# 🩺 BETTER.MD — Sanjeevani v2 UI & UX Strategic Masterplan
> **Guiding Principle: "Calm Under Pressure"**  
> In an emergency, every millisecond of hesitation or visual confusion can cost human lives. Sanjeevani's UI must deliver near-zero cognitive load, intuitive one-handed mobile ergonomics, and instant clinical clarity.

---

## 🧭 Executive Summary & Core Philosophy

Sanjeevani v2 is already a formidable life-saving platform with unique breakthroughs (10-second fail-safe AI cascade, Paramedic SBAR QR beacons, Bystander Paradox crowd squad coordination, and Firecrawl cheap medicine searches). 

To evolve from a powerful feature set into a **world-class, battle-tested pre-hospital life-support interface**, the UI and UX must address four clinical realities:
1. **The Tunnel Vision of Panic**: In a crisis, heart rates spike to 140+ BPM. Users lose fine motor control and peripheral vision. Buttons must be massive, unmissable, and thumb-friendly.
2. **One-Handed Field Operation**: The rescuer's other hand is frequently occupied holding direct pressure on a wound or steadying a victim. Key actions must sit in the **Bottom Thumb Zone**.
3. **Severe Environmental Glare**: Medical handoffs and road accidents happen outdoors in blazing sunlight or dark roadside conditions. High-contrast, pure-black OLED / sunlight modes are mandatory.
4. **Progressive Disclosure**: Never overwhelm a panicking user with a wall of medical text. Deliver **one single imperative action at a time**, advancing as they confirm completion.

---

## ⚡ Priority Matrix

| Phase | Focus Area | High-Impact Deliverables | Effort |
| :--- | :--- | :--- | :--- |
| **P0: Immediate Quick Wins** | **Mobile Thumb Zone & Readability** | Bottom navigation bar on mobile, floating emergency SOS pill, PWA install prompt, streamlined drawer. | Low / High Impact |
| **P1: High-Impact Upgrades** | **AI Cockpit & Stress Mode** | Sticky CPR/Bleeding step HUD, streaming text generation, voice waveform visualizer, 1-tap "High Stress Mode". | Med / Very High Impact |
| **P2: Breakthrough Features** | **Prescription OCR & Sunlight Handoff** | Camera photo OCR for cheap medicines, sunlight-boosted QR display for paramedics, haptic pulse feedback. | Med / High Impact |
| **P3: Delight & Trust** | **Haptics, Sound & Animation** | Audible metronome ducking, celebratory community review badges, offline sync status indicator. | Low / Med Impact |

---

## 📱 Detailed Screen-by-Screen UI/UX Roadmap

---

### 1. Landing Page & First-Time User Experience (FTUX)

#### Current State:
The landing page has been significantly cleaned up with bold Manrope typography, a grounded hero cockpit, clickable Bento grid cards, and an interactive review system.

#### Recommended UI/UX Enhancements:
1. **Sticky Floating "112 SOS & AI Guardian" Bottom Dock (Mobile)**:
   - When a mobile user scrolls past the Hero, display a subtle, high-contrast floating bottom dock with two essential buttons:
     - `[ ⚡ Ask AI Guardian ]` (70% width, emerald/gold tactile)
     - `[ 📞 112 SOS ]` (30% width, crimson pulse)
   - *Why*: Ensures anyone who stumbles upon the app in an active emergency can reach instant triage with 1 thumb tap, regardless of scroll depth.
2. **"Install to Phone" PWA Smart Banner**:
   - Display a clean dismissible top banner: *"Install Sanjeevani to your Home Screen for 100% Offline Access when cellular networks fail"*.
   - Includes 1-tap browser PWA installation trigger.
3. **Interactive "Try a 10-Second CPR Beat" Sandbox on Hero**:
   - An interactive miniature metronome pill directly in the Hero: tap `[ ▶ Test CPR Rhythm ]` to feel/hear the 110 BPM rhythm right on the landing page without opening the full protocol.
4. **Dynamic Location Pill in Header**:
   - Make the GPS pill in the header clickable to open a quick modal showing *"Nearest Trauma Center: Max Healthcare (2.4 km, 7 mins)"* with a live directions button.

---

### 2. AI First-Aid Guardian Cockpit (`ChatView.tsx`)

