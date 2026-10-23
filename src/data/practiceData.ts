import { ScenarioQuiz, UserProgress } from '../types';

export const SCENARIO_QUIZZES: ScenarioQuiz[] = [
  {
    id: 'scen-1',
    title: 'Playground Kitchen Spill',
    category: 'Burns',
    difficulty: 'Beginner',
    situation: 'During lunch at school, hot soup spills on your friend’s forearm. The skin turns bright red and they cry out in pain.',
    question: 'What is your very first action?',
    options: [
      {
        text: 'Rush to the tap and run cool water over their arm for 10-20 minutes.',
        isCorrect: true,
        explanation: 'Correct! Immediate cool running tap water is the gold standard — it halts heat transfer into deeper skin layers.'
      },
      {
        text: 'Rub ice cubes directly on the burn to freeze the heat away.',
        isCorrect: false,
        explanation: 'Extreme cold from ice causes vascular constriction and tissue frostbite, worsening burn damage.'
      },
      {
        text: 'Apply butter or toothpaste to soothe the burning sensation.',
        isCorrect: false,
        explanation: 'Butter, oil, and toothpaste trap heat in the skin and introduce bacterial contamination.'
      },
      {
        text: 'Wrap it tightly with an elastic bandage right away.',
        isCorrect: false,
        explanation: 'Tight bandaging traps heat and can tear blistering skin.'
      }
    ],
    principleLearned: 'Cool burns immediately with running tap water for 15-20 minutes. Never use ice, butter, or toothpaste.',
    mythBuster: 'Myth: Toothpaste or butter cools burns. Fact: They trap burning heat and cause dangerous skin infections.'
  },
  {
    id: 'scen-2',
    title: 'Cafeteria Sudden Silence',
    category: 'Choking',
    difficulty: 'Beginner',
    situation: 'Your classmate was eating peanuts, suddenly stands up with wide eyes, clutching their throat with both hands, making no sound.',
    question: 'They cannot talk or cough. What should you do first?',
    options: [
      {
        text: 'Give them a glass of water to wash down the blockage.',
        isCorrect: false,
        explanation: 'Giving liquid to a choked airway will enter the lungs or trigger aspiration and drowning.'
      },
      {
        text: 'Lean them forward and give 5 firm blows between their shoulder blades.',
        isCorrect: true,
        explanation: 'Correct! Leaning them forward and delivering 5 sharp back blows uses gravity and percussion to dislodge the object.'
      },
      {
        text: 'Reach your fingers blindly down their throat to fish the peanut out.',
        isCorrect: false,
        explanation: 'Blind finger sweeps push airway blockages deeper into the larynx.'
      },
      {
        text: 'Tell them to lie down on their back and stay still.',
        isCorrect: false,
        explanation: 'Lying flat allows gravity to pull the obstruction completely into the trachea.'
      }
    ],
    principleLearned: 'For severe choking with no sound: 5 back blows leaning forward, followed by 5 abdominal thrusts.',
    mythBuster: 'Myth: Shoving your finger in their mouth will fish out the food. Fact: Blind fingers push food deeper and wedge the airway shut.'
  },
  {
    id: 'scen-3',
    title: 'Sports Field Collapse',
    category: 'Cardiac & CPR',
    difficulty: 'Intermediate',
    situation: 'During a football match on a hot afternoon, an older coach collapses to the grass. You run over and they do not reply when you tap their shoulder.',
    question: 'How do you check if they need immediate CPR?',
    options: [
      {
        text: 'Check their chest for normal breathing for no more than 5-10 seconds.',
        isCorrect: true,
        explanation: 'Correct! Look, listen, and feel for normal chest movement for up to 10 seconds. If absent or just gasping, start CPR immediately.'
      },
      {
        text: 'Spend several minutes trying to find a wrist pulse with one finger.',
        isCorrect: false,
        explanation: 'Searching for a pulse is unreliable for non-medics and wastes precious brain-saving seconds.'
      },
      {
        text: 'Splash water on their face and shake their head vigorously.',
        isCorrect: false,
        explanation: 'Shaking could cause severe spinal cord trauma if they fell and injured their neck.'
      },
      {
        text: 'Prop their feet up on a bench and wait 15 minutes to see if they wake up.',
        isCorrect: false,
        explanation: 'In cardiac arrest, brain death begins in 4 minutes without chest compressions.'
      }
    ],
    principleLearned: 'Unresponsive and not breathing normally = Shout for emergency & adult, begin chest compressions immediately.',
    mythBuster: 'Myth: You need to check for a wrist pulse before doing CPR. Fact: Laypeople should only check if they are breathing normally. No breath = start CPR!'
  },
  {
    id: 'scen-4',
    title: 'Classroom Paper Cutter Wound',
    category: 'Bleeding',
    difficulty: 'Beginner',
    situation: 'An art student slips with a utility knife, slicing their palm. Dark red blood is streaming steadily onto the desk.',
    question: 'The first cloth you pressed onto the cut is now soaked in red. What is next?',
    options: [
      {
        text: 'Peel off the soaked cloth to inspect how deep the slice is.',
        isCorrect: false,
        explanation: 'Never peel off the initial dressing! Peeling it removes the fragile blood clot forming underneath.'
      },
      {
        text: 'Keep the soaked cloth in place, stack fresh clean cloth on top, and press harder.',
        isCorrect: true,
        explanation: 'Correct! Always layer fresh pads on top of soaked ones and keep continuous firm pressure.'
      },
      {
        text: 'Tie a shoelace tightly around their upper arm as a tourniquet.',
        isCorrect: false,
        explanation: 'Tourniquets are for catastrophic limb amputation/life-threatening arterial hemorrhage, not steady hand cuts.'
      },
      {
        text: 'Pour rubbing alcohol or disinfectant directly over the flowing blood.',
        isCorrect: false,
        explanation: 'Pouring chemicals into flowing blood causes intense pain, tissue damage, and does not stop bleeding.'
      }
    ],
    principleLearned: 'Never remove blood-soaked pads. Always add more pads on top and maintain steady, uninterrupted pressure.',
    mythBuster: 'Myth: Always remove a soaked pad to see if bleeding stopped. Fact: Removing it tears off the fresh clot and restarts heavy bleeding.'
  },
  {
    id: 'scen-5',
    title: 'Skatepark Fall with Swollen Arm',
    category: 'Fractures & Sprains',
    difficulty: 'Intermediate',
    situation: 'A friend falls off their skateboard awkwardly. Their wrist is swollen and resting at a strange, unnatural angle. They are crying in pain.',
    question: 'How should you manage the injury while waiting for an adult or ambulance?',
    options: [
      {
        text: 'Gently pull the hand to straighten the wrist back into natural alignment.',
        isCorrect: false,
        explanation: 'Never attempt to realign broken bones! Doing so can sever arteries, lacerate tendons, or destroy nerves.'
      },
      {
        text: 'Support the wrist in the position found with a soft jacket, keep it still, and notify an adult.',
        isCorrect: true,
        explanation: 'Correct! Always immobilize and support a suspected fracture in the exact posture it is found.'
      },
      {
        text: 'Encourage them to flex and rotate their fingers to see if it is really broken.',
        isCorrect: false,
        explanation: 'Moving an unstable fracture risks turning a closed fracture into a compound (bone through skin) injury.'
      },
      {
        text: 'Apply direct deep massage to knead out any muscle spasms.',
        isCorrect: false,
        explanation: 'Massaging a broken bone causes excruciating pain and severe internal tissue injury.'
      }
    ],
    principleLearned: 'Support fractures in the position found. Never attempt realignment. Apply wrapped cold packs and notify an adult.',
    mythBuster: 'Myth: You should snap a broken bone back into place. Fact: Attempting to reset a bone yourself can cut nerves and bleed heavily inside.'
  },
  {
    id: 'scen-6',
    title: 'Hot Classroom Fainting',
    category: 'Environmental',
    difficulty: 'Beginner',
    situation: 'During morning assembly in hot 40°C summer sun, a student suddenly turns pale and collapses onto the ground.',
    question: 'They are breathing, but groggy. What is the safest position for them?',
    options: [
      {
        text: 'Keep them lying flat on their back and elevate their legs about 30 cm (12 inches).',
        isCorrect: true,
        explanation: 'Correct! Elevating legs uses gravity to send blood pooling in lower extremities back to the brain.'
      },
      {
        text: 'Force them to immediately stand up and walk around to shake it off.',
        isCorrect: false,
        explanation: 'Standing up immediately will cause blood to drain from the head again and trigger another fall.'
      },
      {
        text: 'Pour cold water down their throat while they are lying down.',
        isCorrect: false,
        explanation: 'Never pour liquids into someone who is not fully alert — it goes down the windpipe.'
      },
      {
        text: 'Sit them up and bend their head between their knees forcibly.',
        isCorrect: false,
        explanation: 'Can compromise breathing and doesn’t circulate blood as effectively as elevating legs.'
      }
    ],
    principleLearned: 'For simple fainting: Lay flat, elevate feet 30 cm, loosen tight collar, ensure cool fresh air.',
    mythBuster: 'Myth: Force fainting people to sit or walk right away. Fact: They need blood in their brain — keep them lying flat with feet raised.'
  },
  {
    id: 'scen-7',
    title: 'Sudden Classroom Convulsion',
    category: 'Neurological',
    difficulty: 'Advanced',
    situation: 'A student slides out of their desk onto the floor and begins shaking violently in an epileptic seizure.',
    question: 'What is the most critical first-aid priority?',
    options: [
      {
        text: 'Put a wooden ruler, spoon, or your fingers in their mouth so they do not swallow their tongue.',
        isCorrect: false,
        explanation: 'Dangerous myth! It is anatomically impossible to swallow your tongue. Shoving items in teeth breaks jaws and obstructs air.'
      },
      {
        text: 'Clear away hard furniture, cushion their head with a folded jacket, and time the seizure.',
        isCorrect: true,
        explanation: 'Correct! Protect them from physical trauma, never restrain movement, and call 112 if lasting >5 minutes.'
      },
      {
        text: 'Pin down their arms and legs with multiple people to stop the shaking.',
        isCorrect: false,
        explanation: 'Restraining violent spasms can fracture bones and tear tendons.'
      },
      {
        text: 'Make them smell an onion or leather shoe to shock them awake.',
        isCorrect: false,
        explanation: 'Traditional folk myths have zero effect on neurological electrical storms and can cause chemical inhalation.'
      }
    ],
    principleLearned: 'Protect head with soft padding, clear dangerous furniture, never insert anything into mouth, time the duration.',
    mythBuster: 'Myth: People swallow their tongue during seizures. Fact: Impossible! Putting anything in their mouth breaks teeth and chokes them.'
  },
  {
    id: 'scen-8',
    title: 'Laboratory Acid Splash',
    category: 'Burns',
    difficulty: 'Advanced',
    situation: 'During a chemistry lab, a flask of dilute acid slips and splashes onto a classmate’s cheek and into their right eye.',
    question: 'What must you do in the first 15 seconds?',
    options: [
      {
        text: 'Rinse the eye continuously with clean, lukewarm running water for at least 15-20 minutes.',
        isCorrect: true,
        explanation: 'Correct! Continuous copious irrigation is the ONLY way to dilute and flush chemical agents out of the cornea.'
      },
      {
        text: 'Search for a weak base like baking soda to chemically neutralize the acid in their eye.',
        isCorrect: false,
        explanation: 'Neutralization reactions generate intense exothermic heat that literally cooks ocular tissue!'
      },
      {
        text: 'Rub the eye with a dry tissue to absorb the liquid quickly.',
        isCorrect: false,
        explanation: 'Rubbing grinds chemical and corrosive particles into the sensitive cornea.'
      },
      {
        text: 'Tightly bandage both eyes closed and wait for an ambulance.',
        isCorrect: false,
        explanation: 'Closing trapped chemicals inside the eye guarantees permanent blindness.'
      }
    ],
    principleLearned: 'Flush chemical eye burns immediately with copious clean water for 15+ minutes. Never attempt chemical neutralization.',
    mythBuster: 'Myth: Put a neutralizing agent on chemical burns. Fact: Chemical neutralization creates extreme heat, worsening the burn!'
  }
];

