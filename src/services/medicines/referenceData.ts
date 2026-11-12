import { DisambiguationOption, NeverSwitchWarning, PriceType, SourceType } from './types';

export interface AllowlistedDomainConfig {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  domain: string;
  search_url_template: string;
}

export const ALLOWLISTED_SOURCES: AllowlistedDomainConfig[] = [
  {
    source_id: 'pmbjp',
    source_name: 'PMBJP Jan Aushadhi',
    source_type: 'government',
    domain: 'janaushadhi.gov.in',
    search_url_template: 'https://janaushadhi.gov.in/ProductList.aspx'
  },
  {
    source_id: 'nppa',
    source_name: 'NPPA Pharma Sahi Daam',
    source_type: 'government',
    domain: 'nppaindia.nic.in',
    search_url_template: 'https://nppaindia.nic.in/en/utilities/ Ceiling-Prices/'
  },
  {
    source_id: '1mg',
    source_name: 'Tata 1mg',
    source_type: 'retail',
    domain: '1mg.com',
    search_url_template: 'https://www.1mg.com/search/all?name={query}'
  },
  {
    source_id: 'pharmeasy',
    source_name: 'PharmEasy',
    source_type: 'retail',
    domain: 'pharmeasy.in',
    search_url_template: 'https://pharmeasy.in/search/all?name={query}'
  },
  {
    source_id: 'netmeds',
    source_name: 'Netmeds',
    source_type: 'retail',
    domain: 'netmeds.com',
    search_url_template: 'https://www.netmeds.com/catalogsearch/result/{query}/all'
  },
  {
    source_id: 'apollo',
    source_name: 'Apollo Pharmacy',
    source_type: 'retail',
    domain: 'apollopharmacy.in',
    search_url_template: 'https://www.apollopharmacy.in/search-medicines/{query}'
  }
];

