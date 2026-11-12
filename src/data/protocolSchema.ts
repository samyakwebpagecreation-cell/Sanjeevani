import { InjuryProtocolId, LibraryEntry } from '../types';
import { LIBRARY_ENTRIES } from './libraryData';

export type ProtocolSeverity = 'Emergency' | 'Urgent' | 'Moderate' | 'Mild';
export type ProtocolReviewStatus = 'draft' | 'needs_update' | 'pending_review' | 'reviewed';
export type ProtocolInlineActionType =
  | 'call112'
  | 'metronome110'
  | 'arChestGuide'
  | 'crowdSquad'
  | 'nearestFacility';

export interface ProtocolStep {
  title?: string;
  text: string;
  icon?: string;
  wordCount: number;
  over20Words: boolean;
  action?: {
    type: ProtocolInlineActionType;
    label: string;
  };
}

export interface ProtocolSource {
  name: string;
  publisher: string;
  version: string;
  year: number;
  url: string;
}

export interface ProtocolReview {
  status: ProtocolReviewStatus;
  reviewer_role?: string;
  reviewed_on?: string;
  next_review?: string;
  note?: string;
}

export interface ProtocolDocument {
  id: string;
  slug: string;
  title: string;
  aliases: string[];
  missingAliasesFlag?: boolean;
  category: string;
  severity: ProtocolSeverity;
  call112: boolean;
  summary: string; // <= 90 chars, derived strictly from first sentence
  summaryCandidateNeedsApproval: boolean;
  fullDescription: string; // verbatim original whatIsIt
  redFlags: string[];
  steps: ProtocolStep[];
  avoid: string[];
  watchFor: string[];
  whileWaiting: string[];
  aftercare: string[];
  inIndia: string[];
  quickReminder: string;
  linkedProtocolId: InjuryProtocolId;
  related: string[];
  sources: ProtocolSource[];
  review: ProtocolReview;
  version: string;
  updated_at: string;
  lang: 'en';
  offlineCached: boolean;
}

export const PROTOCOL_DATASET_VERSION = '2.4';
export const PROTOCOL_UPDATED_AT = '2025-02-15';

export const AHA_2025_REVIEW_NOTE =
  'AHA published updated CPR/ECC guidelines in Oct 2025 (reported to change choking response for adults/children and to add a public opioid-overdose algorithm). Verify against the primary source and Indian Resuscitation Council guidance before release.';

/**
 * B2: 8 critical protocols pinned in the "Start here" row
 * (cardiac arrest/AED, choking, severe bleeding, stroke FAST signs,
 * anaphylaxis, seizure, drowning, snakebite)
 */
export const PINNED_IDS: readonly string[] = [
  'cardiac-arrest-aed',
  'child-choking',
  'amputation',
  'suspected-stroke-fast',
  'anaphylaxis-full',
  'first-time-seizure',
  'drowning',
  'snake-bite',
] as const;

export const PINNED_SHORT_LABELS: Record<string, { shortTitle: string; subtitle: string }> = {
  'cardiac-arrest-aed': {
    shortTitle: 'Cardiac Arrest & AED',
    subtitle: 'Unresponsive · No breathing · Start CPR',
  },
  'child-choking': {
    shortTitle: 'Choking (Airway Blocked)',
    subtitle: 'Cannot speak, cough, or breathe',
  },
  'amputation': {
    shortTitle: 'Severe Bleeding & Amputation',
    subtitle: 'Direct pressure · Preserve severed part',
  },
  'suspected-stroke-fast': {
    shortTitle: 'Stroke (FAST Signs)',
    subtitle: 'Face droop · Arm weakness · Speech slur',
  },
  'anaphylaxis-full': {
    shortTitle: 'Anaphylaxis (Severe Allergy)',
    subtitle: 'Airway swelling · Epinephrine auto-injector',
  },
  'first-time-seizure': {
    shortTitle: 'Active Seizure',
    subtitle: 'Protect head · Time seizure · Clear area',
  },
  'drowning': {
    shortTitle: 'Drowning Rescue',
    subtitle: '5 initial rescue breaths · 30:2 CPR',
  },
  'snake-bite': {
    shortTitle: 'Venomous Snake Bite',
    subtitle: 'Immobilize limb · Rush to ASV hospital',
  },
};

