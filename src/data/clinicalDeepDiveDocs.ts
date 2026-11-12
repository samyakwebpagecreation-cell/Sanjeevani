export interface ClinicalResourceLink {
  organization: string;
  badge: string;
  title: string;
  yearOrEdition: string;
  summary: string;
  url: string;
}

export interface PathophysiologyItem {
  title: string;
  mechanism: string;
  clinicalPearl: string;
}

export interface MonitoringMetric {
  metric: string;
  normalTarget: string;
  dangerThreshold: string;
}

export interface ClinicalDeepDiveDocument {
  id: string;
  title: string;
  classification: string;
  clinicalSummary: string;
  pathophysiologySteps: PathophysiologyItem[];
  monitoringChecklist: MonitoringMetric[];
  paramedicHandoverPoints: string[];
  resources: ClinicalResourceLink[];
}

export const CLINICAL_DEEP_DIVE_DOCS: Record<string, ClinicalDeepDiveDocument> = {
  bleeding: {
    id: 'bleeding',
    title: 'Clinical Reference: Severe Bleeding & Hemorrhage Control',
    classification: 'Trauma & Hemostasis · Hypovolemic Shock Prevention',
    clinicalSummary:
      'Uncontrolled external hemorrhage is the leading cause of preventable trauma mortality in the pre-hospital setting. The primary clinical objective is rapid mechanical tamponade of the ruptured vessel lumen so endogenous platelets and fibrin can cross-link into a stable hemostatic plug before acute hypovolemic shock develops.',
    pathophysiologySteps: [
      {
        title: 'Direct Mechanical Tamponade (3–5 Minutes Uninterrupted)',
        mechanism:
          'Firm, continuous direct pressure collapses the injured arterial or venous wall, reducing shear stress at the wound site so Von Willebrand factor and platelets can adhere and form a primary hemostatic plug.',
        clinicalPearl:
          'Never lift or peel back a blood-soaked dressing to "check" the wound—doing so mechanically tears the fragile fibrin mesh and restarts active bleeding. Always stack fresh gauze pads directly on top.'
      },
      {
        title: 'Hydrostatic Pressure Reduction & Supine Positioning',
        mechanism:
          'Placing the patient flat (supine) preserves cerebral and coronary perfusion as circulating blood volume drops, while elevating an unfractured bleeding extremity reduces local hydrostatic venous and capillary pressure.',
        clinicalPearl:
          'If a long-bone fracture or spinal injury is suspected, prioritize immobilization in the position found while maintaining firm direct pressure at the bleeding site.'
      },
      {
        title: 'Circumferential Pressure Dressing & Distal Perfusion Check',
        mechanism:
          'Securing the dressing with a firm roller bandage maintains steady transmural pressure across the wound bed without occluding deeper collateral arterial inflow unless a life-threatening arterial tourniquet is required.',
        clinicalPearl:
          'After wrapping, check distal nail-bed capillary refill (< 2 seconds), warmth, and sensation in fingers or toes to confirm the bandage is hemostatic without causing unintended distal ischemia.'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Mental Status (AVPU Scale)',
        normalTarget: 'Alert and oriented; answers questions clearly',
        dangerThreshold: 'Restless, anxious, confused, drowsy, or responds only to voice/pain (early cerebral hypoperfusion)'
      },
      {
        metric: 'Capillary Refill & Skin Perfusion',
        normalTarget: 'Pink, warm skin; nail-bed refill < 2 seconds',
        dangerThreshold: 'Pale, cold, clammy/sweaty skin; capillary refill > 2 seconds (compensatory vasoconstriction)'
      },
      {
        metric: 'Pulse & Breathing Pattern',
        normalTarget: 'Steady radial pulse (60–100 BPM); calm breathing',
        dangerThreshold: 'Rapid, weak/thready radial pulse (> 100 BPM) or rapid shallow breathing (> 22 breaths/min)'
      }
    ],
    paramedicHandoverPoints: [
      'Exact time the bleeding started and mechanism of injury (e.g., glass laceration, road traffic trauma, fall).',
      'Estimated blood loss volume and whether blood was spurting rhythmically (arterial) or flowing steadily (venous).',
      'Total minutes of continuous direct pressure applied and number of dressing layers soaked.',
      'Whether the patient takes blood thinners / antiplatelets (e.g., Aspirin, Clopidogrel, Warfarin, Apixaban).'
    ],
    resources: [
      {
        organization: 'American Heart Association & American Red Cross',
        badge: 'AHA / Red Cross 2020',
        title: 'Focused Update for First Aid: Control of Life-Threatening External Bleeding',
        yearOrEdition: 'Circulation Guidelines',
        summary:
          'Establishes direct manual pressure as first-line hemorrhage control, with layer-on-layer dressing reinforcement and tourniquet protocols for extremity arterial bleeding.',
        url: 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines'
      },
      {
        organization: 'American College of Surgeons — Committee on Trauma',
        badge: 'ACS Stop the Bleed',
        title: 'Pre-Hospital Hemorrhage Control & Wound Packing Clinical Consensus',
        yearOrEdition: 'ATLS 10th Edition',
        summary:
          'Clinical framework for recognizing life-threatening bleeding (pulsatile flow, pooling blood, soaked dressings) and maintaining uninterrupted wound tamponade.',
        url: 'https://www.stopthebleed.org/resources/'
      },
      {
        organization: 'World Health Organization & ICRC',
        badge: 'WHO BEC',
        title: 'Basic Emergency Care (BEC): Approach to the Acutely Ill and Injured — Circulation & Shock',
        yearOrEdition: 'WHO / ICRC Manual',
        summary:
          'Standardized low-resource emergency assessment of ABCDs, external hemorrhage arrest, and early recognition of hypovolemic shock.',
        url: 'https://www.who.int/publications/i/item/9789241513081'
      },
      {
        organization: 'MoHFW & AIIMS New Delhi',
        badge: 'AIIMS / MoHFW India',
        title: 'National Emergency Life Support (NELS) & Trauma Triage Protocols',
        yearOrEdition: 'Government of India STG',
        summary:
          'Indian pre-hospital and emergency department trauma stabilization guidelines for bystander and paramedic handover.',
        url: 'https://main.mohfw.gov.in'
      }
    ]
  },

  cpr: {
    id: 'cpr',
    title: 'Clinical Reference: Unresponsiveness, Cardiac Arrest & High-Quality CPR',
    classification: 'Cardiopulmonary Resuscitation · Chain of Survival (100–120 BPM)',
    clinicalSummary:
      'During sudden cardiac arrest, cerebral irreversible ischemic injury begins within 4 to 6 minutes of circulatory standstill. High-quality chest compressions manually pump blood from the ventricles to the brain and coronary arteries, buying critical time until an Automated External Defibrillator (AED) or 112 ALS crew arrives.',
    pathophysiologySteps: [
      {
        title: 'Rapid Recognition & Agonal Gasping Differentiation (≤ 10 Seconds)',
        mechanism:
          'Brainstem hypoxia often triggers slow, reflexive "agonal gasps" or snorting breaths in the first minutes after cardiac arrest. Mistaking agonal gasping for normal breathing delays life-saving compressions.',
        clinicalPearl:
          'If the person does not respond to a firm shoulder tap and is not breathing normally (or is only gasping), assume cardiac arrest immediately and start chest compressions.'
      },
      {
        title: 'Thoracic & Cardiac Pump Mechanism (5–6 cm Depth at 100–120 BPM)',
        mechanism:
          'Compressing the lower half of the sternum 5–6 cm (2–2.4 inches) squeezes the heart between the sternum and thoracic spine and raises intrathoracic pressure, driving forward blood flow to the brain and myocardium.',
        clinicalPearl:
          'Keep your elbows locked straight and position your shoulders directly vertically above your hands so your upper body weight delivers consistent depth without rapid arm fatigue.'
      },
      {
        title: 'Full Chest Wall Recoil & Minimizing Interruptions',
        mechanism:
          'Allowing the chest to spring back completely after each push creates negative intrathoracic pressure (vacuum effect) that draws venous blood back into the right atrium and perfuses the coronary arteries.',
        clinicalPearl:
          'Leaning on the chest between compressions raises right atrial pressure and slashes coronary perfusion pressure. Switch compressors every 2 minutes if a second bystander is present.'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Compression Rate & Depth',
        normalTarget: '100–120 BPM (follow Sanjeevani metronome); 5–6 cm adult depth',
        dangerThreshold: 'Rate < 100 BPM (insufficient perfusion) or > 120 BPM (incomplete cardiac filling)'
      },
      {
        metric: 'Chest Wall Recoil & Pause Duration',
        normalTarget: 'Complete recoil after every push; pauses < 10 seconds',
        dangerThreshold: 'Leaning on chest or stopping compressions for > 10 seconds (coronary pressure drops to zero)'
      },
      {
        metric: 'Signs of Return of Spontaneous Circulation (ROSC)',
        normalTarget: 'Coughing, purposeful movement, or regular spontaneous breathing',
        dangerThreshold: 'Persistent unresponsiveness or isolated agonal gasps — continue CPR without stopping'
      }
    ],
    paramedicHandoverPoints: [
      'Exact time of collapse (witnessed vs. unwitnessed) and time chest compressions were started.',
      'Total duration of CPR performed and whether an AED was attached or shocks were delivered.',
      'Any signs prior to collapse (clutching chest, sudden shortness of breath, drowning, electrocution).',
      'Known cardiac history, diabetes, or medications if family members are present.'
    ],
    resources: [
      {
        organization: 'American Heart Association (AHA)',
        badge: 'AHA 2020 BLS',
        title: 'Adult Basic and Advanced Life Support Guidelines for Cardiopulmonary Resuscitation',
        yearOrEdition: 'AHA 2020 Guidelines',
        summary:
          'Defines high-quality Hands-Only CPR parameters: 100–120 compressions/min, 5–6 cm depth, full chest recoil, and compression fraction > 80%.',
        url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines'
      },
      {
        organization: 'European Resuscitation Council (ERC)',
        badge: 'ERC 2021',
        title: 'ERC Guidelines for Resuscitation: Adult Basic Life Support & AED Use',
        yearOrEdition: 'Resuscitation Journal 2021',
        summary:
          'Evidence-based bystander resuscitation workflow emphasizing immediate recognition of unresponsive patients with absent/abnormal breathing.',
        url: 'https://www.erc.edu'
      },
      {
        organization: 'Indian Resuscitation Council (IRC) & ISA',
        badge: 'IRC Chakra',
        title: 'Compression-Only Life Support (COLS) for Laypersons and First Responders in India',
        yearOrEdition: 'Indian Journal of Anaesthesia',
        summary:
          'Tailored Indian bystander resuscitation guideline for out-of-hospital cardiac arrest before ambulance arrival.',
        url: 'https://cprindia.in'
      }
    ]
  },

  burn: {
    id: 'burn',
    title: 'Clinical Reference: Thermal, Scald & Electrical Burn Management',
    classification: 'Thermal Injury · Jackson’s Burn Zones & Microvascular Preservation',
    clinicalSummary:
      'Burn injuries continue to destroy deeper dermal layers for several minutes after the heat source is removed due to retained intradermal thermal energy. Immediate irrigation with cool running tap water halts cellular protein denaturation, reduces histamine/prostaglandin release, and prevents the "zone of stasis" from converting into irreversible full-thickness necrosis.',
    pathophysiologySteps: [
      {
        title: 'Cool Running Water Irrigation (15–20 Minutes)',
        mechanism:
          'Continuous cool tap water (15°C–25°C) conducts residual heat out of the dermis, stabilizes mast cells, reduces local edema, and preserves microcirculation in the surrounding salvageable tissue.',
        clinicalPearl:
          'Never apply ice or iced water—extreme cold triggers intense cutaneous vasoconstriction, cutting off blood supply to injured dermal cells and deepening the burn.'
      },
      {
        title: 'Early Removal of Constricting Items (Rings, Watches, Bangles)',
        mechanism:
          'Thermal injury causes rapid capillary leak and interstitial fluid shift within 15–30 minutes. Rings or tight bangles act as tourniquets once edema develops, risking distal finger ischemia.',
        clinicalPearl:
          'Never peel off clothing or synthetic fabric that is melted or stuck to the burn bed; cut around adherent cloth and let hospital staff debride it safely.'
      },
      {
        title: 'Sterile Non-Adherent Barrier & Blister Preservation',
        mechanism:
          'Intact burn blisters form a natural sterile biological dressing over raw exposed dermis. Covering loosely with clean plastic cling film or non-stick sterile gauze prevents airborne bacterial contamination and evaporative pain.',
        clinicalPearl:
          'Avoid toothpaste, butter, turmeric, oil, or raw ointments—they trap heat inside the dermis and must be painfully scrubbed off in the emergency room.'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Airway & Inhalation Injury Signs',
        normalTarget: 'Clear voice, unlabored breathing, no facial soot',
        dangerThreshold: 'Hoarse voice, stridor, singed nasal hairs, soot in mouth, or coughing after indoor fire (airway edema risk)'
      },
      {
        metric: 'Burn Surface Area (Wallace Rule of Palms)',
        normalTarget: 'Superficial redness smaller than the patient’s palm (< 1% TBSA)',
        dangerThreshold: 'Blistering burn larger than the patient’s palm, circumferential limb burn, or burn on face/hands/genitals'
      },
      {
        metric: 'Hypothermia Prevention (Especially in Children)',
        normalTarget: 'Cool the burn, but keep the rest of the patient warm and dry',
        dangerThreshold: 'Shivering or core cooling during prolonged water irrigation — wrap unburned torso in a clean blanket'
      }
    ],
    paramedicHandoverPoints: [
      'Exact causal agent (boiling liquid, open flame, steam, chemical acid/alkali, or electrical contact) and time of exposure.',
      'Total duration of cool running water irrigation completed.',
      'Whether the burn occurred in an enclosed space with smoke inhalation.',
      'Confirm that no home remedies (toothpaste, oil, butter) were applied.'
    ],
    resources: [
      {
        organization: 'World Health Organization (WHO)',
        badge: 'WHO Burn Care',
        title: 'WHO Fact Sheet & Clinical Standards on First Aid for Thermal Burns',
        yearOrEdition: 'WHO Injury Prevention',
        summary:
          'Recommends cool running water for 15–20 minutes and explicitly contraindicates ice, oils, butter, and raw pastes on burn wounds.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/burns'
      },
      {
        organization: 'International Society for Burn Injuries (ISBI)',
        badge: 'ISBI Practice Guidelines',
        title: 'ISBI Practice Guidelines for Burn Care: First Aid and Initial Assessment',
        yearOrEdition: 'Burns Journal',
        summary:
          'Global clinical consensus on cooling duration, blister preservation, clean PVC film dressing, and referral criteria to specialized burn centers.',
        url: 'https://worldburn.org'
      },
      {
        organization: 'Directorate General of Health Services (MoHFW India)',
        badge: 'NPPMBI India',
        title: 'National Programme for Prevention and Management of Burn Injuries — Clinical Protocol',
        yearOrEdition: 'MoHFW Government of India',
        summary:
          'Indian national protocol for pre-hospital burn triage, fluid resuscitation thresholds, and referral to district burn units.',
        url: 'https://main.mohfw.gov.in'
      }
    ]
  },

  choking: {
    id: 'choking',
    title: 'Clinical Reference: Foreign Body Airway Obstruction (Choking)',
    classification: 'Airway Emergency · Sub-Diaphragmatic Pressure & Back Blow Protocol',
    clinicalSummary:
      'Complete upper airway obstruction prevents alveolar gas exchange and leads to hypoxic cardiac arrest within minutes if the foreign body is not expelled. Differentiating mild (effective cough) from severe (silent cough, inability to speak or breathe) obstruction determines whether to encourage spontaneous coughing or intervene physically.',
    pathophysiologySteps: [
      {
        title: 'Mild vs. Severe Airway Obstruction Triage',
        mechanism:
          'A person who can cough forcefully or speak still has partial airflow past the foreign body; their natural cough reflex generates higher intrathoracic airflow velocity than external maneuvers.',
        clinicalPearl:
          'Never slap the back of a person who is coughing loudly and effectively—wait and monitor closely unless the cough becomes silent or ineffective.'
      },
      {
        title: '5 Sharp Interscapular Back Blows (Leaning Forward)',
        mechanism:
          'Leaning the torso forward utilizes gravity while sharp heel-of-hand blows between the shoulder blades produce an instantaneous vibration and pressure wave in the tracheobronchial tree to dislodge the object upward.',
        clinicalPearl:
          'Support the patient’s chest with one hand so that if the object dislodges, it exits out of the mouth rather than falling deeper into the trachea.'
      },
      {
        title: '5 Sub-Diaphragmatic Abdominal Thrusts (Heimlich Maneuver)',
        mechanism:
          'Pulling inward and upward just above the umbilicus forces the diaphragm rapidly cephalad, compressing residual lung volume to create an "artificial cough" that ejects the supraglottic or laryngeal obstruction.',
        clinicalPearl:
          'For pregnant patients in late gestation or infants under 1 year, never perform abdominal thrusts—use chest thrusts (and 5 back slaps + 5 chest thrusts for infants).'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Airway Patency & Vocalization',
        normalTarget: 'Able to speak, cough forcefully, and draw breath',
        dangerThreshold: 'Universal choking sign (clutching throat), silent cough, high-pitched inspiratory stridor, or cyanosis'
      },
      {
        metric: 'Level of Consciousness',
        normalTarget: 'Conscious and cooperative',
        dangerThreshold: 'Becomes limp/unresponsive — lower gently to floor, call 112, and start CPR chest compressions immediately'
      },
      {
        metric: 'Post-Expulsion Medical Evaluation',
        normalTarget: 'Clear breathing after object is expelled',
        dangerThreshold: 'Persistent throat pain, wheezing, or after receiving abdominal thrusts (must be evaluated for internal visceral injury)'
      }
    ],
    paramedicHandoverPoints: [
      'Suspected object (food bolus, coin, toy part, denture) and whether the event was witnessed.',
      'Number of cycles of 5 back blows and 5 abdominal thrusts performed.',
      'Whether the object was partially or fully expelled, and if the patient lost consciousness at any point.'
    ],
    resources: [
      {
        organization: 'European Resuscitation Council (ERC)',
        badge: 'ERC 2021',
        title: 'Adult & Pediatric Foreign Body Airway Obstruction Algorithm (5 Back Blows + 5 Abdominal Thrusts)',
        yearOrEdition: 'ERC Basic Life Support',
        summary:
          'Recommends alternating 5 firm back blows with 5 abdominal thrusts for conscious choking adults and children over 1 year.',
        url: 'https://www.erc.edu'
      },
      {
        organization: 'American Heart Association (AHA)',
        badge: 'AHA 2020',
        title: 'Relief of Foreign-Body Airway Obstruction in Responsive and Unresponsive Victims',
        yearOrEdition: 'AHA BLS Guidelines',
        summary:
          'Clinical protocol for abdominal thrusts, chest thrusts in pregnancy, infant back slaps/chest thrusts, and transition to CPR if unresponsive.',
        url: 'https://cpr.heart.org'
      }
    ]
  },

  fracture: {
    id: 'fracture',
    title: 'Clinical Reference: Fractures, Falls & Spinal Immobilization',
    classification: 'Musculoskeletal & Neurovascular Preservation · Splinting Protocol',
    clinicalSummary:
      'Unstabilized bone fragments have sharp cortical edges that can lacerate adjacent arteries, nerves, or skin (converting a closed fracture into an open compound fracture). Immobilizing the joint above and below the injury in the position found prevents secondary neurovascular trauma and fat embolism.',
    pathophysiologySteps: [
      {
        title: 'Zero-Traction In-Situ Stabilization',
        mechanism:
          'Forcing a deformed or angulated limb straight in the field can pinch or sever the radial, ulnar, tibial, or peroneal neurovascular bundle against displaced bone spicules.',
        clinicalPearl:
          'Always splint the limb in the exact position found using soft padding (rolled towels, blankets, or pillows) to fill natural hollows.'
      },
      {
        title: 'Cervical & Spinal Precautions After High-Energy Falls',
        mechanism:
          'Uncontrolled flexion or rotation of an unstable cervical or thoracolumbar vertebra can compress the spinal cord.',
        clinicalPearl:
          'If the person fell from height, was in a vehicle crash, or has neck/back pain or tingling in hands/feet, hold manual in-line head stabilization and do not move them unless in immediate fire/hazard danger.'
      },
      {
        title: 'Wrapped Cold Therapy & Swelling Control',
        mechanism:
          'Applying a cloth-wrapped ice pack over the injured area induces mild local vasoconstriction, limiting hematoma expansion and compartment pressure without causing frostbite.',
        clinicalPearl:
          'Never apply bare ice directly to skin, and never place pressure directly over a protruding bone end.'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Distal Neurovascular Status (CMS: Circulation, Motor, Sensation)',
        normalTarget: 'Warm fingers/toes, capillary refill < 2s, able to wiggle digits, normal touch sensation',
        dangerThreshold: 'Pale/blue cold extremity, absent pulse, numbness/tingling ("pins and needles"), or inability to move digits'
      },
      {
        metric: 'Compartment Syndrome Warning Signs (The 5 Ps)',
        normalTarget: 'Pain proportionate to injury that improves with immobilization',
        dangerThreshold: 'Severe pain out of proportion (especially on passive stretch), pallor, paresthesia, paralysis, pulselessness'
      },
      {
        metric: 'Skin Integrity (Closed vs. Open Compound Fracture)',
        normalTarget: 'Intact skin over swelling',
        dangerThreshold: 'Bone piercing skin or deep bleeding wound over fracture — cover lightly with sterile dressing, do NOT push bone back in'
      }
    ],
    paramedicHandoverPoints: [
      'Mechanism of fall/impact (height, landing surface, axial loading on head/spine).',
      'Distal circulation, sensation, and motor function before and after padding/splinting.',
      'Any loss of consciousness, headache, vomiting, or neck/back tenderness.'
    ],
    resources: [
      {
        organization: 'American Academy of Orthopaedic Surgeons (AAOS) & AHA',
        badge: 'AHA / Red Cross 2020',
        title: 'First Aid Guidelines for Extremity Fractures, Sprains, and Suspected Spinal Trauma',
        yearOrEdition: '2020 Focused Update',
        summary:
          'Directs responders to leave deformed fractures in the position found, pad and immobilize adjacent joints, and monitor distal perfusion.',
        url: 'https://cpr.heart.org/en/resuscitation-science/first-aid-guidelines'
      },
      {
        organization: 'World Health Organization (WHO)',
        badge: 'WHO Trauma Care',
        title: 'Basic Emergency Care: Musculoskeletal Trauma, Splinting & Spinal Immobilization',
        yearOrEdition: 'WHO / ICRC Manual',
        summary:
          'Step-by-step field assessment of neurovascular status and safe immobilization prior to ambulance transport.',
        url: 'https://www.who.int/publications/i/item/9789241513081'
      }
    ]
  },

  snakebite: {
    id: 'snakebite',
    title: 'Clinical Reference: Snakebite Envenomation (Indian "Big Four" Protocol)',
    classification: 'Toxicology & Envenomation · Lymphatic Transport Retardation',
    clinicalSummary:
      'In India, over 90% of medically significant snakebites involve the "Big Four": Spectacled Cobra (Naja naja — neurotoxic), Common Krait (Bungarus caeruleus — neurotoxic), Russell’s Viper (Daboia russelii — hemotoxic/coagulopathic), and Saw-Scaled Viper (Echis carinatus — hemotoxic). Snake venom travels primarily through superficial lymphatic vessels driven by skeletal muscle contraction—making complete physical immobilization and rapid transfer to an Anti-Snake Venom (ASV) hospital the decisive survival factors.',
    pathophysiologySteps: [
      {
        title: 'Strict Limb & Patient Immobilization (Zero Walking)',
        mechanism:
          'Unlike arterial blood, lymph fluid has no central pump; it only moves when skeletal muscles contract. Walking or flexing the bitten limb actively pumps neurotoxins or hemotoxins into systemic circulation.',
        clinicalPearl:
          'Lay the patient down immediately, splint the bitten limb loosely to prevent joint movement, and carry the patient to transport—never let them walk.'
      },
      {
        title: 'Why Tourniquets, Incisions & Suction Are Strictly Contraindicated',
        mechanism:
          'Arterial tourniquets concentrate necrotizing viper venom in the extremity, causing gangrene and catastrophic systemic venom bolus release when the tourniquet is removed at the hospital.',
        clinicalPearl:
          'Never tie tight strings/ropes, never cut the bite with a blade, and never suck venom by mouth. Remove rings, anklets, or tight clothing before swelling progresses.'
      },
      {
        title: '20-Minute Whole Blood Clotting Test (20WBCT) & ASV Readiness',
        mechanism:
          'At the hospital, polyvalent Anti-Snake Venom (ASV) neutralizes circulating unbound venom. Early recognition of neurotoxic ptosis (drooping eyelids) or hemotoxic gum bleeding guides urgent ASV administration.',
        clinicalPearl:
          'Use Sanjeevani Emergency Radar to route directly to a government or trauma hospital stocking 24/7 cold-chain polyvalent ASV.'
      }
    ],
    monitoringChecklist: [
      {
        metric: 'Early Neurotoxic Signs (Cobra / Krait)',
        normalTarget: 'Eyes fully open, clear speech, normal swallowing and breathing',
        dangerThreshold: 'Ptosis (heavy/drooping eyelids), double vision, slurred speech, difficulty swallowing saliva, or shallow breathing'
      },
      {
        metric: 'Early Hemotoxic Signs (Russell’s / Saw-Scaled Viper)',
        normalTarget: 'No spontaneous oozing; stable local swelling',
        dangerThreshold: 'Persistent oozing from fang marks, bleeding gums, blood in urine, or rapidly ascending limb edema'
      },
      {
        metric: 'Airway & Position (Left Lateral Recovery if Vomiting)',
        normalTarget: 'Patent airway, calm respiration',
        dangerThreshold: 'Abdominal pain, vomiting, or bulbar weakness — place in left lateral recovery position to prevent aspiration'
      }
    ],
    paramedicHandoverPoints: [
      'Exact time of bite and anatomical site of fang marks/scratch.',
      'Visual description of the snake if safely seen (do NOT attempt to catch or kill the snake; a safe distant photo is sufficient if already taken).',
      'Onset of any drooping eyelids, difficulty swallowing, gum bleeding, or progressive swelling.',
      'Confirmation that no tight tourniquet or incision was applied.'
    ],
    resources: [
      {
        organization: 'Ministry of Health & Family Welfare (MoHFW), Government of India',
        badge: 'MoHFW National Protocol',
        title: 'National Snakebite Management Protocol (India) — Standard Treatment Guidelines',
        yearOrEdition: 'MoHFW / AIIMS Consensus',
        summary:
          'Official Indian national protocol for "Do it R.I.G.H.T." (Reassure, Immobilize, Get to Hospital, Tell the doctor) and polyvalent ASV dosing.',
        url: 'https://main.mohfw.gov.in'
      },
      {
        organization: 'World Health Organization (WHO SEARO)',
        badge: 'WHO SEARO',
        title: 'Guidelines for the Management of Snakebites in the South-East Asia Region',
        yearOrEdition: '2nd Edition (WHO)',
        summary:
          'Comprehensive clinical reference on Indian Big Four envenomation pathophysiology, first-aid contraindications, and neurotoxic/hemotoxic care.',
        url: 'https://www.who.int/publications/i/item/9789290225300'
      }
    ]
  }
};

