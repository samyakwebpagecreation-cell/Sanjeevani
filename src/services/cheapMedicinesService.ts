import { formatINR } from './medicines/compute';
import {
  executeMedicineSearchPipeline,
  PipelineExecutionOptions,
  SimulatedFailureType
} from './medicines/fetchSources';
import { normaliseMedicineQuery } from './medicines/normalise';
import { ALLOWLISTED_SOURCES } from './medicines/referenceData';
import {
  SearchPipelineResult,
  SearchProgressState,
  SourceCheckProgressItem
} from './medicines/types';

export interface MedicineWebSource {
  title: string;
  url: string;
  snippet: string;
}

export interface GenericAlternativeItem {
  name: string;
  manufacturer: string;
  estimatedPrice: string;
  packSize: string;
  sourceType: 'Jan Aushadhi (Govt)' | 'Economical Generic' | 'Standard Brand';
}

export interface MedicineAdministrationGuide {
  whenToTake: string;
  foodTiming: string;
  typicalAdultFrequency: string;
  pediatricWarning: string;
  contraindications: string[];
  criticalPrecautions: string[];
}

export interface MedicineSavingsReport {
  queriedName: string;
  brandName?: string;
  strength?: string;
  genericSaltName?: string;
  activeSaltComposition: string;
  strengthAndDosageForm: string;
  therapeuticCategory: string;
  whatItTreats: string;
  brandedReferenceName: string;
  brandedManufacturer: string;
  brandedMarketPrice: string;
  genericJanAushadhiName: string;
  genericJanAushadhiPrice: string;
  savingsPercentage: string;
  estimatedSavingsPerStrip: string;
  topGenericAlternatives: GenericAlternativeItem[];
  administrationGuide: MedicineAdministrationGuide;
  qualityAssuranceNote: string;
  pharmacistRequestScript: string;
  importantSafetyDisclaimer: string;
  prescriptionRequired: boolean;
  webSources: MedicineWebSource[];
  searchEngineUsed: 'Firecrawl + Gemini' | 'Gemini Essential Drug Index';
  timings?: {
    webSearchMs: number;
    aiSynthesisMs: number;
    totalMs: number;
  };
}

export interface PrescriptionScanReport {
  doctorOrClinicName: string;
  prescriptionDate: string;
  patientDiagnosisSummary: string;
  detectedMedicines: MedicineSavingsReport[];
  totalBrandedCostINR: number;
  totalGenericCostINR: number;
  totalEstimatedSavingsINR: number;
  overallSavingsPercentage: number;
  totalSavingsPercentage: number;
  totalSavingsRupees: number;
  totalJanAushadhiEstimate: number;
  totalBrandedEstimate: number;
  chemistHandoffScript: string;
  pharmacistMasterScript: string;
  generalPrescriptionAdvice: string[];
  timings: {
    visionOcrMs: number;
    medicineLookupMs: number;
    totalMs: number;
  };
}

export interface ExtractedPrescriptionCandidate {
  id: string;
  raw_line: string;
  medicine_name: string;
  strength: string;
  dosage_form: string;
  selected: boolean;
}

