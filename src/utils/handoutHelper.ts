/**
 * Sanjeevani v2 - Paramedic Handout & QR Telemetry Synthesizer
 * Converts chat exchanges into standardized pre-hospital SBAR handover packets.
 */

import { generateQRCodeSVG } from './qr';
import { EmergencyFacility } from '../services/placesRoutesService';

export interface ParamedicHandoutData {
  handoutId: string;
  generatedAt: string;
  situation: string;
  background: string;
  assessment: string;
  recommendations: string[];
  contraindications: string[];
  isEmergency: boolean;
  modelUsed?: string;
  locationAddress?: string;
  nearestHospitalName?: string;
  nearestHospitalDistance?: string;
  sbarText: string;
  qrPayloadString: string;
  qrSvg: string;
}

/**
 * Extract clean lines from AI text response
 */
function extractSection(text: string, headerRegex: RegExp, stopRegex: RegExp): string {
  const match = text.match(headerRegex);
  if (!match || match.index === undefined) return '';

  const startIdx = match.index + match[0].length;
  const sub = text.slice(startIdx);
  const stopMatch = sub.match(stopRegex);
  const endIdx = stopMatch && stopMatch.index !== undefined ? stopMatch.index : sub.length;

  return sub.slice(0, endIdx).trim();
}

/**
 * Synthesize a standardized SBAR Handout packet from a chat exchange
 */
export function createParamedicHandout(
  messageId: string,
  userQuery: string,
  aiText: string,
  timestamp: string,
  isEmergency: boolean = false,
  modelUsed: string = 'Gemini AI',
  facility?: EmergencyFacility,
  userAddress?: string
): ParamedicHandoutData {
  // Deterministic clean handout ID
  const hashNum = Math.abs(
    messageId.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)
  ) % 900000 + 100000;
  const handoutId = `HANDOUT-${hashNum}`;

  // 1. Situation
  const cleanQuery = (userQuery || 'Acute First-Aid Emergency').replace(/\n+/g, ' ').trim();
  const situation = `Incident Handover: ${cleanQuery}`;

  // 2. Priority & Assessment
  let priority = extractSection(
    aiText,
    /(?:\*\*Immediate Priority:\*\*|Immediate Priority:)/i,
    /(?:\*\*Immediate Action Steps:\*\*|\*\*Action Steps:\*\*|###)/i
  );
  if (!priority) {
    const firstLines = aiText.split('\n').filter(l => l.trim().length > 10).slice(0, 2);
    priority = firstLines.join(' ').slice(0, 150);
  }
  const assessment = priority || 'First-aid evaluation in progress; patient stabilization initiated.';

  // 3. Action Steps & Recommendations
  const actionStepsRaw = extractSection(
    aiText,
    /(?:\*\*Immediate Action Steps:\*\*|\*\*Action Steps:\*\*)/i,
    /(?:\*\*CRITICAL CONTRAINDICATIONS|\*\*WHAT NOT TO DO\*\*|###)/i
  );
  const actionSteps: string[] = [];
  if (actionStepsRaw) {
    const stepLines = actionStepsRaw.split('\n').filter(l => /^\s*\d+\./.test(l));
    stepLines.forEach(l => {
      actionSteps.push(l.replace(/^\s*\d+\.\s*/, '').replace(/\*\*/g, '').trim());
    });
  }
  if (actionSteps.length === 0) {
    actionSteps.push('Maintain calm, verify breathing, and apply direct first aid.');
  }

  // 4. Contraindications
  const contraRaw = extractSection(
    aiText,
    /(?:\*\*CRITICAL CONTRAINDICATIONS|\*\*WHAT NOT TO DO\*\*)/i,
    /(?:\*\*⚠️ Immediate 112|\*\*Immediate 112|###)/i
  );
  const contraindications: string[] = [];
  if (contraRaw) {
    const lines = contraRaw.split('\n').filter(l => l.trim().startsWith('*') || l.trim().startsWith('-'));
    lines.forEach(l => {
      contraindications.push(l.replace(/^[\*\-]\s*/, '').trim());
    });
  }
  if (contraindications.length === 0) {
    contraindications.push('Do not administer oral fluids if drowsy; avoid rough movement.');
  }

  // 5. Build SBAR Text for verbal reading & copy
  const sbarText = [
    `SITUATION: ${situation}. Dispatch status: ${isEmergency ? 'P1 CRITICAL (112 Alert)' : 'P2 Urgent'}. Recorded at ${timestamp}.`,
    `BACKGROUND: AI Guidance initiated via ${modelUsed}. Doorstep location: ${userAddress || 'GPS Calibrated'}.`,
    `ASSESSMENT: Primary Priority: ${assessment}.`,
    `RECOMMENDATIONS FOR ARRIVING PARAMEDICS: ${actionSteps.join('; ')}. Contraindications: ${contraindications.join('; ')}.${facility ? ` Nearest Designated Trauma Center: ${facility.name} (${facility.distanceKm ? facility.distanceKm.toFixed(1) + ' km' : 'En route'}).` : ''}`
  ].join('\n\n');

  // 6. JSON payload for offline QR scanning
  const qrPayload = {
    sanjeevaniHandoffId: handoutId,
    timestamp,
    urgency: isEmergency ? 'CRITICAL_112' : 'URGENT',
    chiefComplaint: cleanQuery.slice(0, 100),
    immediateAssessment: assessment.slice(0, 150),
    actionsAdvised: actionSteps.slice(0, 4),
    contraindications: contraindications.slice(0, 3),
    doorstepLocation: userAddress || undefined,
    nearestHospital: facility ? { name: facility.name, dist: facility.distanceKm } : undefined,
    sbarVerbal: sbarText.slice(0, 400)
  };

  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';
  const origin = (rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1')) ? 'https://sanjeevani-v2.web.app' : rawOrigin;
  const qrPayloadString = `${origin}/?docket=${handoutId}&title=${encodeURIComponent(cleanQuery.slice(0, 60))}&sev=${isEmergency ? 'CRITICAL' : 'URGENT'}`;
  const qrSvg = generateQRCodeSVG(qrPayloadString, 200, '#0E5A50', '#FFFFFF');

  return {
    handoutId,
    generatedAt: timestamp,
    situation,
    background: cleanQuery,
    assessment,
    recommendations: actionSteps,
    contraindications,
    isEmergency,
    modelUsed,
    locationAddress: userAddress,
    nearestHospitalName: facility?.name,
    nearestHospitalDistance: facility?.distanceKm ? `${facility.distanceKm.toFixed(1)} km` : undefined,
    sbarText,
    qrPayloadString,
    qrSvg
  };
}
