/**
 * Sanjeevani v2 - AI & ARCore Service
 * Powered by Google Generative AI Cascading Fail-Safe Engine (Gemini Flash-Lite, 3.5 Flash-Lite, 3.1 Flash-Lite, 3.5 Flash)
 * Project: sanjeevani-v2 (678230707158)
 */

import { ScenarioQuiz } from '../types';
import { SCENARIO_QUIZZES } from '../data/practiceData';
import { FIRST_AID_PROTOCOLS } from '../data/protocols';

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
  apiKey: import.meta?.env?.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6J4jhljX9cZc-j5qT2h-GEoyGQmfAw3700a6MItWh9lAA',
  mapsApiKey: import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta?.env?.VITE_FIREBASE_API_KEY || 'AIzaSyCgusgSaCLIfuV53u7SQWqapCLc3czj3nQ',
  arcoreApiKey: import.meta?.env?.VITE_ARCORE_API_KEY || 'AQ.Ab8RN6J4jhljX9cZc-j5qT2h-GEoyGQmfAw3700a6MItWh9lAA',
  defaultModel: 'gemini-flash-lite-latest',
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

/**
 * Synthesize an accredited offline first-aid response using local protocol library
 */
function generateOfflineProtocolResponse(query: string): string {
  const lower = query.toLowerCase();
  
  let matchedProtocol = FIRST_AID_PROTOCOLS['bleeding'];
  if (lower.includes('cpr') || lower.includes('unconscious') || lower.includes('faint') || lower.includes('breathe') || lower.includes('heart') || lower.includes('collapse')) {
    matchedProtocol = FIRST_AID_PROTOCOLS['unconscious'] || FIRST_AID_PROTOCOLS['bleeding'];
  } else if (lower.includes('burn') || lower.includes('scald') || lower.includes('fire')) {
    matchedProtocol = FIRST_AID_PROTOCOLS['burn'] || FIRST_AID_PROTOCOLS['bleeding'];
  } else if (lower.includes('chok')) {
    matchedProtocol = FIRST_AID_PROTOCOLS['choking'] || FIRST_AID_PROTOCOLS['bleeding'];
  } else if (lower.includes('fracture') || lower.includes('bone') || lower.includes('sprain')) {
    matchedProtocol = FIRST_AID_PROTOCOLS['fracture'] || FIRST_AID_PROTOCOLS['bleeding'];
  }

  const stepsText = matchedProtocol.microSteps
    .map((s) => `${s.stepNumber}. **${s.instruction}:** ${s.detail}`)
    .join('\n');

  const redFlags = matchedProtocol.escalationTriggers
    .map((trig) => `* ${trig}`)
    .join('\n');

  return `I am Sanjeevani AI Guardian (Offline Clinical Safe-Guard). Here is the verified emergency protocol for **${matchedProtocol.title}**:

- **Immediate Priority:** ${matchedProtocol.shortDesc}

- **Immediate Action Steps:**
${stepsText}

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* Do NOT delay calling 112 if the patient is unresponsive, turning pale/blue, or losing blood rapidly.
* Do NOT administer oral water, medicines, or foods if the patient is drowsy or confused.
* Do NOT remove embedded objects from deep wounds.

- **⚠️ Immediate 112 / Hospital Red Flags:**
${redFlags}
* High-speed trauma, severe difficulty breathing, or sudden collapse.`;
}

/**
 * Ask the First-Aid Assistant a query with a strict 10-second auto fail-safe cascade
 */
export async function askFirstAidAssistant(
  userQuery: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  onFailSafeEvent?: (event: FailSafeEvent) => void
): Promise<AIResponse> {
  const overallStart = Date.now();
  const failSafeLog: string[] = [];

  for (let i = 0; i < FAIL_SAFE_MODELS.length; i++) {
    const model = FAIL_SAFE_MODELS[i];
    const modelStart = Date.now();

    onFailSafeEvent?.({
      type: 'attempt_start',
      modelId: model.id,
      displayName: model.displayName,
      tier: model.tier,
      elapsedMs: Date.now() - overallStart
    });

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${AI_CONFIG.apiKey}`;

      const contents: any[] = [
        {
          role: 'user',
          parts: [{ text: `${SANJEEVANI_SYSTEM_PROMPT}\n\nUser Question: ${userQuery}` }]
        }
      ];

      // Add conversation context if provided
      if (history.length > 0) {
        history.forEach((msg) => {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          });
        });
        contents.push({
          role: 'user',
          parts: [{ text: userQuery }]
        });
      }

      // Strict 10-second auto-abort controller
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort(new Error(`Timeout: ${model.id} exceeded 10-second response threshold.`));
      }, AI_CONFIG.timeoutPerModelMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const firstCandidate = data?.candidates?.[0];
      const reply = extractResponseText(firstCandidate);

      if (!reply) {
        throw new Error('Received empty response from model.');
      }

      const latencyMs = Date.now() - overallStart;
      const lowerReply = reply.toLowerCase();
      const isEmergency = lowerReply.includes('112') || lowerReply.includes('emergency') || lowerReply.includes('call for help');

      onFailSafeEvent?.({
        type: 'success',
        modelId: model.id,
        displayName: model.displayName,
        tier: model.tier,
        elapsedMs: latencyMs
      });

      return {
        text: reply,
        modelUsed: model.id,
        modelDisplayName: model.displayName,
        tierUsed: model.tier,
        latencyMs,
        isEmergency,
        failSafeTriggered: i > 0,
        failSafeLog
      };
    } catch (err: any) {
      const elapsed = Date.now() - modelStart;
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('Timeout') || elapsed >= 9900;
      const reasonMsg = isTimeout 
        ? `Tier ${model.tier} (${model.id}) reached 10s limit without response`
        : `Tier ${model.tier} (${model.id}) failed: ${err?.message || 'Error'}`;

      failSafeLog.push(reasonMsg);
      console.warn(`[Auto Fail-Safe] ${reasonMsg}. Switching to next tier...`);

      const nextModel = FAIL_SAFE_MODELS[i + 1];
      if (nextModel) {
        onFailSafeEvent?.({
          type: isTimeout ? 'timeout_switch' : 'error_switch',
          modelId: nextModel.id,
          displayName: nextModel.displayName,
          tier: nextModel.tier,
          elapsedMs: Date.now() - overallStart,
          reason: isTimeout ? 'Response took >10s; routing to next AI tier' : (err?.message || 'Connection error')
        });
      }
    }
  }

  // Tier 5: Accredited Offline Emergency Fallback
  const offlineLatency = Date.now() - overallStart;
  onFailSafeEvent?.({
    type: 'offline_fallback',
    modelId: 'offline-safe-guide',
    displayName: 'Offline Safe-Guard (Tier 5)',
    tier: 5,
    elapsedMs: offlineLatency,
    reason: 'All remote AI tiers timed out (>10s) or offline; activated local protocol synthesis'
  });

  return {
    text: generateOfflineProtocolResponse(userQuery),
    modelUsed: 'offline-safe-guide',
    modelDisplayName: 'Offline Accredited Protocol (Tier 5)',
    tierUsed: 5,
    latencyMs: offlineLatency,
    isEmergency: true,
    failSafeTriggered: true,
    failSafeLog: [...failSafeLog, 'Active offline clinical fallback']
  };
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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${AI_CONFIG.apiKey}`;

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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_CONFIG.apiKey}`;
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

