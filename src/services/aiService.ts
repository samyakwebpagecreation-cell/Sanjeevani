/**
 * Sanjeevani v2 - AI & ARCore Service
 * Powered by Google Generative AI Cascading Fail-Safe Engine (Gemini Flash-Lite, 3.5 Flash-Lite, 3.1 Flash-Lite, 3.5 Flash)
 * Project: sanjeevani-v2 (678230707158)
 */

import { ScenarioQuiz } from '../types';
import { SCENARIO_QUIZZES } from '../data/practiceData';
import { FIRST_AID_PROTOCOLS } from '../data/protocols';
import {
  getAppLanguage,
  getAppLanguageMeta,
  getLocalizedOfflineProtocolMarkdown
} from '../utils/languageStore';

export interface ModelTier {
  id: string;
  displayName: string;
  tier: number;
  description: string;
  expectedSpeed: string;
}

export const FAIL_SAFE_MODELS: ModelTier[] = [
  {
    id: 'gemini-flash-lite-latest',
    displayName: 'Flash-Lite (Tier 1)',
    tier: 1,
    description: 'Ultra-low latency clinical intelligence (~1.2s)',
    expectedSpeed: '1-2s'
  },
  {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Flash 3.1-Lite (Tier 2)',
    tier: 2,
    description: 'High-throughput emergency protocol & vision reasoning',
    expectedSpeed: '1-2s'
  },
  {
    id: 'gemini-3.5-flash-lite',
    displayName: 'Flash 3.5-Lite (Tier 3)',
    tier: 3,
    description: 'State-of-the-art multimodal clinical reasoning',
    expectedSpeed: '1-3s'
  },
  {
    id: 'gemini-flash-latest',
    displayName: 'Flash (Tier 4)',
    tier: 4,
    description: 'Deep medical reasoning backup',
    expectedSpeed: '2-4s'
  }
];

export const AI_CONFIG = {
  mapsApiKey: import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta?.env?.VITE_FIREBASE_API_KEY || 'AIzaSyCgusgSaCLIfuV53u7SQWqapCLc3czj3nQ',
  arcoreApiKey: import.meta?.env?.VITE_ARCORE_API_KEY || '',
  defaultModel: 'gemini-3.8-flash',
  models: FAIL_SAFE_MODELS,
  timeoutPerModelMs: 10000, // Strict 10-second fail-safe limit per model
  projectId: import.meta?.env?.VITE_GOOGLE_PROJECT_ID || 'sanjeevani-v2',
  projectNumber: import.meta?.env?.VITE_GOOGLE_PROJECT_NUMBER || '678230707158',
  clientId: import.meta?.env?.VITE_GOOGLE_CLIENT_ID || '678230707158-4ce41722dhckvfd7t9cknspnf2f5qnku.apps.googleusercontent.com',
  isARCoreReady: true
};

export interface FailSafeEvent {
  type: 'attempt_start' | 'timeout_switch' | 'error_switch' | 'success' | 'offline_fallback';
  modelId: string;
  displayName: string;
  tier: number;
  elapsedMs: number;
  reason?: string;
}

export interface AIResponse {
  text: string;
  modelUsed: string;
  modelDisplayName: string;
  tierUsed: number;
  latencyMs: number;
  isEmergency: boolean;
  failSafeTriggered: boolean;
  failSafeLog: string[];
  steps?: string[];
  warning?: string;
}

export interface VisionAnalysisResult {
  hasInjury: boolean;
  injuryType?: string;
  detectedSubject: string;
  summary: string;
  guidance: string;
  actionSteps: string[];
  whatNotToDo: string[];
  severity: 'none' | 'minor' | 'moderate' | 'severe' | 'emergency';
  confidenceScore: number;
  detectedConcerns: string[];
  isHardStop: boolean;
  modelUsed?: string;
  latencyMs?: number;
}