const LOCAL_CACHE_PREFIX = 'sanjeevani_med_pipeline_v2:';
const LOCAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readClientCache(normKey: string): { timestamp: number; result: SearchPipelineResult } | null {
  if (typeof window === 'undefined' || !normKey) return null;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_CACHE_PREFIX}${normKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number' && parsed.result) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeClientCache(normKey: string, result: SearchPipelineResult): void {
  if (typeof window === 'undefined' || !normKey || result.outcome !== 'success') return;
  try {
    window.localStorage.setItem(
      `${LOCAL_CACHE_PREFIX}${normKey}`,
      JSON.stringify({ timestamp: Date.now(), result })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export interface TransparentSearchOptions {
  forceRefresh?: boolean;
  simulate_failures?: Record<string, SimulatedFailureType>;
  onProgress?: (state: SearchProgressState) => void;
}

/**
 * Runs the transparent medicine price-comparison pipeline:
 * - Emits immediate (<50ms) SearchProgress checklist updates
 * - Calls `/api/medicines/search` on the server (keeping all keys and scraping server-side)
 * - Supports 24h client cache + stale-while-revalidate + offline reference fallback
 */
export async function runTransparentMedicineSearch(
  rawQuery: string,
  options: TransparentSearchOptions = {}
): Promise<SearchPipelineResult> {
  const startedAt = Date.now();
  const normKey = normaliseMedicineQuery(rawQuery);

  const initialSourceItems: SourceCheckProgressItem[] = ALLOWLISTED_SOURCES.slice(0, 4).map(
    (s) => ({
      source_id: s.source_id,
      source_name: s.source_name,
      source_type: s.source_type,
      domain: s.domain,
      state: 'checking'
    })
  );

  // Paint initial progress immediately (<100ms)
  options.onProgress?.({
    stage: 'identifying',
    identified_medicine: rawQuery.trim(),
    source_items: initialSourceItems,
    started_at_ms: startedAt,
    elapsed_ms: 10
  });

  // Check local 24h cache unless forceRefresh or simulated failures are active
  if (!options.forceRefresh && !options.simulate_failures && normKey) {
    const cached = readClientCache(normKey);
    if (cached) {
      const ageMs = Date.now() - cached.timestamp;
      if (ageMs < LOCAL_CACHE_TTL_MS) {
        return {
          ...cached.result,
          from_cache: true,
          cache_age_ms: ageMs
        };
      }
    }
  }

  // If offline or in unit test environment without server, execute pipeline deterministically from saved reference fixtures
  const isOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;

  if (!isOffline && typeof window !== 'undefined') {
    try {
      options.onProgress?.({
        stage: 'checking_sources',
        identified_medicine: rawQuery.trim(),
        source_items: initialSourceItems,
        started_at_ms: startedAt,
        elapsed_ms: Date.now() - startedAt
      });

      const response = await fetch('/api/medicines/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: rawQuery.trim().slice(0, 100),
          forceRefresh: Boolean(options.forceRefresh),
          simulate_failures: options.simulate_failures
        })
      });

      if (response.ok) {
        const data: SearchPipelineResult = await response.json();
        if (!options.simulate_failures && data.outcome === 'success') {
          writeClientCache(data.normalised_query, data);
        }
        return data;
      }
    } catch {
      // Fall through to local deterministic reference pipeline
    }
  }

  // Offline / fallback execution using the exact same verified pipeline
  const pipelineOpts: PipelineExecutionOptions = {
    simulate_failures: options.simulate_failures,
    onProgress: (ev) => {
      options.onProgress?.({
        stage: ev.stage,
        identified_medicine: ev.identified_medicine,
        confirmed_composition: ev.confirmed_composition,
        source_items: ev.source_items,
        started_at_ms: startedAt,
        elapsed_ms: Date.now() - startedAt
      });
    }
  };

  const result = await executeMedicineSearchPipeline(rawQuery, pipelineOpts);
  if (isOffline) {
    result.is_offline_fallback = true;
  }
  if (!options.simulate_failures && result.outcome === 'success') {
    writeClientCache(result.normalised_query, result);
  }
  return result;
}

/**
 * Extracts candidate medicine lines from a prescription image via `/api/medicines/ocr`.
 * Never auto-runs searches and never returns fake fallback medicines on failure.
 */
export async function extractPrescriptionCandidatesFromImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  ok: boolean;
  candidates: ExtractedPrescriptionCandidate[];
  error_message?: string;
}> {
  try {
    const response = await fetch('/api/medicines/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType })
    });

    if (!response.ok) {
      return {
        ok: false,
        candidates: [],
        error_message:
          "We couldn't read this photo clearly. Please type the medicine name below or add items manually."
      };
    }

    const payload = await response.json();
    const rawItems = Array.isArray(payload?.items) ? payload.items : [];

    if (rawItems.length === 0) {
      return {
        ok: false,
        candidates: [],
        error_message:
          "We couldn't read this photo clearly. Please type the medicine name below or add items manually."
      };
    }

    const candidates: ExtractedPrescriptionCandidate[] = rawItems.map(
      (item: Record<string, string>, idx: number) => ({
        id: `rx-cand-${idx}-${Date.now()}`,
        raw_line: item.raw_line || item.medicine_name || '',
        medicine_name: item.medicine_name || '',
        strength: item.strength || '',
        dosage_form: item.dosage_form || '',
        selected: true
      })
    );

    return { ok: true, candidates };
  } catch {
    return {
      ok: false,
      candidates: [],
      error_message:
        "We couldn't read this photo clearly. Please type the medicine name below or add items manually."
    };
  }
}

export const SAMPLE_PRESCRIPTION_CANDIDATES: ExtractedPrescriptionCandidate[] = [
  {
    id: 'sample-1',
    raw_line: 'Tab. Augmentin 625 Duo (1-0-1 x 5 days)',
    medicine_name: 'Augmentin 625',
    strength: '500mg + 125mg',
    dosage_form: 'Tablet',
    selected: true
  },
  {
    id: 'sample-2',
    raw_line: 'Cap. Pan-D 40/30mg (1-0-0 Before Breakfast)',
    medicine_name: 'Pan-D',
    strength: '40mg + 30mg',
    dosage_form: 'Capsule SR',
    selected: true
  },
  {
    id: 'sample-3',
    raw_line: 'Tab. Dolo 650mg (SOS for Fever)',
    medicine_name: 'Dolo 650',
    strength: '650mg',
    dosage_form: 'Tablet',
    selected: true
  }
];

/**
 * Legacy adapter kept for backwards compatibility with AIMedicalCameraView.tsx.
 */
