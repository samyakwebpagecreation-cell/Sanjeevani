import { ProtocolDocument, ProtocolSeverity, PROTOCOLS } from '../data/protocolSchema';

export interface SearchMatchSegment {
  text: string;
  matched: boolean;
}

export interface ProtocolSearchResult {
  protocol: ProtocolDocument;
  score: number;
  matchField: 'title' | 'alias' | 'category' | 'summary' | 'fuzzy';
  matchedAlias?: string;
}

const SEVERITY_RANK: Record<ProtocolSeverity, number> = {
  Emergency: 40,
  Urgent: 30,
  Moderate: 20,
  Mild: 10,
};

interface IndexedProtocol {
  protocol: ProtocolDocument;
  titleLower: string;
  titleTokens: string[];
  aliasesLower: string[];
  aliasTokens: string[];
  categoryLower: string;
  summaryLower: string;
  summaryTokens: string[];
  trigrams: Set<string>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
}

function buildTrigrams(str: string): Set<string> {
  const s = `  ${str.toLowerCase().trim()} `;
  const set = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

/**
 * Fast bounded Levenshtein edit distance (stops early if distance > maxDist)
 */
function editDistanceBounded(a: string, b: string, maxDist = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;

  const prev = new Array(lb + 1);
  const curr = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      const val = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      curr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

// Pre-built in-memory index for sub-millisecond search across all 100 protocols
const LOCAL_INDEX: IndexedProtocol[] = PROTOCOLS.map((protocol) => {
  const titleLower = protocol.title.toLowerCase();
  const aliasesLower = protocol.aliases.map(a => a.toLowerCase());
  const categoryLower = protocol.category.toLowerCase();
  const summaryLower = `${protocol.summary} ${protocol.fullDescription}`.toLowerCase();

  return {
    protocol,
    titleLower,
    titleTokens: tokenize(titleLower),
    aliasesLower,
    aliasTokens: aliasesLower.flatMap(tokenize),
    categoryLower,
    summaryLower,
    summaryTokens: tokenize(summaryLower),
    trigrams: buildTrigrams(`${titleLower} ${aliasesLower.join(' ')} ${categoryLower}`),
  };
});

/**
 * Search 100 protocols locally in <= 5ms.
 * Ranking order: exact title > alias > category > summary text,
 * breaking ties by severity (Emergency first), then alphabetical title.
 */
export function searchProtocols(
  rawQuery: string,
  subset?: ProtocolDocument[]
): ProtocolSearchResult[] {
  const q = rawQuery.trim().toLowerCase();
  const allowedIds = subset ? new Set(subset.map(p => p.id)) : null;

  if (!q) {
    const base = subset || PROTOCOLS;
    return base.map(protocol => ({
      protocol,
      score: SEVERITY_RANK[protocol.severity],
      matchField: 'title',
    }));
  }

  const qTokens = tokenize(q);
  const results: ProtocolSearchResult[] = [];

  for (const item of LOCAL_INDEX) {
    if (allowedIds && !allowedIds.has(item.protocol.id)) continue;

    const sevTieBreaker = SEVERITY_RANK[item.protocol.severity]; // 10..40
    let tierScore = 0;
    let matchField: ProtocolSearchResult['matchField'] = 'summary';
    let matchedAlias: string | undefined;

    // Tier 1: Exact or substring Title match (1200..1500)
    if (item.titleLower === q) {
      tierScore = 1500;
      matchField = 'title';
    } else if (
      item.titleLower.startsWith(q) ||
      item.titleLower.includes(q) ||
      (qTokens.length > 0 && qTokens.every(qt => item.titleTokens.some(tt => tt.startsWith(qt))))
    ) {
      tierScore = 1200;
      matchField = 'title';
    }

    // Tier 2: Alias match (800..950)
    if (tierScore === 0) {
      const exactAlias = item.aliasesLower.find(a => a === q || a.startsWith(q) || a.includes(q));
      if (exactAlias) {
        tierScore = exactAlias === q ? 950 : 880;
        matchField = 'alias';
        matchedAlias = exactAlias;
      } else if (qTokens.length > 0 && qTokens.every(qt => item.aliasTokens.some(at => at.startsWith(qt)))) {
        tierScore = 820;
        matchField = 'alias';
        matchedAlias = item.aliasesLower.find(a => qTokens.some(qt => a.includes(qt)));
      }
    }

    // Tier 2.5: Typo-tolerant fuzzy match on title or alias tokens (e.g., "chocking" -> "choking") (720..790)
    if (tierScore === 0 && qTokens.length > 0) {
      let allTokensFuzzyTitle = true;
      for (const qt of qTokens) {
        if (qt.length < 3) {
          allTokensFuzzyTitle = false;
          break;
        }
        const maxDist = qt.length >= 6 ? 2 : 1;
        const hitTitle = item.titleTokens.some(
          tt => tt.startsWith(qt) || editDistanceBounded(qt, tt, maxDist) <= maxDist
        );
        if (!hitTitle) {
          allTokensFuzzyTitle = false;
          break;
        }
      }

      if (allTokensFuzzyTitle) {
        tierScore = 780;
        matchField = 'fuzzy';
      } else {
        let allTokensFuzzyAlias = true;
        for (const qt of qTokens) {
          if (qt.length < 3) {
            allTokensFuzzyAlias = false;
            break;
          }
          const maxDist = qt.length >= 6 ? 2 : 1;
          const hitAlias = item.aliasTokens.some(
            at => at.startsWith(qt) || editDistanceBounded(qt, at, maxDist) <= maxDist
          );
          if (!hitAlias) {
            allTokensFuzzyAlias = false;
            break;
          }
        }
        if (allTokensFuzzyAlias) {
          tierScore = 740;
          matchField = 'alias';
          matchedAlias = item.aliasesLower[0];
        }
      }
    }

    // Tier 3: Category match (500..600)
    if (tierScore === 0) {
      if (item.categoryLower.includes(q) || (qTokens.length > 0 && qTokens.every(qt => item.categoryLower.includes(qt)))) {
        tierScore = 550;
        matchField = 'category';
      }
    }

    // Tier 4: Summary / description match (200..400)
    if (tierScore === 0) {
      if (item.summaryLower.includes(q)) {
        tierScore = 350;
        matchField = 'summary';
      } else if (
        qTokens.length > 0 &&
        qTokens.every(qt =>
          item.summaryTokens.some(st => st.startsWith(qt) || (qt.length >= 5 && editDistanceBounded(qt, st, 1) <= 1))
        )
      ) {
        tierScore = 250;
        matchField = 'summary';
      }
    }

    if (tierScore > 0) {
      results.push({
        protocol: item.protocol,
        score: tierScore + sevTieBreaker,
        matchField,
        matchedAlias,
      });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.protocol.title.localeCompare(b.protocol.title);
  });

  return results;
}

/**
 * Suggest closest protocols when search returns 0 direct hits (using trigram overlap + Emergency priority)
 */
export function getClosestProtocolSuggestions(rawQuery: string, limit = 4): ProtocolDocument[] {
  const qTrigrams = buildTrigrams(rawQuery);
  const scored = LOCAL_INDEX.map((item) => {
    let overlap = 0;
    qTrigrams.forEach((tri) => {
      if (item.trigrams.has(tri)) overlap++;
    });
    const score = overlap * 100 + SEVERITY_RANK[item.protocol.severity];
    return { protocol: item.protocol, overlap, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.protocol);
}

/**
 * Splits text into matched and unmatched segments for accessible highlighting.
 */
export function getHighlightSegments(text: string, rawQuery: string): SearchMatchSegment[] {
  const q = rawQuery.trim();
  if (!q || q.length < 2) return [{ text, matched: false }];

  const escapedTokens = tokenize(q)
    .filter(t => t.length >= 2)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escapedTokens.length === 0) return [{ text, matched: false }];

  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return [{ text, matched: false }];

  const lowerTokens = escapedTokens.map(t => t.toLowerCase());
  return parts
    .filter(Boolean)
    .map((part) => ({
      text: part,
      matched: lowerTokens.includes(part.toLowerCase()),
    }));
}