#### Current State:
Full-screen borderless layout with horizontal quick trauma chips, text/voice input, photo/video attachments, auto TTS voice narration, SBAR handout cards, and crowd squad cards in the stream.

#### Recommended UI/UX Enhancements:
1. **Sticky "Active Emergency HUD" (Pinned Top Card)**:
   - When the AI detects a high-severity emergency (e.g., CPR, Arterial Bleeding, Severe Burn, Choking), pin the **current active instruction** and its tool (e.g. 110 BPM Metronome or 20-min Burn countdown) as a **sticky banner at the top of the chat**.
   - *UX Problem Solved*: Rescuers won't lose their place or have to scroll through chat history while performing chest compressions or applying dressings.
2. **Real-Time Voice Input Waveform & Hinglish Recognition**:
   - Replace the static microphone icon with an active audio pulse waveform visualizer when speech recognition is active.
   - Support seamless bilingual / Hinglish medical terms (*"chhati me dard"*, *"khoon beh raha hai"*, *"bachha saans nahi le raha"*).
3. **Streaming Progressive Response Rendering**:
   - Implement streaming or stepped word appearance instead of waiting for the full response payload, dropping perceived latency to `<400ms`.
4. **"Stress Mode" Toggle (Extreme High Contrast)**:
   - A toggle button in the top bar (`[ ⚠️ High Stress Mode ]`):
     - Expands font sizes to 22pt+
     - Hides all non-essential telemetry chips
     - Shows each instruction as a massive numbered card with a single giant **"NEXT STEP →"** thumb button.

---

### 3. Paramedic Handoff & Black-Box Docket (`ParamedicHandoffView.tsx`)

#### Current State:
Comprehensive pre-hospital timeline, trauma stopwatch, SBAR structured briefing, video forensic integration, and vector QR code.

#### Recommended UI/UX Enhancements:
1. **"Sunlight Mode" (Outdoor High-Contrast QR View)**:
   - Emergency medical handoffs often occur in blazing direct sunlight or dark roadways where phone screen glare makes QR scanning difficult.
   - Add a 1-tap **"Maximize Contrast for Scanner"** button:
     - Turns the entire screen pure white with an oversized, centered black vector QR code.
     - Temporarily forces max screen brightness via the Screen Wake Lock API.
     - Displays the 3 critical numbers in giant font underneath: **Elapsed Time**, **Head Strike (Y/N)**, and **CPR Minutes**.
2. **1-Tap Web NFC / Instant Share**:
   - In addition to QR scanning, provide an `[ 📲 Instant Share to EMT ]` button that uses the native Web Share API to send the full SBAR docket via WhatsApp, AirDrop, or Bluetooth directly to the arriving ambulance tablet.
3. **Interactive 2D Body Silhouette Injury Tagger**:
   - Instead of typing long text notes while hands are shaky, provide a clean, 2D anatomical silhouette where the rescuer simply taps the head, chest, left arm, or leg to tag injury locations with a red pulse dot.

---

### 4. Bystander Paradox Crowd Engine (`CrowdCommanderModal.tsx` & `SquadJoinView.tsx`)

#### Current State:
Step 1 incident intake (photo upload + description + crowd size selector) → Step 2 AI squad generation → Step 3 Live Squad room with QR code and bilingual audio loudspeaker broadcast.

#### Recommended UI/UX Enhancements:
1. **Live Task Status Sound Chimes & Haptic Feedback**:
   - When a bystander scans the QR on their phone and clicks *"I am doing this"*, the Commander's phone should play a discreet, positive confirmation sound and vibrate gently.
   - The task card transitions from `[ Unclaimed - Yellow ]` to `[ Claimed by Volunteer #2 - Glowing Green ]`.
2. **Directional Compass to AED on Onlooker Screen**:
   - For bystanders assigned the *"Scout for AED / First Aid Kit"* role, show a simple compass heading arrow and estimated walking distance to the nearest mapped AED.
3. **One-Tap "112 Auto-Dialer & Teleprompter" on Mobile Join Screen**:
   - The person assigned the *"Call 112 Dispatcher"* role gets a giant green button: `[ 📞 Dial 112 Now ]`.
   - Directly below the button, a bold teleprompter displays the exact script:
     > *"Say: Ambulance needed at [GPS Address]. 1 male victim unconscious with head bleeding. CPR currently in progress."*

---