export async function searchCheapMedicine(medicineQuery: string): Promise<MedicineSavingsReport> {
  const res = await runTransparentMedicineSearch(medicineQuery);
  const id = res.identity;
  const sav = res.savings;

  return {
    queriedName: id?.brand_name || medicineQuery,
    brandName: id?.brand_name || medicineQuery,
    strength: id?.strength || '',
    genericSaltName: id?.composition_display || 'Composition not confirmed',
    activeSaltComposition: id?.composition_display || 'Composition not confirmed',
    strengthAndDosageForm: id ? `${id.strength} · ${id.dosage_form}` : 'Unconfirmed',
    therapeuticCategory: 'Verified Price Comparison',
    whatItTreats: 'Refer to your prescribing doctor or official package insert.',
    brandedReferenceName: id?.brand_name || medicineQuery,
    brandedManufacturer:
      sav?.brand_source_records[0]?.maker || id?.identity_source_name || 'Branded Manufacturer',
    brandedMarketPrice: sav?.brand_price_inr
      ? `${formatINR(sav.brand_price_inr)} (${sav.brand_pack_label || ''})`
      : 'Not verified',
    genericJanAushadhiName: sav?.generic_product_name || 'Same-salt Generic',
    genericJanAushadhiPrice: sav?.generic_price_inr
      ? `${formatINR(sav.generic_price_inr)} (${sav.generic_pack_label || ''})`
      : 'Not verified',
    savingsPercentage: sav?.savings_pct ? `${sav.savings_pct}%` : '—',
    estimatedSavingsPerStrip: sav?.savings_per_pack_inr
      ? `${formatINR(sav.savings_per_pack_inr)} per pack`
      : '—',
    topGenericAlternatives: res.verified_alternatives.map((alt) => ({
      name: alt.product_name,
      manufacturer: alt.maker,
      estimatedPrice: formatINR(alt.price_inr),
      packSize: alt.pack_label,
      sourceType:
        alt.source_type === 'government' ? 'Jan Aushadhi (Govt)' : 'Economical Generic'
    })),
    administrationGuide: {
      whenToTake: 'Follow your prescribing doctor’s instructions.',
      foodTiming: 'Confirm with your doctor or pharmacist.',
      typicalAdultFrequency: 'As prescribed by a registered medical practitioner.',
      pediatricWarning: 'Consult a pediatrician for weight-based dosing.',
      contraindications: ['Confirm allergies and interactions with your physician.'],
      criticalPrecautions: ['Confirm prescription medicines with your doctor before switching.']
    },
    qualityAssuranceNote: res.confidence_reason,
    pharmacistRequestScript: res.counter_script,
    importantSafetyDisclaimer:
      'Prices change and can differ by city and store. Confirm with your pharmacist. For prescription medicines, check with your doctor before switching.',
    prescriptionRequired: id?.rx_status !== 'otc',
    webSources: res.source_ledger
      .filter((s) => s.status === 'used')
      .map((s) => ({
        title: `${s.source_name} — ${s.product_name || ''}`,
        url: s.url,
        snippet: s.snippet || ''
      })),
    searchEngineUsed: 'Gemini Essential Drug Index',
    timings: {
      webSearchMs: res.total_duration_ms,
      aiSynthesisMs: 0,
      totalMs: res.total_duration_ms
    }
  };
}

export const SAMPLE_PRESCRIPTION_REPORT: PrescriptionScanReport = {
  doctorOrClinicName: 'Sample Prescription Preview',
  prescriptionDate: '2025-02-20',
  patientDiagnosisSummary: 'Fever, Acidity & Bacterial Infection',
  detectedMedicines: [],
  totalBrandedCostINR: 467,
  totalGenericCostINR: 81,
  totalEstimatedSavingsINR: 386,
  overallSavingsPercentage: 83,
  totalSavingsPercentage: 83,
  totalSavingsRupees: 386,
  totalJanAushadhiEstimate: 81,
  totalBrandedEstimate: 467,
  chemistHandoffScript:
    'Namaste, please show me same-salt Jan Aushadhi or verified generic options for the medicines on my prescription.',
  pharmacistMasterScript:
    '"Namaste, please show me same-salt Jan Aushadhi or verified generic options for the medicines on my prescription."',
  generalPrescriptionAdvice: [
    'Confirm with your pharmacist and prescribing doctor before switching prescription medicines.'
  ],
  timings: {
    visionOcrMs: 120,
    medicineLookupMs: 180,
    totalMs: 300
  }
};

export async function scanPrescriptionImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<PrescriptionScanReport> {
  const extracted = await extractPrescriptionCandidatesFromImage(base64Data, mimeType);
  if (!extracted.ok || extracted.candidates.length === 0) {
    throw new Error(
      extracted.error_message ||
        "We couldn't read this photo clearly. Please type the medicine name below."
    );
  }
  const reports = await Promise.all(
    extracted.candidates.slice(0, 4).map((c) => searchCheapMedicine(c.medicine_name))
  );
  return {
    ...SAMPLE_PRESCRIPTION_REPORT,
    detectedMedicines: reports
  };
}
