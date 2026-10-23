import { LibraryEntry } from '../types';

/**
 * Sanjeevani v2 - Comprehensive First-Aid Library
 * 77 Clinical Protocols across 12 Categories
 * Modeled strictly in simple, everyday language for the general public.
 */
export const LIBRARY_ENTRIES: LibraryEntry[] = [
  {
    "id": "friction-blisters",
    "title": "Friction Blisters",
    "category": "Bleeding & Wounds",
    "severityBadge": "Mild",
    "whatIsIt": "A fluid-filled pocket that forms under the skin from repeated rubbing, most common on hands and feet.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Shield",
        "action": "Leave blister intact",
        "detail": "Do not puncture or peel the skin bubble; it acts as a sterile natural dressing."
      },
      {
        "icon": "Layers",
        "action": "Cushion surrounding skin",
        "detail": "Apply a doughnut-shaped moleskin or hydrocolloid blister bandage over the area."
      },
      {
        "icon": "Droplet",
        "action": "Clean if it bursts",
        "detail": "Wash gently with clean water and mild soap, apply petroleum jelly, and bandage loosely."
      }
    ],
    "whatNotToDo": [
      "Do not intentionally pop the blister with a pin.",
      "Do not peel away loose skin flaps if it opens."
    ],
    "whenToGetHelp": [
      "Red streaks spread outward from the blister.",
      "Pus drains or throbbing pain increases."
    ],
    "quickReminder": "Keep it clean, covered, and cushioned — never pop a fresh friction blister."
  },
  {
    "id": "splinters-debris",
    "title": "Splinters & Embedded Debris",
    "category": "Bleeding & Wounds",
    "severityBadge": "Mild",
    "whatIsIt": "A small foreign object lodged just under the skin's surface, usually wood, glass, or metal.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Wash area gently",
        "detail": "Clean the skin with mild soap and warm water without pressing debris deeper."
      },
      {
        "icon": "Scissors",
        "action": "Sterilize tweezers",
        "detail": "Wipe clean tweezers with rubbing alcohol."
      },
      {
        "icon": "Check",
        "action": "Grasp and pull out",
        "detail": "Grip the protruding tip firmly and pull straight out at the exact entry angle."
      }
    ],
    "whatNotToDo": [
      "Do not squeeze or pinch the skin, which can snap the splinter inside.",
      "Do not dig deeply into flesh with sewing pins."
    ],
    "whenToGetHelp": [
      "Splinter is embedded deeply under a fingernail or near an eye.",
      "Area becomes hot, swollen, or produces discharge."
    ],
    "quickReminder": "Disinfect tweezers, grip the tip, and pull straight along the entry path."
  },
  {
    "id": "nail-bleeding",
    "title": "Bleeding Under a Nail",
    "category": "Bleeding & Wounds",
    "severityBadge": "Mild",
    "whatIsIt": "Blood pooling beneath the nail bed after a crush injury, causing pressure and dark discoloration.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Snowflake",
        "action": "Apply cold compress",
        "detail": "Wrap an ice pack in a cloth and apply for 10-15 minutes to reduce pain and throbbing."
      },
      {
        "icon": "ArrowUp",
        "action": "Elevate the limb",
        "detail": "Keep the injured hand or foot resting above heart level to decrease pooling."
      },
      {
        "icon": "Bandage",
        "action": "Protect the nail",
        "detail": "Apply a snug, clean protective dressing so the loose nail does not catch on clothes."
      }
    ],
    "whatNotToDo": [
      "Never heat a paperclip to melt through the nail at home (high infection risk).",
      "Do not forcefully rip or pry away a partially lifted nail."
    ],
    "whenToGetHelp": [
      "Blood covers more than half the nail surface.",
      "The bone feels broken or severe throbbing persists."
    ],
    "quickReminder": "Ice, elevate, and protect — visit a clinic if blood covers over half the nail."
  },
  {
    "id": "cuts-stitches",
    "title": "Deep Cuts Needing Stitches",
    "category": "Bleeding & Wounds",
    "severityBadge": "Moderate",
    "whatIsIt": "A wound with separated skin edges that keeps bleeding and may need medical closure.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Hand",
        "action": "Apply direct pressure",
        "detail": "Press firmly with a sterile pad or clean cloth for 5 to 10 continuous minutes."
      },
      {
        "icon": "Droplet",
        "action": "Rinse with clean water",
        "detail": "Rinse gently under cool tap water to remove visible dirt; avoid harsh scrubbing."
      },
      {
        "icon": "Layers",
        "action": "Pull edges together",
        "detail": "Apply butterfly bandages or sterile gauze and visit an urgent clinic within 6 hours."
      }
    ],
    "whatNotToDo": [
      "Do not keep lifting the dressing to see if bleeding stopped.",
      "Do not pack wounds with turmeric, dirt, or baking soda."
    ],
    "whenToGetHelp": [
      "Wound gapes open exposing yellow fat or red muscle.",
      "Bleeding pulses through dressings after 10 minutes of direct pressure."
    ],
    "quickReminder": "Continuous direct pressure stops bleeding; seek medical closure within 6 hours."
  },
  {
    "id": "animal-bite",
    "title": "Animal Bite Wounds",
    "category": "Bleeding & Wounds",
    "severityBadge": "Moderate",
    "whatIsIt": "Puncture or tear wounds from a domestic or wild animal, carrying infection risk alongside bleeding.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Wash 5-10 minutes",
        "detail": "Flush thoroughly under warm running water with mild soap to clear animal saliva."
      },
      {
        "icon": "Hand",
        "action": "Control bleeding",
        "detail": "Press with a sterile pad until bleeding slows."
      },
      {
        "icon": "PhoneCall",
        "action": "Seek medical advice",
        "detail": "Cover with clean gauze and visit a doctor promptly for rabies risk assessment and tetanus."
      }
    ],
    "whatNotToDo": [
      "Do not close animal puncture bites tightly with glue or butterfly tape (traps oral bacteria).",
      "Do not delay seeking rabies advice if animal is unfamiliar."
    ],
    "whenToGetHelp": [
      "The bite is on face, hand, or neck.",
      "Animal appears wild, foaming, or unvaccinated."
    ],
    "quickReminder": "Wash 5-10 minutes under running water immediately to wash out saliva, then get medical care."
  },
  {
    "id": "scalp-lacerations",
    "title": "Scalp Lacerations",
    "category": "Bleeding & Wounds",
    "severityBadge": "Moderate",
    "whatIsIt": "A cut on the scalp that bleeds heavily due to the area's rich blood supply, often looking worse than it is.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Hand",
        "action": "Direct flat pressure",
        "detail": "Hold a folded clean towel flat across the cut with firm, continuous pressure."
      },
      {
        "icon": "User",
        "action": "Keep seated upright",
        "detail": "Have the person sit upright to lower blood pressure in head vessels."
      },
      {
        "icon": "Bandage",
        "action": "Wrap bandage",
        "detail": "Wrap a roll around the forehead to keep the pad firmly in place once bleeding slows."
      }
    ],
    "whatNotToDo": [
      "Do not press hard if you feel a soft depression in the skull bone.",
      "Do not allow the person to lie flat on their back."
    ],
    "whenToGetHelp": [
      "Person lost consciousness, vomits, or appears confused.",
      "Bleeding continues heavily after 15 minutes of direct pressure."
    ],
    "quickReminder": "Firm flat pressure and sitting upright controls scalp bleeding quickly."
  },
  {
    "id": "puncture-wounds",
    "title": "Puncture Wounds",
    "category": "Bleeding & Wounds",
    "severityBadge": "Urgent",
    "whatIsIt": "A narrow, deep wound from a nail or sharp object that can trap bacteria below the surface.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Allow brief bleeding",
        "detail": "Let it bleed gently for a few seconds to help flush deep bacteria out."
      },
      {
        "icon": "Droplet",
        "action": "Wash under tap",
        "detail": "Rinse thoroughly under running tap water with mild soap for 5 minutes."
      },
      {
        "icon": "Bandage",
        "action": "Dry and cover",
        "detail": "Apply a clean bandage; check your tetanus vaccine booster status within 48 hours."
      }
    ],
    "whatNotToDo": [
      "Never attempt to pull out deeply impaled knives or long metal rods (stabilize them in place).",
      "Do not probe inside with tweezers."
    ],
    "whenToGetHelp": [
      "Object was dirty, rusty, or stepped on through a shoe rubber sole.",
      "Tetanus vaccination was more than 5 years ago."
    ],
    "quickReminder": "Wash thoroughly under running water, leave embedded objects in place, check tetanus."
  },
  {
    "id": "road-rash",
    "title": "Road Rash & Deep Abrasions",
    "category": "Bleeding & Wounds",
    "severityBadge": "Urgent",
    "whatIsIt": "Extensive skin scraped away by sliding against a rough surface, exposing multiple layers of skin.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Flush out dirt",
        "detail": "Gently pour clean water or saline over the area to float away gravel and road grit."
      },
      {
        "icon": "Shield",
        "action": "Apply petroleum jelly",
        "detail": "Spread a thick layer of sterile petroleum ointment to keep the raw surface moist."
      },
      {
        "icon": "Layers",
        "action": "Non-stick dressing",
        "detail": "Cover with a sterile non-adherent pad and wrap loosely with flexible gauze."
      }
    ],
    "whatNotToDo": [
      "Do not aggressively scrub raw skin with rough sponges or alcohol.",
      "Do not let road rash dry into a hard, cracked crust."
    ],
    "whenToGetHelp": [
      "Gravel is deeply embedded and cannot be washed away.",
      "Abrasion covers a large area or signs of infection appear."
    ],
    "quickReminder": "Rinse gently, keep moist with petroleum jelly, and protect with non-stick gauze."
  },
  {
    "id": "amputation",
    "title": "Partial or Full Amputation",
    "category": "Bleeding & Wounds",
    "severityBadge": "Emergency",
    "whatIsIt": "Complete or partial severing of a body part, requiring immediate bleeding control and preservation of the part.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "PhoneCall",
        "action": "Call 112 immediately",
        "detail": "Dial 112 instantly. Press clean pads heavily onto the stump to control arterial bleeding."
      },
      {
        "icon": "Layers",
        "action": "Wrap severed part",
        "detail": "Wrap the severed part in a damp sterile cloth and place it inside a sealed plastic bag."
      },
      {
        "icon": "Snowflake",
        "action": "Place bag on ice",
        "detail": "Set the sealed bag into an ice-water bath. Keep it cold but never let tissue freeze."
      }
    ],
    "whatNotToDo": [
      "Never place severed tissue directly in water or directly on bare ice.",
      "Do not use a tourniquet unless bleeding cannot be controlled by direct pressure."
    ],
    "whenToGetHelp": [
      "Immediate 112 emergency response is mandatory for all amputations."
    ],
    "quickReminder": "Call 112, stop bleeding with hard pressure, wrap severed part damp and keep on ice."
  },
  {
    "id": "internal-bleeding",
    "title": "Suspected Internal Bleeding",
    "category": "Bleeding & Wounds",
    "severityBadge": "Emergency",
    "whatIsIt": "Bleeding inside the body with no visible wound, signaled by pain, swelling, or signs of shock after trauma.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "PhoneCall",
        "action": "Call 112 right away",
        "detail": "Call 112. Report blunt impact, abdominal pain, or rapid heartbeat."
      },
      {
        "icon": "User",
        "action": "Lie flat and elevate legs",
        "detail": "Keep person lying still on their back with feet elevated 30 cm (unless spinal injury suspected)."
      },
      {
        "icon": "Shield",
        "action": "Cover and keep warm",
        "detail": "Place a blanket over them to preserve body heat and prevent shock."
      }
    ],
    "whatNotToDo": [
      "Do not give any food or water (emergency surgery may be needed).",
      "Do not let the person get up or walk around."
    ],
    "whenToGetHelp": [
      "Coughing blood, bruised rigid belly, or cold clammy skin after trauma."
    ],
    "quickReminder": "Call 112 immediately, lie flat, keep warm, and give nothing by mouth."
  },
  {
    "id": "sunburn",
    "title": "Sunburn",
    "category": "Burns",
    "severityBadge": "Mild",
    "whatIsIt": "Skin reddening and pain from prolonged UV exposure, sometimes with mild blistering.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Snowflake",
        "action": "Cool the skin",
        "detail": "Apply cool, damp cloths or take a lukewarm bath for 15 minutes."
      },
      {
        "icon": "Droplet",
        "action": "Moisturize",
        "detail": "Apply pure aloe vera gel or calamine lotion while skin is slightly damp."
      },
      {
        "icon": "Coffee",
        "action": "Drink plenty of water",
        "detail": "Hydrate well to counteract dehydration from fluid loss through hot skin."
      }
    ],
    "whatNotToDo": [
      "Do not apply butter, cooking oils, or petroleum jelly to hot sunburns.",
      "Do not peel or scratch off flaking skin."
    ],
    "whenToGetHelp": [
      "Severe blistering covers large areas, accompanied by high fever or dizziness."
    ],
    "quickReminder": "Cool compresses, pure aloe vera, and abundant drinking water."
  },
  {
    "id": "minor-scald",
    "title": "Minor Scald from Hot Liquid",
    "category": "Burns",
    "severityBadge": "Mild",
    "whatIsIt": "A small first-degree burn from spilled hot water, tea, or cooking liquid.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Cool tap water 20 min",
        "detail": "Gently hold the scalded skin under cool running tap water for 20 continuous minutes."
      },
      {
        "icon": "Shield",
        "action": "Remove tight items",
        "detail": "Take off rings, watches, or restrictive clothing before swelling sets in."
      },
      {
        "icon": "Layers",
        "action": "Cover loosely",
        "detail": "Cover loosely with clean plastic cling wrap or a sterile non-stick bandage."
      }
    ],
    "whatNotToDo": [
      "Never apply ice or ice water directly to burns.",
      "Do not use toothpaste, butter, or flour."
    ],
    "whenToGetHelp": [
      "Burn is larger than the person's palm or located on face, hands, or groin."
    ],
    "quickReminder": "20 minutes of cool running tap water, remove jewelry, cover loosely."
  },
  {
    "id": "chemical-burns",
    "title": "Chemical Contact Burns",
    "category": "Burns",
    "severityBadge": "Moderate",
    "whatIsIt": "Skin damage caused by contact with an acidic or caustic household or industrial chemical.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Shield",
        "action": "Brush dry chemicals off",
        "detail": "If dry powder, brush it off skin with a cloth before applying water."
      },
      {
        "icon": "Droplet",
        "action": "Flood with water 20 min",
        "detail": "Rinse the area with copious running tap water for at least 20 continuous minutes."
      },
      {
        "icon": "Layers",
        "action": "Remove clothing",
        "detail": "Take off contaminated clothes while flushing skin under running water."
      }
    ],
    "whatNotToDo": [
      "Do not try to neutralize acids with bases (causes exothermic heat reactions).",
      "Do not delay flushing to read label instructions."
    ],
    "whenToGetHelp": [
      "Chemical splashed in eyes or covers a large area — call 112 immediately."
    ],
    "quickReminder": "Brush dry powders off, then flush continuously under tap water for 20 minutes."
  },
  {
    "id": "steam-burns",
    "title": "Steam Burns",
    "category": "Burns",
    "severityBadge": "Moderate",
    "whatIsIt": "Burns from direct contact with hot steam, often deeper than they first appear.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Cool water for 20 min",
        "detail": "Hold under cool running tap water immediately for 20 continuous minutes."
      },
      {
        "icon": "Layers",
        "action": "Protect with plastic wrap",
        "detail": "Cover with clean plastic cling wrap layered flat without adhesive."
      },
      {
        "icon": "ArrowUp",
        "action": "Elevate injured limb",
        "detail": "Prop the burned hand or arm up to reduce throbbing and edema."
      }
    ],
    "whatNotToDo": [
      "Do not pop steam blisters that arise over the next hours.",
      "Do not apply greasy antibiotic creams immediately."
    ],
    "whenToGetHelp": [
      "Steam was inhaled into mouth or nose (airway swelling risk). Call 112."
    ],
    "quickReminder": "Cool under tap water for 20 minutes and cover loosely with clean film."
  },
  {
    "id": "electrical-burns",
    "title": "Electrical Burns",
    "category": "Burns",
    "severityBadge": "Urgent",
    "whatIsIt": "Tissue damage from electrical current passing through the body, which can be severe internally despite a small entry wound.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Shield",
        "action": "Ensure power is OFF",
        "detail": "Never touch the person until the power source is switched off or disconnected."
      },
      {
        "icon": "PhoneCall",
        "action": "Call 112 immediately",
        "detail": "Call 112. Internal organ damage can occur even with small skin marks."
      },
      {
        "icon": "Bandage",
        "action": "Cover both wounds",
        "detail": "Check for both entrance and exit burn spots; cover both with clean dry dressings."
      }
    ],
    "whatNotToDo": [
      "Do not touch victim with bare hands while they are touching the live circuit."
    ],
    "whenToGetHelp": [
      "All electrical burns require professional hospital monitoring for cardiac rhythm."
    ],
    "quickReminder": "Turn power off first, call 112, and cover entrance and exit burn marks."
  },
  {
    "id": "friction-burns",
    "title": "Friction Burns",
    "category": "Burns",
    "severityBadge": "Urgent",
    "whatIsIt": "Skin abrasion combined with heat damage from fast-moving contact against rope, road, or machinery.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "Droplet",
        "action": "Cool for 15 minutes",
        "detail": "Irrigate gently with cool clean water to soothe heat and wash out grit."
      },
      {
        "icon": "Shield",
        "action": "Apply sterile ointment",
        "detail": "Coat with sterile petroleum ointment to keep the raw surface from sticking."
      },
      {
        "icon": "Layers",
        "action": "Non-stick sterile wrap",
        "detail": "Cover with a sterile non-stick pad and secure with soft gauze."
      }
    ],
    "whatNotToDo": [
      "Do not rip away clothing fibers stuck firmly inside the burn."
    ],
    "whenToGetHelp": [
      "Friction burn extends deep into muscle or covers an entire joint."
    ],
    "quickReminder": "Cool with tap water, coat with sterile petroleum jelly, and protect with non-stick pads."
  },
  {
    "id": "third-degree-burns",
    "title": "Third-Degree (Full-Thickness) Burns",
    "category": "Burns",
    "severityBadge": "Emergency",
    "whatIsIt": "A burn destroying all skin layers, leaving the area white, leathery, or charred with reduced sensation.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "PhoneCall",
        "action": "Call 112 immediately",
        "detail": "Dial 112 right away. This is a critical medical emergency."
      },
      {
        "icon": "Layers",
        "action": "Dry sterile cover",
        "detail": "Cover with a clean, dry, lint-free sheet or sterile cloth."
      },
      {
        "icon": "Shield",
        "action": "Treat for shock",
        "detail": "Keep the person warm with a light blanket and elevate legs if possible."
      }
    ],
    "whatNotToDo": [
      "Never immerse large third-degree burns in cold water (triggers hypothermia and shock).",
      "Never pull away clothing stuck to charred skin."
    ],
    "whenToGetHelp": [
      "Call 112 immediately for all suspected third-degree burns."
    ],
    "quickReminder": "Call 112, cover with dry sterile cloth, treat for shock — never soak in cold water."
  },
  {
    "id": "large-area-burns",
    "title": "Large Area Burns (Over 10% of Body)",
    "category": "Burns",
    "severityBadge": "Emergency",
    "whatIsIt": "Extensive burns covering a large portion of the body, carrying high risk of fluid loss and shock.",
    "linkedProtocolId": "burn",
    "steps": [
      {
        "icon": "PhoneCall",
        "action": "Call 112 instantly",
        "detail": "Call 112 immediately. State burn percentage and request burn center transport."
      },
      {
        "icon": "Shield",
        "action": "Extinguish fire",
        "detail": "Ensure flames are completely out; remove loose smoldering clothes."
      },
      {
        "icon": "Layers",
        "action": "Cover with clean sheets",
        "detail": "Drape with clean, dry cotton sheets to prevent fluid evaporation and contamination."
      }
    ],
    "whatNotToDo": [
      "Do not apply ice water or wet towels over large areas (causes fatal hypothermia).",
      "Do not give large amounts of water to drink."
    ],
    "whenToGetHelp": [
      "Call 112 immediately."
    ],
    "quickReminder": "Call 112 immediately, cover with clean dry sheets, keep warm to prevent shock."
  },
  {
    "id": "infant-cpr",
    "title": "Infant CPR (Under 1 Year)",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "Lifesaving chest compressions and rescue breaths for an unresponsive infant not breathing normally.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Check & call 112",
        "detail": "Flick foot sole. If no breathing, shout for help and dial 112 on speaker."
      },
      {
        "icon": "Check",
        "action": "2 fingers, 1.5 in deep",
        "detail": "Place 2 fingers below nipple line. Push at 100-120 BPM, 30 times."
      },
      {
        "icon": "Check",
        "action": "2 gentle puffs",
        "detail": "Cover baby mouth AND nose with your mouth. Give 2 gentle puffs."
      }
    ],
    "whatNotToDo": [
      "Do not tilt infant head far back (blocks tiny airway).",
      "Do not blow forcefully like adult CPR."
    ],
    "whenToGetHelp": [
      "Continue 30 pushes and 2 puffs until emergency paramedics arrive."
    ],
    "quickReminder": "Flick foot, 30 two-finger compressions (1.5 in), 2 gentle puffs over mouth and nose.",
    "offlineReady": true
  },
  {
    "id": "child-cpr",
    "title": "Child CPR (1–8 Years)",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "Adapted CPR technique for a child in cardiac arrest, using child-appropriate compression depth and rate.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Check & call 112",
        "detail": "Tap collarbone and shout name. If no breathing, call 112 on speaker."
      },
      {
        "icon": "Check",
        "action": "1 or 2 hands, 2 in deep",
        "detail": "Push center of chest 2 inches deep at 100-120 BPM for 30 compressions."
      },
      {
        "icon": "Check",
        "action": "2 rescue breaths",
        "detail": "Tilt head, pinch nose, give 2 breaths making chest visibly rise."
      }
    ],
    "whatNotToDo": [
      "Do not interrupt compressions for more than 10 seconds."
    ],
    "whenToGetHelp": [
      "Continue CPR cycles until AED arrives or child shows signs of life."
    ],
    "quickReminder": "Call 112, 30 chest compressions (2 inches deep), 2 rescue breaths at 100-120 BPM.",
    "offlineReady": true
  },
  {
    "id": "infant-choking",
    "title": "Infant Choking",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "Airway obstruction in a baby under one year, requiring back blows and chest thrusts instead of abdominal thrusts.",
    "linkedProtocolId": "choking",
    "steps": [
      {
        "icon": "Check",
        "action": "5 back blows",
        "detail": "Rest infant facedown on your forearm, head low. Give 5 firm slaps between shoulder blades."
      },
      {
        "icon": "Check",
        "action": "5 chest thrusts",
        "detail": "Turn baby faceup on other arm. Give 5 quick chest thrusts with 2 fingers."
      },
      {
        "icon": "Check",
        "action": "Repeat cycle & 112",
        "detail": "Repeat 5 blows and 5 thrusts until object clears. Call 112 if baby turns blue."
      }
    ],
    "whatNotToDo": [
      "Never do blind finger sweeps (can push object deeper).",
      "Never perform abdominal Heimlich thrusts on infants under 1."
    ],
    "whenToGetHelp": [
      "Baby goes limp, stops making sounds, or turns blue. Call 112 and start infant CPR."
    ],
    "quickReminder": "5 back slaps head-down, 5 chest thrusts with 2 fingers — repeat until object pops out.",
    "offlineReady": true
  },
  {
    "id": "child-choking",
    "title": "Child Choking",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "A blocked airway in a young child from food or a small object, needing modified abdominal thrusts.",
    "linkedProtocolId": "choking",
    "steps": [
      {
        "icon": "Check",
        "action": "Kneel behind child",
        "detail": "Get down to child's height. Wrap arms around child's waist."
      },
      {
        "icon": "Check",
        "action": "Fist above navel",
        "detail": "Place thumb side of fist just above belly button and below ribcage."
      },
      {
        "icon": "Check",
        "action": "Inward & upward thrusts",
        "detail": "Grasp fist with other hand; give quick upward thrusts until object expels."
      }
    ],
    "whatNotToDo": [
      "Do not slap back while child is standing upright without bending them forward."
    ],
    "whenToGetHelp": [
      "Child cannot speak, cough, or breathe. Call 112 immediately."
    ],
    "quickReminder": "Kneel behind child, make fist above navel, give quick upward thrusts.",
    "offlineReady": true
  },
  {
    "id": "drowning",
    "title": "Drowning & Near-Drowning",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "Rescue and breathing support for someone who has inhaled water and is struggling to breathe or unconscious.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Safe rescue & call 112",
        "detail": "Remove person safely from water. Shout for 112 immediately."
      },
      {
        "icon": "Check",
        "action": "5 initial rescue breaths",
        "detail": "For drowning victims, start with 5 rescue breaths before chest compressions."
      },
      {
        "icon": "Check",
        "action": "Continue 30:2 CPR",
        "detail": "Perform 30 compressions followed by 2 rescue breaths. Keep warm."
      }
    ],
    "whatNotToDo": [
      "Do not try to drain water from the stomach by pressing on the belly."
    ],
    "whenToGetHelp": [
      "All near-drowning victims must go to hospital due to secondary drowning risk."
    ],
    "quickReminder": "Call 112, give 5 initial rescue breaths, then 30:2 CPR until help arrives.",
    "offlineReady": true
  },
  {
    "id": "severe-asthma",
    "title": "Severe Asthma Attack",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "A dangerous narrowing of the airways causing extreme difficulty breathing, wheezing, and possible blue lips.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Sit upright",
        "detail": "Help person sit upright; leaning forward slightly helps lungs expand."
      },
      {
        "icon": "Check",
        "action": "Reliever inhaler (4 puffs)",
        "detail": "Give 4 puffs of blue inhaler (with spacer if available), 1 puff per minute."
      },
      {
        "icon": "Check",
        "action": "Call 112 if no relief",
        "detail": "If no improvement after 4 minutes, give 4 more puffs and call 112 immediately."
      }
    ],
    "whatNotToDo": [
      "Do not have them lie down flat.",
      "Do not crowd the person; ensure fresh air."
    ],
    "whenToGetHelp": [
      "Lips turn blue/grey, or unable to speak full sentences. Call 112."
    ],
    "quickReminder": "Sit upright, 4 puffs of blue inhaler with spacer, call 112 if no relief in 4 minutes.",
    "offlineReady": true
  },
  {
    "id": "anaphylactic-swelling",
    "title": "Anaphylactic Airway Swelling",
    "category": "Breathing & Airway",
    "severityBadge": "Emergency",
    "whatIsIt": "Rapid throat and airway swelling from a severe allergic reaction that can cut off breathing within minutes.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Use EpiPen immediately",
        "detail": "Press auto-injector firmly into outer middle thigh until it clicks; hold 3 seconds."
      },
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Tell dispatcher \"anaphylaxis / allergic throat swelling\"."
      },
      {
        "icon": "Check",
        "action": "Lie flat or sit slightly",
        "detail": "Keep person lying down with legs elevated; sit up only if breathing is difficult."
      }
    ],
    "whatNotToDo": [
      "Never allow the person to suddenly stand or walk (causes fatal blood pressure crash)."
    ],
    "whenToGetHelp": [
      "EpiPen injection and immediate 112 transport are mandatory."
    ],
    "quickReminder": "EpiPen into outer thigh, call 112, keep lying flat with legs up.",
    "offlineReady": true
  },
  {
    "id": "hyperventilation",
    "title": "Hyperventilation",
    "category": "Breathing & Airway",
    "severityBadge": "Urgent",
    "whatIsIt": "Rapid, shallow breathing often triggered by panic or anxiety, causing lightheadedness and tingling.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Calm environment",
        "detail": "Sit the person down in a quiet space and speak in a calm, soothing voice."
      },
      {
        "icon": "Check",
        "action": "Box breathing",
        "detail": "Guide them to breathe in for 4 seconds, hold 4, breathe out slowly for 6."
      },
      {
        "icon": "Check",
        "action": "Cup hands",
        "detail": "Have them cup hands over mouth and nose to rebreathe carbon dioxide."
      }
    ],
    "whatNotToDo": [
      "Do not use a brown paper bag (hazardous if cause is asthma or cardiac)."
    ],
    "whenToGetHelp": [
      "Person loses consciousness or complains of chest pressure."
    ],
    "quickReminder": "Sit down, breathe slowly through pursed lips, cup hands if dizzy.",
    "offlineReady": true
  },
  {
    "id": "croup-cough",
    "title": "Croup (Barking Cough in Children)",
    "category": "Breathing & Airway",
    "severityBadge": "Moderate",
    "whatIsIt": "A viral infection causing a distinctive barking cough and noisy breathing, mainly in young children.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Keep child calm",
        "detail": "Comfort and hold child upright. Crying worsens airway narrowing."
      },
      {
        "icon": "Check",
        "action": "Warm steam / cool air",
        "detail": "Sit in a steamy bathroom for 10-15 minutes or take outside into cool night air."
      },
      {
        "icon": "Check",
        "action": "Hydrate in sips",
        "detail": "Offer small frequent sips of cool water."
      }
    ],
    "whatNotToDo": [
      "Do not give adult cough syrups or aspirins to children."
    ],
    "whenToGetHelp": [
      "High-pitched whistling sound when resting or chest indrawing. Call 112."
    ],
    "quickReminder": "Keep child calm, sit upright in steamy bathroom, call 112 if breathing is strained.",
    "offlineReady": true
  },
  {
    "id": "unexplained-shortness-of-breath",
    "title": "Sudden Unexplained Shortness of Breath",
    "category": "Breathing & Airway",
    "severityBadge": "Urgent",
    "whatIsIt": "Difficulty breathing at rest that comes on quickly, without a known trigger like exercise.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Rest seated upright",
        "detail": "Stop all activity and sit supported in a comfortable armchair."
      },
      {
        "icon": "Check",
        "action": "Loosen collar",
        "detail": "Unbutton tight collar, tie, or chest clothing."
      },
      {
        "icon": "Check",
        "action": "Call 112",
        "detail": "Seek urgent evaluation for possible pulmonary clot, pneumothorax, or cardiac event."
      }
    ],
    "whatNotToDo": [
      "Do not attempt vigorous deep breathing exercises."
    ],
    "whenToGetHelp": [
      "Accompanied by chest tightness, fainting, or blue nails. Call 112."
    ],
    "quickReminder": "Sit upright, loosen tight collar, and call 112 immediately for emergency evaluation.",
    "offlineReady": true
  },
  {
    "id": "heart-attack",
    "title": "Suspected Heart Attack",
    "category": "Cardiac",
    "severityBadge": "Emergency",
    "whatIsIt": "Chest pain, pressure, or tightness possibly spreading to the arm or jaw, signaling reduced blood flow to the heart.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Dial 112 right away. State \"suspected heart attack\"."
      },
      {
        "icon": "Check",
        "action": "Rest in W-position",
        "detail": "Sit on floor with back supported and knees bent (W-position) to reduce heart strain."
      },
      {
        "icon": "Check",
        "action": "Chew aspirin 300mg",
        "detail": "If not allergic, have person slowly chew one 300mg aspirin while awaiting ambulance."
      }
    ],
    "whatNotToDo": [
      "Do not let them walk to the car or drive themselves to the hospital."
    ],
    "whenToGetHelp": [
      "Severe crushing chest pain, sweating, jaw or left arm ache. Call 112."
    ],
    "quickReminder": "Call 112 immediately, sit in supported W-position, chew 300mg aspirin if not allergic.",
    "offlineReady": true
  },
  {
    "id": "cardiac-arrest-aed",
    "title": "Sudden Cardiac Arrest (AED Use)",
    "category": "Cardiac",
    "severityBadge": "Emergency",
    "whatIsIt": "A person collapses with no pulse or breathing, requiring immediate CPR and an automated external defibrillator.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 & get AED",
        "detail": "Shout for someone to bring an AED and call 112 on speaker."
      },
      {
        "icon": "Check",
        "action": "Start continuous CPR",
        "detail": "Push hard and fast in center of chest at 110 BPM (2 inches deep)."
      },
      {
        "icon": "Check",
        "action": "Turn on AED",
        "detail": "Open AED, stick pads on bare chest as shown in pictures, follow voice prompts."
      }
    ],
    "whatNotToDo": [
      "Do not touch the patient while AED is analyzing or delivering a shock."
    ],
    "whenToGetHelp": [
      "Unresponsive, no breathing or only gasping sounds. Continuous CPR required."
    ],
    "quickReminder": "Call 112, push hard & fast at 110 BPM, attach AED and follow voice instructions.",
    "offlineReady": true
  },
  {
    "id": "racing-heartbeat",
    "title": "Irregular or Racing Heartbeat",
    "category": "Cardiac",
    "severityBadge": "Urgent",
    "whatIsIt": "A sudden, noticeable change in heart rhythm that feels fluttering, pounding, or skipped.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Sit and rest",
        "detail": "Stop physical activity and sit in a cool, quiet room."
      },
      {
        "icon": "Check",
        "action": "Vagal maneuvers",
        "detail": "Blow gently into an empty syringe or cough deeply to help reset rhythm."
      },
      {
        "icon": "Check",
        "action": "Check pulse rate",
        "detail": "Count beats for 30 seconds to record heart rate for doctors."
      }
    ],
    "whatNotToDo": [
      "Do not consume caffeine, energy drinks, or nicotine."
    ],
    "whenToGetHelp": [
      "Heart rate over 150 BPM at rest, accompanied by chest pain or fainting."
    ],
    "quickReminder": "Sit down, rest calmly, perform gentle vagal cough, seek care if rate remains high.",
    "offlineReady": true
  },
  {
    "id": "unclear-chest-pain",
    "title": "Chest Pain of Unclear Cause",
    "category": "Cardiac",
    "severityBadge": "Urgent",
    "whatIsIt": "Chest discomfort that could be muscular, digestive, or cardiac, warranting careful assessment.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Stop all movement",
        "detail": "Sit down comfortably with head and shoulders supported."
      },
      {
        "icon": "Check",
        "action": "Assess symptoms",
        "detail": "Note if pain changes with deep breathing (muscular) or radiates to arm (cardiac)."
      },
      {
        "icon": "Check",
        "action": "Call 112 if uncertain",
        "detail": "Never ignore chest pain; always err on the side of caution with emergency services."
      }
    ],
    "whatNotToDo": [
      "Do not assume it is just gas or indigestion without medical evaluation."
    ],
    "whenToGetHelp": [
      "Pain radiates to arm, back, or jaw with cold sweat or dizziness. Call 112."
    ],
    "quickReminder": "Sit and rest comfortably; treat as potential emergency until evaluated.",
    "offlineReady": true
  },
  {
    "id": "high-blood-pressure",
    "title": "High Blood Pressure Episode",
    "category": "Cardiac",
    "severityBadge": "Moderate",
    "whatIsIt": "A sudden spike in blood pressure causing headache, flushing, or visual disturbance.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Sit quietly 10 mins",
        "detail": "Rest in a quiet, dark room without talking."
      },
      {
        "icon": "Check",
        "action": "Take prescribed medication",
        "detail": "If prescribed emergency blood pressure medication, take as directed."
      },
      {
        "icon": "Check",
        "action": "Retest after 15 mins",
        "detail": "Check BP again after resting."
      }
    ],
    "whatNotToDo": [
      "Do not panic or rush around (anxiety spikes pressure further)."
    ],
    "whenToGetHelp": [
      "Blood pressure above 180/120 with chest pain, vision loss, or confusion. Call 112."
    ],
    "quickReminder": "Rest quietly in a dim room, take prescribed meds, call 112 if over 180/120.",
    "offlineReady": true
  },
  {
    "id": "fainting-chest-symptoms",
    "title": "Fainting with Chest Symptoms",
    "category": "Cardiac",
    "severityBadge": "Urgent",
    "whatIsIt": "Loss of consciousness accompanied by chest pain or palpitations, needing closer evaluation than a simple faint.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Lie flat with legs up",
        "detail": "Keep person lying flat on back with legs raised 30 cm."
      },
      {
        "icon": "Check",
        "action": "Check breathing",
        "detail": "Ensure airway is open and breathing is steady."
      },
      {
        "icon": "Check",
        "action": "Call 112",
        "detail": "Fainting preceded by chest pain or fluttering requires urgent cardiac workup."
      }
    ],
    "whatNotToDo": [
      "Do not let them stand up immediately upon regaining consciousness."
    ],
    "whenToGetHelp": [
      "Any faint with preceding chest pain, shortness of breath, or cardiac history."
    ],
    "quickReminder": "Lie flat, raise legs 30 cm, monitor breathing, call 112 for cardiac evaluation.",
    "offlineReady": true
  },
  {
    "id": "muscle-cramps",
    "title": "Muscle Cramps",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Mild",
    "whatIsIt": "A sudden, involuntary muscle contraction causing sharp, temporary pain, often in the calf or thigh.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Gently stretch",
        "detail": "Slowly extend the cramped muscle (e.g. pull toes upward toward shin for calf cramp)."
      },
      {
        "icon": "Check",
        "action": "Massage firmly",
        "detail": "Knead the knot gently with thumbs."
      },
      {
        "icon": "Check",
        "action": "Hydrate with electrolytes",
        "detail": "Drink water with a pinch of salt or an electrolyte drink."
      }
    ],
    "whatNotToDo": [
      "Do not forcefully jerk or over-stretch the muscle."
    ],
    "whenToGetHelp": [
      "Severe swelling, redness, or cramp that does not resolve after 20 minutes."
    ],
    "quickReminder": "Gently stretch muscle, massage the tight knot, drink electrolyte fluid.",
    "offlineReady": true
  },
  {
    "id": "bruises-contusions",
    "title": "Bruises & Contusions",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Mild",
    "whatIsIt": "Discolored, tender skin from blood pooling under the surface after a minor knock or fall.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Ice pack wrapped",
        "detail": "Apply a cold pack wrapped in a towel for 15-20 minutes."
      },
      {
        "icon": "Check",
        "action": "Elevate area",
        "detail": "Prop bruised limb on pillows to minimize blood pooling."
      },
      {
        "icon": "Check",
        "action": "Rest the muscle",
        "detail": "Avoid strenuous impact on the bruised tissue for 24 hours."
      }
    ],
    "whatNotToDo": [
      "Never put bare ice directly on skin."
    ],
    "whenToGetHelp": [
      "Bruise expands rapidly or joint cannot move."
    ],
    "quickReminder": "Cold pack wrapped in towel for 15 minutes, elevate limb, and rest.",
    "offlineReady": true
  },
  {
    "id": "sprained-ankle",
    "title": "Sprained Ankle",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Moderate",
    "whatIsIt": "Stretched or torn ligaments around the ankle joint from an awkward twist or landing.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Rest (R.I.C.E.)",
        "detail": "Stop walking; protect the ankle from bearing weight."
      },
      {
        "icon": "Check",
        "action": "Ice & Compress",
        "detail": "Apply cold pack 15 mins, wrap with elastic compression bandage snugly."
      },
      {
        "icon": "Check",
        "action": "Elevate",
        "detail": "Prop ankle above hip level on pillows to drain swelling."
      }
    ],
    "whatNotToDo": [
      "Do not apply heat or hot balms during the first 48 hours (increases swelling)."
    ],
    "whenToGetHelp": [
      "Unable to take 4 steps, or severe bone tenderness right over the ankle bone."
    ],
    "quickReminder": "Follow R.I.C.E: Rest, Ice 15 mins, Compress snugly, Elevate above heart.",
    "offlineReady": true
  },
  {
    "id": "pulled-muscle",
    "title": "Pulled Muscle (Strain)",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Moderate",
    "whatIsIt": "Overstretched or torn muscle fibers causing pain, stiffness, and limited movement.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Stop activity",
        "detail": "Cease exercise immediately to prevent deeper tearing."
      },
      {
        "icon": "Check",
        "action": "Cold compress",
        "detail": "Apply ice wrapped in cloth for 15-20 minutes every 2-3 hours."
      },
      {
        "icon": "Check",
        "action": "Gentle support",
        "detail": "Wrap with an elastic bandage for mild compression."
      }
    ],
    "whatNotToDo": [
      "Do not stretch a freshly torn muscle vigorously."
    ],
    "whenToGetHelp": [
      "Complete inability to move limb or visible bulge in muscle."
    ],
    "quickReminder": "Rest immediately, apply ice pack for 15 minutes, and wrap with elastic bandage.",
    "offlineReady": true
  },
  {
    "id": "concussion",
    "title": "Concussion (Mild Head Injury)",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Moderate",
    "whatIsIt": "A jolt to the head causing brief confusion, headache, or dizziness without loss of consciousness.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Physical & mental rest",
        "detail": "Stop sports or screens immediately; sit in a quiet area."
      },
      {
        "icon": "Check",
        "action": "Cold pack for bump",
        "detail": "Apply ice wrapped in towel to external swellings."
      },
      {
        "icon": "Check",
        "action": "Monitor 24 hours",
        "detail": "Keep under adult supervision for signs of worsening brain injury."
      }
    ],
    "whatNotToDo": [
      "Do not return to sports on the same day."
    ],
    "whenToGetHelp": [
      "Repeated vomiting, unequal pupils, worsening confusion, or seizure. Call 112."
    ],
    "quickReminder": "Immediate physical rest, monitor for 24 hours, call 112 if vomiting or confused.",
    "offlineReady": true
  },
  {
    "id": "dislocated-shoulder",
    "title": "Dislocated Shoulder",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Urgent",
    "whatIsIt": "The upper arm bone popped out of its socket, causing visible deformity and intense pain.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Support in sling",
        "detail": "Support arm in the most comfortable position using a sling or folded jacket."
      },
      {
        "icon": "Check",
        "action": "Ice for pain",
        "detail": "Place an ice pack wrapped in a towel over the joint."
      },
      {
        "icon": "Check",
        "action": "Head to ER",
        "detail": "Transport to hospital emergency department for medical relocation."
      }
    ],
    "whatNotToDo": [
      "Never attempt to forcefully pop the shoulder back into place yourself."
    ],
    "whenToGetHelp": [
      "Numbness or tingling in fingers or lost wrist pulse."
    ],
    "quickReminder": "Support arm gently in place, apply ice, never pop it back yourself, go to ER.",
    "offlineReady": true
  },
  {
    "id": "dislocated-finger",
    "title": "Dislocated Finger",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Urgent",
    "whatIsIt": "A finger joint forced out of alignment, usually from a ball or fall, causing swelling and deformity.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Immobilize in place",
        "detail": "Tape loosely to adjacent healthy finger (buddy tape) or support with splint."
      },
      {
        "icon": "Check",
        "action": "Ice compress",
        "detail": "Apply an ice pack for 10-15 minutes to control swelling."
      },
      {
        "icon": "Check",
        "action": "Remove rings",
        "detail": "Remove rings immediately before swelling locks them."
      }
    ],
    "whatNotToDo": [
      "Do not yank or pull finger to straighten it."
    ],
    "whenToGetHelp": [
      "Finger turns pale/blue or has an open bone cut."
    ],
    "quickReminder": "Remove rings immediately, buddy-tape to neighbor finger, seek medical realignment.",
    "offlineReady": true
  },
  {
    "id": "rib-fracture",
    "title": "Rib Fracture (Suspected)",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Urgent",
    "whatIsIt": "Sharp pain when breathing or pressing on the chest after a fall or direct blow, suggesting a cracked rib.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Rest supported",
        "detail": "Sit leaning slightly toward injured side with a pillow pressed to chest."
      },
      {
        "icon": "Check",
        "action": "Breathe normally",
        "detail": "Take regular, gentle breaths (avoid shallow breathing which leads to pneumonia)."
      },
      {
        "icon": "Check",
        "action": "Seek X-ray",
        "detail": "Have a doctor assess for underlying lung puncture."
      }
    ],
    "whatNotToDo": [
      "Do not bind the chest tightly with tape (restricts lung expansion)."
    ],
    "whenToGetHelp": [
      "Coughing up pink frothy blood or extreme shortness of breath. Call 112."
    ],
    "quickReminder": "Hug a pillow against chest for support, breathe gently, do not bind tightly.",
    "offlineReady": true
  },
  {
    "id": "knee-ligament-injury",
    "title": "Knee Ligament Injury",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Urgent",
    "whatIsIt": "A twisting injury to the knee causing swelling, instability, or a popping sensation.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Immobilize knee",
        "detail": "Keep leg straight and supported; do not bear weight."
      },
      {
        "icon": "Check",
        "action": "Cold compress",
        "detail": "Apply ice pack wrapped in cloth for 15-20 minutes."
      },
      {
        "icon": "Check",
        "action": "Splint and transport",
        "detail": "Support with a straight splint and visit orthopedic clinic."
      }
    ],
    "whatNotToDo": [
      "Do not attempt to walk or pivot on an unstable knee."
    ],
    "whenToGetHelp": [
      "Knee joint is visibly deformed or foot turns numb."
    ],
    "quickReminder": "Do not walk on injured knee, keep straight, apply ice, get orthopedic check.",
    "offlineReady": true
  },
  {
    "id": "crush-injury",
    "title": "Crush Injury",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Urgent",
    "whatIsIt": "Tissue damage from a heavy object trapping or compressing a body part, which can hide serious internal harm.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Free object quickly if <15m",
        "detail": "If trapped for under 15 minutes, remove the weight immediately."
      },
      {
        "icon": "Check",
        "action": "Call 112 if prolonged",
        "detail": "If trapped >15 mins, call 112 BEFORE moving (crush syndrome toxins risk)."
      },
      {
        "icon": "Check",
        "action": "Control wounds",
        "detail": "Apply sterile dressings and monitor pulse in crushed limb."
      }
    ],
    "whatNotToDo": [
      "Do not release heavy weight suddenly if trapped over 15 minutes without paramedics present."
    ],
    "whenToGetHelp": [
      "Crush syndrome can cause sudden kidney and cardiac failure. Call 112."
    ],
    "quickReminder": "Release quickly if under 15 mins; if over 15 mins, call 112 before moving weight.",
    "offlineReady": true
  },
  {
    "id": "spinal-injury",
    "title": "Suspected Spinal Injury",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Emergency",
    "whatIsIt": "Neck or back trauma with pain, numbness, or weakness, where movement could risk permanent damage.",
    "linkedProtocolId": "fracture",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 & keep still",
        "detail": "Dial 112. Instruct patient not to move head or neck at all."
      },
      {
        "icon": "Check",
        "action": "Hold head manual in-line",
        "detail": "Kneel above head, place hands firmly on both sides of head to prevent turning."
      },
      {
        "icon": "Check",
        "action": "Maintain open airway",
        "detail": "If vomiting, log-roll with 2-3 helpers keeping spine completely straight."
      }
    ],
    "whatNotToDo": [
      "Never twist, bend, or move head or neck."
    ],
    "whenToGetHelp": [
      "Call 112 immediately for any suspected neck or spine injury."
    ],
    "quickReminder": "Call 112, hold head still with both hands, do not allow any movement.",
    "offlineReady": true
  },
  {
    "id": "head-injury-unconscious",
    "title": "Head Injury with Loss of Consciousness",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Emergency",
    "whatIsIt": "A blow to the head severe enough to cause blackout, vomiting, or unequal pupils.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Dial 112 right away. Keep spine stabilized."
      },
      {
        "icon": "Check",
        "action": "Recovery position if breathing",
        "detail": "If breathing and vomiting, gently roll into recovery position keeping neck straight."
      },
      {
        "icon": "Check",
        "action": "Monitor airway",
        "detail": "Check breathing every 60 seconds. Start CPR if breathing stops."
      }
    ],
    "whatNotToDo": [
      "Do not give food, water, or aspirin."
    ],
    "whenToGetHelp": [
      "Any head injury with unconsciousness requires emergency 112 ambulance."
    ],
    "quickReminder": "Call 112, keep neck still, place in recovery position if vomiting, monitor breathing.",
    "offlineReady": true
  },
  {
    "id": "shock",
    "title": "Signs of Shock",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Emergency",
    "whatIsIt": "A life-threatening drop in blood flow to organs after severe injury, marked by pale skin, rapid pulse, and confusion.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Call 112. State \"patient is in shock\"."
      },
      {
        "icon": "Check",
        "action": "Lie flat & raise legs",
        "detail": "Lie person down and elevate legs 30 cm unless spine or leg fracture is present."
      },
      {
        "icon": "Check",
        "action": "Keep warm",
        "detail": "Cover with blankets to preserve core body heat."
      }
    ],
    "whatNotToDo": [
      "Do not give anything to eat or drink."
    ],
    "whenToGetHelp": [
      "Pale clammy skin, blue lips, rapid weak pulse, confusion. Call 112."
    ],
    "quickReminder": "Call 112 immediately, lie flat with legs up, cover with blanket, reassure calmly.",
    "offlineReady": true
  },
  {
    "id": "electric-shock",
    "title": "Electric Shock Injury",
    "category": "Trauma & Musculoskeletal",
    "severityBadge": "Emergency",
    "whatIsIt": "Injury from electrical current passing through the body, which can disrupt heart rhythm even without visible burns.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Isolate power first",
        "detail": "Switch off breaker or push wire away with dry wooden broomstick."
      },
      {
        "icon": "Check",
        "action": "Call 112 & check breathing",
        "detail": "Call 112. If unresponsive and not breathing, begin CPR immediately."
      },
      {
        "icon": "Check",
        "action": "Cover burns",
        "detail": "Protect entry and exit wounds with clean sterile cloths."
      }
    ],
    "whatNotToDo": [
      "Never touch the person while still touching the electrical source."
    ],
    "whenToGetHelp": [
      "Cardiac arrhythmia can develop hours later. All victims require hospital check."
    ],
    "quickReminder": "Disconnect power source first, check breathing/CPR, call 112 immediately.",
    "offlineReady": true
  },
  {
    "id": "dehydration",
    "title": "Dehydration",
    "category": "Environmental",
    "severityBadge": "Mild",
    "whatIsIt": "Fluid loss from heat, exertion, or illness causing thirst, dry mouth, and fatigue.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Sip fluids slowly",
        "detail": "Drink cool water, ORS (Oral Rehydration Salts), or clear broths in small frequent sips."
      },
      {
        "icon": "Check",
        "action": "Rest in shade",
        "detail": "Move out of heat and rest in cool shade or air conditioning."
      },
      {
        "icon": "Check",
        "action": "Cool skin",
        "detail": "Wipe forehead and neck with a damp cloth."
      }
    ],
    "whatNotToDo": [
      "Do not gulp down large quantities of ice-cold water rapidly (causes stomach cramps).",
      "Do not drink sugary sodas or alcohol."
    ],
    "whenToGetHelp": [
      "Sunken eyes, extreme confusion, or no urination for over 8 hours."
    ],
    "quickReminder": "Rest in shade, sip ORS or water slowly, cool down.",
    "offlineReady": true
  },
  {
    "id": "frostnip",
    "title": "Frostnip (Early Cold Exposure)",
    "category": "Environmental",
    "severityBadge": "Mild",
    "whatIsIt": "Mild freezing of the skin's surface, usually on fingers, ears, or nose, causing numbness and pale patches.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Get to warmth",
        "detail": "Move indoors out of wind and cold."
      },
      {
        "icon": "Check",
        "action": "Warm skin-to-skin",
        "detail": "Place cold fingers into armpits or cup warm hands over nose and ears."
      },
      {
        "icon": "Check",
        "action": "Warm water soak",
        "detail": "Immerse in warm (NOT hot) water (37-40°C) for 15-30 minutes."
      }
    ],
    "whatNotToDo": [
      "Never rub or massage frostnipped skin with snow or rough towels."
    ],
    "whenToGetHelp": [
      "Skin turns hard, waxy, or greyish-white (signs of true frostbite)."
    ],
    "quickReminder": "Rewarm gently with body heat or warm water; never rub with snow.",
    "offlineReady": true
  },
  {
    "id": "tick-bite",
    "title": "Tick Bite",
    "category": "Environmental",
    "severityBadge": "Mild",
    "whatIsIt": "A tick attached to the skin, needing careful, complete removal to reduce infection risk.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Fine-tipped tweezers",
        "detail": "Grasp the tick as close to the skin surface as possible."
      },
      {
        "icon": "Check",
        "action": "Pull straight out",
        "detail": "Pull steadily upward with even pressure without twisting or jerking."
      },
      {
        "icon": "Check",
        "action": "Disinfect skin",
        "detail": "Clean the bite with rubbing alcohol or soap and water."
      }
    ],
    "whatNotToDo": [
      "Do not smother tick with petroleum jelly, nail polish, or heat with matches."
    ],
    "whenToGetHelp": [
      "A target bullseye rash, fever, or joint aches appear over the next 3 weeks."
    ],
    "quickReminder": "Grip tick close to skin with tweezers, pull straight out, disinfect with alcohol.",
    "offlineReady": true
  },
  {
    "id": "ant-bites",
    "title": "Ant Bites",
    "category": "Environmental",
    "severityBadge": "Mild",
    "whatIsIt": "Small, itchy welts from ant bites, usually mild but occasionally more reactive in sensitive individuals.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Wash with soap",
        "detail": "Wash the affected skin thoroughly with soap and water."
      },
      {
        "icon": "Check",
        "action": "Cold compress",
        "detail": "Apply an ice pack wrapped in a cloth for 10 minutes to soothe burning."
      },
      {
        "icon": "Check",
        "action": "Antihistamine / Calamine",
        "detail": "Apply calamine lotion or hydrocortisone cream to reduce itching."
      }
    ],
    "whatNotToDo": [
      "Do not scratch or burst the small pustules."
    ],
    "whenToGetHelp": [
      "Swelling spreads to lips, tongue, or breathing becomes tight (call 112)."
    ],
    "quickReminder": "Wash with soap, apply cold compress, use calamine lotion.",
    "offlineReady": true
  },
  {
    "id": "hypothermia",
    "title": "Hypothermia",
    "category": "Environmental",
    "severityBadge": "Moderate",
    "whatIsIt": "A dangerous drop in core body temperature from prolonged cold exposure, causing shivering, confusion, and slowed breathing.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Move to shelter",
        "detail": "Get person out of wind and wet weather into a warm room."
      },
      {
        "icon": "Check",
        "action": "Remove wet clothes",
        "detail": "Strip off wet garments and wrap in warm dry blankets."
      },
      {
        "icon": "Check",
        "action": "Warm sweet drinks",
        "detail": "If conscious, offer warm sweet tea or soup."
      }
    ],
    "whatNotToDo": [
      "Never apply direct intense heat (radiators, heating pads directly on skin).",
      "Do not give alcohol."
    ],
    "whenToGetHelp": [
      "Shivering stops while still cold, slurred speech, or unresponsiveness. Call 112."
    ],
    "quickReminder": "Remove wet clothes, wrap in warm blankets, give warm sweet drinks if awake.",
    "offlineReady": true
  },
  {
    "id": "jellyfish-sting",
    "title": "Jellyfish Sting",
    "category": "Environmental",
    "severityBadge": "Moderate",
    "whatIsIt": "A painful sting from jellyfish tentacles that can leave a raised, burning welt on the skin.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Rinse with seawater",
        "detail": "Wash tentacles off with seawater (never fresh tap water)."
      },
      {
        "icon": "Check",
        "action": "Vinegar soak",
        "detail": "Pour domestic vinegar over the sting for 30 seconds to deactivate stinging cells."
      },
      {
        "icon": "Check",
        "action": "Hot water immersion",
        "detail": "Immerse sting in hot water (as hot as tolerable) for 20 minutes for pain relief."
      }
    ],
    "whatNotToDo": [
      "Never rinse with fresh tap water (triggers remaining venom capsules to fire).",
      "Never rub the sting with sand or towels."
    ],
    "whenToGetHelp": [
      "Sting covers a large area, or person experiences chest pain or breathing difficulty."
    ],
    "quickReminder": "Rinse with seawater and vinegar, soak in hot water, avoid fresh water.",
    "offlineReady": true
  },
  {
    "id": "scorpion-sting",
    "title": "Scorpion Sting",
    "category": "Environmental",
    "severityBadge": "Moderate",
    "whatIsIt": "A sharp, painful sting that can cause numbness, swelling, and in some species more serious symptoms.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Wash with soap",
        "detail": "Clean the sting site gently with soap and water."
      },
      {
        "icon": "Check",
        "action": "Apply cold pack",
        "detail": "Place an ice pack wrapped in a cloth for 10 minutes on and 10 minutes off."
      },
      {
        "icon": "Check",
        "action": "Immobilize & monitor",
        "detail": "Keep the stung limb still and below heart level."
      }
    ],
    "whatNotToDo": [
      "Do not cut the wound or attempt to suck out venom."
    ],
    "whenToGetHelp": [
      "Muscle twitching, drooling, restlessness, or sweating in young children. Call 112."
    ],
    "quickReminder": "Wash with soap, apply wrapped ice pack, keep limb still and seek medical advice.",
    "offlineReady": true
  },
  {
    "id": "cat-scratch-bite",
    "title": "Cat Scratch or Bite",
    "category": "Environmental",
    "severityBadge": "Moderate",
    "whatIsIt": "A puncture or scratch from a cat that carries a notably high infection risk despite looking minor.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Flush immediately",
        "detail": "Wash thoroughly under warm running tap water with mild soap for 5 minutes."
      },
      {
        "icon": "Check",
        "action": "Apply antiseptic",
        "detail": "Dab with povidone-iodine or antibiotic ointment."
      },
      {
        "icon": "Check",
        "action": "Doctor visit",
        "detail": "See a healthcare provider for prophylactic antibiotics and tetanus review."
      }
    ],
    "whatNotToDo": [
      "Do not bandage tightly without thorough washing."
    ],
    "whenToGetHelp": [
      "Red streaks, throbbing heat, or swelling within 24-48 hours."
    ],
    "quickReminder": "Flush under tap for 5 minutes; visit a clinic for antibiotic coverage.",
    "offlineReady": true
  },
  {
    "id": "spider-bite",
    "title": "Spider Bite (Venomous Suspected)",
    "category": "Environmental",
    "severityBadge": "Urgent",
    "whatIsIt": "A bite suspected to be from a venomous spider, with worsening pain, swelling, or skin changes.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Wash bite site",
        "detail": "Wash gently with soap and clean water."
      },
      {
        "icon": "Check",
        "action": "Cold compress",
        "detail": "Apply a cold pack wrapped in a cloth to slow venom spread and relieve pain."
      },
      {
        "icon": "Check",
        "action": "Immobilize limb",
        "detail": "Keep the bitten limb still and at heart level; seek emergency clinic."
      }
    ],
    "whatNotToDo": [
      "Do not apply a tight tourniquet.",
      "Do not cut open the fang marks."
    ],
    "whenToGetHelp": [
      "Severe cramping in belly or back, sweating, fever, or central ulceration."
    ],
    "quickReminder": "Wash with soap, apply cold pack, immobilize limb, get urgent medical evaluation.",
    "offlineReady": true
  },
  {
    "id": "dog-bite-deep",
    "title": "Dog Bite (Deep)",
    "category": "Environmental",
    "severityBadge": "Urgent",
    "whatIsIt": "A deep bite wound from a dog with a real risk of infection and possible rabies exposure.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Wash 10 minutes",
        "detail": "Flush aggressively under running tap water with soap for 10 full minutes."
      },
      {
        "icon": "Check",
        "action": "Press to control blood",
        "detail": "Apply direct pressure with sterile gauze."
      },
      {
        "icon": "Check",
        "action": "Rabies & Tetanus check",
        "detail": "Go directly to emergency clinic for rabies vaccine schedule and wound cleaning."
      }
    ],
    "whatNotToDo": [
      "Do not close deep bite with butterfly strips at home."
    ],
    "whenToGetHelp": [
      "All deep dog bites require prompt professional medical assessment."
    ],
    "quickReminder": "Flush under running water for 10 minutes, control bleeding, get rabies shot.",
    "offlineReady": true
  },
  {
    "id": "high-altitude-sickness",
    "title": "High-Altitude Sickness",
    "category": "Environmental",
    "severityBadge": "Urgent",
    "whatIsIt": "Headache, nausea, and breathlessness from ascending to high altitude too quickly.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Stop ascending",
        "detail": "Do not climb any higher until symptoms completely resolve."
      },
      {
        "icon": "Check",
        "action": "Descend immediately if worse",
        "detail": "Descend 500-1000 meters if headache and nausea do not improve."
      },
      {
        "icon": "Check",
        "action": "Hydrate & rest",
        "detail": "Drink plenty of water and rest comfortably."
      }
    ],
    "whatNotToDo": [
      "Never push through worsening altitude sickness to reach a summit."
    ],
    "whenToGetHelp": [
      "Gurgling breathing, pink sputum, or inability to walk in a straight line (HAPE/HACE). Call 112."
    ],
    "quickReminder": "Stop ascending, descend immediately if symptoms worsen, stay hydrated.",
    "offlineReady": true
  },
  {
    "id": "stingray-urchin",
    "title": "Stingray or Sea Urchin Injury",
    "category": "Environmental",
    "severityBadge": "Urgent",
    "whatIsIt": "A puncture or sting from a stingray barb or sea urchin spine, causing intense pain and embedded fragments.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Hot water soak",
        "detail": "Immerse the injured area in hot water (42-45°C) for 30-90 minutes to break down heat-sensitive venom."
      },
      {
        "icon": "Check",
        "action": "Gently remove spines",
        "detail": "Use tweezers to carefully lift out superficial visible urchin spines."
      },
      {
        "icon": "Check",
        "action": "Disinfect & dress",
        "detail": "Wash with soap and cover loosely; seek medical care for deep spines."
      }
    ],
    "whatNotToDo": [
      "Do not squeeze embedded spines (can shatter brittle spines deeper)."
    ],
    "whenToGetHelp": [
      "Severe spreading infection or deep barb retained in joint."
    ],
    "quickReminder": "Soak in hot water for 30-90 minutes to neutralize venom, extract loose spines gently.",
    "offlineReady": true
  },
  {
    "id": "severe-frostbite",
    "title": "Severe Frostbite",
    "category": "Environmental",
    "severityBadge": "Emergency",
    "whatIsIt": "Deep tissue freezing that turns skin hard, white, and numb, risking permanent damage.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Move to shelter",
        "detail": "Get indoors; prevent further cold exposure."
      },
      {
        "icon": "Check",
        "action": "Warm water bath",
        "detail": "Soak in warm water (37-40°C) until skin softens and color returns (20-30 mins)."
      },
      {
        "icon": "Check",
        "action": "Pad gently",
        "detail": "Place sterile gauze between thawed fingers or toes."
      }
    ],
    "whatNotToDo": [
      "Never thaw frostbite if there is any chance of refreezing before reaching hospital.",
      "Never rub frozen tissue."
    ],
    "whenToGetHelp": [
      "Hard, waxy white or black tissue. Immediate emergency care required."
    ],
    "quickReminder": "Rewarm in warm water bath only if safe from refreezing; pad gently with gauze.",
    "offlineReady": true
  },
  {
    "id": "heat-stroke",
    "title": "Heat Stroke",
    "category": "Environmental",
    "severityBadge": "Emergency",
    "whatIsIt": "A life-threatening rise in body temperature with confusion, hot dry skin, and possible collapse.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Call 112 immediately. State \"heat stroke emergency\"."
      },
      {
        "icon": "Check",
        "action": "Rapid active cooling",
        "detail": "Immerse up to neck in cold water or spray with water and fan vigorously."
      },
      {
        "icon": "Check",
        "action": "Ice packs to neck/armpits",
        "detail": "Place wrapped ice packs in armpits, groin, and neck to cool blood rapidly."
      }
    ],
    "whatNotToDo": [
      "Do not give fever reducers like paracetamol (does not work for environmental heat stroke)."
    ],
    "whenToGetHelp": [
      "Hot dry skin, confusion, fainting, body temp over 40°C. Call 112 immediately."
    ],
    "quickReminder": "Call 112, cool immediately with cold water and fans, apply ice to armpits.",
    "offlineReady": true
  },
  {
    "id": "lightning-strike",
    "title": "Lightning Strike Injury",
    "category": "Environmental",
    "severityBadge": "Emergency",
    "whatIsIt": "A direct or nearby lightning strike that can stop the heart and cause burns or unconsciousness.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Check scene safety & 112",
        "detail": "It is 100% safe to touch the victim; they carry no electrical charge. Call 112."
      },
      {
        "icon": "Check",
        "action": "Start CPR immediately",
        "detail": "If unresponsive and not breathing, begin continuous chest compressions at 110 BPM."
      },
      {
        "icon": "Check",
        "action": "Treat burns & shock",
        "detail": "Cover feather-like burn marks and keep victim warm."
      }
    ],
    "whatNotToDo": [
      "Do not hesitate to touch the victim (lightning victims hold no charge)."
    ],
    "whenToGetHelp": [
      "Immediate 112 emergency response and CPR required."
    ],
    "quickReminder": "Safe to touch! Call 112, start CPR immediately if unresponsive, cover burns.",
    "offlineReady": true
  },
  {
    "id": "snake-bite",
    "title": "Venomous Snake Bite",
    "category": "Environmental",
    "severityBadge": "Emergency",
    "whatIsIt": "A bite from a snake suspected of being venomous, requiring immobilization and urgent care.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 & keep still",
        "detail": "Call 112. Have victim sit completely still; movement spreads venom."
      },
      {
        "icon": "Check",
        "action": "Pressure immobilization",
        "detail": "Wrap a broad elastic bandage firmly up the whole limb (like for a sprain)."
      },
      {
        "icon": "Check",
        "action": "Splint the limb",
        "detail": "Splint the limb to keep joints from bending. Keep below heart level."
      }
    ],
    "whatNotToDo": [
      "Never cut the bite, suck venom, use ice, or apply an arterial tourniquet.",
      "Do not try to catch or kill the snake."
    ],
    "whenToGetHelp": [
      "All snake bites in India must be evaluated immediately at a hospital for anti-snake venom (ASV)."
    ],
    "quickReminder": "Keep completely still, apply broad pressure bandage up limb, splint, call 112.",
    "offlineReady": true
  },
  {
    "id": "non-toxic-plant",
    "title": "Suspected Non-Toxic Plant Ingestion",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Mild",
    "whatIsIt": "A child or adult has eaten an unknown berry or plant that is likely, but not confirmed, harmless.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Clear mouth",
        "detail": "Gently remove any remaining plant parts or berries from mouth."
      },
      {
        "icon": "Check",
        "action": "Save sample",
        "detail": "Take a photo or save a leaf/berry sample in a container."
      },
      {
        "icon": "Check",
        "action": "Call Poison Control",
        "detail": "Call your regional Poison Control or 112 for identification."
      }
    ],
    "whatNotToDo": [
      "Do not induce vomiting."
    ],
    "whenToGetHelp": [
      "Vomiting, drooling, or drowsiness develops."
    ],
    "quickReminder": "Clear mouth, save plant sample, call Poison Control for guidance.",
    "offlineReady": true
  },
  {
    "id": "food-poisoning",
    "title": "Food Poisoning",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Moderate",
    "whatIsIt": "Nausea, vomiting, and diarrhea from contaminated food, usually appearing within hours of eating.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Rest the stomach",
        "detail": "Avoid solid foods for a few hours until stomach settles."
      },
      {
        "icon": "Check",
        "action": "Sip ORS fluids",
        "detail": "Take small frequent sips of water, clear broth, or oral rehydration salts."
      },
      {
        "icon": "Check",
        "action": "Gradual bland diet",
        "detail": "Introduce bland foods: bananas, rice, applesauce, toast (BRAT diet)."
      }
    ],
    "whatNotToDo": [
      "Do not take anti-diarrhea medications without doctor advice (can prolong infection)."
    ],
    "whenToGetHelp": [
      "Blood in stool or vomit, inability to keep liquids down for 24h, high fever."
    ],
    "quickReminder": "Rest stomach, sip ORS rehydration solution, reintroduce bland foods slowly.",
    "offlineReady": true
  },
  {
    "id": "alcohol-intoxication",
    "title": "Alcohol Intoxication",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Moderate",
    "whatIsIt": "Impaired coordination, confusion, and nausea from consuming too much alcohol.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Recovery position",
        "detail": "If lying down, place in recovery position on side so vomit cannot choke them."
      },
      {
        "icon": "Check",
        "action": "Never leave alone",
        "detail": "Stay with the person continuously to monitor breathing."
      },
      {
        "icon": "Check",
        "action": "Keep warm",
        "detail": "Alcohol dilates blood vessels, causing rapid heat loss; wrap in blanket."
      }
    ],
    "whatNotToDo": [
      "Never let them \"sleep it off\" on their back.",
      "Do not give cold showers or force black coffee."
    ],
    "whenToGetHelp": [
      "Breathing slows below 8 breaths/min, skin turns pale or blue, cannot be woken. Call 112."
    ],
    "quickReminder": "Place on side in recovery position, monitor breathing constantly, never leave alone.",
    "offlineReady": true
  },
  {
    "id": "medication-overdose",
    "title": "Accidental Medication Overdose",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Urgent",
    "whatIsIt": "Taking more than the intended dose of a medication, by mistake or a child's accidental access.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Identify medicine",
        "detail": "Locate medicine bottle, box, and note estimated amount and time taken."
      },
      {
        "icon": "Check",
        "action": "Call 112 / Poison Center",
        "detail": "Call 112 or Poison Information Center immediately with the bottle in hand."
      },
      {
        "icon": "Check",
        "action": "Follow exact instructions",
        "detail": "Follow medical dispatcher directions precisely."
      }
    ],
    "whatNotToDo": [
      "Do not induce vomiting unless specifically instructed by Poison Control."
    ],
    "whenToGetHelp": [
      "Person becomes drowsy, unresponsive, or breathes irregularly. Call 112."
    ],
    "quickReminder": "Locate pill bottle, call 112 / Poison Control immediately, do not induce vomiting.",
    "offlineReady": true
  },
  {
    "id": "button-battery-swallowed",
    "title": "Button Battery Ingestion",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Urgent",
    "whatIsIt": "A swallowed button battery, especially in a child, which can cause serious internal burns within hours.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Immediate ER transport",
        "detail": "Go to the nearest emergency hospital immediately."
      },
      {
        "icon": "Check",
        "action": "Honey if >1 year old",
        "detail": "If child is over 1 year and swallowed within 12 hours, give 2 teaspoons of honey every 10 minutes on way to ER."
      },
      {
        "icon": "Check",
        "action": "Keep calm",
        "detail": "Keep child upright and calm."
      }
    ],
    "whatNotToDo": [
      "Do not give honey to infants under 1 year (infant botulism risk).",
      "Do not induce vomiting."
    ],
    "whenToGetHelp": [
      "Button batteries can erode through esophagus in 2 hours. Immediate 112/ER required."
    ],
    "quickReminder": "Head to emergency hospital immediately; give honey every 10 min if child >1 year.",
    "offlineReady": true
  },
  {
    "id": "chemical-inhalation",
    "title": "Household Chemical Inhalation",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Urgent",
    "whatIsIt": "Breathing in fumes from cleaning products or solvents, causing dizziness, headache, or breathing trouble.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Move to fresh air",
        "detail": "Get the person out into open fresh air immediately."
      },
      {
        "icon": "Check",
        "action": "Loosen clothing",
        "detail": "Loosen tight neck and chest clothing."
      },
      {
        "icon": "Check",
        "action": "Call 112 / Poison Control",
        "detail": "Call emergency services if coughing or breathlessness persists."
      }
    ],
    "whatNotToDo": [
      "Do not re-enter the fume-filled room without professional protective equipment."
    ],
    "whenToGetHelp": [
      "Persistent coughing, wheezing, or confusion. Call 112."
    ],
    "quickReminder": "Move to fresh outdoor air immediately, loosen clothing, call 112 if coughing.",
    "offlineReady": true
  },
  {
    "id": "chemical-ingestion",
    "title": "Suspected Chemical Ingestion",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Emergency",
    "whatIsIt": "Swallowing a corrosive or toxic household or industrial chemical, requiring immediate emergency response.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Call 112 immediately. Keep chemical container ready to read details."
      },
      {
        "icon": "Check",
        "action": "Wipe mouth",
        "detail": "Gently wipe lips and mouth with a damp cloth to remove surface chemical residue."
      },
      {
        "icon": "Check",
        "action": "Keep upright",
        "detail": "Keep person sitting upright."
      }
    ],
    "whatNotToDo": [
      "Never induce vomiting (re-burns the esophagus and airway).",
      "Do not give home remedies like raw eggs, milk, or vinegar."
    ],
    "whenToGetHelp": [
      "All corrosive or toxic ingestions are immediate 112 emergencies."
    ],
    "quickReminder": "Call 112 immediately, keep container, do not induce vomiting, wipe mouth.",
    "offlineReady": true
  },
  {
    "id": "drug-overdose",
    "title": "Suspected Drug Overdose",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Emergency",
    "whatIsIt": "Taking a dangerous amount of a recreational or prescription drug, with signs like unresponsiveness or slowed breathing.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Call 112 instantly. State suspected overdose and responsiveness."
      },
      {
        "icon": "Check",
        "action": "Administer Naloxone",
        "detail": "If opioid overdose is suspected and Naloxone nasal spray is available, spray into one nostril."
      },
      {
        "icon": "Check",
        "action": "CPR if not breathing",
        "detail": "If unresponsive and not breathing normally, begin chest compressions at 110 BPM."
      }
    ],
    "whatNotToDo": [
      "Do not delay CPR or 112 to search for pills."
    ],
    "whenToGetHelp": [
      "Blue lips, pinpoint pupils, slow gurgling breathing. Call 112."
    ],
    "quickReminder": "Call 112, give Naloxone nasal spray if available, start CPR if not breathing.",
    "offlineReady": true
  },
  {
    "id": "severe-alcohol-poisoning",
    "title": "Severe Alcohol Poisoning",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Emergency",
    "whatIsIt": "Dangerously high blood alcohol levels causing vomiting, unresponsiveness, or slowed breathing.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Dial 112 right away. This is life-threatening."
      },
      {
        "icon": "Check",
        "action": "Turn on side",
        "detail": "Place in recovery position on side to prevent choking on vomit."
      },
      {
        "icon": "Check",
        "action": "Monitor airway",
        "detail": "Watch chest movement continuously. If breathing stops, start CPR."
      }
    ],
    "whatNotToDo": [
      "Never leave them alone to sleep it off.",
      "Do not force drinks or walks."
    ],
    "whenToGetHelp": [
      "Breathing fewer than 8 times/minute, cold clammy pale skin, cannot be woken. Call 112."
    ],
    "quickReminder": "Call 112, place on side in recovery position, monitor breathing continuously.",
    "offlineReady": true
  },
  {
    "id": "carbon-monoxide",
    "title": "Carbon Monoxide Poisoning",
    "category": "Poisoning & Ingestion",
    "severityBadge": "Emergency",
    "whatIsIt": "Exposure to an odorless gas from faulty heaters or engines, causing headache, confusion, and possible collapse.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Evacuate to fresh air",
        "detail": "Get everyone out into open fresh air immediately."
      },
      {
        "icon": "Check",
        "action": "Call 112",
        "detail": "Dial 112 from outside the building."
      },
      {
        "icon": "Check",
        "action": "Check breathing & CPR",
        "detail": "If someone is unconscious, check breathing and start CPR in fresh air if needed."
      }
    ],
    "whatNotToDo": [
      "Do not stay inside to look for source or open windows if you feel dizzy."
    ],
    "whenToGetHelp": [
      "Headache, nausea, confusion in multiple household members. Call 112."
    ],
    "quickReminder": "Evacuate outdoors immediately, call 112, administer CPR in fresh air if needed.",
    "offlineReady": true
  },
  {
    "id": "localized-hives",
    "title": "Localized Hives",
    "category": "Allergic Reactions",
    "severityBadge": "Mild",
    "whatIsIt": "Raised, itchy welts on the skin from a mild allergic reaction to food, plants, or contact.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Cool compress",
        "detail": "Apply a cool, damp cloth to relieve itching."
      },
      {
        "icon": "Check",
        "action": "Antihistamine",
        "detail": "Take an over-the-counter oral antihistamine as directed."
      },
      {
        "icon": "Check",
        "action": "Avoid triggers",
        "detail": "Identify and remove contact with suspected plant, food, or fabric."
      }
    ],
    "whatNotToDo": [
      "Do not take hot baths (heat worsens histamine itching)."
    ],
    "whenToGetHelp": [
      "Hives spread rapidly to face, throat, or cause coughing."
    ],
    "quickReminder": "Cool compress, oral antihistamine, remove allergen trigger.",
    "offlineReady": true
  },
  {
    "id": "insect-sting-allergic",
    "title": "Insect Sting Allergic Reaction",
    "category": "Allergic Reactions",
    "severityBadge": "Moderate",
    "whatIsIt": "Swelling and itching that spreads beyond the sting site, without breathing difficulty.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Remove stinger",
        "detail": "Scrape stinger sideways with a credit card edge or fingernail."
      },
      {
        "icon": "Check",
        "action": "Cold pack",
        "detail": "Apply an ice pack wrapped in cloth for 15 minutes."
      },
      {
        "icon": "Check",
        "action": "Antihistamine & elevate",
        "detail": "Take antihistamine and elevate the stung arm or leg."
      }
    ],
    "whatNotToDo": [
      "Do not pinch stinger with fingers (squeezes more venom in)."
    ],
    "whenToGetHelp": [
      "Swelling spreads to lips, tongue, or difficulty swallowing develops."
    ],
    "quickReminder": "Scrape stinger sideways, apply cold pack, elevate, take antihistamine.",
    "offlineReady": true
  },
  {
    "id": "seasonal-allergy",
    "title": "Seasonal Allergy Flare-Up",
    "category": "Allergic Reactions",
    "severityBadge": "Moderate",
    "whatIsIt": "Sneezing, itchy eyes, and congestion triggered by pollen or other airborne allergens.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Saline nasal rinse",
        "detail": "Rinse nasal passages with sterile saline spray to flush pollen."
      },
      {
        "icon": "Check",
        "action": "Antihistamine",
        "detail": "Take non-drowsy antihistamine tablet."
      },
      {
        "icon": "Check",
        "action": "Shower and change",
        "detail": "Wash hair and change clothes after returning from outdoors."
      }
    ],
    "whatNotToDo": [
      "Do not rub itchy eyes (causes conjunctival irritation)."
    ],
    "whenToGetHelp": [
      "Wheezing or chest tightness begins."
    ],
    "quickReminder": "Rinse nose with saline, take antihistamine, wash face and change clothes.",
    "offlineReady": true
  },
  {
    "id": "facial-lip-swelling",
    "title": "Facial or Lip Swelling",
    "category": "Allergic Reactions",
    "severityBadge": "Urgent",
    "whatIsIt": "Sudden swelling of the face or lips after eating or contact with an allergen, without breathing trouble yet.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Monitor airway closely",
        "detail": "Watch breathing and voice quality every minute."
      },
      {
        "icon": "Check",
        "action": "Give antihistamine",
        "detail": "Give oral antihistamine immediately if person can swallow safely."
      },
      {
        "icon": "Check",
        "action": "Prepare EpiPen & call 112",
        "detail": "Have EpiPen ready; call 112 if swelling advances toward throat."
      }
    ],
    "whatNotToDo": [
      "Do not assume lip swelling will stay mild."
    ],
    "whenToGetHelp": [
      "Voice becomes hoarse, tongue swells, or breathing becomes noisy. Call 112."
    ],
    "quickReminder": "Give antihistamine, prepare EpiPen, watch airway closely, call 112 if worsening.",
    "offlineReady": true
  },
  {
    "id": "anaphylaxis-full",
    "title": "Anaphylaxis (Full-Body Reaction)",
    "category": "Allergic Reactions",
    "severityBadge": "Emergency",
    "whatIsIt": "A rapid, severe allergic reaction affecting breathing and circulation, requiring immediate epinephrine and emergency care.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Inject EpiPen immediately",
        "detail": "Press auto-injector firmly into outer middle thigh for 3 seconds."
      },
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Call 112. State \"anaphylaxis emergency\"."
      },
      {
        "icon": "Check",
        "action": "Lie flat, legs raised",
        "detail": "Keep person lying flat; if breathing is labored, allow them to sit slightly."
      }
    ],
    "whatNotToDo": [
      "Never allow the person to walk or stand."
    ],
    "whenToGetHelp": [
      "Life-threatening emergency. EpiPen and 112 required."
    ],
    "quickReminder": "Inject EpiPen into outer thigh immediately, call 112, keep lying flat.",
    "offlineReady": true
  },
  {
    "id": "fainting-syncope",
    "title": "Fainting (Syncope)",
    "category": "Neurological",
    "severityBadge": "Moderate",
    "whatIsIt": "A brief loss of consciousness from a sudden drop in blood flow to the brain, usually resolving quickly.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Lie flat & elevate feet",
        "detail": "Keep person lying flat with feet elevated 30 cm on pillows."
      },
      {
        "icon": "Check",
        "action": "Fresh air & loosen clothes",
        "detail": "Unbutton tight collar; ensure plenty of circulating cool air."
      },
      {
        "icon": "Check",
        "action": "Rest 10-15 mins",
        "detail": "Do not let them stand up quickly; sit up slowly first."
      }
    ],
    "whatNotToDo": [
      "Do not prop head on a pillow while unconscious (narrows airway).",
      "Do not splash water or slap face."
    ],
    "whenToGetHelp": [
      "Person does not regain consciousness within 60 seconds. Call 112."
    ],
    "quickReminder": "Lie flat, elevate feet 30 cm, loosen collar, rest 15 minutes before standing.",
    "offlineReady": true
  },
  {
    "id": "dizziness-vertigo",
    "title": "Dizziness & Vertigo",
    "category": "Neurological",
    "severityBadge": "Moderate",
    "whatIsIt": "A spinning or off-balance sensation, often linked to inner ear issues or low blood pressure.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Sit immediately",
        "detail": "Sit down immediately to prevent falls and head injuries."
      },
      {
        "icon": "Check",
        "action": "Focus on fixed point",
        "detail": "Keep head still and fix eyes on a stationary distant object."
      },
      {
        "icon": "Check",
        "action": "Hydrate slowly",
        "detail": "Sip water slowly in case dizziness is from mild dehydration."
      }
    ],
    "whatNotToDo": [
      "Do not make sudden head turns or bend down quickly."
    ],
    "whenToGetHelp": [
      "Dizziness accompanied by slurred speech, face drooping, or arm weakness (stroke signs). Call 112."
    ],
    "quickReminder": "Sit down immediately, keep head still, focus on fixed point, hydrate.",
    "offlineReady": true
  },
  {
    "id": "known-epileptic-seizure",
    "title": "Known Epileptic Seizure",
    "category": "Neurological",
    "severityBadge": "Moderate",
    "whatIsIt": "A seizure in someone with a diagnosed seizure disorder, typically following their usual pattern.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Protect from injury",
        "detail": "Clear hard or sharp objects away; place folded jacket under head."
      },
      {
        "icon": "Check",
        "action": "Time the seizure",
        "detail": "Look at clock to time duration accurately."
      },
      {
        "icon": "Check",
        "action": "Roll onto side after",
        "detail": "When convulsions stop, roll into recovery position on side."
      }
    ],
    "whatNotToDo": [
      "Never put anything inside the person's mouth (they will NOT swallow their tongue).",
      "Do not hold them down."
    ],
    "whenToGetHelp": [
      "Seizure lasts longer than 5 minutes or a second seizure starts without regaining consciousness. Call 112."
    ],
    "quickReminder": "Protect head with soft padding, time the seizure, turn on side once stopped, never put items in mouth.",
    "offlineReady": true
  },
  {
    "id": "severe-sudden-headache",
    "title": "Severe Sudden Headache",
    "category": "Neurological",
    "severityBadge": "Urgent",
    "whatIsIt": "An intense headache that comes on abruptly and feels different from any headache before.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Rest in dark room",
        "detail": "Lie quietly in a dark, silent room."
      },
      {
        "icon": "Check",
        "action": "Check warning signs",
        "detail": "Ask if it came like a \"thunderclap\" or with stiff neck."
      },
      {
        "icon": "Check",
        "action": "Seek urgent care",
        "detail": "Sudden explosive headache requires hospital rule-out of brain hemorrhage."
      }
    ],
    "whatNotToDo": [
      "Do not take blood-thinning painkillers like aspirin before doctor evaluation."
    ],
    "whenToGetHelp": [
      "Worst headache of life, stiff neck, fever, or confusion. Call 112."
    ],
    "quickReminder": "Rest in dark room, seek immediate medical assessment for thunderclap onset.",
    "offlineReady": true
  },
  {
    "id": "one-sided-numbness",
    "title": "Sudden One-Sided Numbness or Weakness",
    "category": "Neurological",
    "severityBadge": "Urgent",
    "whatIsIt": "Sudden one-sided numbness, weakness, or drooping that needs urgent evaluation.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Check FAST test",
        "detail": "Face: smile (droop?). Arms: raise both (drift?). Speech: repeat sentence (slurred?)."
      },
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "If ANY one test is abnormal, call 112 instantly."
      },
      {
        "icon": "Check",
        "action": "Record time started",
        "detail": "Note the exact minute symptoms began for clot-busting eligibility."
      }
    ],
    "whatNotToDo": [
      "Do not give aspirin or drinks before hospital assessment."
    ],
    "whenToGetHelp": [
      "Call 112 immediately."
    ],
    "quickReminder": "Do FAST check: Face, Arms, Speech, Time — call 112 immediately.",
    "offlineReady": true
  },
  {
    "id": "suspected-stroke-fast",
    "title": "Suspected Stroke (FAST Signs)",
    "category": "Neurological",
    "severityBadge": "Emergency",
    "whatIsIt": "Sudden face drooping, arm weakness, or slurred speech signaling a possible stroke.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 instantly",
        "detail": "Call 112 immediately. State \"acute stroke alert\"."
      },
      {
        "icon": "Check",
        "action": "Note the exact time",
        "detail": "Clot-busting medication must be given within 3-4.5 hours of first symptom."
      },
      {
        "icon": "Check",
        "action": "Lie with head elevated 15°",
        "detail": "Keep person comfortable with head slightly propped on low pillow."
      }
    ],
    "whatNotToDo": [
      "Do not give aspirin, food, or water."
    ],
    "whenToGetHelp": [
      "Any positive FAST sign is an immediate 112 emergency."
    ],
    "quickReminder": "Call 112 instantly, record exact time symptoms began, give nothing by mouth.",
    "offlineReady": true
  },
  {
    "id": "first-time-seizure",
    "title": "First-Time or Prolonged Seizure",
    "category": "Neurological",
    "severityBadge": "Emergency",
    "whatIsIt": "A seizure in someone with no history of seizures, or one lasting longer than five minutes.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Call 112 right away for any first-time seizure or one over 5 minutes."
      },
      {
        "icon": "Check",
        "action": "Cushion head",
        "detail": "Place soft pillow or clothing beneath head; loosen neckwear."
      },
      {
        "icon": "Check",
        "action": "Recovery position after",
        "detail": "Gently roll onto side as soon as shaking stops to keep airway clear."
      }
    ],
    "whatNotToDo": [
      "Never restrain body movements.",
      "Never force teeth apart."
    ],
    "whenToGetHelp": [
      "All first-time seizures or seizures >5 minutes are emergencies. Call 112."
    ],
    "quickReminder": "Call 112, cushion head, time duration, turn onto side when shaking ends.",
    "offlineReady": true
  },
  {
    "id": "unresponsive-breathing",
    "title": "Unresponsive but Breathing",
    "category": "Neurological",
    "severityBadge": "Emergency",
    "whatIsIt": "A person who won't wake up or respond but is still breathing normally, needing urgent assessment.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Place in recovery position",
        "detail": "Roll onto side, top knee bent, hand supporting cheek to keep airway open."
      },
      {
        "icon": "Check",
        "action": "Call 112",
        "detail": "Dial 112. Explain person is unconscious but breathing."
      },
      {
        "icon": "Check",
        "action": "Check breathing every min",
        "detail": "Listen and watch chest continuously until ambulance arrives."
      }
    ],
    "whatNotToDo": [
      "Do not leave them lying flat on back (tongue or saliva can block airway)."
    ],
    "whenToGetHelp": [
      "If breathing stops at any point, roll onto back and start CPR immediately."
    ],
    "quickReminder": "Place on side in recovery position, call 112, monitor breathing every minute.",
    "offlineReady": true
  },
  {
    "id": "hypoglycemia",
    "title": "Hypoglycemia (Low Blood Sugar)",
    "category": "Metabolic / Diabetic",
    "severityBadge": "Urgent",
    "whatIsIt": "A sudden drop in blood sugar causing shakiness, sweating, confusion, or weakness.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Rule of 15 (fast sugar)",
        "detail": "If awake, give 15g fast sugar: 1/2 cup fruit juice, 4 glucose tablets, or 3 tsp sugar."
      },
      {
        "icon": "Check",
        "action": "Wait 15 minutes",
        "detail": "Have them rest quietly for 15 minutes."
      },
      {
        "icon": "Check",
        "action": "Recheck and snack",
        "detail": "If still low, repeat sugar; if recovered, eat a carb snack (bread or crackers)."
      }
    ],
    "whatNotToDo": [
      "Never force liquids into a groggy or unconscious person (choking danger)."
    ],
    "whenToGetHelp": [
      "Person becomes unresponsive or has a seizure. Call 112."
    ],
    "quickReminder": "If awake, give 15g fast sugar (fruit juice/glucose), recheck in 15 mins.",
    "offlineReady": true
  },
  {
    "id": "hyperglycemia",
    "title": "Hyperglycemia (High Blood Sugar)",
    "category": "Metabolic / Diabetic",
    "severityBadge": "Moderate",
    "whatIsIt": "Elevated blood sugar causing excessive thirst, frequent urination, and fatigue.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Drink water",
        "detail": "Drink plenty of water to help kidneys flush excess glucose."
      },
      {
        "icon": "Check",
        "action": "Test ketones",
        "detail": "If type 1 diabetic, test urine or blood for ketones."
      },
      {
        "icon": "Check",
        "action": "Administer insulin",
        "detail": "Take insulin correction dose as prescribed by doctor."
      }
    ],
    "whatNotToDo": [
      "Do not drink sugary beverages or sports drinks."
    ],
    "whenToGetHelp": [
      "Fruity breath, nausea, deep rapid breathing, or confusion (DKA). Call 112."
    ],
    "quickReminder": "Drink abundant water, check ketones, take prescribed insulin correction.",
    "offlineReady": true
  },
  {
    "id": "diabetic-ketoacidosis",
    "title": "Diabetic Ketoacidosis (Suspected)",
    "category": "Metabolic / Diabetic",
    "severityBadge": "Emergency",
    "whatIsIt": "A dangerous diabetic complication with fruity breath, rapid breathing, and confusion, needing emergency care.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Call 112 immediately",
        "detail": "Call 112 right away. State \"suspected diabetic ketoacidosis\"."
      },
      {
        "icon": "Check",
        "action": "Monitor breathing",
        "detail": "Keep person resting comfortably; observe breathing rate."
      },
      {
        "icon": "Check",
        "action": "No oral fluids if nauseous",
        "detail": "Do not force drinks if vomiting or confused."
      }
    ],
    "whatNotToDo": [
      "Do not delay hospital transport."
    ],
    "whenToGetHelp": [
      "Immediate emergency hospital admission for IV fluids and insulin required."
    ],
    "quickReminder": "Call 112 immediately, monitor breathing and airway, transport to hospital.",
    "offlineReady": true
  },
  {
    "id": "diabetic-confusion",
    "title": "Diabetic Confusion or Unresponsiveness",
    "category": "Metabolic / Diabetic",
    "severityBadge": "Urgent",
    "whatIsIt": "A person with diabetes becomes confused or unresponsive, which could be dangerously high or low blood sugar.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Rub glucose gel if drowsy",
        "detail": "If semi-conscious, rub glucose gel or honey inside cheek."
      },
      {
        "icon": "Check",
        "action": "Call 112 if unresponsive",
        "detail": "If unresponsive, place in recovery position and call 112."
      },
      {
        "icon": "Check",
        "action": "Glucagon injection",
        "detail": "If trained and glucagon kit is available, administer as directed."
      }
    ],
    "whatNotToDo": [
      "Never pour liquids down the throat of an unconscious person."
    ],
    "whenToGetHelp": [
      "Loss of consciousness or seizure in a diabetic person. Call 112."
    ],
    "quickReminder": "Call 112, place in recovery position if unconscious, never give oral liquids.",
    "offlineReady": true
  },
  {
    "id": "toothache",
    "title": "Toothache",
    "category": "Dental",
    "severityBadge": "Mild",
    "whatIsIt": "Persistent tooth pain, often from decay or a cracked tooth, ranging from mild to sharp.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Warm saltwater rinse",
        "detail": "Rinse gently with warm salt water (1/2 tsp salt in 1 cup water)."
      },
      {
        "icon": "Check",
        "action": "Cold compress on cheek",
        "detail": "Hold an ice pack wrapped in towel to outside of cheek."
      },
      {
        "icon": "Check",
        "action": "Floss gently",
        "detail": "Gently floss around tooth to dislodge trapped food particles."
      }
    ],
    "whatNotToDo": [
      "Never place an aspirin tablet directly on gums (causes chemical burn)."
    ],
    "whenToGetHelp": [
      "Facial swelling spreading to eye or neck, or difficulty swallowing/breathing."
    ],
    "quickReminder": "Warm saltwater rinse, cold pack on cheek, see dentist promptly.",
    "offlineReady": true
  },
  {
    "id": "chipped-tooth",
    "title": "Chipped or Cracked Tooth",
    "category": "Dental",
    "severityBadge": "Moderate",
    "whatIsIt": "A tooth broken from impact or biting something hard, with exposed edges or sensitivity.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Save fragments",
        "detail": "Rinse tooth fragments gently in water or milk and save in a clean container."
      },
      {
        "icon": "Check",
        "action": "Rinse mouth",
        "detail": "Rinse mouth gently with warm water."
      },
      {
        "icon": "Check",
        "action": "Cover sharp edges",
        "detail": "Apply dental wax or sugarless chewing gum over sharp edges."
      }
    ],
    "whatNotToDo": [
      "Do not chew on the damaged side."
    ],
    "whenToGetHelp": [
      "Severe bleeding from gum socket or tooth completely loose."
    ],
    "quickReminder": "Save tooth fragments in milk, rinse with warm water, see dentist within 24h.",
    "offlineReady": true
  },
  {
    "id": "bitten-tongue-lip",
    "title": "Bitten Tongue or Lip",
    "category": "Dental",
    "severityBadge": "Moderate",
    "whatIsIt": "A cut from accidentally biting the tongue or lip, which bleeds heavily due to rich blood supply.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Direct pressure with gauze",
        "detail": "Press a clean cloth or sterile gauze firmly against the cut for 5-10 minutes."
      },
      {
        "icon": "Check",
        "action": "Ice compress",
        "detail": "Hold an ice cube wrapped in cloth against the lip to reduce swelling."
      },
      {
        "icon": "Check",
        "action": "Rinse gently",
        "detail": "Rinse mouth with cool water once bleeding stops."
      }
    ],
    "whatNotToDo": [
      "Do not keep spitting forcefully (dislodges fresh blood clot)."
    ],
    "whenToGetHelp": [
      "Bleeding does not stop after 15 minutes of firm pressure or gaping cut."
    ],
    "quickReminder": "Firm direct pressure with gauze for 10 minutes, apply wrapped ice cube.",
    "offlineReady": true
  },
  {
    "id": "knocked-out-tooth",
    "title": "Knocked-Out Tooth",
    "category": "Dental",
    "severityBadge": "Urgent",
    "whatIsIt": "A permanent tooth completely dislodged from the socket, where quick action can save it.",
    "linkedProtocolId": "bleeding",
    "steps": [
      {
        "icon": "Check",
        "action": "Handle by crown only",
        "detail": "Pick up tooth by white chewing crown; NEVER touch root."
      },
      {
        "icon": "Check",
        "action": "Rinse gently without scrub",
        "detail": "If dirty, rinse briefly in milk or saline for 10 seconds. Do not scrub."
      },
      {
        "icon": "Check",
        "action": "Store in milk & rush to dentist",
        "detail": "Place tooth in cup of cold milk or saliva and reach dentist within 30-60 minutes."
      }
    ],
    "whatNotToDo": [
      "Never touch the tooth root or scrape away attached tissue fibers.",
      "Do not reinsert baby teeth."
    ],
    "whenToGetHelp": [
      "Reaching a dentist within 60 minutes gives the best chance of saving the tooth."
    ],
    "quickReminder": "Touch crown only, store in cold milk, see emergency dentist within 30-60 mins.",
    "offlineReady": true
  },
  {
    "id": "teething-discomfort",
    "title": "Teething Discomfort",
    "category": "Pediatric-Specific",
    "severityBadge": "Mild",
    "whatIsIt": "Gum irritation and fussiness in infants as new teeth emerge.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Cold teething ring",
        "detail": "Offer a firm silicone or chilled rubber teething ring."
      },
      {
        "icon": "Check",
        "action": "Gently massage gums",
        "detail": "Rub baby's gums gently with a clean finger or damp gauze."
      },
      {
        "icon": "Check",
        "action": "Wipe drool",
        "detail": "Dab drool gently to prevent skin rash on chin."
      }
    ],
    "whatNotToDo": [
      "Never freeze teething rings solid (can bruise gums).",
      "Do not use teething necklaces or gels containing benzocaine."
    ],
    "whenToGetHelp": [
      "High fever, diarrhea, or unusual lethargy (teething does not cause true high fever)."
    ],
    "quickReminder": "Chilled teething ring, gentle gum massage with clean finger, wipe drool.",
    "offlineReady": true
  },
  {
    "id": "infant-child-fever",
    "title": "Infant or Child Fever",
    "category": "Pediatric-Specific",
    "severityBadge": "Moderate",
    "whatIsIt": "An elevated body temperature in a child, ranging from mild to concerning depending on age and other symptoms.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Keep hydrated",
        "detail": "Offer plenty of breastmilk, formula, or water in frequent sips."
      },
      {
        "icon": "Check",
        "action": "Light clothing",
        "detail": "Dress child in light, comfortable layers; keep room well-ventilated."
      },
      {
        "icon": "Check",
        "action": "Pediatric paracetamol",
        "detail": "Give age-appropriate dose of children's paracetamol if child is distressed."
      }
    ],
    "whatNotToDo": [
      "Never give aspirin to children or teenagers (risk of fatal Reye's syndrome).",
      "Do not use cold water or alcohol sponge baths."
    ],
    "whenToGetHelp": [
      "Baby under 3 months with fever over 38°C (100.4°F), or child has rash and stiff neck. Call 112."
    ],
    "quickReminder": "Keep hydrated, dress in light layers, give children's paracetamol, never give aspirin.",
    "offlineReady": true
  },
  {
    "id": "febrile-seizure",
    "title": "Febrile Seizure",
    "category": "Pediatric-Specific",
    "severityBadge": "Urgent",
    "whatIsIt": "A seizure triggered by a rapid rise in body temperature in a young child, alarming but usually brief.",
    "linkedProtocolId": "unconscious",
    "steps": [
      {
        "icon": "Check",
        "action": "Protect from injury",
        "detail": "Place child on floor on a soft blanket or rug away from furniture."
      },
      {
        "icon": "Check",
        "action": "Roll onto side",
        "detail": "Gently roll onto side to ensure airway stays clear of saliva."
      },
      {
        "icon": "Check",
        "action": "Time seizure & cool",
        "detail": "Note duration; loosen tight clothes once shaking ends."
      }
    ],
    "whatNotToDo": [
      "Never put anything in child's mouth.",
      "Do not place child in cold bath during seizure."
    ],
    "whenToGetHelp": [
      "Seizure lasts longer than 5 minutes or child does not wake up after. Call 112."
    ],
    "quickReminder": "Place on floor on side, protect head, time seizure, call 112 if over 5 minutes.",
    "offlineReady": true
  },
  {
    "id": "swallowed-object-non-battery",
    "title": "Swallowed Foreign Object (Non-Battery)",
    "category": "Pediatric-Specific",
    "severityBadge": "Urgent",
    "whatIsIt": "A child has swallowed a small object like a coin or toy part that isn't a battery or magnet.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Check breathing & airway",
        "detail": "Ensure child is breathing smoothly and not choking or gagging."
      },
      {
        "icon": "Check",
        "action": "Keep calm",
        "detail": "Comfort child; do not induce vomiting."
      },
      {
        "icon": "Check",
        "action": "Seek medical X-ray",
        "detail": "Visit emergency clinic to verify object location and ensure it enters stomach safely."
      }
    ],
    "whatNotToDo": [
      "Do not give laxatives or force bread/potatoes down throat."
    ],
    "whenToGetHelp": [
      "Child gags, drools continuously, cannot swallow saliva, or has chest pain. Call 112."
    ],
    "quickReminder": "Ensure airway is clear, do not induce vomiting, visit hospital for X-ray check.",
    "offlineReady": true
  },
  {
    "id": "head-bump-infant",
    "title": "Head Bump in an Infant or Toddler",
    "category": "Pediatric-Specific",
    "severityBadge": "Urgent",
    "whatIsIt": "A fall or bump to an infant's head, needing careful monitoring for worsening symptoms.",
    "linkedProtocolId": "custom",
    "steps": [
      {
        "icon": "Check",
        "action": "Cold pack wrapped",
        "detail": "Apply a cold cloth or wrapped ice pack for 10 minutes to soothe bump."
      },
      {
        "icon": "Check",
        "action": "Comfort & observe",
        "detail": "Hold and comfort baby; observe behavior closely for 24-48 hours."
      },
      {
        "icon": "Check",
        "action": "Watch sleep cycles",
        "detail": "Check that baby wakes up normally and responds to parents as usual."
      }
    ],
    "whatNotToDo": [
      "Do not ignore bumps in infants under 6 months."
    ],
    "whenToGetHelp": [
      "Vomiting more than once, bulging soft spot (fontanelle), extreme sleepiness, or fluid from ear/nose. Call 112."
    ],
    "quickReminder": "Apply cold pack to bump, comfort, and monitor behavior closely for 24-48 hours.",
    "offlineReady": true
  }
];
