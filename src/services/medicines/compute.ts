import {
  ConfidenceTier,
  MedicineIdentity,
  PriceType,
  SavingsComputation,
  SourceRecord,
  ValidatedAlternative
} from './types';

/**
 * Formats an INR number with Indian digit grouping (₹1,234.50) and tabular numerals.
 */
export function formatINR(amount: number | null | undefined, fractionDigits = 2): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '—';
  }
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}`;
}

export interface ConfidenceEvaluation {
  tier: ConfidenceTier;
  reason: string;
}

/**
 * Section E (Confidence Tiers — computed deterministically in code):
 * - High: official/government source + at least 1 retail source in agreement (within ±10% on branded or generic price)
 * - Medium: at least 2 retail sources in agreement (within ±10%), OR 1 official/government source
 * - Low: 1 retail source only
 * - None: 0 verified sources
 */
export function computeConfidenceTier(records: SourceRecord[]): ConfidenceEvaluation {
  const validExactRecords = records.filter(
    (r) =>
      r.status === 'used' &&
      r.checks.salt === true &&
      r.checks.strength === true &&
      r.checks.form === true &&
      r.price_inr !== null &&
      r.price_inr > 0 &&
      r.pack_size_units !== null &&
      r.pack_size_units > 0
  );

  if (validExactRecords.length === 0) {
    return {
      tier: 'none',
      reason: '0 verified sources returned a matching composition, strength, and dosage form.'
    };
  }

  const govSources = new Set(
    validExactRecords.filter((r) => r.source_type === 'government').map((r) => r.source_id)
  );
  const retailRecords = validExactRecords.filter((r) => r.source_type === 'retail');
  const retailSources = new Set(retailRecords.map((r) => r.source_id));

  // Helper to check if >= 2 retail records from distinct sources agree within ±10% on per-unit price
  const checkRetailAgreement = (): boolean => {
    const brandedRetail = retailRecords.filter((r) => r.is_branded_reference);
    const pool = brandedRetail.length >= 2 ? brandedRetail : retailRecords;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        if (pool[i].source_id === pool[j].source_id) continue;
        const u1 = (pool[i].price_inr as number) / (pool[i].pack_size_units as number);
        const u2 = (pool[j].price_inr as number) / (pool[j].pack_size_units as number);
        const avg = (u1 + u2) / 2;
        if (avg > 0 && Math.abs(u1 - u2) / avg <= 0.1) {
          return true;
        }
      }
    }
    return false;
  };

  const hasGov = govSources.size >= 1;
  const hasRetail = retailSources.size >= 1;
  const retailAgrees = checkRetailAgreement();

  if (hasGov && hasRetail) {
    return {
      tier: 'high',
      reason: `Verified across ${govSources.size} official government source(s) and ${retailSources.size} retail pharmacy source(s).`
    };
  }

  if (retailAgrees) {
    return {
      tier: 'medium',
      reason: `Verified across ${retailSources.size} independent retail pharmacy sources in price agreement (within ±10%).`
    };
  }

  if (hasGov) {
    return {
      tier: 'medium',
      reason: 'Verified against an official government price catalogue (PMBJP / NPPA).'
    };
  }

  return {
    tier: 'low',
    reason: 'Single retail source verified so far — confirm price at the pharmacy counter.'
  };
}

/**
 * Section E (Savings Calculation Rules):
 * - Only show a headline "% saved" when:
 *   1. Both the brand and the generic have at least one verified record with identical salt, strength, and form.
 *   2. Confidence tier is Medium or High.
 * - Compare like-for-like: MRP to MRP, or selling_price to selling_price (never mix the two).
 * - Normalise pack sizes to per-unit price first, then compute equivalent pack price for the standard brand pack size.
 * - If multiple sources for the same product disagree by > 10%, show a price range ("₹195–₹220") rather than a single number.
 */
export function computeSavingsSummary(
  identity: MedicineIdentity,
  records: SourceRecord[],
  confidence: ConfidenceTier
): SavingsComputation {
  const validExact = records.filter(
    (r) =>
      r.status === 'used' &&
      r.checks.salt === true &&
      r.checks.strength === true &&
      r.checks.form === true &&
      r.price_inr !== null &&
      r.price_inr > 0 &&
      r.pack_size_units !== null &&
      r.pack_size_units > 0
  );

  // Separate branded reference vs generic alternatives
  const allBranded = validExact.filter((r) => r.is_branded_reference);
  const allGenerics = validExact.filter((r) => !r.is_branded_reference);

  // Choose like-for-like price basis (prefer MRP since PMBJP/NPPA and Indian strips carry statutory MRP)
  const mrpBranded = allBranded.filter((r) => r.price_type === 'MRP');
  const mrpGenerics = allGenerics.filter((r) => r.price_type === 'MRP');
  const spBranded = allBranded.filter((r) => r.price_type === 'selling_price');
  const spGenerics = allGenerics.filter((r) => r.price_type === 'selling_price');

  let priceBasis: PriceType | null = null;
  let brandedPool: SourceRecord[] = [];
  let genericPool: SourceRecord[] = [];

  if (mrpBranded.length > 0 && mrpGenerics.length > 0) {
    priceBasis = 'MRP';
    brandedPool = mrpBranded;
    genericPool = mrpGenerics;
  } else if (spBranded.length > 0 && spGenerics.length > 0) {
    priceBasis = 'selling_price';
    brandedPool = spBranded;
    genericPool = spGenerics;
  } else if (mrpBranded.length > 0 || mrpGenerics.length > 0) {
    priceBasis = 'MRP';
    brandedPool = mrpBranded;
    genericPool = mrpGenerics;
  } else if (spBranded.length > 0 || spGenerics.length > 0) {
    priceBasis = 'selling_price';
    brandedPool = spBranded;
    genericPool = spGenerics;
  }

  const comparisonUnits = identity.standard_pack_units || 10;

  // Compute branded summary if available
  let brandPerUnit: number | null = null;
  let brandPackPrice: number | null = null;
  let brandPriceRange: [number, number] | null = null;
  let brandPackUnits: number | null = null;
  let brandPackLabel: string | null = null;

  if (brandedPool.length > 0) {
    const perUnits = brandedPool
      .map((r) => (r.price_inr as number) / (r.pack_size_units as number))
      .sort((a, b) => a - b);
    const minU = perUnits[0];
    const maxU = perUnits[perUnits.length - 1];
    const primaryBrand = brandedPool[0];
    brandPackUnits = primaryBrand.pack_size_units || comparisonUnits;
    brandPackLabel = primaryBrand.pack_label || `Strip of ${brandPackUnits} units`;
    brandPerUnit = minU;
    brandPackPrice = Number((minU * brandPackUnits).toFixed(2));
    if (minU > 0 && (maxU - minU) / minU > 0.1) {
      brandPriceRange = [
        Number((minU * brandPackUnits).toFixed(2)),
        Number((maxU * brandPackUnits).toFixed(2))
      ];
    }
  }

  // Pick the cheapest verified generic alternative on per-unit basis
  let genericPerUnit: number | null = null;
  let genericPackPrice: number | null = null;
  let genericPriceRange: [number, number] | null = null;
  let genericPackUnits: number | null = null;
  let genericPackLabel: string | null = null;
  let genericProductName: string | null = null;
  let genericMaker: string | null = null;
  let cheapestGenericRecords: SourceRecord[] = [];

  if (genericPool.length > 0) {
    const sortedGenerics = [...genericPool].sort((a, b) => {
      const ua = (a.price_inr as number) / (a.pack_size_units as number);
      const ub = (b.price_inr as number) / (b.pack_size_units as number);
      return ua - ub;
    });
    const best = sortedGenerics[0];
    genericProductName = best.product_name;
    genericMaker = best.maker;
    genericPackUnits = best.pack_size_units;
    genericPackLabel = best.pack_label || `Strip of ${best.pack_size_units} units`;
    genericPackPrice = best.price_inr;
    genericPerUnit = (best.price_inr as number) / (best.pack_size_units as number);

    // Find all records for this same generic product to check >10% range
    cheapestGenericRecords = sortedGenerics.filter(
      (r) =>
        r.product_name &&
        best.product_name &&
        r.product_name.toLowerCase() === best.product_name.toLowerCase()
    );
    if (cheapestGenericRecords.length > 1 && genericPackUnits) {
      const gUnits = cheapestGenericRecords
        .map((r) => (r.price_inr as number) / (r.pack_size_units as number))
        .sort((a, b) => a - b);
      const minG = gUnits[0];
      const maxG = gUnits[gUnits.length - 1];
      if (minG > 0 && (maxG - minG) / minG > 0.1) {
        genericPriceRange = [
          Number((minG * genericPackUnits).toFixed(2)),
          Number((maxG * genericPackUnits).toFixed(2))
        ];
      }
    }
  }

  if (brandedPool.length === 0 || genericPool.length === 0) {
    return {
      can_show_headline: false,
      reason_if_withheld: 'Not enough verified prices to compare yet.',
      price_basis: priceBasis,
      brand_price_inr: brandPackPrice,
      brand_price_range_inr: brandPriceRange,
      brand_per_unit_inr: brandPerUnit,
      brand_pack_units: brandPackUnits,
      brand_pack_label: brandPackLabel,
      brand_source_records: brandedPool,
      generic_price_inr: genericPackPrice,
      generic_price_range_inr: genericPriceRange,
      generic_per_unit_inr: genericPerUnit,
      generic_pack_units: genericPackUnits,
      generic_pack_label: genericPackLabel,
      generic_product_name: genericProductName,
      generic_maker: genericMaker,
      generic_source_records: cheapestGenericRecords,
      savings_pct: null,
      savings_pct_range: null,
      savings_per_unit_inr: null,
      savings_per_pack_inr: null,
      comparison_pack_units: brandPackUnits || comparisonUnits
    };
  }

  if (confidence !== 'high' && confidence !== 'medium') {
    return {
      can_show_headline: false,
      reason_if_withheld:
        'Not enough verified prices to compare yet (requires Medium or High multi-source confidence).',
      price_basis: priceBasis,
      brand_price_inr: brandPackPrice,
      brand_price_range_inr: brandPriceRange,
      brand_per_unit_inr: brandPerUnit,
      brand_pack_units: brandPackUnits,
      brand_pack_label: brandPackLabel,
      brand_source_records: brandedPool,
      generic_price_inr: genericPackPrice,
      generic_price_range_inr: genericPriceRange,
      generic_per_unit_inr: genericPerUnit,
      generic_pack_units: genericPackUnits,
      generic_pack_label: genericPackLabel,
      generic_product_name: genericProductName,
      generic_maker: genericMaker,
      generic_source_records: cheapestGenericRecords,
      savings_pct: null,
      savings_pct_range: null,
      savings_per_unit_inr: null,
      savings_per_pack_inr: null,
      comparison_pack_units: brandPackUnits || comparisonUnits
    };
  }

  // Compute deterministic per-unit savings and equivalent pack savings using the 2-decimal per-unit prices
  const bUnit = Number((brandPerUnit as number).toFixed(2));
  const gUnit = Number((genericPerUnit as number).toFixed(2));
  const rawSavingsPct = ((bUnit - gUnit) / bUnit) * 100;

  if (rawSavingsPct <= 0) {
    return {
      can_show_headline: false,
      reason_if_withheld: 'No lower-priced generic alternative was found below the branded price.',
      price_basis: priceBasis,
      brand_price_inr: brandPackPrice,
      brand_price_range_inr: brandPriceRange,
      brand_per_unit_inr: brandPerUnit,
      brand_pack_units: brandPackUnits,
      brand_pack_label: brandPackLabel,
      brand_source_records: brandedPool,
      generic_price_inr: genericPackPrice,
      generic_price_range_inr: genericPriceRange,
      generic_per_unit_inr: genericPerUnit,
      generic_pack_units: genericPackUnits,
      generic_pack_label: genericPackLabel,
      generic_product_name: genericProductName,
      generic_maker: genericMaker,
      generic_source_records: cheapestGenericRecords,
      savings_pct: 0,
      savings_pct_range: null,
      savings_per_unit_inr: 0,
      savings_per_pack_inr: 0,
      comparison_pack_units: brandPackUnits || comparisonUnits
    };
  }

  const eqUnits = brandPackUnits || comparisonUnits;
  const savingsPerUnit = Number((bUnit - gUnit).toFixed(2));
  const savingsPerPack = Number(((bUnit - gUnit) * eqUnits).toFixed(2));
  const savingsPct = Math.round(rawSavingsPct);

  let savingsPctRange: [number, number] | null = null;
  if (brandPriceRange && eqUnits > 0) {
    const lowBrandU = brandPriceRange[0] / eqUnits;
    const highBrandU = brandPriceRange[1] / eqUnits;
    const lowPct = Math.max(0, Math.round(((lowBrandU - gUnit) / lowBrandU) * 100));
    const highPct = Math.max(0, Math.round(((highBrandU - gUnit) / highBrandU) * 100));
    if (lowPct !== highPct) {
      savingsPctRange = [Math.min(lowPct, highPct), Math.max(lowPct, highPct)];
    }
  }

  return {
    can_show_headline: true,
    price_basis: priceBasis,
    brand_price_inr: brandPackPrice,
    brand_price_range_inr: brandPriceRange,
    brand_per_unit_inr: Number(bUnit.toFixed(2)),
    brand_pack_units: brandPackUnits,
    brand_pack_label: brandPackLabel,
    brand_source_records: brandedPool,
    generic_price_inr: genericPackPrice,
    generic_price_range_inr: genericPriceRange,
    generic_per_unit_inr: Number(gUnit.toFixed(2)),
    generic_pack_units: genericPackUnits,
    generic_pack_label: genericPackLabel,
    generic_product_name: genericProductName,
    generic_maker: genericMaker,
    generic_source_records: cheapestGenericRecords,
    savings_pct: savingsPct,
    savings_pct_range: savingsPctRange,
    savings_per_unit_inr: savingsPerUnit,
    savings_per_pack_inr: savingsPerPack,
    comparison_pack_units: eqUnits
  };
}

/**
 * Builds the sorted lists of:
 * - verified_alternatives (salt ✓, strength ✓, form ✓, sorted by per-unit price ascending)
 * - similar_alternatives (any ✗ on salt, strength, or form, with mismatch_reasons shown)
 */
export function buildAlternativeLists(
  identity: MedicineIdentity,
  records: SourceRecord[],
  brandPerUnitInr: number | null,
  brandPriceBasis: PriceType | null
): {
  verified_alternatives: ValidatedAlternative[];
  similar_alternatives: ValidatedAlternative[];
} {
  const verified: ValidatedAlternative[] = [];
  const similar: ValidatedAlternative[] = [];

  for (let idx = 0; idx < records.length; idx++) {
    const rec = records[idx];
    if (rec.status !== 'used') continue;
    if (
      !rec.product_name ||
      rec.price_inr === null ||
      rec.price_inr <= 0 ||
      !rec.pack_size_units ||
      rec.pack_size_units <= 0 ||
      !rec.price_type ||
      !rec.snippet
    ) {
      continue;
    }

    const perUnit = rec.price_inr / rec.pack_size_units;
    const isExact = Boolean(rec.checks.salt && rec.checks.strength && rec.checks.form);

    let savingsPctVsBrand: number | null = null;
    let savingsInrPerPackEq: number | null = null;

    if (
      isExact &&
      brandPerUnitInr &&
      brandPerUnitInr > 0 &&
      (!brandPriceBasis || rec.price_type === brandPriceBasis)
    ) {
      const diffPerUnit = brandPerUnitInr - perUnit;
      if (diffPerUnit > 0) {
        savingsPctVsBrand = Math.round((diffPerUnit / brandPerUnitInr) * 100);
        savingsInrPerPackEq = Number((diffPerUnit * identity.standard_pack_units).toFixed(2));
      } else {
        savingsPctVsBrand = 0;
        savingsInrPerPackEq = 0;
      }
    }

    const alt: ValidatedAlternative = {
      id: `${rec.source_id}-${idx}`,
      product_name: rec.product_name,
      maker: rec.maker || rec.source_name,
      composition: rec.composition,
      strength: rec.strength || 'Unspecified',
      dosage_form: rec.dosage_form || 'Unspecified',
      price_inr: rec.price_inr,
      price_type: rec.price_type,
      pack_size_units: rec.pack_size_units,
      pack_label: rec.pack_label || `Strip of ${rec.pack_size_units} units`,
      per_unit_price_inr: Number(perUnit.toFixed(2)),
      savings_pct_vs_brand: savingsPctVsBrand,
      savings_inr_per_pack_equivalent: savingsInrPerPackEq,
      source_id: rec.source_id,
      source_name: rec.source_name,
      source_type: rec.source_type,
      url: rec.url,
      retrieved_at: rec.retrieved_at,
      snippet: rec.snippet,
      regulatory_label: rec.regulatory_label,
      regulatory_explanation: rec.regulatory_explanation,
      checks: {
        salt: Boolean(rec.checks.salt),
        strength: Boolean(rec.checks.strength),
        form: Boolean(rec.checks.form),
        pack: Boolean(rec.checks.pack)
      },
      mismatch_reasons: rec.mismatch_reasons || [],
      is_exact_match: isExact
    };

    if (isExact) {
      verified.push(alt);
    } else {
      similar.push(alt);
    }
  }

  verified.sort((a, b) => a.per_unit_price_inr - b.per_unit_price_inr);
  similar.sort((a, b) => a.per_unit_price_inr - b.per_unit_price_inr);

  return {
    verified_alternatives: verified,
    similar_alternatives: similar
  };
}
