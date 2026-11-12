# Sanjeevani School Drill Mode — Child Privacy, DPDP Compliance & Cost Notes (`PRIVACY_NOTES.md`)

## 1. Data Minimisation for Minors (DPDP Act 2023 & DPDP Rules Nov 2025)
Sanjeevani Drill Mode is engineered for Indian schools under the **Digital Personal Data Protection (DPDP) Act 2023** and the **DPDP Rules notified in November 2025**:
1. **Zero Student Accounts or PII**:
   - Students **never** create accounts, enter email addresses, phone numbers, dates of birth, or upload photos/audio/video/GPS coordinates.
   - Students join a practice drill via Firebase Anonymous Auth and select an anonymous classroom code (`S-01` through `S-40`).
   - Only the classroom teacher holds the physical paper key mapping `S-01..S-40` to students if desired.
2. **No Behavioural Tracking, Profiling, or Targeted Advertising**:
   - No third-party analytics, ad pixels, or behavioural tracking SDKs are loaded.
   - No individual student rankings or leaderboards are computed.
3. **Public Certificate Verification Privacy (`/verify/:certId`)**:
   - Certificates use unguessable IDs (`CERT-XXXX-XXXX-XXXX`) and `firestore.rules` blocks collection listing (`allow list: if false`).
   - The public verification page displays **only** valid/revoked status, school name, class grade, scenario title, and drill date — **never** a student's name or roster code.
4. **Data Residency (`asia-south1`, Mumbai)**:
   - Firestore and Cloud Functions are configured for `asia-south1` (Mumbai) so all school records remain within India.
5. **Retention & Right to Erasure**:
   - Raw drill runs and events are automatically purged after `school.settings.retentionDays` (default `365` days) while keeping anonymised class/school aggregates.
   - Teachers and school admins can permanently cascade-delete any class (`deleteClassCascade`) or school (`deleteSchoolCascade`) at any time.

---

## 2. Draft Parent & Guardian Information Notice (For School Pilots)

> **Subject: Participation in Sanjeevani First-Aid Practice Drills (Zero Personal Data Collection)**
>
> Dear Parent / Guardian,
>
> This term, **[School Name]** is conducting timed classroom first-aid practice drills using the **Sanjeevani School Readiness Program** (covering simulated 112 emergency calling, hands-only CPR rhythm practice at 100–120 BPM, AED retrieval, and paramedic handover teamwork).
>
> **How Your Child's Privacy is Protected:**
> - **No Student Accounts or Personal Details:** Students do not create accounts or enter their name, email address, phone number, photo, or location into the app.
> - **Anonymous Classroom Codes Only:** During a 3-minute group drill, each team of 3–5 students uses an anonymous classroom code (such as `S-01` or `S-02`) to log team response times.
> - **Educational Practice Only:** All drills are clearly marked as practice simulations (`DRILL / PRACTICE MODE`), and the 112 button is strictly simulated. Participation certificates record practice participation and are not medical qualifications.
> - **Right to Opt Out or Request Deletion:** Participation is part of classroom safety education. You may inspect the classroom dashboard or request deletion of your class's practice logs at any time through the School Principal.
>
> *Signed,*  
> **Principal / School Safety Coordinator, [School Name]**

---

## 3. Firebase Spark (Free) vs Blaze Plan & Cost Note

| Dimension | Firebase Spark Plan (Free Tier) | Firebase Blaze Plan (Pay-As-You-Go, `asia-south1`) |
| :--- | :--- | :--- |
| **Firestore Reads / Writes** | 50,000 reads/day, 20,000 writes/day, 1 GiB storage free | Same free tier included; ₹0.03–₹0.10 per 1,000 extra operations |
| **Per-Drill Footprint** | 1 drill (4 teams, ~32 events) = **~40 writes & ~80 reads** | Supports **~500 classroom drills/day** completely within the free tier |
| **Aggregation Execution** | Runs via **Teacher-Client Transaction Fallback** (`src/services/drillService.ts`) | Runs via **Cloud Functions (`functions/src/index.ts`)** using Admin SDK |
| **Tamper-Resistance Trade-off** | On Spark, an authenticated teacher client writes `classStats` and `schoolStats` directly. A technical teacher could theoretically craft custom aggregate payloads for their own school. | On Blaze, `classStats`, `schoolStats`, and `platformStats/current` are locked to Admin SDK writes only (`allow write: if false` for clients), providing cryptographic server-side tamper resistance. |
