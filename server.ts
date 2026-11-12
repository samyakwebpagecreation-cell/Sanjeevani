import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { executeMedicineSearchPipeline } from './src/services/medicines/fetchSources';
import { normaliseMedicineQuery } from './src/services/medicines/normalise';
import { SearchPipelineResult } from './src/services/medicines/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SERVER_INVITE_SECRET =
  process.env.SERVER_INVITE_SECRET || 'sanjeevani-school-invite-hmac-secret-v2';

export function computeServerHmacSha256(code: string): string {
  return crypto
    .createHmac('sha256', SERVER_INVITE_SECRET)
    .update(code.trim().toUpperCase())
    .digest('hex');
}

// Classroom-safe rate limiters: keyed by Target Code or UID/App-Check token (NEVER per-IP for classroom endpoints)
const codeAttemptLimits = new Map<
  string,
  { failedAttempts: number; windowStart: number; lockedUntil: number | null }
>();
const uidWindowLimits = new Map<string, { windowStart: number; count: number }>();
const serverCreatedSchoolsPerUid = new Map<string, number>();

function checkClassroomCodeRateLimit(code: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const key = code.trim().toUpperCase();
  const entry = codeAttemptLimits.get(key);
  const now = Date.now();
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000)
    };
  }
  if (now - entry.windowStart > 60_000) {
    entry.failedAttempts = 0;
    entry.windowStart = now;
    entry.lockedUntil = null;
  }
  return { allowed: true };
}

function recordClassroomCodeFailure(code: string): void {
  const key = code.trim().toUpperCase();
  const now = Date.now();
  const existing = codeAttemptLimits.get(key);
  if (!existing || now - existing.windowStart > 60_000) {
    codeAttemptLimits.set(key, {
      failedAttempts: 1,
      windowStart: now,
      lockedUntil: null
    });
  } else {
    existing.failedAttempts += 1;
    if (existing.failedAttempts >= 5) {
      existing.lockedUntil = now + 60_000;
    }
  }
}

function checkUidOrTokenRateLimit(uidOrToken: string, maxPerMinute = 20): boolean {
  const now = Date.now();
  const entry = uidWindowLimits.get(uidOrToken);
  if (!entry || now - entry.windowStart > 60_000) {
    uidWindowLimits.set(uidOrToken, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= maxPerMinute) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Server-side 24h medicine search cache & per-IP rate limiter
const MEDICINE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const serverMedicineCache = new Map<
  string,
  { timestamp: number; result: SearchPipelineResult }
>();
const ipRateLimits = new Map<string, { windowStart: number; count: number }>();

function checkRateLimit(ip: string, maxPerMinute = 45): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    ipRateLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= maxPerMinute) {
    return false;
  }
  entry.count += 1;
  return true;
}

