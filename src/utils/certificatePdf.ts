import { generateQRCodeSVG } from './qr';

export interface CertificateRenderData {
  certId: string;
  schoolName: string;
  className: string;
  grade: string;
  drillDateIso: string;
  scenarioTitle: string;
  studentIdentifier: string; // Student code by default (e.g. "S-04"), or name if showStudentNames is enabled
  rolePracticed: string;
  verifyUrl: string;
  isDemo?: boolean;
}

export const REQUIRED_CERTIFICATE_CAVEAT =
  'Certificate of participation in a first-aid practice drill. This is not a first-aid qualification.';

export const OPTIONAL_INSTRUCTOR_LINE =
  'Countersigned by certified instructor: ________________________________ (optional)';

/**
 * Escapes parentheses and backslashes in PDF literal strings.
 */
function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a 100% offline-safe, standards-compliant PDF 1.4 byte array (Uint8Array)
 * containing one page per certificate in `items` (single student or full class batch),
 * including vector border geometry, exact required non-qualification disclaimer,
 * optional instructor countersignature line, and verification URL + QR matrix.
 */
export function buildCertificatesPdfBytes(items: CertificateRenderData[]): Uint8Array {
  const pageEntries: string[] = [];

  for (const cert of items) {
    const dateFormatted = new Date(cert.drillDateIso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Draw vector frame + typography in standard A4 Landscape (842 x 595 pt)
    const cmds: string[] = [];

    // Outer background & border
    cmds.push('0.98 0.98 0.97 rg');
    cmds.push('0 0 842 595 re f');

    // Deep clinical teal outer frame (#0E5A50 -> 0.055 0.353 0.314)
    cmds.push('0.055 0.353 0.314 RG');
    cmds.push('3 w');
    cmds.push('28 28 786 539 re S');

    // Inner subtle hairline border
    cmds.push('0.80 0.85 0.83 RG');
    cmds.push('1 w');
    cmds.push('36 36 770 523 re S');

    // Header bar accent
    cmds.push('0.055 0.353 0.314 rg');
    cmds.push('36 515 770 44 re f');

    // Header text in white
    cmds.push('BT');
    cmds.push('/F2 13 Tf');
    cmds.push('1 1 1 rg');
    cmds.push('56 532 Td');
    cmds.push(`(SANJEEVANI SCHOOL READINESS PROGRAM  |  PRACTICE DRILL RECORD) Tj`);
    cmds.push('ET');

    if (cert.isDemo) {
      cmds.push('BT');
      cmds.push('/F2 11 Tf');
      cmds.push('0.94 0.66 0.36 rg');
      cmds.push('620 532 Td');
      cmds.push(`([DEMO DATA - SAMPLE]) Tj`);
      cmds.push('ET');
    }

    // Main title
    cmds.push('BT');
    cmds.push('/F2 24 Tf');
    cmds.push('0.06 0.09 0.16 rg');
    cmds.push('56 462 Td');
    cmds.push(`(First-Aid Practice Drill Participation) Tj`);
    cmds.push('ET');

    // Mandatory prominent caveat right beneath title
    cmds.push('0.93 0.96 0.95 rg');
    cmds.push('56 416 730 30 re f');
    cmds.push('BT');
    cmds.push('/F2 11 Tf');
    cmds.push('0.055 0.353 0.314 rg');
    cmds.push('68 427 Td');
    cmds.push(`(${escapePdfText(REQUIRED_CERTIFICATE_CAVEAT)}) Tj`);
    cmds.push('ET');

    // Participant & School metadata rows
    const rows: Array<[string, string]> = [
      ['Participant Identifier:', cert.studentIdentifier],
      ['School:', cert.schoolName],
      ['Class / Section:', `${cert.className} (Grade ${cert.grade})`],
      ['Scenario Practised:', cert.scenarioTitle],
      ['Squad Role Practised:', cert.rolePracticed],
      ['Practice Drill Date:', dateFormatted],
      ['Verification ID:', cert.certId]
    ];

    let y = 378;
    for (const [label, value] of rows) {
      cmds.push('BT');
      cmds.push('/F2 11 Tf');
      cmds.push('0.35 0.40 0.45 rg');
      cmds.push(`56 ${y} Td`);
      cmds.push(`(${escapePdfText(label)}) Tj`);
      cmds.push('ET');

      cmds.push('BT');
      cmds.push('/F1 12 Tf');
      cmds.push('0.06 0.09 0.16 rg');
      cmds.push(`230 ${y} Td`);
      cmds.push(`(${escapePdfText(value)}) Tj`);
      cmds.push('ET');

      y -= 28;
    }

    // Optional countersigning instructor line
    cmds.push('BT');
    cmds.push('/F1 10.5 Tf');
    cmds.push('0.25 0.30 0.35 rg');
    cmds.push('56 135 Td');
    cmds.push(`(${escapePdfText(OPTIONAL_INSTRUCTOR_LINE)}) Tj`);
    cmds.push('ET');

    // Verification URL & footer note
    cmds.push('BT');
    cmds.push('/F2 10 Tf');
    cmds.push('0.055 0.353 0.314 rg');
    cmds.push('56 92 Td');
    cmds.push(`(Public Verification Link \\(shows school, grade & date only\\):) Tj`);
    cmds.push('ET');

    cmds.push('BT');
    cmds.push('/F1 10 Tf');
    cmds.push('0.06 0.09 0.16 rg');
    cmds.push('56 76 Td');
    cmds.push(`(${escapePdfText(cert.verifyUrl)}) Tj`);
    cmds.push('ET');

    // Render SVG QR matrix squares directly into PDF vector rectangles on the right side
    const qrSvg = generateQRCodeSVG(cert.verifyUrl, 120);
    const rectRegex = /<rect x="(\d+)" y="(\d+)" width="1" height="1"/g;
    const viewBoxMatch = qrSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const qrGridSize = viewBoxMatch ? parseInt(viewBoxMatch[1], 10) : 29;
    const boxSizePt = 116;
    const cellPt = boxSizePt / qrGridSize;
    const qrOriginX = 656;
    const qrOriginY = 72;

    cmds.push('1 1 1 rg');
    cmds.push(`${qrOriginX - 6} ${qrOriginY - 6} ${boxSizePt + 12} ${boxSizePt + 12} re f`);
    cmds.push('0.06 0.09 0.16 rg');

    let match: RegExpExecArray | null;
    while ((match = rectRegex.exec(qrSvg)) !== null) {
      const gx = parseInt(match[1], 10);
      const gy = parseInt(match[2], 10);
      const px = (qrOriginX + gx * cellPt).toFixed(2);
      const py = (qrOriginY + (qrGridSize - 1 - gy) * cellPt).toFixed(2);
      const cw = (cellPt + 0.15).toFixed(2);
      cmds.push(`${px} ${py} ${cw} ${cw} re f`);
    }

    pageEntries.push(cmds.join('\n'));
  }

  // Assemble multi-page PDF 1.4 document
  const objects: string[] = [];
  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // Obj 2: Pages placeholder (will fill kids)
  const firstPageObjNum = 5;
  const pageObjNums: number[] = [];
  for (let i = 0; i < pageEntries.length; i++) {
    pageObjNums.push(firstPageObjNum + i * 2);
  }
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${
      pageEntries.length
    } >>\nendobj`
  );
  // Obj 3: Font F1 (Helvetica)
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );
  // Obj 4: Font F2 (Helvetica-Bold)
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj'
  );

  for (let i = 0; i < pageEntries.length; i++) {
    const pageObjNum = firstPageObjNum + i * 2;
    const contentObjNum = pageObjNum + 1;
    const streamContent = pageEntries[i];
    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}

/**
 * Triggers a client-side PDF download in the browser (offline-safe).
 */
export function downloadCertificatesPdf(
  items: CertificateRenderData[],
  filename = 'sanjeevani-drill-certificates.pdf'
): void {
  const bytes = buildCertificatesPdfBytes(items);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
