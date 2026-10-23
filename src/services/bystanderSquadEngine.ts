/**
 * Sanjeevani v2 - AI-Powered Bystander Paradox Resolution Engine
 * 
 * Clinical & Psychological Foundation:
 * Breaks the Diffusion of Responsibility (Bystander Effect / Genovese Syndrome)
 * through deterministic, algorithmic direct delegation across crowds.
 * 
 * Generates an instant, zero-install Peer-to-Peer Squad Room with a high-contrast
 * QR code that distributes prioritized, life-saving tasks to each onlooker who scans.
 */

import { generateQRCodeSVG } from '../utils/qr';
import { audioEngine } from '../utils/audio';
import { AI_CONFIG } from './aiService';

export type SquadRoleCategory = 'medical' | 'dispatch' | 'equipment' | 'perimeter' | 'logistics';
export type SquadRoleStatus = 'unassigned' | 'claimed' | 'in_progress' | 'completed';

export interface SquadTaskRole {
  id: string;
  title: string;
  subtitle: string;
  priority: number; // 1 = highest priority
  category: SquadRoleCategory;
  assignedTo?: string; // e.g. "Bystander #1 (Rahul)"
  assignedAt?: string;
  status: SquadRoleStatus;
  instruction: string;
  scriptText?: string;
  actionType: 'call_112' | 'metronome_cpr' | 'search_aed' | 'crowd_control' | 'gate_flag' | 'first_aid';
  actionPayload?: {
    phoneNumber?: string;
    metronomeBpm?: number;
    itemLocations?: string[];
    addressText?: string;
    customNote?: string;
  };
  completedAt?: string;
}