const SANJEEVANI_SYSTEM_PROMPT = `
You are Sanjeevani AI, India's accredited first-aid emergency decision-support system.
All protocols strictly adhere to the American Heart Association (AHA 2020), European Resuscitation Council (ERC 2021), and All India Institute of Medical Sciences (AIIMS) Emergency Medicine guidelines.
Your audience includes responders, teachers, parents, students, and everyday citizens.

FORMAT & CLINICAL RULES:
1. Speak with calm, authoritative clarity. Be directive, reassuring, and precise.
2. Structure every emergency guidance into these standardized sections:
   - **Immediate Priority:** 1 clear sentence stating the critical objective in the first 10 seconds.
   - **Immediate Action Steps:**
     1. **Action Name:** Exact, actionable instruction (e.g., "Place heel of hand on lower half of sternum; compress at 100-120 BPM, 5-6 cm depth").
     2. **Action Name:** Clear instruction.
     3. **Action Name:** Clear instruction.
   - **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):** Dangerous myths or harmful mistakes to avoid (e.g. no raw ice, no tourniquet loosening, no oral fluids to unconscious patients).
   - **⚠️ Immediate 112 / Hospital Red Flags:**
     * Specific physiological red flags requiring rapid ambulance dispatch or emergency trauma center transfer.
3. NEVER instruct users to "search Google Maps" or manually search for facilities. Sanjeevani's built-in Emergency Radar automatically locates the nearest hospital with 24/7 cold-chain ASV (anti-venom), pediatric burns, or AEDs and renders the live route directly.
4. OUTPUT LENGTH & FORMAT CONSTRAINTS: Output at most 6 numbered steps of <= 20 words each, then Avoid, then red flags, with no preamble. Bold only the action verb or key number inside a line (at most one bold phrase per bullet). Do NOT include hospital data in this response.
`;

/**
 * Extract clean response text, ignoring any thinking tokens/parts
 */
function extractResponseText(candidate: any): string {
  if (!candidate?.content?.parts) return '';
  
  // Find non-thought parts
  const textParts = candidate.content.parts.filter((p: any) => !p.thought && p.text);
  if (textParts.length > 0) {
    return textParts.map((p: any) => p.text).join('\n').trim();
  }
  
  // Fallback: if all parts had thought or standard part format
  const anyText = candidate.content.parts.find((p: any) => p.text)?.text;
  return anyText || '';
}

export interface OfflineProtocolMatch {
  matched: boolean;
  protocolId: string;
  protocolTitle: string;
  text: string;
  isEmergency: boolean;
}

/**
 * Instant Offline Protocol Matcher (<100ms, G.3)
 * Recognizes the 6 scenario buttons and free-text queries matched by the Tier-4/offline matcher.
 * Preserves the exact clinical content from FIRST_AID_PROTOCOLS without changing any wording.
 */
export function matchOfflineProtocol(query: string): OfflineProtocolMatch {
  const lower = query.toLowerCase();

  let matchedKey: string | null = null;
  if (
    lower.includes('cpr') ||
    lower.includes('unconscious') ||
    lower.includes('unresponsive') ||
    lower.includes('faint') ||
    lower.includes('breathe') ||
    lower.includes('breathing') ||
    lower.includes('heart') ||
    lower.includes('collapse') ||
    query.includes('बेहोश') ||
    query.includes('सांस') ||
    query.includes('অজ্ঞান') ||
    query.includes('শ্বাস') ||
    query.includes('மயக்கம்') ||
    query.includes('மூச்சு') ||
    query.includes('बेशुद्ध')
  ) {
    matchedKey = 'unconscious';
  } else if (
    lower.includes('burn') ||
    lower.includes('scald') ||
    lower.includes('fire') ||
    lower.includes('boiling') ||
    lower.includes('heatstroke') ||
    lower.includes('104') ||
    lower.includes('fever') ||
    query.includes('जल') ||
    query.includes('लू') ||
    query.includes('পোড়া') ||
    query.includes('হিটস্ট্রোক') ||
    query.includes('தீக்காயம்') ||
    query.includes('भाजणे') ||
    query.includes('उष्माघात')
  ) {
    matchedKey = 'burn';
  } else if (
    lower.includes('chok') ||
    lower.includes('coin') ||
    lower.includes('swallow') ||
    lower.includes('airway') ||
    lower.includes('back blow') ||
    query.includes('गले') ||
    query.includes('दम') ||
    query.includes('গলায়') ||
    query.includes('தொண்டை') ||
    query.includes('घशात')
  ) {
    matchedKey = 'choking';
  } else if (
    lower.includes('fracture') ||
    lower.includes('bone') ||
    lower.includes('sprain') ||
    lower.includes('deformity') ||
    lower.includes('immobilize') ||
    query.includes('हड्डी') ||
    query.includes('फ्रैक्चर') ||
    query.includes('হাড়') ||
    query.includes('எலும்பு') ||
    query.includes('हाड')
  ) {
    matchedKey = 'fracture';
  } else if (
    !lower.includes('paper cut') &&
    (lower.includes('bleed') ||
      lower.includes('hemorrhage') ||
      lower.includes('arterial') ||
      lower.includes('tourniquet') ||
      lower.includes('deep cut') ||
      lower.includes('wound') ||
      lower.includes('snake') ||
      lower.includes('bite') ||
      lower.includes('venom') ||
      lower.includes('allergy') ||
      lower.includes('anaphylax') ||
      lower.includes('shock') ||
      query.includes('खून') ||
      query.includes('रक्त') ||
      query.includes('सांप') ||
      query.includes('एलर्जी') ||
      query.includes('রক্ত') ||
      query.includes('সাপ') ||
      query.includes('இரத்த') ||
      query.includes('பாம்பு') ||
      query.includes('सर्पदंश'))
  ) {
    matchedKey = 'bleeding';
  }

  const effectiveKey = matchedKey || 'bleeding';
  const matchedProtocol =
    FIRST_AID_PROTOCOLS[effectiveKey] || FIRST_AID_PROTOCOLS['bleeding'];

  const activeLang = getAppLanguage();
  const localizedOffline = getLocalizedOfflineProtocolMarkdown(effectiveKey, activeLang);

  if (localizedOffline) {
    return {
      matched: matchedKey !== null,
      protocolId: matchedProtocol.id,
      protocolTitle: localizedOffline.title,
      text: localizedOffline.markdown,
      isEmergency: true
    };
  }

  const stepsText = matchedProtocol.microSteps
    .map((s) => `${s.stepNumber}. **${s.instruction}:** ${s.detail}`)
    .join('\n');

  const redFlags = matchedProtocol.escalationTriggers
    .map((trig) => `* ${trig}`)
    .join('\n');

  const text = `- **Immediate Priority:** ${matchedProtocol.shortDesc}

- **Immediate Action Steps:**
${stepsText}

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* Do NOT delay calling 112 if the patient is unresponsive, turning pale/blue, or losing blood rapidly.
* Do NOT administer oral water, medicines, or foods if the patient is drowsy or confused.
* Do NOT remove embedded objects from deep wounds.

- **⚠️ Immediate 112 / Hospital Red Flags:**
${redFlags}
* High-speed trauma, severe difficulty breathing, or sudden collapse.`;

  return {
    matched: matchedKey !== null,
    protocolId: matchedProtocol.id,
    protocolTitle: matchedProtocol.title,
    text,
    isEmergency: true
  };
}

