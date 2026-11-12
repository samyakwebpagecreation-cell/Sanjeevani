import {
  AMBIGUOUS_PREFIX_GROUPS,
  CURATED_MEDICINE_INDEX,
  CuratedMedicineReference
} from './referenceData';
import { DidYouMeanSuggestion, DisambiguationOption } from './types';

/**
 * Normalises a user query:
 * - trims, lowercases
 * - splits glued letter-digit boundaries ("augmentin625" -> "augmentin 625", "dolo650" -> "dolo 650")
 * - preserves standard unit suffixes ("650mg", "100iu/ml") when appropriate or normalises spaces
 * - replaces hyphens/punctuation with spaces and collapses multiple spaces
 */
export function normaliseMedicineQuery(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim().toLowerCase().slice(0, 100);
  // Insert space between letters and digits when a brand name is glued to a dose number (e.g. augmentin625 -> augmentin 625)
  const splitBrandDigits = trimmed.replace(/([a-z]{3,})(\d+)/g, '$1 $2');
  // Replace hyphens, underscores, and punctuation (except / and +) with spaces
  const cleaned = splitBrandDigits
    .replace(/[-_.,;:()[\]{}'"`!?@#$%^&*=~<>|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

/**
 * Computes Levenshtein edit distance between two strings for fuzzy matching ("Did you mean...").
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export interface QueryResolution {
  normalised_query: string;
  status: 'exact_match' | 'ambiguous' | 'fuzzy_suggestions' | 'unknown';
  matched_reference?: CuratedMedicineReference;
  disambiguation_options?: DisambiguationOption[];
  did_you_mean?: DidYouMeanSuggestion[];
}

export function resolveMedicineQuery(rawInput: string): QueryResolution {
  const normalised = normaliseMedicineQuery(rawInput);
  if (!normalised) {
    return {
      normalised_query: '',
      status: 'unknown',
      did_you_mean: []
    };
  }

  // 1. Check if the query is an ambiguous prefix ("pan", "dolo", "telma", "glycomet")
  const ambiguousOptions = AMBIGUOUS_PREFIX_GROUPS[normalised];
  if (ambiguousOptions && ambiguousOptions.length > 1) {
    return {
      normalised_query: normalised,
      status: 'ambiguous',
      disambiguation_options: ambiguousOptions
    };
  }

  // 2. Check exact match against curated medicine index or aliases
  for (const item of CURATED_MEDICINE_INDEX) {
    const normAliases = item.aliases.map((a) => normaliseMedicineQuery(a));
    if (item.normalised_key === normalised || normAliases.includes(normalised)) {
      return {
        normalised_query: item.normalised_key,
        status: 'exact_match',
        matched_reference: item
      };
    }
  }

  // 3. Check if single-option prefix group matches
  if (ambiguousOptions && ambiguousOptions.length === 1) {
    const targetNorm = normaliseMedicineQuery(ambiguousOptions[0].query);
    const matched = CURATED_MEDICINE_INDEX.find((c) => c.normalised_key === targetNorm);
    if (matched) {
      return {
        normalised_query: matched.normalised_key,
        status: 'exact_match',
        matched_reference: matched
      };
    }
  }

  // 4. Check salt composition match (e.g., "paracetamol 650", "telmisartan 40", "amoxicillin clavulanic acid")
  for (const item of CURATED_MEDICINE_INDEX) {
    const saltCompNorm = normaliseMedicineQuery(item.composition_display);
    if (saltCompNorm === normalised) {
      return {
        normalised_query: item.normalised_key,
        status: 'exact_match',
        matched_reference: item
      };
    }
  }

  // 5. Compute fuzzy "Did you mean..." suggestions (edit distance <= 3)
  const scored: Array<{ ref: CuratedMedicineReference; dist: number }> = [];
  for (const item of CURATED_MEDICINE_INDEX) {
    const candidates = [item.normalised_key, ...item.aliases.map((a) => normaliseMedicineQuery(a))];
    let minDist = Infinity;
    for (const cand of candidates) {
      const d = levenshteinDistance(normalised, cand);
      if (d < minDist) minDist = d;
      // Also check prefix similarity if user typed a typo of the brand word
      const firstWordQuery = normalised.split(' ')[0];
      const firstWordCand = cand.split(' ')[0];
      if (firstWordQuery.length >= 4 && levenshteinDistance(firstWordQuery, firstWordCand) <= 2) {
        minDist = Math.min(minDist, levenshteinDistance(firstWordQuery, firstWordCand) + 1);
      }
    }
    if (minDist <= 3) {
      scored.push({ ref: item, dist: minDist });
    }
  }

  scored.sort((a, b) => a.dist - b.dist);
  if (scored.length > 0) {
    // If the closest match has edit distance 1 and identical numeric strength (e.g., "Augmentin 625" typo "Augmentn 625"),
    // still offer it as a clear suggestion or match if unambiguous
    const suggestions: DidYouMeanSuggestion[] = scored.slice(0, 4).map((s) => ({
      query: s.ref.brand_name,
      brand_name: s.ref.brand_name,
      composition_display: s.ref.composition_display
    }));
    return {
      normalised_query: normalised,
      status: 'fuzzy_suggestions',
      did_you_mean: suggestions
    };
  }

  return {
    normalised_query: normalised,
    status: 'unknown',
    did_you_mean: []
  };
}
