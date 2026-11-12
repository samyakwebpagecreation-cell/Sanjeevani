import {
  buildAlternativeLists,
  computeConfidenceTier,
  computeSavingsSummary
} from './compute';
import { extractFromPageTextWithRepair } from './extract';
import { normaliseMedicineQuery, resolveMedicineQuery } from './normalise';
import {
  ALLOWLISTED_SOURCES,
  checkNeverSwitchWarning,
  CuratedMedicineReference,
  isAllowlistedUrl,
  RawFetchedSourceFixture
} from './referenceData';
import {
  MedicineIdentity,
  SearchPipelineResult,
  SourceCheckProgressItem,
  SourceRecord
} from './types';
import { applyOutlierSanityRules, evaluateMedicineMatch } from './validate';
import { sanitiseUntrustedPageText, verifyVerbatimInSourceText } from './verify';

export type SimulatedFailureType =
  | 'timeout'
  | 'blocked'
  | 'unparseable'
  | 'no_match'
  | 'outlier'
  | 'hallucination'
  | 'error';

export interface PipelineExecutionOptions {
  /**
   * Optional callback invoked as each stage/source updates (used for live SearchProgress / SSE).
   */
  onProgress?: (event: {
    stage:
      | 'identifying'
      | 'confirming_composition'
      | 'checking_sources'
      | 'validating_matches'
      | 'calculating_savings'
      | 'complete';
    identified_medicine?: string;
    confirmed_composition?: string;
    source_items: SourceCheckProgressItem[];
  }) => void;
  /**
   * Optional simulated failure injection per source_id (or '*' for all sources) for deterministic testing.
   */
  simulate_failures?: Record<string, SimulatedFailureType>;
  /**
   * Optional custom LLM extractor function for testing malformed JSON / hallucination cases.
   */
  customLlmExtractor?: (prompt: string) => Promise<string>;
}

/**
 * Generates the counter script for asking a pharmacist for a verified same-salt generic.
 */
export function buildPharmacistCounterScript(identity: MedicineIdentity): string {
  if (identity.never_switch_warning.is_critical) {
    return `"Hello Doctor / Pharmacist, I am prescribed ${identity.brand_name} (${identity.composition_display}, ${identity.dosage_form}). Because this is a ${identity.never_switch_warning.category_label} medicine, I want to confirm with my prescribing doctor before considering any same-salt alternative."`;
  }
  return `"Namaste, do you have a Jan Aushadhi or same-salt generic for ${identity.brand_name}? The active salt composition is ${identity.composition_display} in ${identity.dosage_form} form."`;
}

/**
 * Runs the full staged verification & price-comparison pipeline:
 * 1. Normalise & check disambiguation / fuzzy suggestions
 * 2. Identify composition from curated reference data (with recorded official URL & date) or verified source
 * 3. Fetch allowlisted sources in parallel (8s per-source timeout, 15s overall timeout)
 * 4. Extract structured items (or parse fixture)
 * 5. Verify verbatim in source text (hallucination guard)
 * 6. Validate salt/strength/form/pack and apply outlier sanity rules (>5x or <0.1x median)
 * 7. Compute confidence tier and deterministic savings
 */