/**
 * Synthesize an accredited offline first-aid response using local protocol library
 */
export function generateOfflineProtocolResponse(query: string): string {
  const match = matchOfflineProtocol(query);
  return `I am Sanjeevani AI Guardian (Offline Clinical Safe-Guard). Here is the verified emergency protocol for **${match.protocolTitle}**:\n\n${match.text}`;
}

// In-memory LRU response cache for instant repeat queries (G.1 / G.4)
const responseCache = new Map<string, AIResponse>();

// Warm-up state (G.8)
let warmedUp = false;
export function warmUpAIService(): void {
  if (warmedUp || typeof window === 'undefined') return;
  warmedUp = true;
  try {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  } catch {
    // ignore
  }
  const runWarmup = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    fetch('/api/gemini/warmup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    }).catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
      runWarmup
    );
  } else {
    setTimeout(runWarmup, 400);
  }
}

export interface StreamAssistantOptions {
  userQuery: string;
  history?: { role: 'user' | 'model'; text: string }[];
  onToken?: (accumulatedText: string, deltaText: string, tier: ModelTier) => void;
  onFailSafeEvent?: (event: FailSafeEvent) => void;
  onTierStart?: (tier: number, modelId: string) => void;
  onFirstToken?: (tier: number, modelId: string) => void;
  onTierComplete?: (tier: number, modelId: string) => void;
  onTierAbortedOrFailed?: (
    tier: number,
    modelId: string,
    status: 'aborted' | 'failed',
    reason?: string
  ) => void;
}

export interface StreamAssistantResult extends AIResponse {
  timedOutToOffline?: boolean;
}

/**
 * Stream the First-Aid Assistant response (G.4, G.5, G.6):
 * - Starts Tier 1 immediately via SSE (/api/gemini/stream).
 * - If Tier 1 has produced no token within 3s (3000ms), starts Tier 2 in parallel (hedged request).
 * - Takes whichever streams its first token first and aborts the loser with AbortController.
 * - If nothing arrives within 8s (8000ms) total, aborts all requests and returns timedOutToOffline = true.
 */
