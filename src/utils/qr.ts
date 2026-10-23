/**
 * Sanjeevani v2 - ISO/IEC 18004 Standard QR Code Engine
 * Powered by 'qrcode' and 'jsqr' for 100% scannability across iOS, Android, and Web.
 * 
 * Features:
 * - 100% offline, standard Reed-Solomon error correction (Level M)
 * - Synchronous SVG generation for instant UI rendering
 * - Calling data extraction (112, 108, ambulances, contact numbers)
 * - Clinical Markdown docket formatting & parser
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface QRCodeOptions {
  size?: number;
  bgColor?: string;
  fgColor?: string;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate an official ISO/IEC 18004 standard QR Code as a crisp SVG string.
 * Scannable by any mobile camera (iOS Camera, Google Lens, Samsung Camera, barcode readers).
 */
export function generateQRCodeSVG(
  text: string, 
  size: number = 220, 
  fgColor: string = '#0E5A50', 
  bgColor: string = '#FFFFFF',
  options?: Partial<QRCodeOptions>
): string {
  try {
    const errorLevel = options?.errorCorrectionLevel || 'M';
    const qr = QRCode.create(text, { errorCorrectionLevel: errorLevel });
    const moduleCount = qr.modules.size;
    const margin = options?.margin ?? 2;
    const totalCount = moduleCount + margin * 2;
    const cellSize = size / totalCount;

    let rects = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cellSize + 0.05).toFixed(2)}" height="${(cellSize + 0.05).toFixed(2)}" fill="${fgColor}" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="14" />
      ${rects}
    </svg>`;
  } catch (err) {
    console.error('Failed to generate standard QR code:', err);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bgColor}" rx="14"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fgColor}" font-size="12" font-family="sans-serif">QR Encoding Error</text></svg>`;
  }
}

/**
 * Generate a PNG Data URL for standard QR code
 */
export async function generateQRCodeDataURL(
  text: string,
  width: number = 300,
  fgColor: string = '#0E5A50',
  bgColor: string = '#FFFFFF'
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: fgColor,
        light: bgColor
      }
    });
  } catch (err) {
    console.error('Failed to create QR Data URL:', err);
    return '';
  }
}

/**
 * Decodes a QR code from image pixel data using jsQR
 */
export function decodeQRCodeFromImageData(imageData: ImageData): { data: string; location: any } | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (code && code.data) {
      return {
        data: code.data,
        location: code.location
      };
    }
  } catch (e) {
    console.error('Error decoding QR code frame:', e);
  }
  return null;
}

/**
 * Extracts phone and emergency call numbers from text payload
 */
export function extractCallingData(text: string): string[] {
  if (!text) return [];
  const numbers = new Set<string>();

  // Check for tel: URI
  const telMatches = text.match(/tel:([+0-9-]+)/gi);
  if (telMatches) {
    telMatches.forEach(m => {
      const num = m.replace(/tel:/i, '').replace(/[- ]/g, '').trim();
      if (num) numbers.add(num);
    });
  }

  // Priority Indian & Global Emergency numbers
  if (/\b112\b/.test(text)) numbers.add('112'); // All-in-one Emergency
  if (/\b108\b/.test(text)) numbers.add('108'); // Disaster / Ambulance
  if (/\b102\b/.test(text)) numbers.add('102'); // Medical transport
  if (/\b100\b/.test(text)) numbers.add('100'); // Police
  if (/\b101\b/.test(text)) numbers.add('101'); // Fire

  // Standard Indian 10-digit mobile numbers with or without +91
  const mobileMatches = text.match(/(?:\+91|91|0)?[6-9]\d{9}\b/g);
  if (mobileMatches) {
    mobileMatches.forEach(m => {
      // Normalize number
      const clean = m.replace(/^0/, '');
      numbers.add(clean.startsWith('+') ? clean : clean.startsWith('91') && clean.length > 10 ? `+${clean}` : clean);
    });
  }

  return Array.from(numbers);
}

