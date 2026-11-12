/**
 * Sanitises untrusted web page text before sending to an LLM or verifier:
 * - Strips <script>, <style>, hidden HTML tags, and comments
 * - Neutralises prompt-injection patterns ("ignore previous instructions", "system prompt:", etc.)
 */
export function sanitiseUntrustedPageText(rawHtmlOrText: string): string {
  if (!rawHtmlOrText || typeof rawHtmlOrText !== 'string') return '';

  const withoutScripts = rawHtmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  // Neutralise prompt injection directives inside untrusted web text
  const neutralised = withoutScripts.replace(
    /\b(ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|system\s+prompt|you\s+are\s+now|disregard\s+all|override\s+schema|set\s+price\s+to)\b/gi,
    '[REDACTED_UNTRUSTED_DIRECTIVE]'
  );

  return neutralised.replace(/\s+/g, ' ').trim().slice(0, 16000);
}

export interface VerbatimVerificationResult {
  verified: boolean;
  snippet: string | null;
  failure_reason?: string;
}

/**
 * Hallucination guard (Section C.6):
 * Checks in deterministic code that BOTH the extracted product name (or its core identifying tokens)
 * AND the exact numeric price appear verbatim in the fetched source text.
 * If either is missing, the record is rejected with status = "failed_verification".
 */
export function verifyVerbatimInSourceText(
  productName: string | null | undefined,
  priceInr: number | null | undefined,
  sourcePageText: string
): VerbatimVerificationResult {
  if (!sourcePageText || typeof sourcePageText !== 'string' || !sourcePageText.trim()) {
    return {
      verified: false,
      snippet: null,
      failure_reason: 'Source page text was empty.'
    };
  }

  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    return {
      verified: false,
      snippet: null,
      failure_reason: 'Product name was missing from extraction.'
    };
  }

  if (
    priceInr === null ||
    priceInr === undefined ||
    typeof priceInr !== 'number' ||
    !Number.isFinite(priceInr) ||
    priceInr <= 0
  ) {
    return {
      verified: false,
      snippet: null,
      failure_reason: 'Extracted price was missing, zero, negative, or non-numeric.'
    };
  }

  const textLower = sourcePageText.toLowerCase();

  // 1. Check that the product name (or stripped of parenthetical annotation) appears in the source text
  const cleanProductName = productName
    .replace(/\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

  const productIndex = textLower.indexOf(cleanProductName);
  if (productIndex === -1) {
    return {
      verified: false,
      snippet: null,
      failure_reason: `Product name "${productName}" was not found verbatim in the fetched source text.`
    };
  }

  // 2. Check that the price number appears verbatim in the source text
  // Candidate verbatim representations of priceInr (e.g. 52 -> "52", "52.00", "52.0"; 223.42 -> "223.42")
  const priceCandidates = new Set<string>([
    String(priceInr),
    priceInr.toFixed(2),
    priceInr.toFixed(1),
    priceInr.toLocaleString('en-IN'),
    priceInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  ]);

  let matchedPriceStr: string | null = null;
  let matchedPriceIdx = -1;

  for (const cand of priceCandidates) {
    // Match the price as a standalone number (preceded by ₹, Rs, space, or start, not part of a longer number)
    const escaped = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:₹|rs\\.?|\\s|^)${escaped}(?!\\d)`, 'i');
    const match = regex.exec(sourcePageText);
    if (match && match.index !== undefined) {
      matchedPriceStr = cand;
      matchedPriceIdx = match.index;
      break;
    }
  }

  if (!matchedPriceStr || matchedPriceIdx === -1) {
    return {
      verified: false,
      snippet: null,
      failure_reason: `Price ₹${priceInr.toFixed(2)} was not found verbatim in the fetched source text.`
    };
  }

  // Build a concise verbatim snippet around the matched product & price
  const startIdx = Math.max(0, Math.min(productIndex, matchedPriceIdx) - 24);
  const endIdx = Math.min(
    sourcePageText.length,
    Math.max(productIndex + cleanProductName.length, matchedPriceIdx + matchedPriceStr.length) + 48
  );
  const snippet = sourcePageText.slice(startIdx, endIdx).trim();

  return {
    verified: true,
    snippet
  };
}
