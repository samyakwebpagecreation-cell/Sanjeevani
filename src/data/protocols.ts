import { FirstAidProtocol } from '../types';

export const FIRST_AID_PROTOCOLS: Record<string, FirstAidProtocol> = {
  bleeding: {
    id: 'bleeding',
    title: 'Bleeding & Wounds',
    shortDesc: 'Control bleeding with direct pressure and clean dressing.',
    severity: 'moderate',
    requiresCamera: true,
    iconName: 'Droplet',
    escalationTriggers: [
      'Blood spurting in pulses',
      'Bleeding does not stop after 5 minutes of continuous pressure',
      'Deep gaping wound or visible bone/muscle',
      'Object embedded deeply in wound',
      'Person appears pale, dizzy, or confused'
    ],
    microSteps: [
      {
        id: 'bleed-1',
        stepNumber: 1,
        instruction: 'Protect yourself and inspect',
        detail: 'Wash your hands or put on clean gloves if available. Ask the person to sit or lie down comfortably.',
        actionPrompt: 'Sit person down and inspect wound',
        cameraRequired: true,
        arOverlayType: 'pressure_point',
        audioPrompt: 'Sit the person down. Keep calm. Look at the wound and check if anything is stuck inside.'
      },
      {
        id: 'bleed-2',
        stepNumber: 2,
        instruction: 'Apply direct, firm pressure',
        detail: 'Press a clean cloth or sterile gauze firmly against the wound. Do NOT remove if it bleeds through — add more layers on top.',
        actionPrompt: 'Confirm direct pressure applied',
        cameraRequired: true,
        arOverlayType: 'pressure_point',
        audioPrompt: 'Press a clean cloth firmly right on the wound. Hold it without peeking for at least 3 minutes.',
        durationSeconds: 180
      },
      {
        id: 'bleed-3',
        stepNumber: 3,
        instruction: 'Elevate if no fracture suspected',
        detail: 'If the bleeding is on an arm or leg, raise it gently above heart level while continuing firm pressure.',
        actionPrompt: 'Wound elevated & pressure maintained',
        cameraRequired: false,
        audioPrompt: 'Gently raise the limb above the heart level. Keep holding firm pressure.'
      },
      {
        id: 'bleed-4',
        stepNumber: 4,
        instruction: 'Secure with a bandage',
        detail: 'Wrap a roller bandage over the pads to maintain pressure. Ensure fingers or toes do not turn blue or cold.',
        actionPrompt: 'Bandage secured firmly',
        cameraRequired: true,
        arOverlayType: 'pressure_point',
        audioPrompt: 'Tie or wrap the bandage securely over the pad. Check that circulation is not cut off.'
      }
    ]
  },
  burn: {
    id: 'burn',
    title: 'Thermal & Minor Burns',
    shortDesc: 'Cool immediately with clean running water. Never use ice or butter.',
    severity: 'moderate',
    requiresCamera: true,
    iconName: 'Flame',
    escalationTriggers: [
      'Burn is larger than the person\'s palm',
      'Skin looks charred white, dark brown, or leathery',
      'Burn is on face, neck, hands, feet, or groin',
      'Caused by chemicals, electricity, or high-voltage',
      'Person is having trouble breathing or in severe shock'
    ],
    microSteps: [
      {
        id: 'burn-1',
        stepNumber: 1,
        instruction: 'Cool under cool running water immediately',
        detail: 'Hold the burned area under cool running tap water for 10 to 20 minutes. Never use ice, icy water, toothpaste, or butter.',
        actionPrompt: 'Start 15-minute cooling timer',
        cameraRequired: true,
        arOverlayType: 'burn_cooling',
        audioPrompt: 'Place the burned skin under cool running tap water right away. Keep water running gently for at least 15 minutes. Do not use ice.',
        durationSeconds: 900
      },
      {
        id: 'burn-2',
        stepNumber: 2,
        instruction: 'Gently remove rings or tight items',
        detail: 'Remove constricting jewelry, watches, or tight clothing around the burn before swelling begins. Do NOT pull off stuck clothes.',
        actionPrompt: 'Constricting items checked and loosened',
        cameraRequired: false,
        audioPrompt: 'Loosen or remove rings, watches, or bracelets near the burn before any swelling starts.'
      },
      {
        id: 'burn-3',
        stepNumber: 3,
        instruction: 'Cover loosely with clean film or gauze',
        detail: 'Cover with clean food cling wrap or sterile non-stick dressing. Do not break blisters. Keep the person warm.',
        actionPrompt: 'Burn covered loosely',
        cameraRequired: true,
        arOverlayType: 'burn_cooling',
        audioPrompt: 'Cover the burn loosely with clean cling wrap or a sterile non-stick pad. Do not burst blisters.'
      }
    ]
  },
  unconscious: {
    id: 'unconscious',
    title: 'Unconscious / CPR',
    shortDesc: 'Immediate responsiveness check and chest compressions.',
    severity: 'critical',
    requiresCamera: true,
    iconName: 'HeartPulse',
    escalationTriggers: [
      'Person does not respond to firm shoulder tap or shouting',
      'Person is gasping or not breathing normally',
      'Person turned blue/gray around lips',
      'Suspected electric shock or drowning'
    ],
    microSteps: [
      {
        id: 'cpr-1',
        stepNumber: 1,
        instruction: 'Check response & shout for help',
        detail: 'Tap both shoulders firmly and shout: "Are you okay?" Look at the chest for 5 seconds to check for normal breathing.',
        actionPrompt: 'Person does not respond / Not breathing normally',
        cameraRequired: true,
        arOverlayType: 'posture_check',
        audioPrompt: 'Tap their shoulders firmly and shout loudly: Are you okay? Look at their chest. If they are not breathing normally, shout for an adult right now.'
      },
      {
        id: 'cpr-2',
        stepNumber: 2,
        instruction: 'Position hands on center of chest',
        detail: 'Place the heel of one hand in the center of the chest. Interlock your other hand on top. Lock your elbows straight.',
        actionPrompt: 'Hands locked on chest center',
        cameraRequired: true,
        arOverlayType: 'cpr_hands',
        audioPrompt: 'Place the heel of your hand right in the center of their chest between the nipples. Interlock fingers. Keep elbows straight.'
      },
      {
        id: 'cpr-3',
        stepNumber: 3,
        instruction: 'Continuous chest compressions (100–120 BPM)',
        detail: 'Push hard and fast: 5 to 6 cm deep. Allow full chest recoil between compressions. Follow the metronome rhythm.',
        actionPrompt: 'Compressing to rhythm',
        cameraRequired: true,
        arOverlayType: 'cpr_hands',
        audioPrompt: 'Push hard and fast to the beat. Push down 2 inches. Let the chest rise all the way up between each push.',
        isCPR: true,
        metronomeBpm: 110,
        durationSeconds: 120
      }
    ]
  },
  choking: {
    id: 'choking',
    title: 'Choking (Conscious)',
    shortDesc: 'Assess cough. Deliver 5 back blows then 5 abdominal thrusts.',
    severity: 'critical',
    requiresCamera: false,
    iconName: 'ShieldAlert',
    escalationTriggers: [
      'Cannot breathe, speak, or make sound',
      'Clutching throat with hands',
      'Lips or fingernails turning blue',
      'Person becomes unconscious'
    ],
    microSteps: [
      {
        id: 'choke-1',
        stepNumber: 1,
        instruction: 'Encourage coughing if they can make sound',
        detail: 'If the person is coughing loudly or can speak, encourage them to keep coughing hard. Do NOT slap their back while coughing.',
        actionPrompt: 'Cannot cough or speak (Airway blocked)',
        cameraRequired: false,
        audioPrompt: 'If they can cough or make sound, tell them to cough as hard as they can. Do not hit their back yet.'
      },
      {
        id: 'choke-2',
        stepNumber: 2,
        instruction: 'Give 5 firm back blows',
        detail: 'Stand behind and slightly to one side. Support their chest with one hand, lean them forward, and deliver 5 sharp blows between shoulder blades with heel of hand.',
        actionPrompt: '5 back blows delivered',
        cameraRequired: false,
        audioPrompt: 'Lean them forward. Give 5 firm, sharp slaps between their shoulder blades using the heel of your hand.'
      },
      {
        id: 'choke-3',
        stepNumber: 3,
        instruction: 'Give 5 abdominal thrusts (Heimlich)',
        detail: 'Stand behind. Make a fist just above their navel. Grasp fist with other hand and pull sharply inward and upward 5 times.',
        actionPrompt: '5 thrusts completed',
        cameraRequired: false,
        audioPrompt: 'Place a fist just above their belly button. Pull sharply inward and upward five times.'
      }
    ]
  },
  fracture: {
    id: 'fracture',
    title: 'Fall or Suspected Fracture',
    shortDesc: 'Immobilize and support. Never attempt to realign broken bones.',
    severity: 'high',
    requiresCamera: false,
    iconName: 'Bone',
    escalationTriggers: [
      'Bone piercing through skin (compound fracture)',
      'Severe angulation or unnatural deformity',
      'Numbness, loss of pulse, or pale/cold extremity',
      'Head, neck, or spinal pain'
    ],
    microSteps: [
      {
        id: 'frac-1',
        stepNumber: 1,
        instruction: 'Do not move the injured limb',
        detail: 'Instruct the person to stay completely still. Never attempt to push bones back or straighten an unnatural angle.',
        actionPrompt: 'Limb kept still and stabilized',
        cameraRequired: false,
        audioPrompt: 'Keep the injured limb completely still. Do not try to straighten or move it.'
      },
      {
        id: 'frac-2',
        stepNumber: 2,
        instruction: 'Support with soft padding or splint',
        detail: 'Gently support the limb in the exact position found using rolled blankets, towels, or pillows.',
        actionPrompt: 'Padded support placed',
        cameraRequired: false,
        audioPrompt: 'Place rolled towels or a soft jacket gently around the injured limb to stop it from moving.'
      },
      {
        id: 'frac-3',
        stepNumber: 3,
        instruction: 'Apply wrapped cold pack for swelling',
        detail: 'Apply a cloth-wrapped ice pack to reduce pain and swelling. Never apply bare ice directly to skin.',
        actionPrompt: 'Cold pack applied',
        cameraRequired: false,
        audioPrompt: 'Wrap ice in a cloth and place it gently over the swollen area for 15 minutes. Keep an adult notified.'
      }
    ]
  },
  custom: {
    id: 'custom',
    title: 'Symptom Triage & Guidance',
    shortDesc: 'Search or select symptoms for guided micro-step first aid.',
    severity: 'low',
    requiresCamera: false,
    iconName: 'Search',
    escalationTriggers: [
      'Difficulty breathing or chest tightness',
      'Severe disorientation, fainting, or seizure',
      'Sudden slurred speech or facial droop'
    ],
    microSteps: [
      {
        id: 'cust-1',
        stepNumber: 1,
        instruction: 'Describe what happened or select symptom',
        detail: 'Identify the primary symptom: Nosebleed, Bee sting, Sprain, Heat exhaustion, or Eye irritation.',
        actionPrompt: 'Select confirmed symptom',
        cameraRequired: false,
        audioPrompt: 'Tell Sanjeevani what happened, or tap one of the common situations below.'
      }
    ]
  }
};