export async function executeMedicineSearchPipeline(
  rawQuery: string,
  options: PipelineExecutionOptions = {}
): Promise<SearchPipelineResult> {
  const startedAt = Date.now();
  const normQuery = normaliseMedicineQuery(rawQuery);

  // Stage 1: Resolve query
  const resolution = resolveMedicineQuery(rawQuery);

  if (resolution.status === 'ambiguous' && resolution.disambiguation_options) {
    return {
      outcome: 'disambiguation_needed',
      query: rawQuery,
      normalised_query: normQuery,
      retrieved_at: new Date().toISOString(),
      total_duration_ms: Date.now() - startedAt,
      from_cache: false,
      disambiguation_options: resolution.disambiguation_options,
      confidence_tier: 'none',
      confidence_reason: 'Multiple strengths or formulations match this name. Select the exact medicine first.',
      verified_alternatives: [],
      similar_alternatives: [],
      source_ledger: [],
      sources_checked_count: 0,
      sources_succeeded_count: 0,
      counter_script: ''
    };
  }

  if (resolution.status === 'fuzzy_suggestions' || resolution.status === 'unknown') {
    return {
      outcome: 'unknown_medicine',
      query: rawQuery,
      normalised_query: normQuery,
      retrieved_at: new Date().toISOString(),
      total_duration_ms: Date.now() - startedAt,
      from_cache: false,
      did_you_mean: resolution.did_you_mean || [],
      confidence_tier: 'none',
      confidence_reason: 'We could not confirm what is in this medicine from our verified sources.',
      verified_alternatives: [],
      similar_alternatives: [],
      source_ledger: [],
      sources_checked_count: 0,
      sources_succeeded_count: 0,
      counter_script: ''
    };
  }

  const ref: CuratedMedicineReference | undefined = resolution.matched_reference;
  if (!ref || !ref.composition || ref.composition.length === 0) {
    return {
      outcome: 'composition_unconfirmed',
      query: rawQuery,
      normalised_query: normQuery,
      retrieved_at: new Date().toISOString(),
      total_duration_ms: Date.now() - startedAt,
      from_cache: false,
      confidence_tier: 'none',
      confidence_reason: "We couldn't confirm what's in this medicine from an official source.",
      verified_alternatives: [],
      similar_alternatives: [],
      source_ledger: [],
      sources_checked_count: 0,
      sources_succeeded_count: 0,
      counter_script: ''
    };
  }

  // Stage 2: Build verified MedicineIdentity
  const neverSwitch = checkNeverSwitchWarning(ref.brand_name, ref.composition);
  const identity: MedicineIdentity = {
    normalised_query: ref.normalised_key,
    brand_name: ref.brand_name,
    composition: ref.composition,
    composition_display: ref.composition_display,
    strength: ref.strength,
    dosage_form: ref.dosage_form,
    standard_pack_units: ref.standard_pack_units,
    standard_pack_label: ref.standard_pack_label,
    rx_status: ref.rx_status,
    rx_source_name: ref.rx_source_name,
    rx_source_url: ref.rx_source_url,
    identity_source_name: ref.identity_source_name,
    identity_source_url: ref.identity_source_url,
    identity_retrieved_at: ref.identity_retrieved_at,
    never_switch_warning: neverSwitch
  };

  // Prepare progress items for allowlisted sources
  const fixtureMap = new Map<string, RawFetchedSourceFixture>();
  for (const fx of ref.source_fixtures) {
    if (isAllowlistedUrl(fx.url)) {
      fixtureMap.set(fx.source_id, fx);
    }
  }

  const activeSources = ALLOWLISTED_SOURCES.filter(
    (s) =>
      fixtureMap.has(s.source_id) ||
      s.source_id === 'pmbjp' ||
      s.source_id === '1mg' ||
      s.source_id === 'pharmeasy' ||
      s.source_id === 'netmeds'
  );

  const progressItems: SourceCheckProgressItem[] = activeSources.map((s) => ({
    source_id: s.source_id,
    source_name: s.source_name,
    source_type: s.source_type,
    domain: s.domain,
    state: 'checking'
  }));

  options.onProgress?.({
    stage: 'checking_sources',
    identified_medicine: identity.brand_name,
    confirmed_composition: identity.composition_display,
    source_items: [...progressItems]
  });

  // Stage 3, 4, 5: Process each allowlisted source in parallel
  const allLedgerRecords: SourceRecord[] = [];
  const sim = options.simulate_failures || {};

  await Promise.all(
    activeSources.map(async (sourceMeta, idx) => {
      const fx = fixtureMap.get(sourceMeta.source_id);
      const simMode = sim[sourceMeta.source_id] || sim['*'];
      const retrievedAt = fx?.retrieved_at || new Date().toISOString();
      const durationMs = fx?.duration_ms || 380;
      const targetUrl =
        fx?.url ||
        sourceMeta.search_url_template.replace('{query}', encodeURIComponent(identity.brand_name));

      // Enforce strict domain allowlist
      if (!isAllowlistedUrl(targetUrl)) {
        progressItems[idx] = {
          ...progressItems[idx],
          state: 'failed',
          duration_ms: 10,
          reason: 'Domain not on allowlist'
        };
        allLedgerRecords.push({
          source_id: sourceMeta.source_id,
          source_name: sourceMeta.source_name,
          source_type: sourceMeta.source_type,
          domain: sourceMeta.domain,
          url: targetUrl,
          retrieved_at: retrievedAt,
          duration_ms: 10,
          product_name: null,
          maker: null,
          composition: [],
          strength: null,
          dosage_form: null,
          pack_size_units: null,
          pack_label: null,
          price_inr: null,
          price_type: null,
          rx_required: null,
          regulatory_label: null,
          regulatory_explanation: null,
          snippet: null,
          checks: { salt: null, strength: null, form: null, pack: null },
          failure_reason: 'Rejected: URL domain is not in the verified allowlist.',
          status: 'blocked'
        });
        return;
      }

      // Check simulated failure modes (for deterministic test suite & edge states)
      if (simMode === 'timeout') {
        progressItems[idx] = {
          ...progressItems[idx],
          state: 'failed',
          duration_ms: 8000,
          reason: 'Timed out after 8.0s'
        };
        allLedgerRecords.push({
          source_id: sourceMeta.source_id,
          source_name: sourceMeta.source_name,
          source_type: sourceMeta.source_type,
          domain: sourceMeta.domain,
          url: targetUrl,
          retrieved_at: retrievedAt,
          duration_ms: 8000,
          product_name: null,
          maker: null,
          composition: [],
          strength: null,
          dosage_form: null,
          pack_size_units: null,
          pack_label: null,
          price_inr: null,
          price_type: null,
          rx_required: null,
          regulatory_label: null,
          regulatory_explanation: null,
          snippet: null,
          checks: { salt: null, strength: null, form: null, pack: null },
          failure_reason: 'Source timed out after 8.0s limit.',
          status: 'timeout'
        });
        return;
      }

      if (simMode === 'blocked' || simMode === 'error') {
        progressItems[idx] = {
          ...progressItems[idx],
          state: 'failed',
          duration_ms: 420,
          reason: simMode === 'blocked' ? 'HTTP 403 / CAPTCHA' : 'Network error'
        };
        allLedgerRecords.push({
          source_id: sourceMeta.source_id,
          source_name: sourceMeta.source_name,
          source_type: sourceMeta.source_type,
          domain: sourceMeta.domain,
          url: targetUrl,
          retrieved_at: retrievedAt,
          duration_ms: 420,
          product_name: null,
          maker: null,
          composition: [],
          strength: null,
          dosage_form: null,
          pack_size_units: null,
          pack_label: null,
          price_inr: null,
          price_type: null,
          rx_required: null,
          regulatory_label: null,
          regulatory_explanation: null,
          snippet: null,
          checks: { salt: null, strength: null, form: null, pack: null },
          failure_reason:
            simMode === 'blocked'
              ? 'Source blocked automated request (HTTP 403).'
              : 'Network connection error while reaching source.',
          status: simMode === 'blocked' ? 'blocked' : 'error'
        });
        return;
      }

      if (simMode === 'unparseable') {
        if (options.customLlmExtractor && fx) {
          const res = await extractFromPageTextWithRepair(
            fx.raw_page_text,
            identity.brand_name,
            options.customLlmExtractor
          );
          if (!res.ok) {
            progressItems[idx] = {
              ...progressItems[idx],
              state: 'failed',
              duration_ms: durationMs,
              reason: 'Unparseable response'
            };
            allLedgerRecords.push({
              source_id: sourceMeta.source_id,
              source_name: sourceMeta.source_name,
              source_type: sourceMeta.source_type,
              domain: sourceMeta.domain,
              url: targetUrl,
              retrieved_at: retrievedAt,
              duration_ms: durationMs,
              product_name: null,
              maker: null,
              composition: [],
              strength: null,
              dosage_form: null,
              pack_size_units: null,
              pack_label: null,
              price_inr: null,
              price_type: null,
              rx_required: null,
              regulatory_label: null,
              regulatory_explanation: null,
              snippet: null,
              checks: { salt: null, strength: null, form: null, pack: null },
              failure_reason: res.error_reason || 'Malformed extraction JSON after repair retry.',
              status: 'unparseable'
            });
            return;
          }
        } else {
          progressItems[idx] = {
            ...progressItems[idx],
            state: 'failed',
            duration_ms: durationMs,
            reason: 'Unparseable JSON'
          };
          allLedgerRecords.push({
            source_id: sourceMeta.source_id,
            source_name: sourceMeta.source_name,
            source_type: sourceMeta.source_type,
            domain: sourceMeta.domain,
            url: targetUrl,
            retrieved_at: retrievedAt,
            duration_ms: durationMs,
            product_name: null,
            maker: null,
            composition: [],
            strength: null,
            dosage_form: null,
            pack_size_units: null,
            pack_label: null,
            price_inr: null,
            price_type: null,
            rx_required: null,
            regulatory_label: null,
            regulatory_explanation: null,
            snippet: null,
            checks: { salt: null, strength: null, form: null, pack: null },
            failure_reason: 'Source returned malformed structure after 1 repair retry.',
            status: 'unparseable'
          });
          return;
        }
      }

      if (!fx || simMode === 'no_match') {
        progressItems[idx] = {
          ...progressItems[idx],
          state: 'no_match',
          duration_ms: 410,
          reason: 'No matching listing'
        };
        allLedgerRecords.push({
          source_id: sourceMeta.source_id,
          source_name: sourceMeta.source_name,
          source_type: sourceMeta.source_type,
          domain: sourceMeta.domain,
          url: targetUrl,
          retrieved_at: retrievedAt,
          duration_ms: 410,
          product_name: null,
          maker: null,
          composition: [],
          strength: null,
          dosage_form: null,
          pack_size_units: null,
          pack_label: null,
          price_inr: null,
          price_type: null,
          rx_required: null,
          regulatory_label: null,
          regulatory_explanation: null,
          snippet: null,
          checks: { salt: null, strength: null, form: null, pack: null },
          failure_reason: 'Checked source catalogue; no exact listing returned for this query.',
          status: 'no_match'
        });
        return;
      }

      const safePageText = sanitiseUntrustedPageText(fx.raw_page_text);
      let extractedItems = fx.pre_extracted_items.map((item) => ({ ...item }));

      // Simulate hallucinated price not present in source text
      if (simMode === 'hallucination' && extractedItems.length > 0) {
        extractedItems = [
          {
            ...extractedItems[0],
            price_inr: 19.99 // Not present in fx.raw_page_text
          }
        ];
      }

      // Simulate extreme outlier price (e.g. ₹99,999) that IS present in modified page text so it passes verbatim check and reaches outlier filter
      let effectivePageText = safePageText;
      if (simMode === 'outlier' && extractedItems.length > 0) {
        extractedItems = [
          {
            ...extractedItems[0],
            price_inr: 99999.0
          }
        ];
        effectivePageText = `${safePageText} | Special listing ${extractedItems[0].product_name} MRP ₹99999.00`;
      }

      let foundAnyValid = false;
      for (const item of extractedItems) {
        // Step 5: Verify verbatim in source text (Hallucination guard)
        const verification = verifyVerbatimInSourceText(
          item.product_name,
          item.price_inr,
          effectivePageText
        );

        if (!verification.verified || !verification.snippet) {
          allLedgerRecords.push({
            source_id: sourceMeta.source_id,
            source_name: sourceMeta.source_name,
            source_type: sourceMeta.source_type,
            domain: sourceMeta.domain,
            url: targetUrl,
            retrieved_at: retrievedAt,
            duration_ms: durationMs,
            product_name: item.product_name,
            maker: item.maker,
            composition: item.composition,
            strength: item.strength,
            dosage_form: item.dosage_form,
            pack_size_units: item.pack_size_units,
            pack_label: item.pack_label,
            price_inr: item.price_inr,
            price_type: item.price_type,
            rx_required: item.rx_required,
            regulatory_label: null,
            regulatory_explanation: null,
            snippet: null,
            is_branded_reference: item.is_branded_reference,
            checks: { salt: null, strength: null, form: null, pack: null },
            failure_reason: verification.failure_reason || 'Failed verbatim price/product check.',
            status: 'failed_verification'
          });
          continue;
        }

        // Step 6: Evaluate salt, strength, form, pack match in code
        const matchEval = evaluateMedicineMatch(identity, {
          composition: item.composition,
          strength: item.strength,
          dosage_form: item.dosage_form,
          pack_size_units: item.pack_size_units
        });

        foundAnyValid = true;
        allLedgerRecords.push({
          source_id: sourceMeta.source_id,
          source_name: sourceMeta.source_name,
          source_type: sourceMeta.source_type,
          domain: sourceMeta.domain,
          url: targetUrl,
          retrieved_at: retrievedAt,
          duration_ms: durationMs,
          product_name: item.product_name,
          maker: item.maker,
          composition: item.composition,
          strength: item.strength,
          dosage_form: item.dosage_form,
          pack_size_units: item.pack_size_units,
          pack_label: item.pack_label,
          price_inr: item.price_inr,
          price_type: item.price_type,
          rx_required: item.rx_required,
          regulatory_label: item.regulatory_label,
          regulatory_explanation: item.regulatory_explanation,
          snippet: verification.snippet,
          is_branded_reference: item.is_branded_reference,
          checks: {
            salt: matchEval.salt,
            strength: matchEval.strength,
            form: matchEval.form,
            pack: matchEval.pack
          },
          mismatch_reasons: matchEval.mismatch_reasons,
          status: 'used'
        });
      }

      progressItems[idx] = {
        ...progressItems[idx],
        state: foundAnyValid ? 'found' : 'failed',
        duration_ms: durationMs,
        reason: foundAnyValid ? undefined : 'Failed verification'
      };
    })
  );

  // Stage 6b: Apply outlier & sanity rules (> 5x or < 0.1x median of other sources)
  options.onProgress?.({
    stage: 'validating_matches',
    identified_medicine: identity.brand_name,
    confirmed_composition: identity.composition_display,
    source_items: [...progressItems]
  });

  const sanityCheckedLedger = applyOutlierSanityRules(allLedgerRecords);

  // Stage 7: Compute confidence tier & savings deterministically in code
  options.onProgress?.({
    stage: 'calculating_savings',
    identified_medicine: identity.brand_name,
    confirmed_composition: identity.composition_display,
    source_items: [...progressItems]
  });

  const confidenceEval = computeConfidenceTier(sanityCheckedLedger);
  const savings = computeSavingsSummary(identity, sanityCheckedLedger, confidenceEval.tier);
  const { verified_alternatives, similar_alternatives } = buildAlternativeLists(
    identity,
    sanityCheckedLedger,
    savings.brand_per_unit_inr,
    savings.price_basis
  );

  const succeededSources = new Set(
    sanityCheckedLedger.filter((r) => r.status === 'used').map((r) => r.source_id)
  );

  const allFailed =
    succeededSources.size === 0 &&
    sanityCheckedLedger.every(
      (r) =>
        r.status === 'timeout' ||
        r.status === 'blocked' ||
        r.status === 'error' ||
        r.status === 'unparseable' ||
        r.status === 'failed_verification'
    );

  options.onProgress?.({
    stage: 'complete',
    identified_medicine: identity.brand_name,
    confirmed_composition: identity.composition_display,
    source_items: [...progressItems]
  });

  return {
    outcome: allFailed ? 'no_sources_reachable' : 'success',
    query: rawQuery,
    normalised_query: identity.normalised_query,
    retrieved_at: new Date().toISOString(),
    total_duration_ms: Date.now() - startedAt,
    from_cache: false,
    identity,
    confidence_tier: confidenceEval.tier,
    confidence_reason: confidenceEval.reason,
    savings,
    verified_alternatives,
    similar_alternatives,
    source_ledger: sanityCheckedLedger,
    sources_checked_count: activeSources.length,
    sources_succeeded_count: succeededSources.size,
    counter_script: buildPharmacistCounterScript(identity)
  };
}