function resolveModelName(requestedModel?: string): string {
  if (!requestedModel) return 'gemini-3.8-flash';
  const normalized = requestedModel.trim();
  if (
    normalized === 'gemini-3.8-flash' ||
    normalized === 'gemini-3.8-pro' ||
    normalized === 'gemini-3.1-flash-lite' ||
    normalized === 'gemini-flash-latest'
  ) {
    return normalized;
  }
  if (normalized.includes('lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (normalized.includes('pro')) {
    return 'gemini-3.8-pro';
  }
  return 'gemini-3.8-flash';
}

function sanitizeConfigForModel(
  model: string,
  config?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!config) return undefined;
  const cleaned: Record<string, unknown> = { ...config };
  if (model === 'gemini-3.8-flash' || model === 'gemini-3.8-pro') {
    delete cleaned.temperature;
    delete cleaned.topP;
    delete cleaned.topK;
    delete cleaned.candidateCount;
    if (cleaned.thinkingConfig) {
      cleaned.thinkingConfig = { thinkingLevel: 'LOW' };
    }
  } else if (model === 'gemini-3.1-flash-lite') {
    if (cleaned.thinkingConfig) {
      cleaned.thinkingConfig = { thinkingLevel: 'MINIMAL' };
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

let cachedGenAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (cachedGenAIClient) return cachedGenAIClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  cachedGenAIClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return cachedGenAIClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/gemini/warmup', (_req, res) => {
    try {
      getGenAIClient();
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { model, contents, config, generationConfig } = req.body || {};
      if (!contents) {
        res.status(400).json({ error: { message: 'Missing contents in request body.' } });
        return;
      }

      const ai = getGenAIClient();
      const resolvedModel = resolveModelName(model);
      const mergedConfig = sanitizeConfigForModel(resolvedModel, {
        ...(generationConfig || {}),
        ...(config || {}),
      });

      const response = await ai.models.generateContent({
        model: resolvedModel,
        contents,
        ...(mergedConfig ? { config: mergedConfig } : {}),
      });

      const text = response.text ?? '';
      const candidates =
        response.candidates && response.candidates.length > 0
          ? response.candidates
          : [
              {
                content: {
                  parts: [{ text }],
                },
              },
            ];

      res.json({
        text,
        candidates,
        modelUsed: resolvedModel,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Server-side Gemini generation failed.';
      res.status(500).json({
        error: {
          message,
        },
      });
    }
  });

  app.post('/api/gemini/stream', async (req, res) => {
    try {
      const { model, contents, config, generationConfig } = req.body || {};
      if (!contents) {
        res.status(400).json({ error: { message: 'Missing contents in request body.' } });
        return;
      }

      const ai = getGenAIClient();
      const resolvedModel = resolveModelName(model);
      const mergedConfig = sanitizeConfigForModel(resolvedModel, {
        ...(generationConfig || {}),
        ...(config || {}),
      });

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const responseStream = await ai.models.generateContentStream({
        model: resolvedModel,
        contents,
        ...(mergedConfig ? { config: mergedConfig } : {}),
      });

      for await (const chunk of responseStream) {
        if (res.writableEnded) break;
        const chunkText = chunk.text ?? '';
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Server-side Gemini streaming failed.';
      if (!res.headersSent) {
        res.status(500).json({ error: { message } });
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
    }
  });

  app.post('/api/medicines/search', async (req, res) => {
    try {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local');
      if (!checkRateLimit(clientIp)) {
        res.status(429).json({
          error: { message: 'Too many medicine queries from this address. Please wait a minute.' }
        });
        return;
      }

      const { query, forceRefresh, simulate_failures } = req.body || {};
      if (!query || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ error: { message: 'Medicine query is required.' } });
        return;
      }

      const trimmedQuery = query.trim().slice(0, 100);
      const normKey = normaliseMedicineQuery(trimmedQuery);

      if (!forceRefresh && !simulate_failures && serverMedicineCache.has(normKey)) {
        const cached = serverMedicineCache.get(normKey)!;
        const ageMs = Date.now() - cached.timestamp;
        if (ageMs < MEDICINE_CACHE_TTL_MS) {
          res.json({
            ...cached.result,
            from_cache: true,
            cache_age_ms: ageMs
          });
          return;
        }
      }

      const result = await executeMedicineSearchPipeline(trimmedQuery, {
        simulate_failures:
          simulate_failures && typeof simulate_failures === 'object'
            ? simulate_failures
            : undefined
      });

      if (result.outcome === 'success' && !simulate_failures) {
        serverMedicineCache.set(normKey, { timestamp: Date.now(), result });
      }

      res.json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Server-side medicine search pipeline failed.';
      res.status(500).json({ error: { message } });
    }
  });

  app.post('/api/medicines/ocr', async (req, res) => {
    try {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local');
      if (!checkRateLimit(clientIp, 15)) {
        res.status(429).json({
          error: { message: 'Too many prescription scans. Please wait a minute.' }
        });
        return;
      }

      const { base64Data, mimeType } = req.body || {};
      if (!base64Data || typeof base64Data !== 'string') {
        res.status(400).json({ error: { message: 'Missing prescription image data.' } });
        return;
      }

      const ai = getGenAIClient();
      const prompt = `
You are a strict prescription OCR line reader.
Read the prescription image and extract ONLY medicine lines that are clearly legible.
Do NOT guess or invent medicine names if the handwriting is illegible.
Return ONLY a valid JSON array with objects matching:
[
  {
    "raw_line": "exact text read from the image",
    "medicine_name": "brand or salt name",
    "strength": "strength if visible (e.g. 650mg) or empty string",
    "dosage_form": "Tablet / Capsule / Syrup / Injection if visible or empty string"
  }
]
If no medicine names are legible in the image, return [].
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: 'LOW' },
          responseMimeType: 'application/json'
        }
      });

      const rawText = (response.text ?? '[]')
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      let parsed: unknown = [];
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = [];
      }

      const items = Array.isArray(parsed)
        ? parsed
            .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
            .map((item) => ({
              raw_line: typeof item.raw_line === 'string' ? item.raw_line.trim().slice(0, 120) : '',
              medicine_name:
                typeof item.medicine_name === 'string' ? item.medicine_name.trim().slice(0, 80) : '',
              strength: typeof item.strength === 'string' ? item.strength.trim().slice(0, 40) : '',
              dosage_form:
                typeof item.dosage_form === 'string' ? item.dosage_form.trim().slice(0, 40) : ''
            }))
            .filter((item) => item.medicine_name.length > 0)
        : [];

      res.json({ items });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not read the prescription image on the server.';
      res.status(500).json({ error: { message } });
    }
  });

  // ===============================================================
  // Server-Authoritative School Drill Auth & Governance Routes
  // Rate-limited by Target Code & UID/App-Check token (NEVER per-IP)
  // ===============================================================

  app.post('/api/drill-auth/create-school', (req, res) => {
    const { uid, emailVerified, name, city, state, udiseCode } = req.body || {};
    if (!uid || typeof uid !== 'string') {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }
    if (!emailVerified) {
      res.status(403).json({
        ok: false,
        error: 'Verified email is required before registering a school.'
      });
      return;
    }
    if (!checkUidOrTokenRateLimit(`create-school:${uid}`, 5)) {
      res.status(429).json({
        ok: false,
        error: 'Too many school creation requests for this account. Please wait a minute.'
      });
      return;
    }
    const existingCount = serverCreatedSchoolsPerUid.get(uid) ?? 0;
    if (existingCount >= 2) {
      res.status(403).json({
        ok: false,
        error: 'Account limit reached: A single account can register at most 2 unverified schools.'
      });
      return;
    }
    if (!name || !city || !state) {
      res.status(400).json({
        ok: false,
        error: 'School name, city, and state are required.'
      });
      return;
    }
    serverCreatedSchoolsPerUid.set(uid, existingCount + 1);
    res.json({
      ok: true,
      verificationStatus: 'unverified',
      retentionDays: 90,
      allowStudentAccounts: false,
      udiseFormatCheckedOnly: Boolean(udiseCode)
    });
  });

  app.post('/api/drill-auth/redeem-invite', (req, res) => {
    const { uid, emailVerified, code, expectedCodeHmac } = req.body || {};
    if (!uid || !emailVerified) {
      res.status(403).json({
        ok: false,
        error: 'Signed-in account with verified email required to redeem an invite code.'
      });
      return;
    }
    if (!code || typeof code !== 'string') {
      res.status(400).json({ ok: false, error: 'Invite code is required.' });
      return;
    }
    const rate = checkClassroomCodeRateLimit(code);
    if (!rate.allowed) {
      res.status(429).json({
        ok: false,
        error: `This invite code is temporarily locked after 5 failed attempts. Try again in ${rate.retryAfterSec}s.`
      });
      return;
    }
    const computedHmac = computeServerHmacSha256(code);
    if (expectedCodeHmac && expectedCodeHmac !== computedHmac) {
      recordClassroomCodeFailure(code);
      res.status(400).json({ ok: false, error: 'Invalid invite code.' });
      return;
    }
    res.json({ ok: true, codeHmac: computedHmac });
  });

  app.get('/api/drill-auth/search-schools', (req, res) => {
    const uid = String(req.query.uid || '');
    const emailVerified = req.query.emailVerified === 'true';
    const q = String(req.query.q || '').trim().toLowerCase();

    if (!uid || !emailVerified) {
      res.status(403).json({
        ok: false,
        error: 'Signed-in, email-verified account required to search the verified school directory.',
        results: []
      });
      return;
    }
    if (!checkUidOrTokenRateLimit(`search:${uid}`, 15)) {
      res.status(429).json({
        ok: false,
        error: 'Rate limit exceeded (15 searches/minute). Please wait a moment.',
        results: []
      });
      return;
    }

    const verifiedDirectory: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
    }> = [];
    const results = q
      ? verifiedDirectory.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.state.toLowerCase().includes(q)
        )
      : verifiedDirectory;

    res.json({ ok: true, results: results.slice(0, 15) });
  });

  app.post('/api/drill-auth/approve-join-request', (req, res) => {
    const { reviewerRole, reviewerUid, requestedRole, classTeacherUid } = req.body || {};
    if (requestedRole === 'teacher' && reviewerRole !== 'admin') {
      res.status(403).json({
        ok: false,
        error: 'Only a School Admin (Principal) can approve teacher join requests.'
      });
      return;
    }
    if (
      requestedRole === 'student' &&
      reviewerRole === 'teacher' &&
      classTeacherUid !== reviewerUid
    ) {
      res.status(403).json({
        ok: false,
        error: 'Teachers can only approve student join requests into their own assigned classes.'
      });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/drill-auth/join-drill', (req, res) => {
    const { code, studentCode, anonUid } = req.body || {};
    if (!code || !studentCode || !anonUid) {
      res.status(400).json({
        ok: false,
        error: 'Active drill code, student slot code, and anonymous session UID are required.'
      });
      return;
    }
    const rate = checkClassroomCodeRateLimit(code);
    if (!rate.allowed) {
      res.status(429).json({
        ok: false,
        error: `Too many failed attempts for this drill code. Locked for ${rate.retryAfterSec}s.`
      });
      return;
    }
    if (!checkUidOrTokenRateLimit(`join-drill:${anonUid}`, 10)) {
      res.status(429).json({
        ok: false,
        error: 'Too many join attempts from this device session. Please wait a minute.'
      });
      return;
    }
    res.json({
      ok: true,
      codeHmac: computeServerHmacSha256(code)
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