export const MYTH_BUSTER_QUESTIONS = [
  {
    id: 'myth-1',
    myth: 'Putting butter, toothpaste, or oil on a burn helps soothe the pain.',
    isTrue: false,
    explanation: 'Butter and toothpaste trap heat deep inside the skin and cause severe bacterial infections. Only cool running tap water is safe!'
  },
  {
    id: 'myth-2',
    myth: 'If someone is having a seizure, put a spoon in their mouth so they don’t bite their tongue.',
    isTrue: false,
    explanation: 'Never put anything in the mouth! It is impossible to swallow the tongue. Objects can break teeth, choke the person, or bite fingers.'
  },
  {
    id: 'myth-3',
    myth: 'Tilt your head backwards when you have a nosebleed.',
    isTrue: false,
    explanation: 'Tilting backwards causes blood to pour down into your stomach and lungs, causing vomiting and coughing. Always lean FORWARD and pinch the soft part.'
  },
  {
    id: 'myth-4',
    myth: 'If a cut bleeds through a cloth, peel it off to check how deep it is before adding another.',
    isTrue: false,
    explanation: 'Peeling off the cloth rips off the fragile blood clot! Always stack fresh clean pads directly on top and press harder.'
  },
  {
    id: 'myth-5',
    myth: 'Pushing on the chest to the beat of "Stayin Alive" (100-120 BPM) is the correct speed for CPR.',
    isTrue: true,
    explanation: 'True! 100-120 compressions per minute keeps oxygenated blood circulating to the brain until emergency medical teams arrive.'
  },
  {
    id: 'myth-6',
    myth: 'Cut an X over a snake bite and suck the venom out with your mouth.',
    isTrue: false,
    explanation: 'Cutting damages nerves and muscles, and venom spreads via the lymphatic system within seconds. Keep the limb still, remove tight jewelry, and rush to the hospital.'
  }
];