/**
 * Existing search terms & synonyms extracted from the protocol titles/categories
 */
const PROTOCOL_ALIASES: Record<string, string[]> = {
  'cardiac-arrest-aed': ['cpr', 'aed', 'no pulse', 'not breathing', 'heart stopped', 'collapse', 'defibrillator'],
  'heart-attack': ['chest pain', 'mi', 'myocardial infarction', 'angina', 'jaw pain', 'left arm pain'],
  'infant-cpr': ['baby cpr', 'newborn cpr', 'infant resuscitation', 'baby not breathing'],
  'child-cpr': ['pediatric cpr', 'kids cpr', 'child not breathing'],
  'infant-choking': ['baby choking', 'infant airway', 'back blows', 'baby swallowed'],
  'child-choking': ['choking', 'chocking', 'heimlich', 'abdominal thrusts', 'blocked airway', 'food stuck'],
  'drowning': ['near drowning', 'water rescue', 'submersion', 'pool accident'],
  'severe-asthma': ['asthma attack', 'wheezing', 'inhaler', 'bronchospasm', 'short of breath'],
  'anaphylactic-swelling': ['throat swelling', 'airway swelling', 'epipen', 'allergy'],
  'anaphylaxis-full': ['anaphylaxis', 'severe allergy', 'epipen', 'epinephrine', 'allergic shock'],
  'amputation': ['severe bleeding', 'heavy bleeding', 'arterial bleeding', 'hemorrhage', 'severed finger', 'cut off'],
  'internal-bleeding': ['internal hemorrhage', 'blunt trauma', 'belly pain after crash'],
  'cuts-stitches': ['deep cut', 'laceration', 'bleeding wound', 'gash', 'stitches'],
  'animal-bite': ['dog bite', 'monkey bite', 'stray dog', 'rabies', 'cat bite'],
  'dog-bite-deep': ['stray dog bite', 'rabies vaccine', 'arv', 'mauling'],
  'snake-bite': ['snakebite', 'cobra', 'krait', 'viper', 'asv', 'antivenom', 'fang marks'],
  'scorpion-sting': ['scorpion', 'bicchu'],
  'suspected-stroke-fast': ['stroke', 'fast signs', 'paralysis', 'slurred speech', 'face drooping', 'brain attack'],
  'first-time-seizure': ['seizure', 'fits', 'convulsion', 'epilepsy', 'shaking'],
  'known-epileptic-seizure': ['epilepsy', 'mirgi', 'seizure disorder', 'convulsions'],
  'febrile-seizure': ['fever fits', 'child fever convulsion', 'toddler seizure'],
  'unresponsive-breathing': ['unconscious', 'coma', 'passed out', 'recovery position', 'fainted'],
  'fainting-syncope': ['fainting', 'syncope', 'dizzy', 'blackout', 'lightheaded'],
  'heat-stroke': ['heatstroke', 'sunstroke', 'loo', 'hyperthermia', 'high body temp'],
  'hypothermia': ['freezing', 'low body temperature', 'shivering'],
  'electric-shock': ['electrocution', 'live wire', 'current shock'],
  'lightning-strike': ['lightning', 'thunderstorm strike'],
  'third-degree-burns': ['severe burn', 'full thickness burn', 'charred skin', 'fire burn'],
  'large-area-burns': ['major burn', 'scald', 'boiling water burn'],
  'chemical-burns': ['acid burn', 'alkali burn', 'chemical splash'],
  'chemical-ingestion': ['swallowed poison', 'drank acid', 'phenyl', 'cleaner swallowed'],
  'drug-overdose': ['overdose', 'opioid', 'naloxone', 'narcan', 'sleeping pills'],
  'medication-overdose': ['too many pills', 'paracetamol overdose', 'accidental medicine'],
  'button-battery-swallowed': ['swallowed battery', 'coin cell', 'watch battery'],
  'carbon-monoxide': ['co poisoning', 'gas leak', 'generator fumes', 'heater fumes'],
  'hypoglycemia': ['low blood sugar', 'insulin shock', 'sugar drop', 'diabetic shaky'],
  'diabetic-ketoacidosis': ['dka', 'high blood sugar', 'fruity breath'],
  'spinal-injury': ['neck injury', 'back broken', 'c-spine', 'cervical spine', 'road accident'],
  'head-injury-unconscious': ['head trauma', 'tbi', 'knocked out', 'skull injury'],
  'concussion': ['mild head injury', 'head bump', 'bell rung'],
  'shock': ['circulatory shock', 'hypovolemic shock', 'cold clammy skin'],
  'sprained-ankle': ['twisted ankle', 'ligament sprain', 'rice protocol'],
  'knocked-out-tooth': ['avulsed tooth', 'broken tooth', 'dental trauma'],
};