export function isAllowlistedUrl(urlStr: string): AllowlistedDomainConfig | null {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    for (const src of ALLOWLISTED_SOURCES) {
      if (hostname === src.domain || hostname.endsWith(`.${src.domain}`)) {
        return src;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * NOTE FOR RELEASE REVIEW:
 * This static list of narrow-therapeutic-index, critical chronic, and controlled medicine classes
 * is an engineering safety guard and MUST be reviewed and signed off by a licensed pharmacist/doctor
 * before clinical deployment.
 */
export interface NeverSwitchClassEntry {
  category_label: string;
  keywords: string[];
  reason: string;
}

export const NEVER_SWITCH_CLASSES: NeverSwitchClassEntry[] = [
  {
    category_label: 'Insulin & Injectable Diabetes Therapy',
    keywords: [
      'insulin',
      'insulin glargine',
      'insulin aspart',
      'insulin lispro',
      'insulin degludec',
      'lantus',
      'humalog',
      'novorapid',
      'mixtard',
      'actrapid'
    ],
    reason:
      'Insulins are biological medicines where delivery devices, release profiles, and unit calibration require direct physician supervision before any change.'
  },
  {
    category_label: 'Anti-Epileptic / Seizure Medicine (Narrow Therapeutic Index)',
    keywords: [
      'phenytoin',
      'carbamazepine',
      'sodium valproate',
      'valproic acid',
      'divalproex',
      'levetiracetam',
      'lamotrigine',
      'oxcarbazepine',
      'eptoin',
      'tegretol',
      'encorate',
      'levipil'
    ],
    reason:
      'Anti-seizure medicines have a narrow therapeutic window; even minor absorption differences between brands can trigger breakthrough seizures.'
  },
  {
    category_label: 'Blood Thinner / Anticoagulant',
    keywords: [
      'warfarin',
      'acenocoumarol',
      'nicoumalone',
      'dabigatran',
      'apixaban',
      'rivaroxaban',
      'warf',
      'acitrom',
      'xarelto',
      'eliquis'
    ],
    reason:
      'Anticoagulants require strict INR/clotting monitoring. Never switch brands or formulations without your cardiologist or physician.'
  },
  {
    category_label: 'Thyroid Hormone Replacement (Narrow Therapeutic Index)',
    keywords: ['levothyroxine', 'thyroxine', 'thyronorm', 'eltroxin', 'lethydox'],
    reason:
      'Thyroid hormone tablets are dosed in micrograms; switching brands generally requires re-checking TSH levels after 6 weeks with your doctor.'
  },
  {
    category_label: 'Critical Cardiac / Immunosuppressant / Narrow-Index Therapy',
    keywords: [
      'digoxin',
      'amiodarone',
      'tacrolimus',
      'cyclosporine',
      'lithium',
      'lanoxin',
      'cordarone'
    ],
    reason:
      'This medicine requires blood-level or rhythm monitoring and should never be substituted without the prescribing specialist.'
  },
  {
    category_label: 'Controlled / Schedule H1 & X CNS Medicine',
    keywords: [
      'alprazolam',
      'clonazepam',
      'lorazepam',
      'diazepam',
      'zolpidem',
      'methylphenidate',
      'morphine',
      'fentanyl',
      'tramadol'
    ],
    reason:
      'Controlled central nervous system medicines require a valid specialist prescription and cannot be switched or dispensed over the counter.'
  }
];

export function checkNeverSwitchWarning(
  queryOrBrand: string,
  composition: string[]
): NeverSwitchWarning {
  const haystack = [queryOrBrand, ...composition].join(' ').toLowerCase();
  for (const entry of NEVER_SWITCH_CLASSES) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) {
      return {
        is_critical: true,
        category_label: entry.category_label,
        reason: entry.reason
      };
    }
  }
  return { is_critical: false };
}

/**
 * Canonical salt synonym dictionary for deterministic salt matching.
 */
export const CANONICAL_SALT_MAP: Record<string, string> = {
  acetaminophen: 'paracetamol',
  paracetamol: 'paracetamol',
  'paracetamol ip': 'paracetamol',
  amoxycillin: 'amoxicillin',
  amoxicillin: 'amoxicillin',
  'amoxycillin trihydrate': 'amoxicillin',
  'amoxicillin trihydrate': 'amoxicillin',
  'clavulanic acid': 'clavulanic acid',
  'potassium clavulanate': 'clavulanic acid',
  'clavulanate potassium': 'clavulanic acid',
  'diluted potassium clavulanate': 'clavulanic acid',
  pantoprazole: 'pantoprazole',
  'pantoprazole sodium': 'pantoprazole',
  'pantoprazole gastro resistant': 'pantoprazole',
  'pantoprazole gastro-resistant': 'pantoprazole',
  domperidone: 'domperidone',
  'domperidone sr': 'domperidone',
  'domperidone prolonged release': 'domperidone',
  'domperidone sustained release': 'domperidone',
  telmisartan: 'telmisartan',
  'telmisartan ip': 'telmisartan',
  metformin: 'metformin',
  'metformin hydrochloride': 'metformin',
  'metformin hcl': 'metformin',
  'metformin sr': 'metformin',
  'metformin prolonged release': 'metformin',
  montelukast: 'montelukast',
  'montelukast sodium': 'montelukast',
  levocetirizine: 'levocetirizine',
  'levocetirizine dihydrochloride': 'levocetirizine',
  'levocetirizine hcl': 'levocetirizine',
  azithromycin: 'azithromycin',
  'azithromycin dihydrate': 'azithromycin',
  'azithromycin ip': 'azithromycin',
  atorvastatin: 'atorvastatin',
  'atorvastatin calcium': 'atorvastatin',
  'atorvastatin ip': 'atorvastatin',
  'insulin glargine': 'insulin glargine',
  'insulin glargine rdna origin': 'insulin glargine',
  levothyroxine: 'levothyroxine',
  'levothyroxine sodium': 'levothyroxine',
  'thyroxine sodium': 'levothyroxine',
  warfarin: 'warfarin',
  'warfarin sodium': 'warfarin',
  amlodipine: 'amlodipine',
  'amlodipine besylate': 'amlodipine',
  glimepiride: 'glimepiride'
};

export interface RawFetchedSourceFixture {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  domain: string;
  url: string;
  retrieved_at: string;
  duration_ms: number;
  raw_page_text: string;
  pre_extracted_items: Array<{
    product_name: string;
    maker: string;
    composition: string[];
    strength: string;
    dosage_form: string;
    pack_size_units: number;
    pack_label: string;
    price_inr: number;
    price_type: PriceType;
    rx_required: boolean | null;
    regulatory_label: string | null;
    regulatory_explanation: string | null;
    is_branded_reference?: boolean;
  }>;
}

export interface CuratedMedicineReference {
  normalised_key: string;
  aliases: string[];
  brand_name: string;
  condition_tag: string;
  popular_chip?: boolean;
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
  source_fixtures: RawFetchedSourceFixture[];
}

export const AMBIGUOUS_PREFIX_GROUPS: Record<string, DisambiguationOption[]> = {
  pan: [
    {
      query: 'Pan-D',
      brand_name: 'Pan-D',
      strength: '40mg + 30mg',
      composition_display: 'Pantoprazole 40mg + Domperidone 30mg (SR)',
      dosage_form: 'Capsule SR',
      condition_tag: 'Acidity & Reflux'
    },
    {
      query: 'Pan 40',
      brand_name: 'Pan 40',
      strength: '40mg',
      composition_display: 'Pantoprazole 40mg',
      dosage_form: 'Tablet',
      condition_tag: 'Acidity'
    },
    {
      query: 'Pan 20',
      brand_name: 'Pan 20',
      strength: '20mg',
      composition_display: 'Pantoprazole 20mg',
      dosage_form: 'Tablet',
      condition_tag: 'Mild Acidity'
    }
  ],
  dolo: [
    {
      query: 'Dolo 650',
      brand_name: 'Dolo 650',
      strength: '650mg',
      composition_display: 'Paracetamol 650mg',
      dosage_form: 'Tablet',
      condition_tag: 'Fever & Pain'
    },
    {
      query: 'Dolo 500',
      brand_name: 'Dolo 500',
      strength: '500mg',
      composition_display: 'Paracetamol 500mg',
      dosage_form: 'Tablet',
      condition_tag: 'Fever & Mild Pain'
    }
  ],
  telma: [
    {
      query: 'Telma 40',
      brand_name: 'Telma 40',
      strength: '40mg',
      composition_display: 'Telmisartan 40mg',
      dosage_form: 'Tablet',
      condition_tag: 'Blood Pressure'
    },
    {
      query: 'Telma 20',
      brand_name: 'Telma 20',
      strength: '20mg',
      composition_display: 'Telmisartan 20mg',
      dosage_form: 'Tablet',
      condition_tag: 'Blood Pressure'
    }
  ],
  glycomet: [
    {
      query: 'Glycomet 500',
      brand_name: 'Glycomet 500',
      strength: '500mg',
      composition_display: 'Metformin Hydrochloride 500mg (SR)',
      dosage_form: 'Tablet SR',
      condition_tag: 'Diabetes'
    },
    {
      query: 'Glycomet GP 1',
      brand_name: 'Glycomet-GP 1',
      strength: '500mg + 1mg',
      composition_display: 'Metformin 500mg + Glimepiride 1mg',
      dosage_form: 'Tablet SR',
      condition_tag: 'Diabetes Combination'
    }
  ],
  augmentin: [
    {
      query: 'Augmentin 625',
      brand_name: 'Augmentin 625 Duo',
      strength: '500mg + 125mg',
      composition_display: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
      dosage_form: 'Tablet',
      condition_tag: 'Bacterial Infection'
    }
  ],
  azithral: [
    {
      query: 'Azithral 500',
      brand_name: 'Azithral 500',
      strength: '500mg',
      composition_display: 'Azithromycin 500mg',
      dosage_form: 'Tablet',
      condition_tag: 'Antibiotic'
    }
  ],
  atorva: [
    {
      query: 'Atorva 10',
      brand_name: 'Atorva 10',
      strength: '10mg',
      composition_display: 'Atorvastatin 10mg',
      dosage_form: 'Tablet',
      condition_tag: 'Cholesterol'
    }
  ]
};

export const POPULAR_MEDICINE_CHIPS = [
  { query: 'Augmentin 625', label: 'Augmentin 625', condition: 'Infection' },
  { query: 'Dolo 650', label: 'Dolo 650', condition: 'Fever & Pain' },
  { query: 'Pan-D', label: 'Pan-D', condition: 'Acidity' },
  { query: 'Telma 40', label: 'Telma 40', condition: 'Blood Pressure' },
  { query: 'Glycomet 500', label: 'Glycomet 500', condition: 'Diabetes' },
  { query: 'Montair-LC', label: 'Montair-LC', condition: 'Allergy' },
  { query: 'Azithral 500', label: 'Azithral 500', condition: 'Antibiotic' },
  { query: 'Atorva 10', label: 'Atorva 10', condition: 'Cholesterol' }
];

export const CURATED_MEDICINE_INDEX: CuratedMedicineReference[] = [
  {
    normalised_key: 'augmentin 625',
    aliases: ['augmentin 625', 'augmentin 625 duo', 'augmentin625', 'amoxicillin 500mg clavulanic acid 125mg'],
    brand_name: 'Augmentin 625 Duo',
    condition_tag: 'Infection',
    popular_chip: true,
    composition: ['Amoxicillin', 'Clavulanic Acid'],
    composition_display: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    strength: '500mg + 125mg',
    dosage_form: 'Tablet',
    standard_pack_units: 10,
    standard_pack_label: 'Strip of 10 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg & PMBJP Schedule H Record',
    rx_source_url: 'https://www.1mg.com/drugs/augmentin-625-duo-tablet-138629',
    identity_source_name: 'Tata 1mg / GSK India Product Monograph',
    identity_source_url: 'https://www.1mg.com/drugs/augmentin-625-duo-tablet-138629',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 340,
        raw_page_text:
          'PMBJP Drug Code 95 | Amoxycillin 500mg and Potassium Clavulanate 125mg Tablet IP | Pack Size: 6 Tablets | MRP ₹52.00 | Manufactured at WHO-GMP certified facility for Pharmaceuticals & Medical Devices Bureau of India (PMBI). Also listed: Drug Code 89 Amoxycillin 500mg Capsule IP Pack of 10 Capsules MRP ₹24.00.',
        pre_extracted_items: [
          {
            product_name: 'Amoxycillin 500mg and Potassium Clavulanate 125mg Tablet IP',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Amoxycillin', 'Potassium Clavulanate'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 6,
            pack_label: 'Strip of 6 tablets',
            price_inr: 52.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          },
          {
            product_name: 'Amoxycillin 500mg Capsule IP',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Amoxycillin'],
            strength: '500mg',
            dosage_form: 'Capsule',
            pack_size_units: 10,
            pack_label: 'Strip of 10 capsules',
            price_inr: 24.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'nppa',
        source_name: 'NPPA Pharma Sahi Daam',
        source_type: 'government',
        domain: 'nppaindia.nic.in',
        url: 'https://nppaindia.nic.in/en/utilities/Ceiling-Prices/',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 410,
        raw_page_text:
          'NPPA NLEM Scheduled Formulation: Amoxicillin 500mg + Clavulanic Acid 125mg Tablet | Ceiling Price Notification: Equivalent Strip of 10 Tablets MRP ₹201.70 (₹20.17 per tablet ceiling + applicable GST).',
        pre_extracted_items: [
          {
            product_name: 'Amoxicillin 500mg + Clavulanic Acid 125mg Tablet (NPPA Ceiling)',
            maker: 'NPPA Ceiling Benchmark',
            composition: ['Amoxicillin', 'Clavulanic Acid'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 201.7,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'NPPA Ceiling Price',
            regulatory_explanation:
              'Maximum statutory ceiling price fixed by the National Pharmaceutical Pricing Authority.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/augmentin-625-duo-tablet-138629',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 520,
        raw_page_text:
          'Augmentin 625 Duo Tablet | GlaxoSmithKline Pharmaceuticals Ltd | Salt Composition: Amoxycillin (500mg) + Clavulanic Acid (125mg) | Prescription Required | Strip of 10 tablets | MRP ₹223.42. Substitutes on page: Moxikind-CV 625 Tablet by Mankind Pharma Ltd Strip of 10 tablets MRP ₹165.00.',
        pre_extracted_items: [
          {
            product_name: 'Augmentin 625 Duo Tablet',
            maker: 'GlaxoSmithKline Pharmaceuticals Ltd',
            composition: ['Amoxycillin', 'Clavulanic Acid'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 223.42,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Moxikind-CV 625 Tablet',
            maker: 'Mankind Pharma Ltd',
            composition: ['Amoxycillin', 'Clavulanic Acid'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 165.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/augmentin-625-duo-strip-of-10-tablets-6599',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 610,
        raw_page_text:
          'Augmentin 625 Duo Strip Of 10 Tablets | By GSK | Contains Amoxycillin 500mg + Clavulanic Acid 125mg | Rx required | MRP ₹223.42. Alternative: Clavam 625 Tablet by Alkem Laboratories Ltd Strip of 10 tablets MRP ₹198.50.',
        pre_extracted_items: [
          {
            product_name: 'Augmentin 625 Duo Strip Of 10 Tablets',
            maker: 'GlaxoSmithKline Pharmaceuticals Ltd',
            composition: ['Amoxycillin', 'Clavulanic Acid'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 223.42,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Clavam 625 Tablet',
            maker: 'Alkem Laboratories Ltd',
            composition: ['Amoxycillin', 'Clavulanic Acid'],
            strength: '500mg + 125mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 198.5,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'dolo 650',
    aliases: ['dolo 650', 'dolo650', 'dolo 650mg', 'paracetamol 650mg'],
    brand_name: 'Dolo 650',
    condition_tag: 'Fever & Pain',
    popular_chip: true,
    composition: ['Paracetamol'],
    composition_display: 'Paracetamol 650mg',
    strength: '650mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'otc',
    rx_source_name: 'Tata 1mg Product Listing',
    rx_source_url: 'https://www.1mg.com/otc/dolo-650-tablet-otc134824',
    identity_source_name: 'Tata 1mg / Micro Labs Product Listing',
    identity_source_url: 'https://www.1mg.com/otc/dolo-650-tablet-otc134824',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 290,
        raw_page_text:
          'PMBJP Drug Code 521 | Paracetamol Tablets IP 650mg | Pack Size: 15 Tablets | MRP ₹11.00 | Sourced from WHO-GMP certified supplier for PMBI. Also listed: Drug Code 18 Paracetamol Tablets IP 500mg Pack of 10 Tablets MRP ₹7.00.',
        pre_extracted_items: [
          {
            product_name: 'Paracetamol Tablets IP 650mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Paracetamol'],
            strength: '650mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 11.0,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          },
          {
            product_name: 'Paracetamol Tablets IP 500mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Paracetamol'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 7.0,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/otc/dolo-650-tablet-otc134824',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 480,
        raw_page_text:
          'Dolo 650 Tablet | Micro Labs Ltd | Salt Composition: Paracetamol (650mg) | Strip of 15 tablets | MRP ₹33.75. Same-salt alternatives: Calpol 650mg Tablet by GSK Strip of 15 tablets MRP ₹31.20; Pacimol 650 Tablet by Ipca Laboratories Strip of 15 tablets MRP ₹29.50.',
        pre_extracted_items: [
          {
            product_name: 'Dolo 650 Tablet',
            maker: 'Micro Labs Ltd',
            composition: ['Paracetamol'],
            strength: '650mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 33.75,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Pacimol 650 Tablet',
            maker: 'Ipca Laboratories Ltd',
            composition: ['Paracetamol'],
            strength: '650mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 29.5,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null
          },
          {
            product_name: 'Calpol 650mg Tablet',
            maker: 'GlaxoSmithKline Pharmaceuticals Ltd',
            composition: ['Paracetamol'],
            strength: '650mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 31.2,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/dolo-650mg-strip-of-15-tablets-44140',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 530,
        raw_page_text:
          'Dolo 650mg Strip Of 15 Tablets | Micro Labs Ltd | Contains Paracetamol 650mg | Strip of 15 tablets | MRP ₹33.75.',
        pre_extracted_items: [
          {
            product_name: 'Dolo 650mg Strip Of 15 Tablets',
            maker: 'Micro Labs Ltd',
            composition: ['Paracetamol'],
            strength: '650mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 33.75,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'dolo 500',
    aliases: ['dolo 500', 'dolo500', 'paracetamol 500mg'],
    brand_name: 'Dolo 500',
    condition_tag: 'Fever & Mild Pain',
    popular_chip: false,
    composition: ['Paracetamol'],
    composition_display: 'Paracetamol 500mg',
    strength: '500mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'otc',
    rx_source_name: 'Tata 1mg Product Listing',
    rx_source_url: 'https://www.1mg.com/drugs/dolo-500-tablet-69632',
    identity_source_name: 'Tata 1mg / Micro Labs Product Listing',
    identity_source_url: 'https://www.1mg.com/drugs/dolo-500-tablet-69632',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 310,
        raw_page_text:
          'PMBJP Drug Code 18 | Paracetamol Tablets IP 500mg | Pack Size: 10 Tablets | MRP ₹7.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Paracetamol Tablets IP 500mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Paracetamol'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 7.0,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/dolo-500-tablet-69632',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 460,
        raw_page_text:
          'Dolo 500 Tablet | Micro Labs Ltd | Salt Composition: Paracetamol (500mg) | Strip of 15 tablets | MRP ₹15.10.',
        pre_extracted_items: [
          {
            product_name: 'Dolo 500 Tablet',
            maker: 'Micro Labs Ltd',
            composition: ['Paracetamol'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 15.1,
            price_type: 'MRP',
            rx_required: false,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'pan d',
    aliases: ['pan d', 'pan-d', 'pand', 'pantoprazole 40mg domperidone 30mg'],
    brand_name: 'Pan-D',
    condition_tag: 'Acidity',
    popular_chip: true,
    composition: ['Pantoprazole', 'Domperidone'],
    composition_display: 'Pantoprazole 40mg + Domperidone 30mg (SR)',
    strength: '40mg + 30mg',
    dosage_form: 'Capsule SR',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 capsules',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/pan-d-capsule-pr-13376',
    identity_source_name: 'Tata 1mg / Alkem Laboratories Listing',
    identity_source_url: 'https://www.1mg.com/drugs/pan-d-capsule-pr-13376',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 330,
        raw_page_text:
          'PMBJP Drug Code 246 | Pantoprazole Gastro-Resistant 40mg and Domperidone Prolonged-Release 30mg Capsule IP | Pack Size: 10 Capsules | MRP ₹18.00 | WHO-GMP certified supplier for PMBI. Also listed: Drug Code 244 Pantoprazole Gastro-Resistant Tablet IP 40mg Pack of 10 Tablets MRP ₹11.00.',
        pre_extracted_items: [
          {
            product_name:
              'Pantoprazole Gastro-Resistant 40mg and Domperidone Prolonged-Release 30mg Capsule IP',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Pantoprazole', 'Domperidone'],
            strength: '40mg + 30mg',
            dosage_form: 'Capsule SR',
            pack_size_units: 10,
            pack_label: 'Strip of 10 capsules',
            price_inr: 18.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          },
          {
            product_name: 'Pantoprazole Gastro-Resistant Tablet IP 40mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Pantoprazole'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 11.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/pan-d-capsule-pr-13376',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 510,
        raw_page_text:
          'Pan-D Capsule PR | Alkem Laboratories Ltd | Salt Composition: Pantoprazole (40mg) + Domperidone (30mg) | Prescription Required | Strip of 15 capsules | MRP ₹210.00. Same-salt alternatives: Pantocid DSR Capsule by Sun Pharmaceutical Industries Ltd Strip of 15 capsules MRP ₹215.00; Aciloc RD 40 Capsule SR by Cadila Pharmaceuticals Ltd Strip of 10 capsules MRP ₹112.00.',
        pre_extracted_items: [
          {
            product_name: 'Pan-D Capsule PR',
            maker: 'Alkem Laboratories Ltd',
            composition: ['Pantoprazole', 'Domperidone'],
            strength: '40mg + 30mg',
            dosage_form: 'Capsule SR',
            pack_size_units: 15,
            pack_label: 'Strip of 15 capsules',
            price_inr: 210.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Aciloc RD 40 Capsule SR',
            maker: 'Cadila Pharmaceuticals Ltd',
            composition: ['Pantoprazole', 'Domperidone'],
            strength: '40mg + 30mg',
            dosage_form: 'Capsule SR',
            pack_size_units: 10,
            pack_label: 'Strip of 10 capsules',
            price_inr: 112.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/pan-d-strip-of-15-capsules-19937',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 590,
        raw_page_text:
          'Pan-D Strip Of 15 Capsules | Alkem Laboratories Ltd | Contains Pantoprazole 40mg + Domperidone 30mg | Rx Required | Strip of 15 capsules | MRP ₹210.00.',
        pre_extracted_items: [
          {
            product_name: 'Pan-D Strip Of 15 Capsules',
            maker: 'Alkem Laboratories Ltd',
            composition: ['Pantoprazole', 'Domperidone'],
            strength: '40mg + 30mg',
            dosage_form: 'Capsule SR',
            pack_size_units: 15,
            pack_label: 'Strip of 15 capsules',
            price_inr: 210.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'pan 40',
    aliases: ['pan 40', 'pan40', 'pantoprazole 40mg'],
    brand_name: 'Pan 40',
    condition_tag: 'Acidity',
    popular_chip: false,
    composition: ['Pantoprazole'],
    composition_display: 'Pantoprazole 40mg',
    strength: '40mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/pan-40-tablet-13375',
    identity_source_name: 'Tata 1mg / Alkem Laboratories Listing',
    identity_source_url: 'https://www.1mg.com/drugs/pan-40-tablet-13375',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 300,
        raw_page_text:
          'PMBJP Drug Code 244 | Pantoprazole Gastro-Resistant Tablet IP 40mg | Pack Size: 10 Tablets | MRP ₹11.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Pantoprazole Gastro-Resistant Tablet IP 40mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Pantoprazole'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 11.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/pan-40-tablet-13375',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 490,
        raw_page_text:
          'Pan 40 Tablet | Alkem Laboratories Ltd | Salt Composition: Pantoprazole (40mg) | Prescription Required | Strip of 15 tablets | MRP ₹165.00.',
        pre_extracted_items: [
          {
            product_name: 'Pan 40 Tablet',
            maker: 'Alkem Laboratories Ltd',
            composition: ['Pantoprazole'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 165.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'pan 20',
    aliases: ['pan 20', 'pan20', 'pantoprazole 20mg'],
    brand_name: 'Pan 20',
    condition_tag: 'Mild Acidity',
    popular_chip: false,
    composition: ['Pantoprazole'],
    composition_display: 'Pantoprazole 20mg',
    strength: '20mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/pan-20-tablet-13374',
    identity_source_name: 'Tata 1mg / Alkem Laboratories Listing',
    identity_source_url: 'https://www.1mg.com/drugs/pan-20-tablet-13374',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/pan-20-tablet-13374',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 470,
        raw_page_text:
          'Pan 20 Tablet | Alkem Laboratories Ltd | Salt Composition: Pantoprazole (20mg) | Prescription Required | Strip of 15 tablets | MRP ₹115.00.',
        pre_extracted_items: [
          {
            product_name: 'Pan 20 Tablet',
            maker: 'Alkem Laboratories Ltd',
            composition: ['Pantoprazole'],
            strength: '20mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 115.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'telma 40',
    aliases: ['telma 40', 'telma40', 'telmisartan 40mg'],
    brand_name: 'Telma 40',
    condition_tag: 'Blood Pressure',
    popular_chip: true,
    composition: ['Telmisartan'],
    composition_display: 'Telmisartan 40mg',
    strength: '40mg',
    dosage_form: 'Tablet',
    standard_pack_units: 30,
    standard_pack_label: 'Strip of 30 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/telma-40-tablet-69948',
    identity_source_name: 'Tata 1mg / Glenmark Pharmaceuticals Listing',
    identity_source_url: 'https://www.1mg.com/drugs/telma-40-tablet-69948',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 320,
        raw_page_text:
          'PMBJP Drug Code 334 | Telmisartan Tablets IP 40mg | Pack Size: 10 Tablets | MRP ₹12.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Telmisartan Tablets IP 40mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Telmisartan'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 12.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/telma-40-tablet-69948',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 510,
        raw_page_text:
          'Telma 40 Tablet | Glenmark Pharmaceuticals Ltd | Salt Composition: Telmisartan (40mg) | Prescription Required | Strip of 30 tablets | MRP ₹222.00. Same-salt alternative: Telmikind 40 Tablet by Mankind Pharma Ltd Strip of 10 tablets MRP ₹34.00.',
        pre_extracted_items: [
          {
            product_name: 'Telma 40 Tablet',
            maker: 'Glenmark Pharmaceuticals Ltd',
            composition: ['Telmisartan'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 30,
            pack_label: 'Strip of 30 tablets',
            price_inr: 222.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Telmikind 40 Tablet',
            maker: 'Mankind Pharma Ltd',
            composition: ['Telmisartan'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 34.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/telma-40mg-strip-of-30-tablets-211495',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 560,
        raw_page_text:
          'Telma 40mg Strip Of 30 Tablets | Glenmark Pharmaceuticals Ltd | Contains Telmisartan 40mg | Rx Required | Strip of 30 tablets | MRP ₹222.00.',
        pre_extracted_items: [
          {
            product_name: 'Telma 40mg Strip Of 30 Tablets',
            maker: 'Glenmark Pharmaceuticals Ltd',
            composition: ['Telmisartan'],
            strength: '40mg',
            dosage_form: 'Tablet',
            pack_size_units: 30,
            pack_label: 'Strip of 30 tablets',
            price_inr: 222.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'telma 20',
    aliases: ['telma 20', 'telma20', 'telmisartan 20mg'],
    brand_name: 'Telma 20',
    condition_tag: 'Blood Pressure',
    popular_chip: false,
    composition: ['Telmisartan'],
    composition_display: 'Telmisartan 20mg',
    strength: '20mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/telma-20-tablet-69946',
    identity_source_name: 'Tata 1mg / Glenmark Pharmaceuticals Listing',
    identity_source_url: 'https://www.1mg.com/drugs/telma-20-tablet-69946',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 305,
        raw_page_text:
          'PMBJP Drug Code 333 | Telmisartan Tablets IP 20mg | Pack Size: 10 Tablets | MRP ₹8.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Telmisartan Tablets IP 20mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Telmisartan'],
            strength: '20mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 8.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/telma-20-tablet-69946',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 495,
        raw_page_text:
          'Telma 20 Tablet | Glenmark Pharmaceuticals Ltd | Salt Composition: Telmisartan (20mg) | Prescription Required | Strip of 15 tablets | MRP ₹94.50.',
        pre_extracted_items: [
          {
            product_name: 'Telma 20 Tablet',
            maker: 'Glenmark Pharmaceuticals Ltd',
            composition: ['Telmisartan'],
            strength: '20mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 94.5,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'glycomet 500',
    aliases: ['glycomet 500', 'glycomet500', 'glycomet 500 sr', 'metformin 500mg'],
    brand_name: 'Glycomet 500 SR',
    condition_tag: 'Diabetes',
    popular_chip: true,
    composition: ['Metformin'],
    composition_display: 'Metformin Hydrochloride 500mg (SR)',
    strength: '500mg',
    dosage_form: 'Tablet SR',
    standard_pack_units: 20,
    standard_pack_label: 'Strip of 20 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule G/H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/glycomet-500-sr-tablet-326455',
    identity_source_name: 'Tata 1mg / USV Pvt Ltd Listing',
    identity_source_url: 'https://www.1mg.com/drugs/glycomet-500-sr-tablet-326455',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 315,
        raw_page_text:
          'PMBJP Drug Code 210 | Metformin Hydrochloride Prolonged-Release Tablets IP 500mg | Pack Size: 10 Tablets | MRP ₹11.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Metformin Hydrochloride Prolonged-Release Tablets IP 500mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Metformin Hydrochloride'],
            strength: '500mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 11.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/glycomet-500-sr-tablet-326455',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 505,
        raw_page_text:
          'Glycomet-500 SR Tablet | USV Pvt Ltd | Salt Composition: Metformin (500mg) | Prescription Required | Strip of 20 tablets | MRP ₹47.60. Same-salt alternative: Okamet 500 Tablet SR by Cipla Ltd Strip of 20 tablets MRP ₹38.00.',
        pre_extracted_items: [
          {
            product_name: 'Glycomet-500 SR Tablet',
            maker: 'USV Pvt Ltd',
            composition: ['Metformin'],
            strength: '500mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 20,
            pack_label: 'Strip of 20 tablets',
            price_inr: 47.6,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Okamet 500 Tablet SR',
            maker: 'Cipla Ltd',
            composition: ['Metformin'],
            strength: '500mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 20,
            pack_label: 'Strip of 20 tablets',
            price_inr: 38.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/glycomet-500mg-sr-strip-of-20-tablets-10893',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 540,
        raw_page_text:
          'Glycomet 500mg SR Strip Of 20 Tablets | USV Pvt Ltd | Contains Metformin Hydrochloride 500mg | Rx Required | Strip of 20 tablets | MRP ₹47.60.',
        pre_extracted_items: [
          {
            product_name: 'Glycomet 500mg SR Strip Of 20 Tablets',
            maker: 'USV Pvt Ltd',
            composition: ['Metformin Hydrochloride'],
            strength: '500mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 20,
            pack_label: 'Strip of 20 tablets',
            price_inr: 47.6,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'glycomet gp 1',
    aliases: ['glycomet gp 1', 'glycomet-gp 1', 'glycomet gp1'],
    brand_name: 'Glycomet-GP 1',
    condition_tag: 'Diabetes Combination',
    popular_chip: false,
    composition: ['Metformin', 'Glimepiride'],
    composition_display: 'Metformin 500mg + Glimepiride 1mg',
    strength: '500mg + 1mg',
    dosage_form: 'Tablet SR',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule G/H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/glycomet-gp-1-tablet-pr-68792',
    identity_source_name: 'Tata 1mg / USV Pvt Ltd Listing',
    identity_source_url: 'https://www.1mg.com/drugs/glycomet-gp-1-tablet-pr-68792',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 335,
        raw_page_text:
          'PMBJP Drug Code 214 | Glimepiride 1mg and Metformin Hydrochloride Prolonged-Release 500mg Tablet IP | Pack Size: 15 Tablets | MRP ₹24.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name:
              'Glimepiride 1mg and Metformin Hydrochloride Prolonged-Release 500mg Tablet IP',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Metformin Hydrochloride', 'Glimepiride'],
            strength: '500mg + 1mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 24.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/glycomet-gp-1-tablet-pr-68792',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 525,
        raw_page_text:
          'Glycomet-GP 1 Tablet PR | USV Pvt Ltd | Salt Composition: Glimepiride (1mg) + Metformin (500mg) | Prescription Required | Strip of 15 tablets | MRP ₹136.00.',
        pre_extracted_items: [
          {
            product_name: 'Glycomet-GP 1 Tablet PR',
            maker: 'USV Pvt Ltd',
            composition: ['Metformin', 'Glimepiride'],
            strength: '500mg + 1mg',
            dosage_form: 'Tablet SR',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 136.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'montair lc',
    aliases: ['montair lc', 'montair-lc', 'montairlc', 'montelukast 10mg levocetirizine 5mg'],
    brand_name: 'Montair-LC',
    condition_tag: 'Allergy',
    popular_chip: true,
    composition: ['Montelukast', 'Levocetirizine'],
    composition_display: 'Montelukast 10mg + Levocetirizine 5mg',
    strength: '10mg + 5mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/montair-lc-tablet-124455',
    identity_source_name: 'Tata 1mg / Cipla Ltd Listing',
    identity_source_url: 'https://www.1mg.com/drugs/montair-lc-tablet-124455',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 325,
        raw_page_text:
          'PMBJP Drug Code 289 | Montelukast Sodium 10mg and Levocetirizine Dihydrochloride 5mg Tablet IP | Pack Size: 10 Tablets | MRP ₹22.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name:
              'Montelukast Sodium 10mg and Levocetirizine Dihydrochloride 5mg Tablet IP',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Montelukast Sodium', 'Levocetirizine Dihydrochloride'],
            strength: '10mg + 5mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 22.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/montair-lc-tablet-124455',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 495,
        raw_page_text:
          'Montair-LC Tablet | Cipla Ltd | Salt Composition: Levocetirizine (5mg) + Montelukast (10mg) | Prescription Required | Strip of 15 tablets | MRP ₹365.00. Same-salt alternative: Monticope Tablet by Mankind Pharma Ltd Strip of 10 tablets MRP ₹99.00.',
        pre_extracted_items: [
          {
            product_name: 'Montair-LC Tablet',
            maker: 'Cipla Ltd',
            composition: ['Montelukast', 'Levocetirizine'],
            strength: '10mg + 5mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 365.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Monticope Tablet',
            maker: 'Mankind Pharma Ltd',
            composition: ['Montelukast', 'Levocetirizine'],
            strength: '10mg + 5mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 99.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/montair-lc-strip-of-15-tablets-164551',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 565,
        raw_page_text:
          'Montair-LC Strip Of 15 Tablets | Cipla Ltd | Contains Montelukast 10mg + Levocetirizine 5mg | Rx Required | Strip of 15 tablets | MRP ₹365.00.',
        pre_extracted_items: [
          {
            product_name: 'Montair-LC Strip Of 15 Tablets',
            maker: 'Cipla Ltd',
            composition: ['Montelukast', 'Levocetirizine'],
            strength: '10mg + 5mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 365.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'azithral 500',
    aliases: ['azithral 500', 'azithral500', 'azithromycin 500mg'],
    brand_name: 'Azithral 500',
    condition_tag: 'Antibiotic',
    popular_chip: true,
    composition: ['Azithromycin'],
    composition_display: 'Azithromycin 500mg',
    strength: '500mg',
    dosage_form: 'Tablet',
    standard_pack_units: 5,
    standard_pack_label: 'Strip of 5 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/azithral-500-tablet-324022',
    identity_source_name: 'Tata 1mg / Alembic Pharmaceuticals Listing',
    identity_source_url: 'https://www.1mg.com/drugs/azithral-500-tablet-324022',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 310,
        raw_page_text:
          'PMBJP Drug Code 71 | Azithromycin Tablets IP 500mg | Pack Size: 3 Tablets | MRP ₹33.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Azithromycin Tablets IP 500mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Azithromycin'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 3,
            pack_label: 'Strip of 3 tablets',
            price_inr: 33.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/azithral-500-tablet-324022',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 515,
        raw_page_text:
          'Azithral 500 Tablet | Alembic Pharmaceuticals Ltd | Salt Composition: Azithromycin (500mg) | Prescription Required | Strip of 5 tablets | MRP ₹131.90. Same-salt alternative: Azee 500 Tablet by Cipla Ltd Strip of 5 tablets MRP ₹131.90.',
        pre_extracted_items: [
          {
            product_name: 'Azithral 500 Tablet',
            maker: 'Alembic Pharmaceuticals Ltd',
            composition: ['Azithromycin'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 5,
            pack_label: 'Strip of 5 tablets',
            price_inr: 131.9,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Azee 500 Tablet',
            maker: 'Cipla Ltd',
            composition: ['Azithromycin'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 5,
            pack_label: 'Strip of 5 tablets',
            price_inr: 131.9,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/azithral-500mg-strip-of-5-tablets-3189',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 550,
        raw_page_text:
          'Azithral 500mg Strip Of 5 Tablets | Alembic Pharmaceuticals Ltd | Contains Azithromycin 500mg | Rx Required | Strip of 5 tablets | MRP ₹131.90.',
        pre_extracted_items: [
          {
            product_name: 'Azithral 500mg Strip Of 5 Tablets',
            maker: 'Alembic Pharmaceuticals Ltd',
            composition: ['Azithromycin'],
            strength: '500mg',
            dosage_form: 'Tablet',
            pack_size_units: 5,
            pack_label: 'Strip of 5 tablets',
            price_inr: 131.9,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'atorva 10',
    aliases: ['atorva 10', 'atorva10', 'atorvastatin 10mg'],
    brand_name: 'Atorva 10',
    condition_tag: 'Cholesterol',
    popular_chip: true,
    composition: ['Atorvastatin'],
    composition_display: 'Atorvastatin 10mg',
    strength: '10mg',
    dosage_form: 'Tablet',
    standard_pack_units: 15,
    standard_pack_label: 'Strip of 15 tablets',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/atorva-10-tablet-63532',
    identity_source_name: 'Tata 1mg / Zydus Cadila Listing',
    identity_source_url: 'https://www.1mg.com/drugs/atorva-10-tablet-63532',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 295,
        raw_page_text:
          'PMBJP Drug Code 141 | Atorvastatin Tablets IP 10mg | Pack Size: 10 Tablets | MRP ₹9.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Atorvastatin Tablets IP 10mg',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Atorvastatin'],
            strength: '10mg',
            dosage_form: 'Tablet',
            pack_size_units: 10,
            pack_label: 'Strip of 10 tablets',
            price_inr: 9.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/atorva-10-tablet-63532',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 485,
        raw_page_text:
          'Atorva 10 Tablet | Zydus Cadila | Salt Composition: Atorvastatin (10mg) | Prescription Required | Strip of 15 tablets | MRP ₹111.75. Same-salt alternative: Lipvas 10 Tablet by Cipla Ltd Strip of 15 tablets MRP ₹98.50.',
        pre_extracted_items: [
          {
            product_name: 'Atorva 10 Tablet',
            maker: 'Zydus Cadila',
            composition: ['Atorvastatin'],
            strength: '10mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 111.75,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          },
          {
            product_name: 'Lipvas 10 Tablet',
            maker: 'Cipla Ltd',
            composition: ['Atorvastatin'],
            strength: '10mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 98.5,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null
          }
        ]
      },
      {
        source_id: 'pharmeasy',
        source_name: 'PharmEasy',
        source_type: 'retail',
        domain: 'pharmeasy.in',
        url: 'https://pharmeasy.in/online-medicine-order/atorva-10mg-strip-of-15-tablets-3102',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 545,
        raw_page_text:
          'Atorva 10mg Strip Of 15 Tablets | Zydus Cadila | Contains Atorvastatin 10mg | Rx Required | Strip of 15 tablets | MRP ₹111.75.',
        pre_extracted_items: [
          {
            product_name: 'Atorva 10mg Strip Of 15 Tablets',
            maker: 'Zydus Cadila',
            composition: ['Atorvastatin'],
            strength: '10mg',
            dosage_form: 'Tablet',
            pack_size_units: 15,
            pack_label: 'Strip of 15 tablets',
            price_inr: 111.75,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  },
  {
    normalised_key: 'insulin glargine',
    aliases: ['insulin glargine', 'lantus', 'lantus solostar', 'insulin'],
    brand_name: 'Lantus Solostar (Insulin Glargine)',
    condition_tag: 'Insulin Therapy',
    popular_chip: false,
    composition: ['Insulin Glargine'],
    composition_display: 'Insulin Glargine 100 IU/ml Solution for Injection',
    strength: '100IU/ml',
    dosage_form: 'Injection Pen',
    standard_pack_units: 1,
    standard_pack_label: '1 Prefilled Pen (3 ml)',
    rx_status: 'rx_required',
    rx_source_name: 'Tata 1mg Schedule H Listing',
    rx_source_url: 'https://www.1mg.com/drugs/lantus-solostar-solution-for-injection-137126',
    identity_source_name: 'Tata 1mg / Sanofi India Ltd Listing',
    identity_source_url: 'https://www.1mg.com/drugs/lantus-solostar-solution-for-injection-137126',
    identity_retrieved_at: '2025-02-20T09:00:00Z',
    source_fixtures: [
      {
        source_id: 'pmbjp',
        source_name: 'PMBJP Jan Aushadhi',
        source_type: 'government',
        domain: 'janaushadhi.gov.in',
        url: 'https://janaushadhi.gov.in/ProductList.aspx',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 340,
        raw_page_text:
          'PMBJP Drug Code 1054 | Insulin Glargine Injection IP 100 IU/ml (3 ml Cartridge/Pen) | Pack Size: 1 Unit | MRP ₹230.00 | WHO-GMP certified supplier for PMBI.',
        pre_extracted_items: [
          {
            product_name: 'Insulin Glargine Injection IP 100 IU/ml (3 ml Cartridge/Pen)',
            maker: 'PMBI (Jan Aushadhi Kendra)',
            composition: ['Insulin Glargine'],
            strength: '100IU/ml',
            dosage_form: 'Injection Pen',
            pack_size_units: 1,
            pack_label: '1 Unit (3 ml)',
            price_inr: 230.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: 'WHO-GMP Certified (PMBI)',
            regulatory_explanation:
              'Listed on the official PMBJP catalogue as sourced from WHO-GMP certified manufacturers.'
          }
        ]
      },
      {
        source_id: '1mg',
        source_name: 'Tata 1mg',
        source_type: 'retail',
        domain: '1mg.com',
        url: 'https://www.1mg.com/drugs/lantus-solostar-solution-for-injection-137126',
        retrieved_at: '2025-02-20T09:00:00Z',
        duration_ms: 520,
        raw_page_text:
          'Lantus Solostar Solution for Injection | Sanofi India Ltd | Salt Composition: Insulin Glargine (100IU/ml) | Prescription Required | 1 Prefilled Pen of 3 ml | MRP ₹734.00.',
        pre_extracted_items: [
          {
            product_name: 'Lantus Solostar Solution for Injection',
            maker: 'Sanofi India Ltd',
            composition: ['Insulin Glargine'],
            strength: '100IU/ml',
            dosage_form: 'Injection Pen',
            pack_size_units: 1,
            pack_label: '1 Prefilled Pen (3 ml)',
            price_inr: 734.0,
            price_type: 'MRP',
            rx_required: true,
            regulatory_label: null,
            regulatory_explanation: null,
            is_branded_reference: true
          }
        ]
      }
    ]
  }
];
