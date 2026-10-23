# Sanjeevani v2.0 — First-Aid Intelligence & Trauma Command Center

> **Transforming Every Smartphone into an Offline-Resilient Pre-Hospital Trauma Command Center.**  
> 🌐 **Live Web Application:** [https://sanjeevani-v2.web.app](https://sanjeevani-v2.web.app)  
> 🏫 **Origin:** Seth M.R. Jaipuria School (Recognized among the World's Top 10 Schools by T4 Education)  
> 👥 **Founders:** Dakshita Kapoor & Samyak Verma | **Key Contributor:** Siddhi Misra

---

## 🚑 About Sanjeevani

In India, more than **150,000 people die annually in road traffic accidents**, and over **58,000 die from snakebites**—many during the critical **"Golden Hour"** before an ambulance arrives. 

**Sanjeevani v2.0** bridges this pre-hospital void by providing real-time clinical execution tools rather than just conversational chat:
1. **112 SOS Deterministic Hard-Stop Override:** Locks conversational guidance during severe life-threatening emergencies, triggers immediate 112 calling, and generates a live GPS driving route to the nearest Level-1 trauma hospital.
2. **Crowd Squad QR:** Flashes a full-screen dynamic QR code at the accident scene; surrounding bystanders scan it with their phone camera (**zero app install, zero login**) and get instantly assigned to 3 coordinated, non-overlapping roles:
   - *Role 1:* 112 Dispatch & GPS Doorstep Beacon
   - *Role 2:* Crowd Control & Airway Protection
   - *Role 3:* AED & First-Aid Kit Runner
3. **Paramedic SBAR Handover Docket:** Records pre-hospital telemetry (incident clock, unresponsive seconds, CPR minutes, head strikes, direct pressure duration) and compiles it into an offline-scannable **SBAR QR Code** that arriving 108/112 paramedics can scan in 3 seconds.
4. **AI Medical Camera (4 Clinical Modes):**
   - *Visual Injury Triage:* Wounds, burns, and bites severity assessment with 1-2-3 steps and contraindications.
   - *AR CPR Chest Guide:* Live sternum reticle overlay + **110 BPM Web-Audio Metronome** (`5 cm / 2 inches` depth cues).
   - *Prescription OCR:* Scans doctor prescriptions to identify generic salt equivalents.
   - *In-App QR Scanner:* Scans Squad and Docket QR codes offline.
5. **AI Video Forensic Analyzer:** Extracts chronological video frames in the browser to analyze vehicle collision kinematics, mechanism of injury (MOI), and occult cervical spine risks.
6. **Cheap Medicines (Jan Aushadhi Kendra Matcher):** Searches brand-name medicines, maps exact identical active chemical salts, and compares prices against **PMBJP Jan Aushadhi Kendras** (saving families 50% to 85%) and major Indian pharmacies.
7. **Hyper-Local Antidote & AED Radar:** Pinpoints nearby emergency assets including Cold-Chain Anti-Snake Venom (ASV) and Anti-Rabies Vaccine (ARV) in Civil Hospitals, Transit/Metro AEDs, and 24/7 Burn Pharmacies.
8. **Cultural MythBuster:** Debunks dangerous Indian first-aid folklore (e.g., toothpaste on burns, cutting snakebites, keys in seizure hands) with AIIMS and WHO clinical evidence.
9. **Acoustic Agonal Gasp Detector:** Analyzes 10 seconds of breathing cadence via microphone using the Web Audio API to detect irregular agonal gasps and trigger prompt CPR.
10. **Verified Offline Protocol Library:** Human-verified, instant emergency protocols aligned with **AHA 2020** and **AIIMS Emergency Medicine** standards.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4 with adaptive WCAG AAA clinical light/dark mode.
- **AI Engine:** Google Gemini Multimodal API with a **4-Tier Fail-Safe Cascade** (`gemini-flash-lite`, `gemini-2.5-flash`, `gemini-2.0-flash`, and local deterministic offline engine).
- **Backend & Real-Time Sync:** Google Cloud Firestore with real-time `onSnapshot` listeners for multi-bystander sync, Firebase Authentication, and Firebase Hosting Global CDN.
- **Mapping & Routing:** Leaflet.js, OpenStreetMap Nominatim reverse-geocoding, and OSRM / Google Routes.
- **Browser Hardware APIs:** Web Audio API (metronome synthesizer & FFT acoustic analysis), Web Speech API (hands-free voice recognition & auto-TTS), MediaDevices + HTML5 Canvas.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/samyakwebpagecreation-cell/Sanjeevani.git
   cd Sanjeevani
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key and Firebase configuration in `.env`.

4. **Run the local development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## ⚖️ Clinical Guidelines & Good Samaritan Law

- **Clinical Compliance:** Benchmarked against **AHA 2020 Guidelines** (CPR compression rates 100–120 BPM, depth 5 cm / 2 in), **AIIMS National Snakebite Management Protocol**, and **WHO/NLEM** essential drug standards.
- **Legal Protection:** Operates under the protection of India's **Good Samaritan Law** (*Section 134A of the Motor Vehicles Amendment Act, 2019* / Supreme Court of India *SaveLIFE Foundation v. Union of India, 2016*), protecting all citizens who render emergency first-aid in good faith.

---

## 📄 License & Team

Developed by **Team Sanjeevani**  
*Save Time · Save Life*