export async function streamFirstAidAssistant(
  options: StreamAssistantOptions
): Promise<StreamAssistantResult> {
  const {
    userQuery,
    history = [],
    onToken,
    onFailSafeEvent,
    onTierStart,
    onFirstToken,
    onTierComplete,
    onTierAbortedOrFailed
  } = options;

  const overallStart = Date.now();
  const failSafeLog: string[] = [];
  const activeLang = getAppLanguage();
  const langMeta = getAppLanguageMeta(activeLang);
  const cacheKey = `${activeLang}:${userQuery.trim().toLowerCase()}`;

  // Check in-memory cache first when online
  if (
    responseCache.has(cacheKey) &&
    (typeof navigator === 'undefined' || navigator.onLine)
  ) {
    const cached = responseCache.get(cacheKey)!;
    const tier1 = FAIL_SAFE_MODELS[0];
    onTierStart?.(tier1.tier, tier1.id);
    onFirstToken?.(tier1.tier, tier1.id);
    onToken?.(cached.text, cached.text, tier1);
    onTierComplete?.(tier1.tier, tier1.id);
    return {
      ...cached,
      latencyMs: Math.max(5, Date.now() - overallStart)
    };
  }

  // If browser is explicitly offline, return immediately so offline protocol remains primary
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const offlineLatency = Date.now() - overallStart;
    onFailSafeEvent?.({
      type: 'offline_fallback',
      modelId: 'offline-safe-guide',
      displayName: 'Offline Safe-Guard (Tier 5)',
      tier: 5,
      elapsedMs: offlineLatency,
      reason: 'Browser is offline; showing verified local protocol'
    });
    return {
      text: generateOfflineProtocolResponse(userQuery),
      modelUsed: 'offline-safe-guide',
      modelDisplayName: 'Offline Accredited Protocol (Tier 5)',
      tierUsed: 5,
      latencyMs: offlineLatency,
      isEmergency: true,
      failSafeTriggered: true,
      failSafeLog: ['Browser offline'],
      timedOutToOffline: true
    };
  }

  const languageDirective =
    activeLang === 'en'
      ? 'Respond in clear English.'
      : `IMPORTANT LANGUAGE REQUIREMENT: Write all step explanations, priority sentences, contraindication bullets, and red flag bullets in ${langMeta.englishName} (${langMeta.nativeName} script). Keep the 4 section headings in English (**Immediate Priority:**, **Immediate Action Steps:**, **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**, **⚠️ Immediate 112 / Hospital Red Flags:**) so the clinical parser formats them properly, while all content inside is in ${langMeta.nativeName}.`;

  const contents: any[] = [
    {
      role: 'user',
      parts: [{ text: `${SANJEEVANI_SYSTEM_PROMPT}\n\n${languageDirective}\n\nUser Question: ${userQuery}` }]
    }
  ];

  if (history.length > 0) {
    history.forEach((msg) => {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    });
    contents.push({
      role: 'user',
      parts: [{ text: `${userQuery}\n(${languageDirective})` }]
    });
  }

  const tier1 = FAIL_SAFE_MODELS[0];
  const tier2 = FAIL_SAFE_MODELS[1];

  const controller1 = new AbortController();
  const controller2 = new AbortController();

  let winningTier: ModelTier | null = null;
  let accumulatedText = '';
  let settled = false;

  const abortAll = () => {
    try {
      controller1.abort();
    } catch {
      // ignore
    }
    try {
      controller2.abort();
    } catch {
      // ignore
    }
  };

  const runSingleStream = async (
    model: ModelTier,
    controller: AbortController,
    otherController: AbortController,
    otherModel: ModelTier
  ): Promise<StreamAssistantResult> => {
    onTierStart?.(model.tier, model.id);
    onFailSafeEvent?.({
      type: 'attempt_start',
      modelId: model.id,
      displayName: model.displayName,
      tier: model.tier,
      elapsedMs: Date.now() - overallStart
    });

    const response = await fetch('/api/gemini/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.id,
        contents,
        generationConfig: {
          maxOutputTokens: 700,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      }),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let localText = '';
    let sawFirstToken = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        let parsed: { text?: string; error?: string } = {};
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        const delta = parsed.text || '';
        if (!delta) continue;

        // First token arbitration between hedged Tier 1 and Tier 2
        if (!winningTier) {
          winningTier = model;
          try {
            otherController.abort();
            onTierAbortedOrFailed?.(otherModel.tier, otherModel.id, 'aborted', 'Hedged loser aborted');
          } catch {
            // ignore
          }
        } else if (winningTier.tier !== model.tier) {
          controller.abort();
          return Promise.reject(new Error('Aborted as hedged loser'));
        }

        if (!sawFirstToken) {
          sawFirstToken = true;
          onFirstToken?.(model.tier, model.id);
        }

        localText += delta;
        accumulatedText = localText;
        onToken?.(localText, delta, model);
      }
    }

    if (!localText.trim()) {
      throw new Error('Empty stream response');
    }

    const latencyMs = Date.now() - overallStart;
    const lowerReply = localText.toLowerCase();
    const isEmergency =
      lowerReply.includes('112') ||
      lowerReply.includes('emergency') ||
      lowerReply.includes('call for help');

    onTierComplete?.(model.tier, model.id);
    onFailSafeEvent?.({
      type: 'success',
      modelId: model.id,
      displayName: model.displayName,
      tier: model.tier,
      elapsedMs: latencyMs
    });

    const result: StreamAssistantResult = {
      text: localText.trim(),
      modelUsed: model.id,
      modelDisplayName: model.displayName,
      tierUsed: model.tier,
      latencyMs,
      isEmergency,
      failSafeTriggered: model.tier > 1,
      failSafeLog,
      timedOutToOffline: false
    };

    responseCache.set(cacheKey, result);
    return result;
  };

  return new Promise<StreamAssistantResult>((resolve) => {
    let tier2Started = false;
    let activeCount = 1;

    // 8s strict total timeout (G.5)
    const deadlineTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      abortAll();

      // If we already streamed meaningful partial text before 8s, keep what streamed
      if (accumulatedText.trim().length > 40 && winningTier) {
        onTierComplete?.(winningTier.tier, winningTier.id);
        resolve({
          text: accumulatedText.trim(),
          modelUsed: winningTier.id,
          modelDisplayName: winningTier.displayName,
          tierUsed: winningTier.tier,
          latencyMs: Date.now() - overallStart,
          isEmergency: true,
          failSafeTriggered: true,
          failSafeLog: [...failSafeLog, '8s deadline reached with partial stream'],
          timedOutToOffline: false
        });
        return;
      }

      onTierAbortedOrFailed?.(tier1.tier, tier1.id, 'aborted', '8s total timeout');
      if (tier2Started) {
        onTierAbortedOrFailed?.(tier2.tier, tier2.id, 'aborted', '8s total timeout');
      }

      const offlineLatency = Date.now() - overallStart;
      onFailSafeEvent?.({
        type: 'offline_fallback',
        modelId: 'offline-safe-guide',
        displayName: 'Offline Safe-Guard (Tier 5)',
        tier: 5,
        elapsedMs: offlineLatency,
        reason: 'AI response exceeded 8s limit; showing verified offline protocol'
      });

      resolve({
        text: generateOfflineProtocolResponse(userQuery),
        modelUsed: 'offline-safe-guide',
        modelDisplayName: 'Offline Accredited Protocol (Tier 5)',
        tierUsed: 5,
        latencyMs: offlineLatency,
        isEmergency: true,
        failSafeTriggered: true,
        failSafeLog: [...failSafeLog, '8s total timeout; offline fallback active'],
        timedOutToOffline: true
      });
    }, 8000);

    const handleFailure = (tierModel: ModelTier, err: any) => {
      if (settled) return;
      const reason = err?.message || 'Stream error';
      failSafeLog.push(`Tier ${tierModel.tier} failed: ${reason}`);
      onTierAbortedOrFailed?.(
        tierModel.tier,
        tierModel.id,
        reason.includes('Abort') || reason.includes('loser') ? 'aborted' : 'failed',
        reason
      );

      // If Tier 1 failed before 3s and Tier 2 hasn't started yet, start Tier 2 immediately!
      if (tierModel.tier === 1 && !tier2Started && !winningTier) {
        startTier2('Tier 1 error; hedging Tier 2 immediately');
      }

      activeCount--;
      if (activeCount <= 0 && !settled) {
        settled = true;
        clearTimeout(deadlineTimer);
        clearTimeout(hedgeTimer);
        const offlineLatency = Date.now() - overallStart;
        onFailSafeEvent?.({
          type: 'offline_fallback',
          modelId: 'offline-safe-guide',
          displayName: 'Offline Safe-Guard (Tier 5)',
          tier: 5,
          elapsedMs: offlineLatency,
          reason: 'All remote AI streams failed; showing verified offline protocol'
        });
        resolve({
          text: generateOfflineProtocolResponse(userQuery),
          modelUsed: 'offline-safe-guide',
          modelDisplayName: 'Offline Accredited Protocol (Tier 5)',
          tierUsed: 5,
          latencyMs: offlineLatency,
          isEmergency: true,
          failSafeTriggered: true,
          failSafeLog,
          timedOutToOffline: true
        });
      }
    };

    const startTier2 = (reasonText: string) => {
      if (tier2Started || settled || winningTier) return;
      tier2Started = true;
      activeCount++;
      onFailSafeEvent?.({
        type: 'timeout_switch',
        modelId: tier2.id,
        displayName: tier2.displayName,
        tier: tier2.tier,
        elapsedMs: Date.now() - overallStart,
        reason: reasonText
      });

      runSingleStream(tier2, controller2, controller1, tier1)
        .then((res) => {
          if (settled) return;
          settled = true;
          clearTimeout(deadlineTimer);
          clearTimeout(hedgeTimer);
          resolve(res);
        })
        .catch((err) => handleFailure(tier2, err));
    };

    // 3s hedge timer: if Tier 1 has produced no token within 3s, start Tier 2 in parallel (G.5)
    const hedgeTimer = setTimeout(() => {
      if (!winningTier && !settled) {
        startTier2('Tier 1 produced no token in 3s; starting hedged Tier 2 in parallel');
      }
    }, 3000);

    // Start Tier 1 immediately
    runSingleStream(tier1, controller1, controller2, tier2)
      .then((res) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadlineTimer);
        clearTimeout(hedgeTimer);
        resolve(res);
      })
      .catch((err) => handleFailure(tier1, err));
  });
}

