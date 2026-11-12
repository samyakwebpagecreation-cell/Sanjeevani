export type SourceType = 'government' | 'retail';

export type SourceStatus =
  | 'used'
  | 'no_match'
  | 'unparseable'
  | 'timeout'
  | 'blocked'
  | 'error'
  | 'failed_verification'
  | 'excluded_outlier';

export type PriceType = 'MRP' | 'selling_price';

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'none';

export interface MatchChecks {
  salt: boolean | null;
  strength: boolean | null;
  form: boolean | null;
  pack: boolean | null;
}

export interface SourceRecord {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  domain: string;
  url: string;
  retrieved_at: string;
  duration_ms: number;
  product_name: string | null;
  maker: string | null;
  composition: string[];
  strength: string | null;
  dosage_form: string | null;
  pack_size_units: number | null;
  pack_label: string | null;
  price_inr: number | null;
  price_type: PriceType | null;
  rx_required: boolean | null;
  regulatory_label: string | null;
  regulatory_explanation: string | null;
  snippet: string | null;
  is_branded_reference?: boolean;
  checks: MatchChecks;
  mismatch_reasons?: string[];
  failure_reason?: string;
  status: SourceStatus;
}

export interface NeverSwitchWarning {
  is_critical: boolean;
  category_label?: string;
  reason?: string;
}

export interface MedicineIdentity {
  normalised_query: string;
  brand_name: string;
  composition: string[];
  composition_display: string;
  strength: string;
  dosage_form: string;
  standard_pack_units: number;
  standard_pack_label: string;
  rx_status: 'rx_required' | 'otc' | 'unconfirmed';
  rx_source_name: string | null;
  rx_source_url: string | null;
  identity_source_name: string;
  identity_source_url: string;
  identity_retrieved_at: string;
  never_switch_warning: NeverSwitchWarning;
}

export interface ValidatedAlternative {
  id: string;
  product_name: string;
  maker: string;
  composition: string[];
  strength: string;
  dosage_form: string;
  price_inr: number;
  price_type: PriceType;
  pack_size_units: number;
  pack_label: string;
  per_unit_price_inr: number;
  savings_pct_vs_brand: number | null;
  savings_inr_per_pack_equivalent: number | null;
  source_id: string;
  source_name: string;
  source_type: SourceType;
  url: string;
  retrieved_at: string;
  snippet: string;
  regulatory_label: string | null;
  regulatory_explanation: string | null;
  checks: {
    salt: boolean;
    strength: boolean;
    form: boolean;
    pack: boolean;
  };
  mismatch_reasons: string[];
  is_exact_match: boolean;
}

export interface SavingsComputation {
  can_show_headline: boolean;
  reason_if_withheld?: string;
  price_basis: PriceType | null;
  brand_price_inr: number | null;
  brand_price_range_inr: [number, number] | null;
  brand_per_unit_inr: number | null;
  brand_pack_units: number | null;
  brand_pack_label: string | null;
  brand_source_records: SourceRecord[];
  generic_price_inr: number | null;
  generic_price_range_inr: [number, number] | null;
  generic_per_unit_inr: number | null;
  generic_pack_units: number | null;
  generic_pack_label: string | null;
  generic_product_name: string | null;
  generic_maker: string | null;
  generic_source_records: SourceRecord[];
  savings_pct: number | null;
  savings_pct_range: [number, number] | null;
  savings_per_unit_inr: number | null;
  savings_per_pack_inr: number | null;
  comparison_pack_units: number | null;
}

export interface DisambiguationOption {
  query: string;
  brand_name: string;
  strength: string;
  composition_display: string;
  dosage_form: string;
  condition_tag: string;
}

export interface DidYouMeanSuggestion {
  query: string;
  brand_name: string;
  composition_display: string;
}

export interface SourceCheckProgressItem {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  domain: string;
  state: 'pending' | 'checking' | 'found' | 'no_match' | 'failed';
  duration_ms?: number;
  reason?: string;
}

export interface SearchProgressState {
  stage:
    | 'identifying'
    | 'confirming_composition'
    | 'checking_sources'
    | 'validating_matches'
    | 'calculating_savings'
    | 'complete'
    | 'stopped';
  identified_medicine?: string;
  confirmed_composition?: string;
  source_items: SourceCheckProgressItem[];
  started_at_ms: number;
  elapsed_ms: number;
}

export interface SearchPipelineResult {
  outcome:
    | 'success'
    | 'disambiguation_needed'
    | 'unknown_medicine'
    | 'composition_unconfirmed'
    | 'no_sources_reachable';
  query: string;
  normalised_query: string;
  retrieved_at: string;
  total_duration_ms: number;
  from_cache: boolean;
  cache_age_ms?: number;
  is_offline_fallback?: boolean;
  disambiguation_options?: DisambiguationOption[];
  did_you_mean?: DidYouMeanSuggestion[];
  identity?: MedicineIdentity;
  confidence_tier: ConfidenceTier;
  confidence_reason: string;
  savings?: SavingsComputation;
  verified_alternatives: ValidatedAlternative[];
  similar_alternatives: ValidatedAlternative[];
  source_ledger: SourceRecord[];
  sources_checked_count: number;
  sources_succeeded_count: number;
  counter_script: string;
}