export interface BystanderSquadSession {
  id: string; // e.g. "SQUAD-849201"
  leaderId: string;
  leaderName: string;
  protocolId: string;
  protocolTitle: string;
  incidentSummary: string;
  urgencyLevel: 'CRITICAL_112' | 'URGENT' | 'MONITOR';
  locationAddress: string;
  nearestHospital?: {
    name: string;
    distance: string;
    eta: string;
    phone: string;
  };
  roles: Record<string, SquadTaskRole>;
  bystanderCount: number;
  status: 'active' | 'resolved';
  qrSvg: string;
  joinUrl: string;
  photoPreviewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Detects incident category from query, symptoms, or protocol ID
 */
export function detectIncidentCategory(queryOrText: string): 'cardiac_cpr' | 'hemorrhage' | 'road_accident' | 'choking' | 'burns' | 'general' {
  const text = queryOrText.toLowerCase();

  if (/cpr|cardiac|unconscious|fainted|not breathing|heart attack|collapsed|no pulse|agonal/i.test(text)) {
    return 'cardiac_cpr';
  }
  if (/bleed|hemorrhage|blood|arterial|wound|stab|cut|amputat/i.test(text)) {
    return 'hemorrhage';
  }
  if (/accident|crash|collision|hit and run|car|bike|motorcycle|highway|vehicle|road/i.test(text)) {
    return 'road_accident';
  }
  if (/chok|airway|food stuck|throat|coughing silently|heimlich/i.test(text)) {
    return 'choking';
  }
  if (/burn|scald|hot water|fire|acid|chemical burn|flame|boiling/i.test(text)) {
    return 'burns';
  }
  return 'general';
}

/**
 * Generates prioritized, clinical tasks tailored specifically to the incident
 */
export function generateSquadRolesForIncident(
  category: 'cardiac_cpr' | 'hemorrhage' | 'road_accident' | 'choking' | 'burns' | 'general',
  locationAddress: string,
  hospitalName?: string,
  hospitalDistance?: string
): Record<string, SquadTaskRole> {
  const addressPrompt = locationAddress || 'Current GPS Landmark';
  const hospitalPrompt = hospitalName ? `${hospitalName} (${hospitalDistance || 'nearest'})` : 'the nearest trauma center';

  switch (category) {
    case 'cardiac_cpr':
      return {
        compressor: {
          id: 'compressor',
          title: '1. Hands-on CPR Compressor',
          subtitle: '110 BPM Rhythmic Compressions',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Place heel of hand in the center of the chest. Lock elbows straight. Push hard and fast to 110 BPM (2 inches deep). Do not stop until paramedics arrive or swap after 2 minutes.',
          actionType: 'metronome_cpr',
          actionPayload: { metronomeBpm: 110 }
        },
        caller: {
          id: 'caller',
          title: '2. 112 Emergency Dispatcher',
          subtitle: 'Read GPS Teleprompter to Dispatch',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Dial 112 immediately. Read the exact script below out loud. Stay on the line until the dispatcher confirms ambulance dispatch.',
          scriptText: `Hello, I am reporting a critical cardiac emergency. An unconscious adult is not breathing normally. We have started chest compressions. Our exact location is: ${addressPrompt}. Nearest facility is ${hospitalPrompt}. Please dispatch an Advanced Life Support ambulance immediately.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        aed_scout: {
          id: 'aed_scout',
          title: '3. AED & Trauma Kit Scout',
          subtitle: 'Locate Defibrillator in 200m',
          priority: 2,
          category: 'equipment',
          status: 'unassigned',
          instruction: 'Run to the nearest Metro security booth, mall information desk, hotel reception, or gym. Shout: "Need the AED and First-Aid Kit for an unconscious person!" Bring it back at a run.',
          actionType: 'search_aed',
          actionPayload: {
            itemLocations: [
              'Metro Station Security / Control Room',
              'Mall Reception / Guard Post',
              'Hotel / Gym Concierge',
              'Corporate Building Lobby First-Aid Box'
            ]
          }
        },
        flagger: {
          id: 'flagger',
          title: '4. Ambulance Gate Flagger',
          subtitle: 'Guide Siren at Main Intersection',
          priority: 3,
          category: 'logistics',
          status: 'unassigned',
          instruction: 'Sprint to the main entrance, gate, or roadway. Look for incoming ambulance siren. Wave your phone screen or bright cloth high in the air to guide paramedics directly to the patient without delay.',
          actionType: 'gate_flag'
        },
        airflow_guard: {
          id: 'airflow_guard',
          title: '5. Crowd Airflow & Perimeter Marshal',
          subtitle: 'Push Crowd 15ft Back for Oxygen',
          priority: 4,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Keep onlookers back at least 15 feet. Give the victim fresh air and clear space. Ensure no one takes photos or blocks the stretcher path.',
          scriptText: 'Please step back 15 feet! Give the patient fresh air and keep the hallway completely clear for the stretcher!',
          actionType: 'crowd_control'
        }
      };

    case 'hemorrhage':
      return {
        pressure_lead: {
          id: 'pressure_lead',
          title: '1. Direct Pressure Lead',
          subtitle: 'Continuous Firm Hemorrhage Pressure',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Apply firm, continuous direct pressure over the bleeding wound using clean cloths or trauma gauze. Do not remove soaked cloths; stack more on top. If bleeding is from limb and won’t stop, prepare tourniquet.',
          actionType: 'first_aid'
        },
        caller: {
          id: 'caller',
          title: '2. 112 Trauma Dispatcher',
          subtitle: 'Report Active Arterial Bleed',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Dial 112 immediately. Inform dispatcher of severe hemorrhage requiring trauma team.',
          scriptText: `Hello, reporting an emergency: Severe uncontrolled bleeding. Patient is at risk of hypovolemic shock. Our location is: ${addressPrompt}. We have applied direct pressure. Send an emergency ambulance with blood control trauma gear now.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        supply_scout: {
          id: 'supply_scout',
          title: '3. Clean Bandages & Cloth Scout',
          subtitle: 'Gather Sterile Gauze & Towels',
          priority: 2,
          category: 'equipment',
          status: 'unassigned',
          instruction: 'Gather clean cloths, towels, triangular bandages, or first-aid packs from nearby shops, cars, or offices. Bring clean drinking water.',
          actionType: 'first_aid'
        },
        traffic_guard: {
          id: 'traffic_guard',
          title: '4. Traffic Diverter',
          subtitle: 'Safeguard Incident Perimeter',
          priority: 3,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Stand 30 meters upstream of the incident. Divert oncoming vehicles and motorbikes safely around the responders.',
          actionType: 'crowd_control'
        },
        shock_care: {
          id: 'shock_care',
          title: '5. Shock & Hypothermia Care',
          subtitle: 'Keep Patient Warm & Reassured',
          priority: 4,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Cover the patient with a clean jacket or blanket to prevent hypothermia. Speak in a calm, soothing voice. Elevate legs slightly if no spinal trauma suspected.',
          actionType: 'first_aid'
        }
      };

    case 'road_accident':
      return {
        cspine_guard: {
          id: 'cspine_guard',
          title: '1. C-Spine Head Stabilizer',
          subtitle: 'Hold Head Neutral — DO NOT MOVE',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Kneel at the patient’s head. Place both hands firmly on either side of their head to keep the neck perfectly still. DO NOT ALLOW ANYONE to lift or bend the neck.',
          actionType: 'first_aid'
        },
        caller: {
          id: 'caller',
          title: '2. 112 Road Collision Dispatcher',
          subtitle: 'Report Multi-Casualty Crash',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Call 112. Report the vehicle crash, exact landmark, and number of trapped or injured individuals.',
          scriptText: `Emergency road traffic accident at: ${addressPrompt}. Collision with injured victims. Cervical spine immobilization active. Please dispatch ambulance and highway emergency services immediately.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        hazard_isolator: {
          id: 'hazard_isolator',
          title: '3. Vehicle Ignition & Fuel Isolator',
          subtitle: 'Turn Off Engine, Check Fuel Leaks',
          priority: 2,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Check vehicle ignition and turn it off to eliminate spark risk. Check for leaking fuel or smoking battery. Keep all onlookers from smoking or lighting flames.',
          actionType: 'crowd_control'
        },
        traffic_stopper: {
          id: 'traffic_stopper',
          title: '4. Roadway Traffic Diverter',
          subtitle: 'Warn Traffic 50m Upstream',
          priority: 3,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Walk 50 meters back in the direction of oncoming traffic. Wave arms or place hazard triangles to prevent secondary collisions.',
          actionType: 'crowd_control'
        },
        gate_flagger: {
          id: 'gate_flagger',
          title: '5. Ambulance Siren Guide',
          subtitle: 'Stand at Main Crossing to Lead Medic',
          priority: 4,
          category: 'logistics',
          status: 'unassigned',
          instruction: 'Stand at the nearest main road crossing or entry cut. Direct ambulance driver directly into the scene clearance lane.',
          actionType: 'gate_flag'
        }
      };

    case 'choking':
      return {
        choking_rescuer: {
          id: 'choking_rescuer',
          title: '1. Airway Rescuer',
          subtitle: '5 Back Blows + 5 Abdominal Thrusts',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Stand behind patient. Support chest, deliver 5 sharp back blows between shoulder blades. If still blocked, make fist above navel and give 5 quick upward abdominal thrusts.',
          actionType: 'first_aid'
        },
        caller: {
          id: 'caller',
          title: '2. 112 Airway Obstruction Caller',
          subtitle: 'Call Dispatch if Foreign Body Lodged',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Dial 112 immediately. State severe foreign body airway obstruction.',
          scriptText: `Emergency: Person choking, unable to breathe or make sound at: ${addressPrompt}. Heimlich maneuvers underway. Dispatch emergency unit immediately.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        path_clearer: {
          id: 'path_clearer',
          title: '3. Stretcher & Doorway Clearer',
          subtitle: 'Hold Elevator & Open Main Entrance',
          priority: 2,
          category: 'logistics',
          status: 'unassigned',
          instruction: 'Hold the main elevator doors open on the ground floor. Ensure all gates and glass entryways are unlocked for emergency stretcher access.',
          actionType: 'gate_flag'
        },
        bystander_calmer: {
          id: 'bystander_calmer',
          title: '4. Family & Bystander Reassurer',
          subtitle: 'Maintain Calm & Prevent Crowd Panic',
          priority: 3,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Reassure family members and onlookers. Keep them calm and prevent anyone from shaking the victim or forcing liquids down their throat.',
          actionType: 'crowd_control'
        }
      };

    case 'burns':
      return {
        cooling_lead: {
          id: 'cooling_lead',
          title: '1. Cool Running Water Overseer',
          subtitle: '20 Mins Continuous Gentle Water',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Direct continuous, clean, cool running water over the burn for a minimum of 20 minutes. DO NOT USE ICE, butter, or toothpaste.',
          actionType: 'first_aid'
        },
        caller: {
          id: 'caller',
          title: '2. 112 Burn Center Dispatcher',
          subtitle: 'Report Thermal / Chemical Scald',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Call 112 and request a hospital with an active Burn ICU.',
          scriptText: `Emergency scald/burn injury at: ${addressPrompt}. Cooling water protocol active. Please route an emergency ambulance to the nearest specialized burn trauma center.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        wrap_scout: {
          id: 'wrap_scout',
          title: '3. Clean Plastic Wrap Scout',
          subtitle: 'Find Clean Cling Wrap / Sterile Cloth',
          priority: 2,
          category: 'equipment',
          status: 'unassigned',
          instruction: 'Find clean kitchen plastic cling film or a sterile non-adherent dressing. Cover the cooled burn loosely to prevent air pain and bacterial infection.',
          actionType: 'first_aid'
        },
        hazard_isolator: {
          id: 'hazard_isolator',
          title: '4. Thermal / Chemical Hazard Switch',
          subtitle: 'Turn Off Gas, Stove, or Power',
          priority: 3,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Verify that the heat, chemical, or electrical source is completely disconnected. Keep others from touching the contaminated area.',
          actionType: 'crowd_control'
        }
      };

    default:
      return {
        positioning_lead: {
          id: 'positioning_lead',
          title: '1. Patient Safety & Airway Lead',
          subtitle: 'Check Breathing & Open Airway',
          priority: 1,
          category: 'medical',
          status: 'unassigned',
          instruction: 'Check if patient is conscious and breathing normally. If breathing normally and not trauma-suspected, place into the lateral recovery position.',
          actionType: 'first_aid'
        },
        caller: {
          id: 'caller',
          title: '2. 112 Emergency Dispatcher',
          subtitle: 'Report Incident & Landmark',
          priority: 1,
          category: 'dispatch',
          status: 'unassigned',
          instruction: 'Dial 112 immediately to initiate ambulance dispatch.',
          scriptText: `Emergency first-aid incident at: ${addressPrompt}. Immediate medical response required. Please send an ambulance.`,
          actionType: 'call_112',
          actionPayload: { phoneNumber: '112', addressText: addressPrompt }
        },
        scout: {
          id: 'scout',
          title: '3. First Aid Box & Blanket Scout',
          subtitle: 'Retrieve First Aid Kit & Water',
          priority: 2,
          category: 'equipment',
          status: 'unassigned',
          instruction: 'Find the nearest first-aid box, clean towels, and a warm blanket.',
          actionType: 'first_aid'
        },
        flagger: {
          id: 'flagger',
          title: '4. Ambulance Gate Flagger',
          subtitle: 'Guide Siren to Patient Doorstep',
          priority: 3,
          category: 'logistics',
          status: 'unassigned',
          instruction: 'Wait at the main roadway entrance to direct the ambulance crew straight to the patient.',
          actionType: 'gate_flag'
        },
        guard: {
          id: 'guard',
          title: '5. Crowd Airflow Marshal',
          subtitle: 'Maintain 15ft Clearance',
          priority: 4,
          category: 'perimeter',
          status: 'unassigned',
          instruction: 'Keep the crowd 15 feet back. Maintain calm and quiet.',
          actionType: 'crowd_control'
        }
      };
  }
}

/**
 * Creates a fully initialized BystanderSquadSession with SVG QR Code
 */
export function createBystanderSquadSession(
  incidentTypeOrQuery: string,
  incidentSummary: string,
  locationAddress?: string,
  hospitalInfo?: { name: string; distance: string; eta: string; phone: string }
): BystanderSquadSession {
  const category = detectIncidentCategory(incidentTypeOrQuery);
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const sessionId = `SQUAD-${randomSuffix}`;

  const address = locationAddress || 'Current GPS Scene';
  const roles = generateSquadRolesForIncident(category, address, hospitalInfo?.name, hospitalInfo?.distance);

  // Auto-assign compressor/first aid lead to the Primary Responder (device owner)
  const firstRoleId = Object.keys(roles)[0];
  if (firstRoleId && roles[firstRoleId]) {
    roles[firstRoleId].assignedTo = 'You (Primary Responder)';
    roles[firstRoleId].status = 'claimed';
    roles[firstRoleId].assignedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Generate lightweight URL with embedded metadata for instant offline parsing on any mobile phone
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const origin = (typeof window !== 'undefined' && host !== 'localhost' && host !== '127.0.0.1')
    ? window.location.origin
    : 'https://sanjeevani-v2.web.app';
  const joinUrl = `${origin}/?squad=${sessionId}&cat=${encodeURIComponent(category)}&title=${encodeURIComponent(category.replace('_', ' ').toUpperCase())}&addr=${encodeURIComponent(address)}`;

  // Generate crisp vector SVG QR Code
  const qrSvg = generateQRCodeSVG(joinUrl, 240, '#0E5A50', '#FFFFFF');

  const urgency: 'CRITICAL_112' | 'URGENT' | 'MONITOR' = 
    category === 'cardiac_cpr' || category === 'hemorrhage' || category === 'road_accident' 
      ? 'CRITICAL_112' 
      : 'URGENT';

  return {
    id: sessionId,
    leaderId: 'responder_' + Date.now(),
    leaderName: 'Primary Incident Commander',
    protocolId: category,
    protocolTitle: category.replace('_', ' ').toUpperCase(),
    incidentSummary: incidentSummary || 'Emergency Incident — Crowd Task Assignment Active',
    urgencyLevel: urgency,
    locationAddress: address,
    nearestHospital: hospitalInfo,
    roles,
    bystanderCount: 1,
    status: 'active',
    qrSvg,
    joinUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Plays an authoritative verbal loudspeaker announcement to command onlooker attention
 * in both English and Hindi.
 */
export function broadcastCrowdAudioAnnouncement(
  session: BystanderSquadSession,
  language: 'en' | 'hi' | 'bilingual' = 'bilingual',
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Play alert tone clicks first
  try {
    audioEngine.playClick(true);
    setTimeout(() => audioEngine.playClick(true), 150);
  } catch {
    // ignore
  }

  window.speechSynthesis.cancel();

  const englishPrompt = "Attention everyone nearby! We have an emergency medical incident. Please look at this screen, scan the QR code with your phone camera, and take your assigned task now.";
  const hindiPrompt = "Kripya dhyan dein! Yahan ek aapatkaal hai. Sabhi log is screen par QR code ko apne phone se scan karein aur apni zimmewari lein!";

  let speechText = englishPrompt;
  if (language === 'hi') {
    speechText = hindiPrompt;
  } else if (language === 'bilingual') {
    speechText = `${englishPrompt} ... ${hindiPrompt}`;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1.0; // Maximum volume

  const voices = window.speechSynthesis.getVoices();
  const indVoice = voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
  if (indVoice) {
    utterance.voice = indVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export interface GenerateSquadAIParams {
  incidentDescription: string;
  photoBase64?: string;
  locationAddress?: string;
  hospitalInfo?: { name: string; distance: string; eta: string; phone: string };
  estimatedBystanders?: number;
  onProgress?: (status: string) => void;
}

/**
 * High-Speed AI Squad Task Generator
 * Uses Gemini multimodal vision & text to analyze scene photograph & user description,
 * dynamically generating prioritized bystander tasks to eliminate diffusion of responsibility.
 */
export async function generateBystanderSquadWithAI(params: GenerateSquadAIParams): Promise<BystanderSquadSession> {
  const { incidentDescription, photoBase64, locationAddress, hospitalInfo, estimatedBystanders = 4, onProgress } = params;

  onProgress?.('Evaluating scene visual & clinical priority...');

  const detectedCategory = detectIncidentCategory(incidentDescription || 'general emergency');
  const addressPrompt = locationAddress || 'Current GPS Emergency Scene';

  let aiRoles: Record<string, SquadTaskRole> | null = null;
  let aiSummary = '';
  let aiUrgency: 'CRITICAL_112' | 'URGENT' = 
    detectedCategory === 'cardiac_cpr' || detectedCategory === 'hemorrhage' || detectedCategory === 'road_accident' 
      ? 'CRITICAL_112' 
      : 'URGENT';

  try {
    const cleanBase64 = photoBase64 ? photoBase64.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
    const promptText = `
You are Sanjeevani AI Emergency Incident Commander.
An emergency has occurred with onlookers / bystanders standing around.
Incident Description: "${incidentDescription || 'Acute medical emergency scene'}"
Location: "${addressPrompt}"
Estimated Bystanders on Scene: ${estimatedBystanders}

Your goal is to eliminate the Bystander Effect (Diffusion of Responsibility) through algorithmic direct delegation.
Generate 4 to 5 prioritized, imperative, life-saving tasks for onlookers who will scan an emergency QR code with their phones on scene.

Return ONLY a valid JSON object matching this schema without markdown or formatting:
{
  "category": "${detectedCategory}",
  "urgencyLevel": "${aiUrgency}",
  "incidentSummary": "One clear concise sentence summarizing the injury and immediate life-saving priority",
  "roles": [
    {
      "id": "short_snake_case_id",
      "title": "Role number & title (e.g. '1. Direct Pressure Lead' or '1. Hands-on CPR Compressor')",
      "subtitle": "Short 2-4 word focus (e.g. 'Firm Continuous Pressure' or '110 BPM Compressions')",
      "priority": 1,
      "category": "medical",
      "instruction": "Specific imperative instructions for this bystander. Include what NOT to do.",
      "scriptText": "If 112 dispatcher, exact script to read to emergency dispatch",
      "actionType": "first_aid"
    }
  ]
}
`;

    const parts: any[] = [];
    if (cleanBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }
    parts.push({ text: promptText });

    onProgress?.('Synthesizing direct delegation task matrix with Gemini...');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${AI_CONFIG.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9500);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.roles && Array.isArray(parsed.roles) && parsed.roles.length > 0) {
          aiSummary = parsed.incidentSummary || incidentDescription;
          if (parsed.urgencyLevel === 'CRITICAL_112' || parsed.urgencyLevel === 'URGENT') {
            aiUrgency = parsed.urgencyLevel;
          }
          
          aiRoles = {};
          parsed.roles.forEach((r: any, idx: number) => {
            const roleId = r.id || `role_${idx + 1}`;
            const validCategories: SquadRoleCategory[] = ['medical', 'dispatch', 'equipment', 'perimeter', 'logistics'];
            const category: SquadRoleCategory = validCategories.includes(r.category) ? r.category : 'medical';

            const validActionTypes = ['call_112', 'metronome_cpr', 'search_aed', 'crowd_control', 'gate_flag', 'first_aid'] as const;
            const actionType = validActionTypes.includes(r.actionType) ? r.actionType : (idx === 0 ? 'first_aid' : 'call_112');

            aiRoles![roleId] = {
              id: roleId,
              title: r.title || `${idx + 1}. Task Rescuer`,
              subtitle: r.subtitle || 'Immediate Action',
              priority: r.priority || idx + 1,
              category,
              status: idx === 0 ? 'claimed' : 'unassigned',
              assignedTo: idx === 0 ? 'You (Primary Responder)' : undefined,
              assignedAt: idx === 0 ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              instruction: r.instruction || 'Follow first-aid protocol and await arriving paramedics.',
              scriptText: r.scriptText || (actionType === 'call_112' ? `Emergency at ${addressPrompt}: ${aiSummary}. Please dispatch an ambulance immediately.` : undefined),
              actionType,
              actionPayload: actionType === 'call_112' 
                ? { phoneNumber: '112', addressText: addressPrompt }
                : actionType === 'metronome_cpr'
                ? { metronomeBpm: 110 }
                : undefined
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn('AI task synthesis encountered issue, using clinical algorithmic fallback:', err);
  }

  // Fallback to accredited algorithmic roles if AI was unable to parse
  const finalRoles = aiRoles || generateSquadRolesForIncident(detectedCategory, addressPrompt, hospitalInfo?.name, hospitalInfo?.distance);
  const finalSummary = aiSummary || incidentDescription || `${detectedCategory.replace('_', ' ').toUpperCase()} Incident Response`;

  onProgress?.('Generating high-contrast vector QR code beacon...');

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const sessionId = `SQUAD-${randomSuffix}`;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const origin = (typeof window !== 'undefined' && host !== 'localhost' && host !== '127.0.0.1')
    ? window.location.origin
    : 'https://sanjeevani-v2.web.app';
  const joinUrl = `${origin}/?squad=${sessionId}&cat=${encodeURIComponent(detectedCategory)}&title=${encodeURIComponent(detectedCategory.replace('_', ' ').toUpperCase())}&addr=${encodeURIComponent(addressPrompt)}`;
  const qrSvg = generateQRCodeSVG(joinUrl, 220, '#0E5A50', '#FFFFFF');

  const session: BystanderSquadSession = {
    id: sessionId,
    leaderId: 'responder_' + Date.now(),
    leaderName: 'Primary Incident Commander',
    protocolId: detectedCategory,
    protocolTitle: detectedCategory.replace('_', ' ').toUpperCase(),
    incidentSummary: finalSummary,
    urgencyLevel: aiUrgency,
    locationAddress: addressPrompt,
    nearestHospital: hospitalInfo,
    roles: finalRoles,
    bystanderCount: 1,
    status: 'active',
    qrSvg,
    joinUrl,
    photoPreviewUrl: photoBase64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return session;
}