### 5. Cheap Medicines & Generic Radar (`CheapMedicinesView.tsx`)

#### Current State:
Live Firecrawl real web search across 1mg, PharmEasy, and PMBJP Jan Aushadhi catalogs, side-by-side MRP vs Generic price comparison, "What to tell your chemist" script, and clickable web sources.

#### Recommended UI/UX Enhancements:
1. **Prescription Camera OCR (Snap Your Prescription)**:
   - *UX Friction*: Medical brand names (*"Augmentin 625 Duo"*, *"Rosuvas 10"*, *"Telmikind-AM"*) are difficult for elderly or non-English-speaking users to type.
   - *Solution*: Add a `[ 📷 Snap Prescription ]` button. Gemini Vision extracts all branded medicines in the photo, runs parallel Firecrawl searches, and displays a complete savings table for the entire prescription slip in seconds.
2. **Family Monthly Savings Calculator ("The Generic Basket")**:
   - Allow users to add multiple chronic medicines (e.g. Diabetes + Blood Pressure + Heart) to a "Family Medicine Basket".
   - Shows total annual household savings:  
     *"Switching this basket to Jan Aushadhi saves your family ₹18,400 every year."*
3. **1-Tap Directions to Nearest Jan Aushadhi Kendra**:
   - Integrate geolocation to display the exact distance and direct Google Maps navigation button to the closest operating Jan Aushadhi center.

---

### 6. Design System, Color Psychology & Accessibility

#### 1. Clinical Color Tokens
To maintain consistency between emergency states and calm states:
- **Alert Red (`#D93A3A`)**: Strictly reserved for irreversible life-threats (Cardiac arrest, heavy bleeding, 112 SOS).
- **Warning Amber (`#F0A85B`)**: Used for urgent precautions, crowd assignments, and red-flag contraindications.
- **Clinical Emerald (`#0E5A50` / `#2E9E6D`)**: Used for primary reassurance, safe steps, and Jan Aushadhi savings.
- **Telemetry Cyan / Sky (`#0284C7`)**: Used for hospital radar, driving ETA, and real web citations.

#### 2. Accessible Typography & Visual Weights (Manrope)
- **Primary Headings**: `font-extrabold` (800) with `-0.02em` letter-spacing for sharp optical weight.
- **Emergency Telemetry & Numbers (110 BPM, timers, prices)**: Strict monospace or tabular figures (`font-mono font-bold`) so changing numbers don't cause layout shifts.
- **Body Text**: `font-medium` (500) to ensure high readability even on low-cost Android displays in high ambient light.

#### 3. Haptic Feedback (Vibration API)
- **CPR Metronome**: Rhythmic, short 20ms pulse on every beat (110 BPM) so the rescuer can keep the rhythm in their pocket without looking at the screen.
- **Critical Red-Flag Warning**: Two distinct double-pulses (`[80ms, 50ms, 80ms]`) when a contraindication warning is triggered.

---

## 🛠️ Step-by-Step Implementation Roadmap

```
  ┌────────────────────────────────────────────────────────┐
  │  MILESTONE 1: Mobile Ergonomics & Quick-Wins (P0)     │
  │  • Floating emergency SOS bottom dock on mobile        │
  │  • PWA offline install banner                          │
  │  • Header location pill with 1-tap trauma navigation   │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  MILESTONE 2: AI Cockpit HUD & Stress Mode (P1)        │
  │  • Pinned active protocol HUD during chat              │
  │  • Voice input waveform visualizer                     │
  │  • High Stress Mode (giant cards, step-by-step)        │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  MILESTONE 3: Sunlight Handoff & Prescription OCR (P2) │
  │  • Sunlight Mode for Paramedic QR scanning             │
  │  • Prescription camera scan for cheap medicines        │
  │  • Family monthly savings calculator                   │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  MILESTONE 4: Haptics, Live Compass & Sound (P3)       │
  │  • Tactile vibration on CPR beats                      │
  │  • Directional heading compass to AED                  │
  │  • Real-time crowd squad claim chimes                  │
  └────────────────────────────────────────────────────────┘
```

---

## 🏁 Summary

By implementing the recommendations in `better.md`, Sanjeevani will bridge the gap between digital utility and authentic emergency medical equipment: **grounded, calm under pressure, frictionless for one-handed operation, and universally accessible to every Indian family.**