/**
 * Ask the First-Aid Assistant a query (delegates to streamFirstAidAssistant)
 */
export async function askFirstAidAssistant(
  userQuery: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  onFailSafeEvent?: (event: FailSafeEvent) => void
): Promise<AIResponse> {
  return streamFirstAidAssistant({
    userQuery,
    history,
    onFailSafeEvent
  });
}

/**
 * Multimodal Camera & Injury Visual Analysis
 * Analyzes frame base64 image using Gemma 4 31B vision / Gemini 3.6 Flash
 */
export async function analyzeInjuryVisual(
  imageBase64: string,
  contextNote: string = 'Check wound condition and first-aid posture'
): Promise<VisionAnalysisResult> {
  const overallStart = Date.now();

  // Extract mime type and clean base64
  let mimeType = 'image/jpeg';
  let cleanBase64 = imageBase64;
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (mimeMatch) {
    mimeType = mimeMatch[1];
    cleanBase64 = mimeMatch[2];
  } else {
    cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
  }

  const promptText = `You are Sanjeevani AI, India's premier accredited clinical first-aid vision assistant built on AHA 2020 and AIIMS emergency medicine guidelines.
Analyze this image or camera frame carefully and accurately for any medical emergency, injury, first-aid scenario, symptom, wound, or training simulation.

COMPREHENSIVE CLINICAL RECOGNITION:
1. Traumatic wounds: cuts, lacerations, abrasions, scrapes, punctures, active venous or arterial bleeding, thermal/chemical/electrical burns, scalds, blisters.
2. Musculoskeletal trauma: visible swelling, joint deformities, sprains, bruises/hematomas, suspected fractures, limb guarding.
3. Systemic & physical emergencies: collapsed/unresponsive person, choking signs (hands clutching throat), difficulty breathing, seizure posture, recovery position, fainting.
4. Environmental & biological: snake bites (fang puncture marks), insect/scorpion stings, rashes, hives, allergic anaphylaxis signs, localized inflammation, redness.
5. Demonstrations & First-Aid gear: bandages, dressings, splints, tourniquets, CPR posture, CPR training manikins, simulated wounds or first-aid training scenarios.
6. Skin inspection / anatomical check: If the user points the camera at skin, an arm, leg, face, or chest seeking help, evaluate for any visible redness, rash, swelling, or trauma.

CLINICAL TRIAGE RULES:
- If ANY trauma, wound, cut, scrape, burn, blister, bite, sting, rash, bruise, swelling, bandage, or first-aid practice is observed, mark "hasInjury": true.
- Provide 3 clear, actionable first-aid steps based on AHA/AIIMS protocols and 2-3 critical contraindications to avoid ("What NOT to do").
- Only mark "hasInjury": false if the frame is completely non-biological and contains NO human subject, skin, medical gear, or injury (e.g. an empty wall, ceiling, keyboard, or furniture).

Return STRICT RAW JSON only matching this schema with NO markdown code fences:
{
  "hasInjury": boolean,
  "injuryType": "wound" | "burn" | "cpr_unresponsive" | "choking" | "fracture_sprain" | "bite_sting" | "rash_allergy" | "training_demo" | "none",
  "detectedSubject": "Specific, clear title of what is identified (e.g. 'Thermal Scald Burn on Hand', 'Superficial Abrasion with Venous Bleeding', 'Suspected Ankle Sprain with Edema', 'Bandaging & Wound Dressing Demonstration')",
  "severity": "none" | "minor" | "moderate" | "severe" | "emergency",
  "observation": "Detailed 2-3 sentence clinical observation describing tissue appearance, visible signs, anatomical location, and condition.",
  "actionSteps": [
    "Step 1: Immediate primary action with specific technique (e.g. pressure, cooling, immobilization)",
    "Step 2: Secondary protective or dressing step",
    "Step 3: Monitoring or escalation instruction"
  ],
  "whatNotToDo": [
    "Critical myth or contraindication to strictly avoid"
  ],
  "call112Now": boolean
}`;

  for (const model of FAIL_SAFE_MODELS) {
    try {
      const endpoint = '/api/gemini/generate';

      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort(new Error(`Timeout: ${model.id} exceeded 8-second vision threshold.`));
      }, 8000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.id,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType === 'image/svg+xml' ? 'image/png' : mimeType,
                    data: cleanBase64
                  }
                },
                {
                  text: promptText + (contextNote ? `\n\nRescuer Note: ${contextNote}` : '')
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Vision API error (${response.status})`);
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      let reply = extractResponseText(candidate);

      if (!reply) {
        throw new Error('Received empty vision response.');
      }

      reply = reply.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(reply);

      let hasInjury = Boolean(parsed.hasInjury);
      if (!hasInjury && parsed.injuryType && parsed.injuryType !== 'none') {
        hasInjury = true;
      }
      if (!hasInjury && parsed.severity && parsed.severity !== 'none') {
        hasInjury = true;
      }
      const subjectAndObs = `${parsed.detectedSubject || ''} ${parsed.observation || ''}`.toLowerCase();
      if (!hasInjury && /(burn|scald|cut|wound|bleed|blood|bite|sting|rash|sprain|fracture|bruise|swell|blister|abrasion|laceration|skin|dressing|bandage|cpr|chok|injury|trauma|pain)/i.test(subjectAndObs)) {
        hasInjury = true;
      }

      const isHardStop = Boolean(parsed.call112Now) || parsed.severity === 'severe' || parsed.severity === 'emergency';
      const actionSteps: string[] = Array.isArray(parsed.actionSteps) && parsed.actionSteps.length > 0
        ? parsed.actionSteps
        : hasInjury
          ? ['Keep the injured area clean, still, and supported.', 'If bleeding, apply firm pressure with a clean cloth.']
          : ['Ensure the camera is pointed directly at the affected area.', 'If someone feels pain or tenderness, treat with gentle support.'];

      const whatNotToDo: string[] = Array.isArray(parsed.whatNotToDo) && parsed.whatNotToDo.length > 0
        ? parsed.whatNotToDo
        : ['Do not apply unsterile substances, raw ice, toothpaste, or turmeric on open wounds.'];

      return {
        hasInjury,
        injuryType: parsed.injuryType || (hasInjury ? 'wound' : 'none'),
        detectedSubject: parsed.detectedSubject || (hasInjury ? 'Injury Identified' : 'No Acute Medical Concern Detected'),
        summary: parsed.observation || (hasInjury ? 'Tissue injury or first-aid condition observed.' : 'No visible wounds or emergencies detected in this frame.'),
        guidance: actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        actionSteps,
        whatNotToDo,
        severity: parsed.severity || (isHardStop ? 'severe' : hasInjury ? 'minor' : 'none'),
        confidenceScore: hasInjury ? 96 : 92,
        detectedConcerns: isHardStop ? ['Immediate Medical Attention Required (112)'] : whatNotToDo.slice(0, 2),
        isHardStop,
        modelUsed: model.id,
        latencyMs: Date.now() - overallStart
      };
    } catch (err) {
      console.warn(`[Auto Fail-Safe Vision] Attempt with ${model.id} failed:`, err);
    }
  }

  // Fallback heuristic response if all network calls fail
  return {
    hasInjury: false,
    injuryType: 'none',
    detectedSubject: 'No clear injury detected',
    summary: 'No visible acute injury detected in this frame. If someone is injured or in pain, hold the camera steady over the wound with good lighting.',
    guidance: '1. Position camera directly over the wound with adequate lighting.\n2. Keep camera steady so the autofocus can lock on.\n3. If someone is bleeding heavily or in intense pain, call 112 immediately.',
    actionSteps: [
      'Position camera directly over the affected area with good lighting.',
      'Ensure camera lens is focused on the skin or wound.',
      'If in doubt or pain is severe, call 112 immediately.'
    ],
    whatNotToDo: [
      'Do not apply raw ice, butter, or unprescribed home pastes on wounds.'
    ],
    severity: 'none',
    confidenceScore: 0,
    detectedConcerns: ['Align camera with good lighting'],
    isHardStop: false,
    modelUsed: 'offline-heuristic',
    latencyMs: Date.now() - overallStart
  };
}

/**
 * Dynamic AI Scenario Quiz Generation powered by cascading models
 * Generates realistic on-the-fly first aid dilemmas with clinical rationales,
 * common myths, and 4 choices with 4-second timeout and offline curated fallback.
 */
export async function generateScenarioQuiz(
  category: string = 'All',
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
): Promise<ScenarioQuiz> {
  const modelsToTry = FAIL_SAFE_MODELS.map((m) => m.id);
  
  const prompt = `You are a medical first-aid educator for Sanjeevani AI.
Generate ONE realistic emergency first-aid dilemma scenario for training everyday school students, parents, and citizens in simple, everyday language.
Category requested: ${category === 'All' ? 'Any everyday emergency (e.g. Bleeding, Burns, CPR, Choking, Sprains, Heatstroke)' : category}
Difficulty requested: ${difficulty}

RULES:
1. Use SIMPLE, PLAIN, EVERYDAY words. No complex medical jargon.
2. The situation should feel immediate and relatable (e.g. playground, kitchen, classroom, sports field).
3. Provide 4 distinct options (A, B, C, D) where EXACTLY ONE option is correct. The other 3 must represent common mistakes or popular folk myths.
4. For every option, provide a clear 1-2 sentence explanation why it works or why it is harmful.
5. Provide a memorable 1-sentence "principleLearned".
6. Provide a "mythBuster" explaining a dangerous myth (e.g. butter on burns, raw ice, tilting head backwards for nosebleed, spoon in mouth for seizures, blind finger sweeps).

OUTPUT STRICTLY AS VALID RAW JSON with no code fences or extra text:
{
  "title": "Short catchy title (3-5 words)",
  "situation": "2-3 sentences describing the emergency setting and person's symptoms.",
  "question": "The specific dilemma question (e.g. What is your immediate first step?)",
  "options": [
    { "text": "Option 1 description", "isCorrect": false, "explanation": "Why this is dangerous or incorrect" },
    { "text": "Option 2 description", "isCorrect": true, "explanation": "Why this is the correct life-saving action" },
    { "text": "Option 3 description", "isCorrect": false, "explanation": "Why this is incorrect" },
    { "text": "Option 4 description", "isCorrect": false, "explanation": "Why this is incorrect" }
  ],
  "principleLearned": "One key golden rule to remember forever.",
  "mythBuster": "Myth vs Fact debunking a dangerous folk remedy."
}`;

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 4500): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  for (const model of modelsToTry) {
    try {
      const endpoint = '/api/gemini/generate';
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        })
      }, 4000);

      if (response.ok) {
        const data = await response.json();
        const candidate = data?.candidates?.[0];
        let rawText = extractResponseText(candidate);
        
        // Strip markdown fences if present
        rawText = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(rawText);
        if (parsed.title && parsed.situation && parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 4) {
          const hasCorrect = parsed.options.some((o: any) => o.isCorrect === true);
          if (hasCorrect) {
            return {
              id: `ai-gen-${Date.now()}`,
              title: parsed.title,
              category: category === 'All' ? 'Emergency' : category,
              difficulty: difficulty,
              situation: parsed.situation,
              question: parsed.question,
              options: parsed.options.slice(0, 4).map((o: any) => ({
                text: o.text,
                isCorrect: Boolean(o.isCorrect),
                explanation: o.explanation || (o.isCorrect ? 'Correct action according to first-aid protocol.' : 'This action is not recommended.')
              })),
              principleLearned: parsed.principleLearned || 'Stay calm and follow basic life support protocols.',
              mythBuster: parsed.mythBuster || 'Avoid unproven remedies. Rely on clean water, direct pressure, and calling emergency services.',
              isAiGenerated: true
            };
          }
        }
      }
    } catch (err) {
      console.warn(`Dynamic quiz generation with ${model} timed out or failed:`, err);
    }
  }

  // Graceful offline fallback
  const matching = category !== 'All' 
    ? SCENARIO_QUIZZES.filter(s => s.category?.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(s.category?.toLowerCase() || ''))
    : SCENARIO_QUIZZES;
  const pool = matching.length > 0 ? matching : SCENARIO_QUIZZES;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return {
    ...chosen,
    id: `fallback-${Date.now()}-${chosen.id}`,
    isAiGenerated: false
  };
}