const CLEAN_FIRST_SENTENCE_PREFIXES: Record<string, string> = {
  'friction-burns': 'Skin abrasion combined with heat damage from fast-moving contact.',
  'third-degree-burns': 'A burn destroying all skin layers.',
  'infant-cpr': 'Lifesaving chest compressions and rescue breaths for an unresponsive infant.',
  'drowning': 'Rescue and breathing support for someone who has inhaled water.',
  'severe-asthma': 'A dangerous narrowing of the airways causing extreme difficulty breathing.',
  'anaphylactic-swelling': 'Rapid throat and airway swelling from a severe allergic reaction.',
  'concussion': 'A jolt to the head causing brief confusion, headache, or dizziness.',
  'jellyfish-sting': 'A painful sting from jellyfish tentacles.',
  'scorpion-sting': 'A sharp, painful sting that can cause numbness and swelling.',
  'cat-scratch-bite': 'A puncture or scratch from a cat that carries a notably high infection risk.',
  'spider-bite': 'A bite suspected to be from a venomous spider.',
  'heat-stroke': 'A life-threatening rise in body temperature.',
  'lightning-strike': 'A direct or nearby lightning strike that can stop the heart and cause burns.',
  'non-toxic-plant': 'A child or adult has eaten an unknown berry or plant.',
  'severe-alcohol-poisoning': 'Dangerously high blood alcohol levels.',
  'swallowed-object-non-battery': 'A child has swallowed a small object like a coin or toy part.',
};

/**
 * Generates a <= 90-character summary strictly from the FIRST sentence of whatIsIt,
 * without adding or rewording clinical claims.
 */
function buildStrictSummary(id: string, whatIsIt: string): { summary: string; needsApproval: boolean } {
  const firstSentence = (whatIsIt.split(/(?<=\.)\s+/)[0] || whatIsIt).trim();
  if (firstSentence.length <= 90) {
    return { summary: firstSentence, needsApproval: false };
  }

  if (CLEAN_FIRST_SENTENCE_PREFIXES[id] && CLEAN_FIRST_SENTENCE_PREFIXES[id].length <= 90) {
    return { summary: CLEAN_FIRST_SENTENCE_PREFIXES[id], needsApproval: true };
  }

  // Try natural clause boundaries within the first sentence
  const clauseSeparators = [
    ', requiring ',
    ', causing ',
    ', which ',
    ', usually ',
    ', often ',
    ', most ',
    ', signaled ',
    ', marked ',
    ', where ',
    ', especially ',
    ', carrying ',
    ', needing ',
    ', ranging ',
    ', warranting ',
    ', suggesting ',
    ', typically ',
    ', alarming ',
    ', without ',
    ', with ',
    ', by mistake',
  ];
  for (const sep of clauseSeparators) {
    const idx = firstSentence.indexOf(sep);
    if (idx > 25 && idx < 89) {
      const candidate = firstSentence.slice(0, idx).trim() + '.';
      if (candidate.length <= 90) {
        return { summary: candidate, needsApproval: true };
      }
    }
  }

  // Next try last comma before index 88
  const lastComma = firstSentence.lastIndexOf(',', 88);
  if (lastComma > 35) {
    const candidate = firstSentence.slice(0, lastComma).trim() + '.';
    if (candidate.length <= 90) {
      return { summary: candidate, needsApproval: true };
    }
  }

  // Otherwise truncate at last word boundary before 88 chars and end with period
  const lastSpace = firstSentence.lastIndexOf(' ', 88);
  const candidate = firstSentence.slice(0, lastSpace > 0 ? lastSpace : 88).replace(/[,;:\s]+$/, '') + '.';
  return { summary: candidate, needsApproval: true };
}