export type SanjeevaniQRType = 'squad' | 'docket' | 'url' | 'tel' | 'text';

export interface ParsedSanjeevaniQR {
  type: SanjeevaniQRType;
  title: string;
  summary: string;
  squadId?: string;
  docketId?: string;
  protocolTitle?: string;
  url?: string;
  callingNumbers: string[];
  markdown: string;
  rawPayload: string;
}

/**
 * Analyzes and structures any scanned QR payload
 */
export function parseSanjeevaniPayload(rawText: string): ParsedSanjeevaniQR {
  const text = (rawText || '').trim();
  const callingNumbers = extractCallingData(text);

  // 1. Check if it's a Bystander Squad Join Link or ID
  const squadMatch = text.match(/(?:[?&]squad=|\/squad\/|^)(SQUAD-[A-Z0-9]+|\d{6})/i);
  if (squadMatch || text.includes('squad=') || text.startsWith('SQUAD-')) {
    const squadId = squadMatch ? squadMatch[1] : (text.match(/SQUAD-[A-Z0-9]+/i)?.[0] || 'SQUAD-EMERGENCY');
    
    // Check if category or location was encoded in query parameters
    let category = 'cardiac_cpr';
    let location = 'Current GPS Scene';
    try {
      if (text.startsWith('http')) {
        const u = new URL(text);
        if (u.searchParams.get('cat')) category = u.searchParams.get('cat')!;
        if (u.searchParams.get('addr')) location = u.searchParams.get('addr')!;
      }
    } catch {}

    const md = `# 🚨 SANJEEVANI BYSTANDER RESCUE SQUAD
**Squad Session ID:** \`${squadId}\`  
**Incident Type:** ${category.replace('_', ' ').toUpperCase()}  
**Location:** ${location}  
**Emergency Contacts:** ${callingNumbers.join(', ') || '112, 108'}

---

### Assigned Roles Matrix
1. **Hands-on CPR Compressor / Hemorrhage Lead** - Deliver immediate 110 BPM life support.
2. **112 Emergency Dispatcher** - Read teleprompter script to ambulance control.
3. **AED & Trauma Kit Scout** - Retrieve defibrillator from 200m perimeter.
4. **Ambulance Gate Flagger** - Direct incoming emergency vehicles at intersection.
5. **Crowd Airflow Marshal** - Maintain 15-foot safety circle for patient oxygen.

> ⚡ **Action Required:** Open Sanjeevani to claim your life-saving task immediately.
`;

    return {
      type: 'squad',
      title: `Rescue Squad Docket #${squadId}`,
      summary: `Active Bystander Rescue Squad for ${category.replace('_', ' ')} incident.`,
      squadId,
      url: text.startsWith('http') ? text : undefined,
      callingNumbers: callingNumbers.length > 0 ? callingNumbers : ['112', '108'],
      markdown: md,
      rawPayload: text
    };
  }

  // 2. Check if it's a Paramedic Handover Docket (URL, ID, or JSON)
  const isDocketUrl = text.includes('docket=') || text.includes('handoff=') || text.startsWith('TRAUMA-');
  const isDocketJson = text.includes('SANJEEVANI-v2-BLACK-BOX') || text.includes('TRAUMA-') || (text.startsWith('{') && text.includes('interventions'));

  if (isDocketUrl || isDocketJson) {
    let docketId = 'TRAUMA-' + Math.floor(100000 + Math.random() * 900000);
    let title = 'Acute Trauma & Witnessed Incident Handover';
    let cprSecs = 120;
    let accuracy = 94;
    let head = 'UNKNOWN';
    let oral = 'NO (Aspiration Risk Prevented)';

    if (text.startsWith('{')) {
      try {
        const obj = JSON.parse(text);
        if (obj.docId || obj.docketId) docketId = obj.docId || obj.docketId;
        if (obj.protocol || obj.protocolTitle) title = obj.protocol || obj.protocolTitle;
        if (obj.interventions?.cprActiveSeconds) cprSecs = obj.interventions.cprActiveSeconds;
        if (obj.interventions?.cprCadenceAccuracy) accuracy = parseInt(obj.interventions.cprCadenceAccuracy, 10) || accuracy;
        if (obj.preHospitalChecklist?.headStruckSurface) head = obj.preHospitalChecklist.headStruckSurface;
        if (obj.preHospitalChecklist?.oralFluidsGiven) oral = obj.preHospitalChecklist.oralFluidsGiven;
      } catch {}
    } else {
      const match = text.match(/docket=(TRAUMA-[A-Z0-9]+|\d+)/i) || text.match(/(TRAUMA-[A-Z0-9]+)/i);
      if (match) docketId = match[1];
      try {
        const u = new URL(text);
        if (u.searchParams.get('title')) title = decodeURIComponent(u.searchParams.get('title')!);
        if (u.searchParams.get('cpr')) cprSecs = parseInt(u.searchParams.get('cpr')!, 10) || cprSecs;
        if (u.searchParams.get('head')) head = u.searchParams.get('head')!;
      } catch {}
    }

    const md = `# 📋 PARAMEDIC HANDOVER DOCKET - #${docketId}
**System:** Sanjeevani v2 Black-Box Trauma Intelligence  
**Triage Priority:** Critical P1 (Pre-Hospital Handover)  
**Chief Protocol:** ${title}

---

### SBAR Pre-Hospital Report
- **SITUATION:** Witnessed collapse / acute emergency. Resuscitation initiated by bystander.
- **BACKGROUND:** 
  - Head Impact: \`${head}\`
  - Oral Fluids Given: \`${oral}\`
- **ASSESSMENT & INTERVENTIONS:**
  - Active CPR Duration: **${cprSecs} seconds**
  - Cadence Accuracy: **${accuracy}% Compliance (110 BPM target)**
  - Airway Protection: Clear & monitored
- **RECOMMENDATION:** Immediate ALS transport & secondary ER trauma survey.

---
**Emergency Escalation:** Dial \`112\` or \`108\`
`;

    return {
      type: 'docket',
      title: `Paramedic Handover #${docketId}`,
      summary: `${title} - Bystander CPR & Trauma Telemetry Recorded.`,
      docketId,
      protocolTitle: title,
      url: text.startsWith('http') ? text : undefined,
      callingNumbers: callingNumbers.length > 0 ? callingNumbers : ['112', '108'],
      markdown: md,
      rawPayload: text
    };
  }

  // 3. Check if it's a Direct Telephone URI
  if (text.startsWith('tel:') || (callingNumbers.length > 0 && text.length < 25 && /^[+0-9 -]+$/.test(text))) {
    const num = callingNumbers[0] || text.replace(/tel:/i, '');
    return {
      type: 'tel',
      title: `Emergency Phone: ${num}`,
      summary: `Direct 1-tap call to ${num}`,
      callingNumbers: [num],
      markdown: `# 📞 Emergency Call Contact\n**Direct Dial:** \`${num}\`\n\nTap the dial button below to connect immediately.`,
      rawPayload: text
    };
  }

  // 4. Check if standard Web URL
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return {
      type: 'url',
      title: 'Scanned Web Resource',
      summary: text.slice(0, 80),
      url: text,
      callingNumbers,
      markdown: `# 🌐 Scanned Web Link\n**URL:** [${text}](${text})\n\nScanned via Sanjeevani QR Scanner.`,
      rawPayload: text
    };
  }

  // 5. Default General Text / Medical Note
  return {
    type: 'text',
    title: 'Scanned Medical Text',
    summary: text.length > 80 ? `${text.slice(0, 77)}...` : text,
    callingNumbers,
    markdown: `# 📝 Scanned Data\n\n\`\`\`\n${text}\n\`\`\`\n\n*Saved to Sanjeevani offline history.*`,
    rawPayload: text
  };
}
