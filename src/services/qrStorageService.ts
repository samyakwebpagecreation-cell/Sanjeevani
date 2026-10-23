/**
 * Sanjeevani v2 - In-App Scanned QR Text Storage & Emergency Calling Service
 * 
 * Provides fail-safe offline persistence in localStorage:
 * - Stores all scanned QR codes with timestamp, parsed calling data, and markdown representation.
 * - Extracts direct calling shortcuts (112, 108, contact numbers).
 * - Exports individual or combined dossiers as downloadable .md markdown files.
 */

import { parseSanjeevaniPayload, ParsedSanjeevaniQR } from '../utils/qr';

export interface ScannedQREntry {
  id: string;
  timestamp: string;
  rawText: string;
  parsed: ParsedSanjeevaniQR;
  notes?: string;
}

const STORAGE_KEY = 'sanjeevani_qr_history';

/**
 * Retrieve all scanned QR entries from local storage
 */
export function getScannedQRHistory(): ScannedQREntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading QR history:', e);
    return [];
  }
}

/**
 * Save a newly scanned QR code payload
 */
export function saveScannedQR(rawText: string, notes?: string): ScannedQREntry {
  const history = getScannedQRHistory();
  const parsed = parseSanjeevaniPayload(rawText);

  // Check if identical scan exists in past 10 seconds to avoid duplicates
  const existingRecent = history.find(
    (item) => item.rawText === rawText && Date.now() - new Date(item.timestamp).getTime() < 10000
  );
  if (existingRecent) {
    return existingRecent;
  }

  const entry: ScannedQREntry = {
    id: `SCAN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    rawText,
    parsed,
    notes
  };

  const updated = [entry, ...history].slice(0, 50); // Store up to 50 recent scans
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error persisting QR entry:', e);
  }

  // Dispatch custom window event so any listening UI updates in real time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sanjeevani_qr_scanned', { detail: entry }));
  }

  return entry;
}

/**
 * Delete a specific scanned entry by ID
 */
export function deleteScannedQR(id: string): void {
  const history = getScannedQRHistory();
  const filtered = history.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting QR entry:', e);
  }
}

/**
 * Clear all scanned QR history
 */
export function clearScannedQRHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing QR history:', e);
  }
}

/**
 * Export all history as a clean, standardized Markdown file
 */
export function exportHistoryAsMarkdown(): string {
  const history = getScannedQRHistory();
  if (history.length === 0) {
    return '# Sanjeevani v2 - Scanned QR History\n\nNo records found.';
  }

  let md = `# 🛡️ SANJEEVANI v2 - SCANNED QR & EMERGENCY TELEMETRY LOG
**Generated:** ${new Date().toLocaleString()}  
**Total Records:** ${history.length}  

---

`;

  history.forEach((item, index) => {
    md += `## Record #${index + 1}: ${item.parsed.title}
- **Timestamp:** ${new Date(item.timestamp).toLocaleString()}
- **Record ID:** \`${item.id}\`
- **Category:** ${item.parsed.type.toUpperCase()}
- **Emergency Calling Numbers:** ${item.parsed.callingNumbers.join(', ') || 'None detected'}

### Content / Telemetry:
${item.parsed.markdown}

---
`;
  });

  return md;
}

/**
 * Helper to download content as a .md file directly in the browser
 */
export function downloadMarkdownFile(filename: string, markdownContent: string): void {
  try {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger .md download:', err);
  }
}