/**
 * Resolves the best matching ClinicalDeepDiveDocument from the raw AI response text.
 */
export function resolveClinicalDeepDiveDoc(rawText: string): ClinicalDeepDiveDocument {
  const lower = (rawText || '').toLowerCase();

  if (
    lower.includes('snake') ||
    lower.includes('venom') ||
    lower.includes('asv') ||
    lower.includes('cobra') ||
    lower.includes('krait') ||
    lower.includes('viper') ||
    lower.includes('fang')
  ) {
    return CLINICAL_DEEP_DIVE_DOCS.snakebite;
  }

  if (
    lower.includes('cpr') ||
    lower.includes('100-120') ||
    lower.includes('100–120') ||
    lower.includes('chest compression') ||
    lower.includes('sternum') ||
    lower.includes('unconscious') ||
    lower.includes('unresponsive') ||
    lower.includes('cardiac arrest') ||
    lower.includes('aed')
  ) {
    return CLINICAL_DEEP_DIVE_DOCS.cpr;
  }

  if (
    lower.includes('burn') ||
    lower.includes('scald') ||
    lower.includes('blister') ||
    lower.includes('running water') ||
    lower.includes('running tap water')
  ) {
    return CLINICAL_DEEP_DIVE_DOCS.burn;
  }

  if (
    lower.includes('chok') ||
    lower.includes('back blow') ||
    lower.includes('abdominal thrust') ||
    lower.includes('heimlich') ||
    lower.includes('airway')
  ) {
    return CLINICAL_DEEP_DIVE_DOCS.choking;
  }

  if (
    lower.includes('fracture') ||
    lower.includes('splint') ||
    lower.includes('broken bone') ||
    lower.includes('deformity') ||
    lower.includes('immobiliz')
  ) {
    return CLINICAL_DEEP_DIVE_DOCS.fracture;
  }

  return CLINICAL_DEEP_DIVE_DOCS.bleeding;
}
