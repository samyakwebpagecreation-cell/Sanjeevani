import { CANONICAL_SALT_MAP } from './referenceData';
import { MedicineIdentity, SourceRecord } from './types';

/**
 * Normalises a salt name using the canonical salt dictionary so synonyms
 * ("Acetaminophen" -> "paracetamol", "Amoxycillin" -> "amoxicillin", "Potassium Clavulanate" -> "clavulanic acid")
 * compare deterministically.
 */
export function normaliseSaltName(rawSalt: string): string {
  if (!rawSalt || typeof rawSalt !== 'string') return '';
  const cleaned = rawSalt
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu))\b/gi, ' ')
    .replace(/[-_.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (CANONICAL_SALT_MAP[cleaned]) {
    return CANONICAL_SALT_MAP[cleaned];
  }

  // Check if a known canonical phrase is a prefix/exact token match
  for (const [synonym, canonical] of Object.entries(CANONICAL_SALT_MAP)) {
    if (cleaned === synonym) return canonical;
  }

  return cleaned;
}

/**
 * Normalises a strength string (e.g., "500 mg + 125 mg" -> "500mg+125mg", "650 MG" -> "650mg")
 * and sorts components when multiple strengths are present so "1mg + 500mg" matches "500mg + 1mg".
 */
export function normaliseStrength(rawStrength: string | null | undefined): string {
  if (!rawStrength || typeof rawStrength !== 'string') return '';
  const parts = rawStrength
    .toLowerCase()
    .split(/[+/&,]/)
    .map((p) => p.replace(/\s+/g, '').trim())
    .filter(Boolean);
  parts.sort();
  return parts.join('+');
}

/**
 * Normalises dosage form ("Tablet IP" -> "tablet", "Capsule PR" -> "capsule sr", "Strip of 10 Tablets" -> "tablet").
 * Distinguishes immediate-release ("tablet") from sustained/prolonged-release ("tablet sr").
 */
export function normaliseDosageForm(rawForm: string | null | undefined): string {
  if (!rawForm || typeof rawForm !== 'string') return '';
  const lower = rawForm.toLowerCase().trim();
  const isSustained =
    /\b(sr|pr|er|xr|cr|prolonged[- ]release|sustained[- ]release|extended[- ]release)\b/i.test(
      lower
    );

  if (lower.includes('capsule') || lower.includes('cap')) {
    return isSustained ? 'capsule sr' : 'capsule';
  }
  if (lower.includes('tablet') || lower.includes('tab')) {
    return isSustained ? 'tablet sr' : 'tablet';
  }
  if (lower.includes('injection') || lower.includes('pen') || lower.includes('vial')) {
    return 'injection';
  }
  if (lower.includes('syrup') || lower.includes('suspension')) {
    return 'syrup';
  }
  return lower.replace(/\s+/g, ' ');
}

export interface MedicineMatchEvaluation {
  salt: boolean;
  strength: boolean;
  form: boolean;
  pack: boolean;
  is_exact_match: boolean;
  mismatch_reasons: string[];
}

/**
 * Section E (Valid Match Rules):
 * - Same salt(s), after normalising synonyms -> salt = true
 * - Same strength for every salt -> strength = true
 * - Same dosage form (tablet !== syrup; immediate-release !== sustained-release) -> form = true
 * - Pack size difference is NOT a mismatch (is_exact_match remains true if salt, strength, and form match),
 *   and prices are normalised to per-unit (per tablet/capsule/ml) in code.
 */
export function evaluateMedicineMatch(
  identity: Pick<
    MedicineIdentity,
    'composition' | 'strength' | 'dosage_form' | 'standard_pack_units'
  >,
  candidate: {
    composition: string[];
    strength: string | null;
    dosage_form: string | null;
    pack_size_units: number | null;
  }
): MedicineMatchEvaluation {
  const refSalts = identity.composition.map(normaliseSaltName).filter(Boolean).sort();
  const candSalts = (candidate.composition || []).map(normaliseSaltName).filter(Boolean).sort();

  const saltMatch =
    refSalts.length > 0 &&
    refSalts.length === candSalts.length &&
    refSalts.every((val, idx) => val === candSalts[idx]);

  const refStrength = normaliseStrength(identity.strength);
  const candStrength = normaliseStrength(candidate.strength);
  const strengthMatch = Boolean(refStrength && candStrength && refStrength === candStrength);

  const refForm = normaliseDosageForm(identity.dosage_form);
  const candForm = normaliseDosageForm(candidate.dosage_form);
  const formMatch = Boolean(refForm && candForm && refForm === candForm);

  const packMatch = Boolean(
    candidate.pack_size_units &&
      identity.standard_pack_units &&
      candidate.pack_size_units === identity.standard_pack_units
  );

  const mismatch_reasons: string[] = [];
  if (!saltMatch) {
    const candLabel = candidate.composition?.length ? candidate.composition.join(' + ') : 'Unknown';
    const refLabel = identity.composition.join(' + ');
    if (candSalts.length < refSalts.length) {
      mismatch_reasons.push(
        `Missing active salt: contains ${candLabel} instead of ${refLabel}`
      );
    } else {
      mismatch_reasons.push(`Different active salt: ${candLabel} vs ${refLabel}`);
    }
  }
  if (!strengthMatch) {
    mismatch_reasons.push(
      `Different strength: ${candidate.strength || 'unspecified'} vs ${identity.strength}`
    );
  }
  if (!formMatch) {
    mismatch_reasons.push(
      `Different dosage form: ${candidate.dosage_form || 'unspecified'} vs ${identity.dosage_form}`
    );
  }

  return {
    salt: saltMatch,
    strength: strengthMatch,
    form: formMatch,
    pack: packMatch,
    // Pack size difference is NOT a clinical mismatch (normalised to per-unit price)
    is_exact_match: saltMatch && strengthMatch && formMatch,
    mismatch_reasons
  };
}

/**
 * Section E (Outlier & Sanity Rules):
 * - Rejects price <= 0 or NaN
 * - If >= 2 other verified records exist in the same group (branded or generic),
 *   any record whose per-unit price is > 5x or < 0.1x the median per-unit price of the other sources
 *   is marked as status = "excluded_outlier" and excluded from headline calculation.
 */
export function applyOutlierSanityRules(records: SourceRecord[]): SourceRecord[] {
  const updated = records.map((r) => ({ ...r }));

  // First check basic sanity on "used" records
  for (const rec of updated) {
    if (rec.status !== 'used') continue;
    if (
      rec.price_inr === null ||
      rec.price_inr === undefined ||
      !Number.isFinite(rec.price_inr) ||
      rec.price_inr <= 0 ||
      !rec.pack_size_units ||
      rec.pack_size_units <= 0
    ) {
      rec.status = 'excluded_outlier';
      rec.failure_reason = 'Rejected: price or pack size was zero, negative, or non-numeric.';
    }
  }

  // Group exact-match used records by role (branded vs generic) to check >5x or <0.1x median outliers
  const checkGroupOutliers = (group: SourceRecord[]) => {
    if (group.length < 3) return;
    for (let i = 0; i < group.length; i++) {
      const target = group[i];
      const others = group.filter((_, idx) => idx !== i);
      const otherPerUnit = others
        .map((o) => (o.price_inr as number) / (o.pack_size_units as number))
        .sort((a, b) => a - b);

      const mid = Math.floor(otherPerUnit.length / 2);
      const medianPerUnit =
        otherPerUnit.length % 2 === 0
          ? (otherPerUnit[mid - 1] + otherPerUnit[mid]) / 2
          : otherPerUnit[mid];

      const targetPerUnit = (target.price_inr as number) / (target.pack_size_units as number);
      if (targetPerUnit > medianPerUnit * 5 || targetPerUnit < medianPerUnit * 0.1) {
        target.status = 'excluded_outlier';
        target.failure_reason = `Excluded as price outlier (₹${targetPerUnit.toFixed(
          2
        )}/unit vs median ₹${medianPerUnit.toFixed(2)}/unit across other sources).`;
      }
    }
  };

  const exactUsed = updated.filter(
    (r) => r.status === 'used' && r.checks.salt && r.checks.strength && r.checks.form
  );
  const brandedGroup = exactUsed.filter((r) => r.is_branded_reference);
  const genericGroup = exactUsed.filter((r) => !r.is_branded_reference);

  checkGroupOutliers(brandedGroup);
  checkGroupOutliers(genericGroup);

  return updated;
}
