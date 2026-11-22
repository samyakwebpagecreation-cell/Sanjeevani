import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  Pill, 
  Search, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Download, 
  Printer, 
  Share2, 
  Mic, 
  MicOff, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  Info,
  DollarSign,
  HeartPulse,
  Flame,
  Droplets,
  Wind,
  Smile,
  Zap,
  Activity
} from 'lucide-react';
import { askRakshaSaathiBot } from '../../services/aiService';

export interface HomeRemedyItem {
  id: string;
  name: string;
  category: string;
  symptoms: string[];
  remedies: {
    title: string;
    preparation: string;
    dosage: string;
    mechanism: string;
    safetyCaution: string;
  }[];
  medicineSubstitute: {
    chemicalSalt: string;
    brandedExample: string;
    brandedPriceEst: string;
    janAushadhiName: string;
    janAushadhiPriceEst: string;
    savingsPercent: string;
    alternativeBrands: string[];
    whatToTellChemist: string;
    isPrescriptionRequired: boolean;
  };
  redFlags: string[];
}

export const CURATED_REMEDIES_LIBRARY: HomeRemedyItem[] = [
  {
    id: 'fever',
    name: 'Fever & High Body Temperature',
    category: 'General Infection / Viral',
    symptoms: ['Elevated temperature (>99°F)', 'Chills', 'Body aches', 'Fatigue', 'Sweating'],
    remedies: [
      {
        title: 'Lukewarm Water Sponge Bath',
        preparation: 'Dip a clean washcloth in room-temperature water (around 85°F–90°F / 29°C–32°C). Gently sponge the forehead, nape of neck, armpits, and groin.',
        dosage: 'Sponge for 15–20 minutes. Discontinue if patient starts shivering.',
        mechanism: 'Physical heat evaporation gently lowers core body temperature without triggering the hypothalamus shivering reflex.',
        safetyCaution: 'NEVER use ice water, raw ice, or rubbing alcohol—cold induces violent shivering and vasoconstriction, causing core temperature to spike dangerously.'
      },
      {
        title: 'Tulsi & Ginger Herbal Brew (Kadha)',
        preparation: 'Boil 8–10 crushed fresh holy basil (Tulsi) leaves and 1/2 inch crushed ginger in 2 cups of water until reduced to 1 cup. Strain and add 1/2 teaspoon pure honey.',
        dosage: 'Sip warm 2 times daily.',
        mechanism: 'Eugenol in Tulsi and gingerol in ginger provide natural analgesic, antipyretic, and mild antimicrobial properties.',
        safetyCaution: 'Do not give honey to infants under 12 months due to risk of infant botulism.'
      },
      {
        title: 'Electrolyte Hydration Protocol',
        preparation: 'Dissolve 1 standard packet of WHO-approved Oral Rehydration Salts (ORS) in 1 liter of clean drinking water, or drink fresh tender coconut water.',
        dosage: 'Drink 200–300 ml every 2–3 hours in small, steady sips.',
        mechanism: 'Replaces critical sodium, potassium, and chloride ions lost through diaphoresis (sweating) and fever-induced tachypnea.',
        safetyCaution: 'Do not boil prepared ORS solution. Consume within 24 hours of mixing.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Paracetamol / Acetaminophen (650mg)',
      brandedExample: 'Dolo 650 / Calpol 650',
      brandedPriceEst: '₹32 - ₹35 (Strip of 15)',
      janAushadhiName: 'PMBJP Paracetamol Tablets IP 650mg',
      janAushadhiPriceEst: '₹11 (Strip of 15)',
      savingsPercent: '68% Savings',
      alternativeBrands: ['Pacimol 650 (Ipca)', 'P-650 (Apex)', 'Dolopar (Micro Labs)'],
      whatToTellChemist: 'Please give generic Paracetamol 650mg tablets or PMBJP Jan Aushadhi generic equivalent.',
      isPrescriptionRequired: false
    },
    redFlags: [
      'Temperature exceeds 103°F (39.4°C) or fails to drop after 48 hours',
      'Stiff neck, sudden confusion, extreme lethargy, or seizure convulsions',
      'Petechial red rash or difficulty breathing',
      'Persistent vomiting unable to keep oral liquids down'
    ]
  },
  {
    id: 'acidity',
    name: 'Acid Reflux, Heartburn & GERD',
    category: 'Gastrointestinal',
    symptoms: ['Burning chest pain after eating', 'Sour belching', 'Regurgitation', 'Stomach bloating', 'Nausea'],
    remedies: [
      {
        title: 'Chilled Skim Milk Sip',
        preparation: 'Take half a glass (100–120 ml) of cold, unflavored skim or toned cow milk without sugar.',
        dosage: 'Sip slowly when experiencing acute burning sensation.',
        mechanism: 'High calcium and alkaline proteins temporarily buffer hydrochloric acid in the gastric lumen and coat esophageal mucosa.',
        safetyCaution: 'Avoid full-fat buffalo milk; fats stimulate gastric lipase and gastrin secretion, causing rebound acidity later.'
      },
      {
        title: 'Fennel (Saunf) & Cumin (Jeera) Infusion',
        preparation: 'Boil 1 teaspoon fennel seeds and 1/2 teaspoon cumin seeds in 250 ml water for 4 minutes. Strain and let it cool to room temperature.',
        dosage: 'Drink 15 minutes after meals.',
        mechanism: 'Anethole in fennel relaxes smooth muscles of the digestive tract, preventing gastric spasms and retrograde acid reflux.',
        safetyCaution: 'Do not add sugar or jaggery during acute acid reflux flare-ups.'
      },
      {
        title: 'Bed Elevation Therapy (Biomechanics)',
        preparation: 'Elevate the head of your bed by 6 inches (15 cm) using wooden bed risers under the front bedposts, or sleep on a firm wedge pillow.',
        dosage: 'Maintain position every night during sleep.',
        mechanism: 'Uses gravity to keep gastric contents pooled in the stomach antrum, preventing acid from regurgitating past the lower esophageal sphincter (LES).',
        safetyCaution: 'Stacking ordinary soft pillows only bends the neck and increases intra-abdominal pressure—elevate the entire torso.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
      brandedExample: 'Pantocid DSR / Pan D / Pantodac DSR',
      brandedPriceEst: '₹185 - ₹220 (Strip of 15)',
      janAushadhiName: 'PMBJP Panto-DSR Capsules',
      janAushadhiPriceEst: '₹32 (Strip of 10)',
      savingsPercent: '82% Savings',
      alternativeBrands: ['Dompan SR (Medley)', 'Penta-D (Torrent)', 'Pantocar DSR (Micro Labs)'],
      whatToTellChemist: 'Please provide generic Pantoprazole 40mg with Domperidone 30mg SR capsules.',
      isPrescriptionRequired: true
    },
    redFlags: [
      'Crushing chest pain radiating to left arm, neck, or jaw (Rule out Myocardial Infarction / Heart Attack)',
      'Difficulty swallowing (dysphagia) or feeling of food stuck in throat',
      'Vomiting blood or passing tarry black stools (melena)',
      'Unexplained weight loss accompanied by chronic acid reflux'
    ]
  },
  {
    id: 'cough',
    name: 'Severe Cough, Sore Throat & Chest Congestion',
    category: 'Respiratory',
    symptoms: ['Dry hacking cough', 'Tickling throat irritation', 'Phlegm congestion', 'Hoarse voice', 'Pain on swallowing'],
    remedies: [
      {
        title: 'Warm Honey & Crushed Ginger Extract',
        preparation: 'Crush 1 inch fresh peeled ginger to extract 1 teaspoon fresh juice. Warm slightly and mix with 1 tablespoon pure raw honey and a pinch of black pepper.',
        dosage: 'Consume slowly twice daily; do not drink cold water for 20 minutes after.',
        mechanism: 'Gingerol suppresses airway hyper-responsiveness, while honey forms a protective demulcent coating over inflamed pharyngeal nerves.',
        safetyCaution: 'Strictly prohibited for children under 1 year of age (botulism hazard).'
      },
      {
        title: 'Warm Hypertonic Saline Gargles',
        preparation: 'Dissolve 1/2 teaspoon non-iodized table salt in 250 ml of warm (not scalding) boiled water.',
        dosage: 'Gargle deeply at the back of the throat for 30–45 seconds, 3 to 4 times a day.',
        mechanism: 'Osmotic pressure draws edema fluid out of swollen throat tissues, decreases viral load, and thins thick mucus plugs.',
        safetyCaution: 'Always spit out the gargle solution; do not swallow hypertonic salt water.'
      },
      {
        title: 'Plain Steam Inhalation',
        preparation: 'Fill a wide bowl with boiling water. Drape a clean towel over head and bowl, keeping face at least 10–12 inches above surface.',
        dosage: 'Inhale steam through nose and mouth for 5–7 minutes twice daily.',
        mechanism: 'Moist heat thins dried secretions in bronchial tubes and humidifies irritated vocal cords.',
        safetyCaution: 'Do not add synthetic camphor, eucalyptus, or volatile balms for children—can trigger reflex laryngospasm.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Levocetirizine (5mg) + Montelukast (10mg) / Dextromethorphan',
      brandedExample: 'Montair-LC / Montek-LC / Ascoril D',
      brandedPriceEst: '₹170 - ₹215 (Strip of 10)',
      janAushadhiName: 'PMBJP Montelukast + Levocetirizine 10/5mg Tablets',
      janAushadhiPriceEst: '₹34 (Strip of 10)',
      savingsPercent: '80% Savings',
      alternativeBrands: ['Levomac-M (Macleods)', 'Telekast-L (Lupin)', 'Romilast-L (Ranbaxy)'],
      whatToTellChemist: 'Please provide generic Levocetirizine 5mg with Montelukast 10mg tablets.',
      isPrescriptionRequired: true
    },
    redFlags: [
      'Coughing up bright red blood or rust-colored sputum (hemoptysis)',
      'Audible stridor, wheezing, or intercostal chest retractions when breathing',
      'Inability to speak full sentences without gasping for breath',
      'Persistent cough lasting longer than 3 weeks (investigate tuberculosis or asthma)'
    ]
  },
  {
    id: 'burn',
    name: 'Superficial Thermal Burns & Scalds',
    category: 'Trauma & Wound Care',
    symptoms: ['Red, painful skin', 'Minor swelling', 'Heat radiating from skin', 'Skin hypersensitivity', 'Small localized blisters'],
    remedies: [
      {
        title: 'Cool Running Tap Water Immersion (First 20 Mins)',
        preparation: 'Immediately place burned area under gently running, cool tap water (15°C–25°C). Continue continuously for a full 15 to 20 minutes.',
        dosage: 'Administer immediately at the scene of thermal injury.',
        mechanism: 'Dissipates residual thermal energy trapped in subcutaneous tissue, halts deeper cellular coagulative necrosis, and reduces dermal edema.',
        safetyCaution: 'NEVER apply ice cubes, ice packs, toothpaste, butter, raw egg, or flour. Ice causes microvascular frostbite injury; kitchen pastes introduce severe bacterial infection.'
      },
      {
        title: 'Pure Aloe Vera Mucilage Dressing',
        preparation: 'Extract fresh clear gel from an aloe vera leaf (rinse away yellow aloin sap). Apply gently over intact, cooled first-degree burn.',
        dosage: 'Apply a thin layer 2 times daily.',
        mechanism: 'Acemannan polysaccharide stimulates fibroblast proliferation and exhibits mild bactericidal action.',
        safetyCaution: 'Only apply to superficial 1st-degree burns with intact skin. Do NOT apply to broken, weeping, or charred flesh.'
      },
      {
        title: 'Non-Adherent Sterile Paraffin Gauze Shield',
        preparation: 'Cover the burn loosely with clean sterile plastic food wrap (cling wrap) or non-stick sterile gauze.',
        dosage: 'Keep loosely covered to exclude air and airborne dust.',
        mechanism: 'Air contact with exposed peripheral sensory nerve endings causes agonizing pain; a smooth plastic barrier eliminates air currents.',
        safetyCaution: 'Never wrap circumferentially around limbs or fingers tightly; tissue swelling may compromise distal circulation.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Silver Sulfadiazine (1% w/w) / Framycetin Sulfate (1%)',
      brandedExample: 'Burnol / Soframycin / SilvrSTAT',
      brandedPriceEst: '₹75 - ₹110 (Tube of 30g)',
      janAushadhiName: 'PMBJP Silver Sulphadiazine Cream 1% (30g)',
      janAushadhiPriceEst: '₹18 (Tube of 30g)',
      savingsPercent: '76% Savings',
      alternativeBrands: ['Silverex Ionic (Sun Pharma)', 'Silvazine', 'Healex Plus'],
      whatToTellChemist: 'Please give generic Silver Sulfadiazine 1% antiseptic cream or PMBJP equivalent.',
      isPrescriptionRequired: false
    },
    redFlags: [
      'Burn covers an area larger than the patient’s open palm (approx >1% Total Body Surface Area)',
      'Any burn involving face, eyes, ears, hands, feet, joints, or genitalia',
      'White, waxy, leathery, charred black, or completely painless skin (3rd-degree full thickness burn)',
      'Electrical burn or chemical caustic exposure—requires immediate 112 emergency care'
    ]
  },
  {
    id: 'diarrhea',
    name: 'Acute Diarrhea, Loose Motions & Food Poisoning',
    category: 'Gastrointestinal & Dehydration',
    symptoms: ['Frequent watery stools', 'Abdominal cramping', 'Dry mouth', 'Extreme thirst', 'Dizziness on standing'],
    remedies: [
      {
        title: 'Standard WHO Oral Rehydration Solution (ORS)',
        preparation: 'Empty 1 complete packet of WHO ORS into exactly 1 liter (1000 ml) of boiled and cooled drinking water. Stir thoroughly until dissolved.',
        dosage: 'Drink 1 glass (200 ml) after each loose bowel movement. Sip slowly.',
        mechanism: 'Glucose-sodium co-transport in intestinal villi forces water absorption into the bloodstream even when bowel secretion is pathologically accelerated.',
        safetyCaution: 'Do not add sugar, squash, fruit juice, or milk into the ORS. Accurate dilution ratio (1 sachet : 1L) is vital.'
      },
      {
        title: 'Boiled Rice Water (Kanji / Maand) with Salt',
        preparation: 'Boil 1/2 cup white rice in 4 cups water until soft. Strain the thick starchy liquid, add 1/4 teaspoon salt, and let cool.',
        dosage: 'Drink 1 cup 3 times daily.',
        mechanism: 'Amylase-resistant starches reduce stool frequency and provide slow-burning carbohydrate energy without stressing gut mucosa.',
        safetyCaution: 'Must be freshly prepared daily; discard after 6 hours in hot weather.'
      },
      {
        title: 'Fresh Curd (Dahi) with Roasted Cumin',
        preparation: 'Take 1 small bowl of fresh, unsweetened plain curd. Sprinkle with 1/2 teaspoon roasted powdered cumin seeds (bhuna jeera).',
        dosage: 'Consume with plain boiled rice twice daily.',
        mechanism: 'Lactobacillus acidophilus restores normal gut microbiota displaced by enteric pathogens.',
        safetyCaution: 'Avoid sour, fermented, or refrigerated old curd.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Oral Rehydration Salts (WHO Formula) + Zinc Sulfate (20mg)',
      brandedExample: 'Electral Sachet / ORS-L / Zinconia',
      brandedPriceEst: '₹22 - ₹30 per sachet',
      janAushadhiName: 'PMBJP Oral Rehydration Salts IP (21.8g Sachet)',
      janAushadhiPriceEst: '₹6.50 per sachet',
      savingsPercent: '72% Savings',
      alternativeBrands: ['Prolyte ORS (Cipla)', 'Walyte (Micro Labs)', 'Reliance ORS'],
      whatToTellChemist: 'Please provide WHO formula generic ORS sachets and Zinc 20mg dispersible tablets.',
      isPrescriptionRequired: false
    },
    redFlags: [
      'Stools containing gross red blood or black coffee-ground material',
      'High persistent fever accompanied by severe abdominal rigidity',
      'Signs of severe hypovolemic shock: sunken eyes, dry tongue, no urine for 6 hours, rapid weak pulse',
      'Vomiting so severe that patient cannot retain any oral liquids'
    ]
  },
  {
    id: 'sprain',
    name: 'Sprained Ankle, Muscle Strain & Joint Pain',
    category: 'Orthopedic & Musculoskeletal',
    symptoms: ['Rapid localized swelling', 'Severe pain on weight bearing', 'Bruising', 'Reduced range of motion'],
    remedies: [
      {
        title: 'Clinical R.I.C.E Protocol (Rest, Ice, Compression, Elevation)',
        preparation: 'Rest injured joint. Apply a cloth-wrapped ice pack for 15 mins. Apply a snug crepe bandage. Elevate limb above heart level on pillows.',
        dosage: 'Repeat ice pack every 2–3 hours during the initial 48 hours.',
        mechanism: 'Cryotherapy induces local vasoconstriction, blunting inflammatory cytokines and preventing extravasation of hematoma blood.',
        safetyCaution: 'Never apply ice directly to bare skin (causes cold burn / neuropraxia). Do not apply hot fomentation in the first 48 hours.'
      },
      {
        title: 'Warm Turmeric & Ginger Topical Poultice (After 48h)',
        preparation: 'Mix 1 teaspoon turmeric powder and 1/2 teaspoon ginger powder with warm mustard oil to form a thick paste.',
        dosage: 'Apply over bruised joint after 48 hours; cover with clean cloth.',
        mechanism: 'Curcumin modulates NF-kB and COX-2 inflammatory pathways, aiding resorption of resolving hematoma.',
        safetyCaution: 'Only use after initial acute swelling has peaked (>48 hours post-injury).'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Ibuprofen (400mg) + Paracetamol (325mg) / Diclofenac Gel',
      brandedExample: 'Combiflam / Flexon / Volini Gel',
      brandedPriceEst: '₹45 - ₹55 (Strip of 20) / ₹120 (Gel)',
      janAushadhiName: 'PMBJP Ibuprofen + Paracetamol Tablets IP (400/325mg)',
      janAushadhiPriceEst: '₹14 (Strip of 20)',
      savingsPercent: '70% Savings',
      alternativeBrands: ['Ibugesic Plus (Cipla)', 'Brufen Plus (Abbott)', 'Diclogesic'],
      whatToTellChemist: 'Please provide generic Ibuprofen with Paracetamol or PMBJP pain relief gel.',
      isPrescriptionRequired: false
    },
    redFlags: [
      'Audible loud "snap" or "pop" heard at moment of injury',
      'Inability to take 4 steps immediately and in the clinic (Ottawa Ankle Rules positive for fracture)',
      'Gross bone deformity, visible protrusion, or numbness/coldness in toes/foot',
      'Direct bone tenderness on the posterior edge or tip of malleolus'
    ]
  },
  {
    id: 'allergy',
    name: 'Skin Allergies, Hives & Insect Bites',
    category: 'Dermatology & Immunology',
    symptoms: ['Raised itchy red welts (urticaria)', 'Stinging sensation', 'Localized redness', 'Irritation'],
    remedies: [
      {
        title: 'Cold Compress & Oatmeal Rinse',
        preparation: 'Grind 1 cup whole oats into a fine colloidal powder. Mix into cool bathwater or apply a cloth soaked in cool oat water to itchy skin.',
        dosage: 'Soak for 15 minutes; gently pat dry without rubbing.',
        mechanism: 'Avenanthramides in colloidal oatmeal exert potent anti-inflammatory and anti-pruritic properties on histamine-sensitized mast cells.',
        safetyCaution: 'Do not use hot water; heat dilates cutaneous capillaries and triggers intense histamine release.'
      },
      {
        title: 'Pure Virgin Coconut Oil with Camphor',
        preparation: 'Warm 2 tablespoons virgin coconut oil and dissolve a tiny pinch (pea-sized) of edible camphor (Kapur).',
        dosage: 'Gently apply onto non-broken, itchy areas twice daily.',
        mechanism: 'Lauric acid provides antimicrobial protection while camphor desensitizes peripheral sensory cutaneous C-fibers.',
        safetyCaution: 'Do not apply near eyes, mucous membranes, or onto open bleeding wounds.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Cetirizine Hydrochloride (10mg) / Levocetirizine (5mg)',
      brandedExample: 'Cetzine / Zyrtec / Okacet',
      brandedPriceEst: '₹40 - ₹50 (Strip of 10)',
      janAushadhiName: 'PMBJP Cetirizine Tablets IP 10mg',
      janAushadhiPriceEst: '₹8.50 (Strip of 10)',
      savingsPercent: '81% Savings',
      alternativeBrands: ['Alerid (Cipla)', 'Ceticad (Cadila)', 'Incid-L'],
      whatToTellChemist: 'Please provide generic Cetirizine 10mg tablets or PMBJP generic antihistamine.',
      isPrescriptionRequired: false
    },
    redFlags: [
      'Swelling of lips, tongue, uvula, or throat (Angioedema)',
      'Difficulty breathing, audible stridor, or sudden hoarseness of voice',
      'Feeling dizzy, lightheaded, or sudden drop in blood pressure (Anaphylaxis shock)',
      'Rapidly spreading full-body rash accompanied by high fever'
    ]
  },
  {
    id: 'migraine',
    name: 'Migraine & Tension Headache',
    category: 'Neurology',
    symptoms: ['Throbbing unilateral headache', 'Sensitivity to light (photophobia)', 'Nausea', 'Neck stiffness', 'Visual aura'],
    remedies: [
      {
        title: 'Dark Room Sensory Isolation & Cold Forehead Pack',
        preparation: 'Lie flat in a completely darkened, quiet room. Place an ice pack wrapped in a hand towel across the forehead and temples.',
        dosage: 'Rest for 30–45 minutes with slow diaphragmatic breathing.',
        mechanism: 'Eliminates sensory trigeminal nerve stimulation while local cold induces intracranial vasoconstriction of throbbing meningeal arteries.',
        safetyCaution: 'Wrap ice in cloth to prevent cold thermal skin injury.'
      },
      {
        title: 'Dilute Peppermint Oil Temple Massage',
        preparation: 'Mix 2 drops pure peppermint essential oil into 1 teaspoon carrier oil (coconut or almond oil). Gently massage onto temples and back of neck.',
        dosage: 'Apply once at headache onset.',
        mechanism: 'Menthol stimulates cold-sensitive TRPM8 receptors and promotes local microvascular flow, relaxing pericranial muscles.',
        safetyCaution: 'Keep away from eyes. Do not apply undiluted essential oil directly onto skin.'
      }
    ],
    medicineSubstitute: {
      chemicalSalt: 'Naproxen (250/500mg) or Paracetamol (650mg) + Caffeine',
      brandedExample: 'Naprosyn 500 / Saridon / Migranil',
      brandedPriceEst: '₹60 - ₹85 (Strip of 10)',
      janAushadhiName: 'PMBJP Naproxen Tablets IP 250mg',
      janAushadhiPriceEst: '₹14 (Strip of 10)',
      savingsPercent: '78% Savings',
      alternativeBrands: ['Xenobid (Ipca)', 'Artagen (Micro Labs)', 'Pacimol Active'],
      whatToTellChemist: 'Please give generic Naproxen or Paracetamol 650mg tablets.',
      isPrescriptionRequired: true
    },
    redFlags: [
      'Sudden "Thunderclap Headache" reaching maximum intensity within 60 seconds (Rule out Subarachnoid Hemorrhage)',
      'Headache accompanied by fever, neck stiffness, and confusion (Rule out Meningitis)',
      'Headache with focal neurological deficits: one-sided facial drooping, slurred speech, or arm weakness',
      'New headache starting in patients over 50 years of age'
    ]
  }
];

interface HomeRemediesViewProps {
  onBackToHome?: () => void;
  onSelectDestination?: (dest: any) => void;
  onTriggerEscalation?: (reason?: string) => void;
}

export const HomeRemediesView: React.FC<HomeRemediesViewProps> = ({
  onBackToHome,
  onSelectDestination,
  onTriggerEscalation
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<HomeRemedyItem | null>(CURATED_REMEDIES_LIBRARY[0]);
  const [activeTab, setActiveTab] = useState<'remedies' | 'substitutes' | 'all'>('all');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [customAIResult, setCustomAIResult] = useState<any | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Filter curated library based on search query
  const filteredLibrary = CURATED_REMEDIES_LIBRARY.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.symptoms.some((s) => s.toLowerCase().includes(q)) ||
      item.medicineSubstitute.brandedExample.toLowerCase().includes(q) ||
      item.medicineSubstitute.chemicalSalt.toLowerCase().includes(q)
    );
  });

  // Handle custom query via Gemma 4-31B IT
  const handleRunCustomSearch = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    // Check if we have an exact or close match in curated library
    const match = CURATED_REMEDIES_LIBRARY.find((item) => 
      item.name.toLowerCase().includes(q.toLowerCase()) ||
      item.id.toLowerCase() === q.toLowerCase() ||
      item.medicineSubstitute.brandedExample.toLowerCase().includes(q.toLowerCase())
    );

    if (match) {
      setSelectedItem(match);
      setCustomAIResult(null);
      return;
    }

    // Otherwise, synthesize dynamic answer with Gemma 4-31B IT
    setIsLoadingAI(true);
    try {
      const res = await askRakshaSaathiBot(`${q} home remedies and generic medicine substitute`);
      setCustomAIResult(res);
      setSelectedItem(null);
    } catch (err) {
      console.error('Custom remedy AI query failed:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Voice Speech-To-Text
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your health concern.');
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningMic(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSearchQuery(text);
        setIsListeningMic(false);
        handleRunCustomSearch(text);
      };
      recognition.onerror = () => setIsListeningMic(false);
      recognition.onend = () => setIsListeningMic(false);

      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  // Text-To-Speech
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    let textToSpeak = '';
    if (selectedItem) {
      textToSpeak = `${selectedItem.name}. Top Home Remedy: ${selectedItem.remedies[0]?.title}. ${selectedItem.remedies[0]?.preparation}. ` +
        `Generic medicine substitute is ${selectedItem.medicineSubstitute.chemicalSalt}, available as ${selectedItem.medicineSubstitute.janAushadhiName} with ${selectedItem.medicineSubstitute.savingsPercent}.`;
    } else if (customAIResult) {
      textToSpeak = customAIResult.headline + '. ' + customAIResult.fullMarkdown.replace(/[*#_`]/g, '');
    }

    const clean = textToSpeak.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy structured text
  const handleCopy = () => {
    let text = '';
    if (selectedItem) {
      text = `📋 [RakshaSaathi - Home Remedies & Medicine Substitutes]\n\n` +
        `Condition: ${selectedItem.name} (${selectedItem.category})\n\n` +
        `--- 🌿 VERIFIED HOME REMEDIES ---\n` +
        selectedItem.remedies.map((r, i) => `${i + 1}. ${r.title}\nPreparation: ${r.preparation}\nDosage: ${r.dosage}\nCaution: ${r.safetyCaution}\n`).join('\n') +
        `\n--- 💊 JAN AUSHADHI MEDICINE SUBSTITUTES ---\n` +
        `Chemical Salt: ${selectedItem.medicineSubstitute.chemicalSalt}\n` +
        `Branded Standard: ${selectedItem.medicineSubstitute.brandedExample} (${selectedItem.medicineSubstitute.brandedPriceEst})\n` +
        `Jan Aushadhi Generic: ${selectedItem.medicineSubstitute.janAushadhiName} (${selectedItem.medicineSubstitute.janAushadhiPriceEst})\n` +
        `Savings: ${selectedItem.medicineSubstitute.savingsPercent}\n` +
        `Chemist Ask: "${selectedItem.medicineSubstitute.whatToTellChemist}"\n\n` +
        `⚠️ RED FLAGS / SEE A DOCTOR IF:\n` +
        selectedItem.redFlags.map(rf => `- ${rf}`).join('\n');
    } else if (customAIResult) {
      text = customAIResult.fullMarkdown;
    }

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download Markdown Report
  const handleDownloadMarkdown = () => {
    let md = '';
    const title = selectedItem ? selectedItem.name : (customAIResult?.headline || 'Home Remedies & Medical Substitute');
    
    if (selectedItem) {
      md = `# 🌿 ${selectedItem.name} - Home Remedies & Medical Substitutes Guide\n\n` +
        `**Category:** ${selectedItem.category}  \n` +
        `**Source:** RakshaSaathi Clinical Health Intelligence  \n` +
        `**Date:** ${new Date().toLocaleDateString()}  \n\n` +
        `---\n\n` +
        `## 🌿 Evidence-Based Home Remedies\n\n` +
        selectedItem.remedies.map((r, i) => `### ${i + 1}. ${r.title}\n- **Preparation:** ${r.preparation}\n- **Dosage:** ${r.dosage}\n- **Mechanism:** ${r.mechanism}\n- **Safety Caution:** ${r.safetyCaution}\n`).join('\n') +
        `\n---\n\n` +
        `## 💊 Generic Jan Aushadhi Medicine Substitutes\n\n` +
        `- **Active Chemical Salt:** \`${selectedItem.medicineSubstitute.chemicalSalt}\`\n` +
        `- **Private Branded Example:** ${selectedItem.medicineSubstitute.brandedExample} (${selectedItem.medicineSubstitute.brandedPriceEst})\n` +
        `- **PMBJP Jan Aushadhi Alternative:** **${selectedItem.medicineSubstitute.janAushadhiName}** (${selectedItem.medicineSubstitute.janAushadhiPriceEst})\n` +
        `- **Cost Savings:** **${selectedItem.medicineSubstitute.savingsPercent}**\n` +
        `- **What to tell your chemist:** *"${selectedItem.medicineSubstitute.whatToTellChemist}"*\n` +
        `- **Alternative Brands:** ${selectedItem.medicineSubstitute.alternativeBrands.join(', ')}\n\n` +
        `---\n\n` +
        `## ⚠️ Clinical Red Flags (When to Seek Hospital Care)\n\n` +
        selectedItem.redFlags.map(rf => `- ${rf}`).join('\n') +
        `\n\n---\n*First-aid & supportive health education. Always consult a certified physician for severe symptoms.*`;
    } else if (customAIResult) {
      md = customAIResult.fullMarkdown;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RakshaSaathi_${title.replace(/[^a-zA-Z0-9]/g, '_')}_Guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200 text-slate-800 dark:text-slate-100">
      
      {/* ======================================================== */}
      {/* 1. HERO HEADER                                           */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-surface border border-border p-5 sm:p-8 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" />
                <span>New Feature</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Pill className="w-3 h-3" />
                <span>Jan Aushadhi Generic Radar</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-base text-ink-muted border border-border">
                Gemma 4-31B AI Engine
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Home Remedies & Medical Alternate Engine
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
              Enter <strong>any medical situation, health symptom, or branded medicine</strong>. RakshaSaathi instantly provides 
              verified, evidence-based home remedies alongside identical-salt <strong>PMBJP Jan Aushadhi generic substitutes</strong> saving up to 85%.
            </p>
          </div>

          {/* Quick SOS Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="tel:112"
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>112 Emergency SOS</span>
            </a>
          </div>
        </div>

        {/* Search Engine Bar */}
        <div className="pt-2 space-y-3">
          <div className="relative flex items-center w-full rounded-2xl bg-base border-2 border-primary/30 focus-within:border-primary shadow-sm px-3 sm:px-4 py-2 transition-all">
            <Search className="w-5 h-5 text-primary shrink-0 mr-2.5" />
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRunCustomSearch();
                }
              }}
              placeholder="Type any medical condition or medicine (e.g. Dolo 650, severe acidity, migraine, diarrhea, minor burn)..."
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-ink placeholder:text-ink-muted font-medium py-1"
            />

            <div className="flex items-center space-x-2 shrink-0">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedItem(CURATED_REMEDIES_LIBRARY[0]);
                    setCustomAIResult(null);
                  }}
                  className="text-xs text-ink-muted hover:text-ink font-bold px-2 py-1 rounded-lg"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListeningMic 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-surface hover:bg-border text-ink-muted hover:text-ink border border-border'
                }`}
                title="Voice Search (Hindi / English)"
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleRunCustomSearch()}
                disabled={isLoadingAI || !searchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black shadow-xs transition-all disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
              >
                {isLoadingAI ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Search</span>
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick-Select Symptom Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] py-1">
            <span className="font-bold text-ink-muted shrink-0 flex items-center gap-1 mr-1">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Popular Situations:</span>
            </span>
            {CURATED_REMEDIES_LIBRARY.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setCustomAIResult(null);
                  setSearchQuery(item.name);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedItem?.id === item.id && !customAIResult
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-base hover:bg-surface text-ink-muted hover:text-ink border-border'
                }`}
              >
                {item.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. DYNAMIC CUSTOM AI QUERY RESULT (If search is custom)   */}
      {/* ======================================================== */}
      {customAIResult && (
        <div className="rounded-3xl bg-surface border-2 border-emerald-500/30 p-5 sm:p-7 shadow-md space-y-5 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Gemma 4-31B Clinical Intelligence Synthesis</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-ink">{customAIResult.headline}</h2>
              <p className="text-xs text-ink-muted">Query: "{customAIResult.query}" • Responded in {customAIResult.latencyMs}ms</p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl text-xs font-bold border border-border transition-colors cursor-pointer ${
                  isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-base hover:bg-border text-ink'
                }`}
                title="Listen Audio"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-base hover:bg-border text-ink border border-border transition-colors cursor-pointer"
                title="Copy Text"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="p-2 rounded-xl bg-base hover:bg-border text-ink border border-border transition-colors cursor-pointer"
                title="Download .md"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-base/60 border border-border/70 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap font-medium">
            {customAIResult.fullMarkdown}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CURATED SITUATION DETAIL VIEW (Twin Pillars)          */}
      {/* ======================================================== */}
      {selectedItem && !customAIResult && (
        <div className="space-y-6">
          
          {/* Action & View Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Displaying:</span>
              <span className="text-sm font-black text-ink">{selectedItem.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {selectedItem.category}
              </span>
            </div>

            {/* Subtabs and Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl bg-base p-1 border border-border">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'all' ? 'bg-primary text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Both Pillars
                </button>
                <button
                  onClick={() => setActiveTab('remedies')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'remedies' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  🌿 Home Remedies
                </button>
                <button
                  onClick={() => setActiveTab('substitutes')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'substitutes' ? 'bg-blue-600 text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  💊 Medicine Substitutes
                </button>
              </div>

              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl text-xs font-bold border border-border transition-colors cursor-pointer ${
                  isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-base hover:bg-border text-ink'
                }`}
                title={isSpeaking ? 'Stop Audio' : 'Listen with Audio (TTS)'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-base hover:bg-border text-ink border border-border transition-colors cursor-pointer"
                title="Copy care instructions"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="p-2 rounded-xl bg-base hover:bg-border text-ink border border-border transition-colors cursor-pointer"
                title="Download .md report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Twin Pillars Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* PILLAR 1: VERIFIED HOME REMEDIES (Left / 7 Cols) */}
            {(activeTab === 'all' || activeTab === 'remedies') && (
              <div className={`${activeTab === 'all' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-ink">
                      Verified Evidence-Based Home Remedies
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedItem.remedies.length} Verified Protocols
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedItem.remedies.map((rem, idx) => (
                    <div 
                      key={idx}
                      className="p-4 sm:p-5 rounded-3xl bg-surface border border-emerald-500/20 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            {rem.title}
                          </h3>
                        </div>
                      </div>

                      {/* Preparation */}
                      <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          🥣 Preparation & Recipe:
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {rem.preparation}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Dosage */}
                        <div className="p-2.5 rounded-xl bg-base border border-border space-y-0.5">
                          <span className="text-[10px] font-bold text-ink-muted uppercase">Dosage & Frequency</span>
                          <p className="font-bold text-ink">{rem.dosage}</p>
                        </div>

                        {/* Mechanism */}
                        <div className="p-2.5 rounded-xl bg-base border border-border space-y-0.5">
                          <span className="text-[10px] font-bold text-ink-muted uppercase">Scientific Mechanism</span>
                          <p className="font-medium text-ink-muted text-[11px]">{rem.mechanism}</p>
                        </div>
                      </div>

                      {/* Caution */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-2 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Safety Caution:</strong> {rem.safetyCaution}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PILLAR 2: JAN AUSHADHI MEDICINE SUBSTITUTES (Right / 5 Cols) */}
            {(activeTab === 'all' || activeTab === 'substitutes') && (
              <div className={`${activeTab === 'all' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-ink">
                      Alternate Generic Medicines
                    </h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                    {selectedItem.medicineSubstitute.savingsPercent}
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-surface border border-blue-500/20 shadow-xs space-y-4">
                  
                  {/* Salt Header */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Active Chemical Salt (API)
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedItem.medicineSubstitute.chemicalSalt}
                    </h3>
                  </div>

                  {/* Price Comparison Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-emerald-50/80 dark:from-blue-950/30 dark:to-emerald-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">Private Branded:</span>
                      <span className="font-bold text-slate-500 line-through">
                        {selectedItem.medicineSubstitute.brandedPriceEst}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-800 dark:text-emerald-300 font-black">
                        PMBJP Jan Aushadhi:
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {selectedItem.medicineSubstitute.janAushadhiPriceEst}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-blue-200/50 flex items-center justify-between text-xs font-black text-emerald-700 dark:text-emerald-300">
                      <span>Instant Cost Savings:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px]">
                        {selectedItem.medicineSubstitute.savingsPercent}
                      </span>
                    </div>
                  </div>

                  {/* PMBJP Name */}
                  <div className="p-3 rounded-2xl bg-base border border-border space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-ink-muted uppercase">PMBJP Generic Name</span>
                    <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      {selectedItem.medicineSubstitute.janAushadhiName}
                    </p>
                  </div>

                  {/* What to tell chemist */}
                  <div className="p-3 rounded-2xl bg-base border border-border space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase text-ink-muted">What to Tell Pharmacist / Chemist:</span>
                    <p className="italic font-medium text-ink bg-surface p-2.5 rounded-xl border border-border/60">
                      "{selectedItem.medicineSubstitute.whatToTellChemist}"
                    </p>
                  </div>

                  {/* Alternate private brands */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-ink-muted uppercase">Other Private Generic Brands:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.medicineSubstitute.alternativeBrands.map((brand, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-base text-ink font-bold text-xs border border-border">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prescription Warning */}
                  <div className="pt-2 text-[11px] text-ink-muted flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      {selectedItem.medicineSubstitute.isPrescriptionRequired 
                        ? 'Prescription required by law from a registered medical practitioner.' 
                        : 'Over-The-Counter (OTC) medication; safe for adult self-administration.'}
                    </span>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* 4. CLINICAL RED FLAGS & EMERGENCY HOSPITAL THRESHOLD     */}
          {/* ======================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-red-500/10 border-2 border-red-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 font-black text-sm uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>When to Stop Home Remedies & Seek Immediate Hospital Care</span>
              </div>
              <a
                href="tel:112"
                className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs"
              >
                Call 112 SOS
              </a>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-red-900 dark:text-red-200 font-medium">
              {selectedItem.redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start space-x-2 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl border border-red-200/50">
                  <span className="text-red-600 font-black shrink-0">⚠️</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};