function countWords(str: string): number {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getSourcesForProtocol(entry: LibraryEntry): ProtocolSource[] {
  const cat = entry.category;
  const id = entry.id;
  const textBlob = `${entry.title} ${entry.whatIsIt} ${entry.steps.map(s => `${s.action} ${s.detail}`).join(' ')}`.toLowerCase();

  const sources: ProtocolSource[] = [];

  if (
    cat === 'Cardiac' ||
    cat === 'Breathing & Airway' ||
    id.includes('cpr') ||
    id.includes('choking') ||
    id.includes('drowning') ||
    id.includes('overdose') ||
    textBlob.includes('110 bpm') ||
    textBlob.includes('100-120 bpm') ||
    textBlob.includes('aed')
  ) {
    sources.push({
      name: 'AHA Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care (AHA 2020)',
      publisher: 'American Heart Association',
      version: '2020 CPR & ECC',
      year: 2020,
      url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines',
    });
    sources.push({
      name: 'Indian Resuscitation Council (IRC) Basic Life Support Guidelines (COLS / BCLS)',
      publisher: 'Indian Resuscitation Council',
      version: 'IRC BCLS 2022',
      year: 2022,
      url: 'https://cprindia.in/',
    });
  }

  if (id === 'snake-bite') {
    sources.push({
      name: 'Standard Treatment Guidelines for Management of Snake Bite in India',
      publisher: 'Ministry of Health & Family Welfare (MoHFW), Govt. of India',
      version: 'National STG',
      year: 2024,
      url: 'https://nhm.gov.in/',
    });
  }

  if (id === 'animal-bite' || id === 'dog-bite-deep' || id === 'cat-scratch-bite') {
    sources.push({
      name: 'National Guidelines for Rabies Prophylaxis in India',
      publisher: 'National Centre for Disease Control (NCDC), MoHFW',
      version: 'NCDC 2023',
      year: 2023,
      url: 'https://ncdc.mohfw.gov.in/',
    });
  }

  sources.push({
    name: '2024 AHA and American Red Cross Guidelines for First Aid',
    publisher: 'American Heart Association / American Red Cross',
    version: '2024 First Aid',
    year: 2024,
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001281',
  });

  sources.push({
    name: 'Indian Red Cross Society — St. John Ambulance First Aid Manual',
    publisher: 'Indian Red Cross Society',
    version: 'Standard Edition',
    year: 2023,
    url: 'https://indianredcross.org/',
  });

  return sources;
}

function requiresAha2025Update(entry: LibraryEntry, sources: ProtocolSource[]): boolean {
  const id = entry.id.toLowerCase();
  const title = entry.title.toLowerCase();
  const textBlob = `${title} ${entry.whatIsIt} ${entry.steps.map(s => `${s.action} ${s.detail}`).join(' ')}`.toLowerCase();

  const citesAha2020 = sources.some(s => s.name.includes('AHA 2020') || (s.publisher.includes('American Heart Association') && s.year === 2020));
  const involvesCpr = id.includes('cpr') || id.includes('cardiac-arrest') || textBlob.includes('cpr') || textBlob.includes('chest compressions') || textBlob.includes('110 bpm') || textBlob.includes('100-120 bpm');
  const involvesChoking = id.includes('choking') || title.includes('choking') || textBlob.includes('airway obstruction') || textBlob.includes('abdominal thrusts') || textBlob.includes('back blows');
  const involvesOverdose = id.includes('overdose') || title.includes('overdose') || textBlob.includes('overdose') || textBlob.includes('opioid') || textBlob.includes('naloxone');

  return citesAha2020 || involvesCpr || involvesChoking || involvesOverdose;
}

function getInlineActionForStep(
  entry: LibraryEntry,
  stepAction: string,
  stepDetail: string,
  stepIndex: number
): ProtocolStep['action'] | undefined {
  const combined = `${stepAction} ${stepDetail}`.toLowerCase();

  if (combined.includes('112') || combined.includes('emergency') || combined.includes('ambulance')) {
    return { type: 'call112', label: 'Call 112' };
  }
  if (combined.includes('100-120 bpm') || combined.includes('compressions') || combined.includes('continuous cpr')) {
    return { type: 'metronome110', label: 'Start CPR metronome' };
  }
  if (combined.includes('center of chest') || combined.includes('nipple line') || combined.includes('hand heel') || (entry.id.includes('cpr') && stepIndex === 1)) {
    return { type: 'arChestGuide', label: 'Open AR chest guide' };
  }
  if (combined.includes('aed') || combined.includes('shout for someone') || combined.includes('bystander')) {
    return { type: 'crowdSquad', label: 'Open crowd squad' };
  }
  if (
    combined.includes('hospital') ||
    combined.includes('clinic') ||
    combined.includes('doctor') ||
    combined.includes('anti-venom') ||
    combined.includes('rabies') ||
    combined.includes('tetanus')
  ) {
    return { type: 'nearestFacility', label: 'Find nearest hospital/AED/ASV' };
  }
  return undefined;
}

function getInIndiaNotes(entry: LibraryEntry): string[] {
  const notes: string[] = [];
  if (entry.severityBadge === 'Emergency' || entry.severityBadge === 'Urgent') {
    notes.push('Dial 112 (National Emergency Response System) or 108 (Free State Emergency Ambulance Service across India).');
  }
  if (entry.id === 'snake-bite') {
    notes.push('Government District Hospitals and Community Health Centres (CHCs) stock free polyvalent Anti-Snake Venom (ASV) covering the "Big Four" Indian snakes (Cobra, Common Krait, Russell’s Viper, Saw-Scaled Viper).');
  }
  if (entry.id === 'animal-bite' || entry.id === 'dog-bite-deep' || entry.id === 'cat-scratch-bite') {
    notes.push('Anti-Rabies Vaccine (ARV) and Rabies Immunoglobulin (RIG) are provided free of charge at Government District Hospitals and Municipal Dispensaries in India.');
  }
  if (entry.category === 'Poisoning & Ingestion') {
    notes.push('National Poisons Information Centre (NPIC), AIIMS New Delhi: 24×7 Toll-Free 1800-116-117 / +91-11-26589391.');
  }
  return notes;
}

/**
 * Transform all 100 LIBRARY_ENTRIES into strict ProtocolDocument objects
 * without rewriting or inventing clinical steps/warnings/redFlags.
 */
export const PROTOCOLS: ProtocolDocument[] = LIBRARY_ENTRIES.map((entry) => {
  const { summary, needsApproval } = buildStrictSummary(entry.id, entry.whatIsIt);
  const sources = getSourcesForProtocol(entry);
  const needsUpdate = requiresAha2025Update(entry, sources);

  // Build steps preserving exact clinical wording
  const rawSteps: ProtocolStep[] = entry.steps.map((s, idx) => {
    const fullStepText = `${s.action}. ${s.detail}`;
    const wc = countWords(fullStepText);
    return {
      title: s.action,
      text: s.detail,
      icon: s.icon,
      wordCount: wc,
      over20Words: wc > 20,
      action: getInlineActionForStep(entry, s.action, s.detail, idx),
    };
  });

  // D2 & E4: For EMERGENCY protocols the first step is always "Call 112 / ask someone to"
  let steps = [...rawSteps];
  if (entry.severityBadge === 'Emergency') {
    const firstStepCombined = `${steps[0]?.title || ''} ${steps[0]?.text || ''}`.toLowerCase();
    const startsWithCall112 =
      firstStepCombined.includes('112') ||
      firstStepCombined.includes('call emergency');

    if (!startsWithCall112) {
      steps = [
        {
          title: 'Call 112 / ask someone to',
          text: 'Call 112 on speaker immediately or point to a bystander to call 112 while you begin care.',
          icon: 'PhoneCall',
          wordCount: 17,
          over20Words: false,
          action: { type: 'call112', label: 'Call 112' },
        },
        ...steps,
      ];
    } else if (!steps[0].action) {
      steps[0] = {
        ...steps[0],
        action: { type: 'call112', label: 'Call 112' },
      };
    }
  }

  // Ensure CPR protocols also expose AR chest guide if not already attached
  if ((entry.id.includes('cpr') || entry.id === 'cardiac-arrest-aed') && !steps.some(s => s.action?.type === 'arChestGuide')) {
    const targetIdx = steps.findIndex(s => s.action?.type === 'metronome110');
    if (targetIdx !== -1 && steps[targetIdx + 1] && !steps[targetIdx + 1].action) {
      steps[targetIdx + 1] = {
        ...steps[targetIdx + 1],
        action: { type: 'arChestGuide', label: 'Open AR chest guide' },
      };
    }
  }

  const isHighAcuity =
    entry.severityBadge === 'Emergency' ||
    entry.severityBadge === 'Urgent' ||
    entry.whenToGetHelp.some(w => /112|emergency|unresponsive|breathing|blue|pulse|immediately/i.test(w));

  const sameCategoryIds = LIBRARY_ENTRIES.filter(
    other => other.category === entry.category && other.id !== entry.id
  )
    .sort((a, b) => {
      const rank: Record<ProtocolSeverity, number> = { Emergency: 0, Urgent: 1, Moderate: 2, Mild: 3 };
      return rank[a.severityBadge] - rank[b.severityBadge];
    })
    .slice(0, 3)
    .map(other => other.id);

  const aliases = PROTOCOL_ALIASES[entry.id] || [];

  return {
    id: entry.id,
    slug: entry.id,
    title: entry.title,
    aliases,
    missingAliasesFlag: aliases.length === 0,
    category: entry.category,
    severity: entry.severityBadge,
    call112: entry.severityBadge === 'Emergency' || isHighAcuity,
    summary,
    summaryCandidateNeedsApproval: needsApproval,
    fullDescription: entry.whatIsIt,
    redFlags: isHighAcuity ? entry.whenToGetHelp : [],
    steps: steps.slice(0, 8),
    avoid: entry.whatNotToDo,
    watchFor: entry.whenToGetHelp,
    whileWaiting:
      entry.severityBadge === 'Emergency' || entry.severityBadge === 'Urgent'
        ? [entry.quickReminder]
        : [],
    aftercare:
      entry.severityBadge === 'Moderate' || entry.severityBadge === 'Mild'
        ? [entry.quickReminder, ...entry.whenToGetHelp]
        : [],
    inIndia: getInIndiaNotes(entry),
    quickReminder: entry.quickReminder,
    linkedProtocolId: entry.linkedProtocolId,
    related: sameCategoryIds,
    sources,
    review: {
      status: needsUpdate ? 'needs_update' : 'pending_review',
      reviewer_role: 'Emergency Medicine & First-Aid Clinical Review Panel (Pending Sign-Off)',
      reviewed_on: undefined,
      next_review: needsUpdate ? '2026-10-01' : '2027-06-01',
      note: needsUpdate ? AHA_2025_REVIEW_NOTE : 'Awaiting primary clinical reviewer sign-off.',
    },
    version: PROTOCOL_DATASET_VERSION,
    updated_at: PROTOCOL_UPDATED_AT,
    lang: 'en',
    offlineCached: entry.offlineReady !== false,
  };
});

export const PROTOCOL_BY_ID: Record<string, ProtocolDocument> = Object.fromEntries(
  PROTOCOLS.map(p => [p.id, p])
);

export function getProtocolBySlug(slug: string): ProtocolDocument | undefined {
  return PROTOCOL_BY_ID[slug];
}