export const INITIAL_PROGRESS: UserProgress = {
  scenariosCompleted: ['scen-1'],
  skillsLearned: ['Direct Pressure', 'Burn Cooling Basics'],
  drillsCompleted: 1,
  badgeLevel: 'Safety Smart',
  lastPracticedDate: 'Today'
};

export const BADGE_TIERS = [
  {
    id: 'badge-1',
    level: 'First-Aid Beginner',
    req: 'Complete 1 scenario quiz',
    icon: 'Shield',
    desc: 'You understand the calm mindset and basic golden rules of everyday safety.'
  },
  {
    id: 'badge-2',
    level: 'Safety Smart',
    req: 'Complete 3 scenarios + 1 CPR drill',
    icon: 'HeartPulse',
    desc: 'You recognize high-risk situations, maintain rhythm, and avoid common harmful myths.'
  },
  {
    id: 'badge-3',
    level: 'First-Aid Ready',
    req: 'Complete 5 scenarios + 90% CPR accuracy',
    icon: 'Award',
    desc: 'You can sequence micro-steps calmly and take charge in sudden school/home emergencies.'
  },
  {
    id: 'badge-4',
    level: 'Emergency Guardian',
    req: 'Master 8+ scenarios & record emergency response',
    icon: 'Sparkles',
    desc: 'Elite responder certified. You know when to stabilize and when to escalate to 112.'
  }
];
