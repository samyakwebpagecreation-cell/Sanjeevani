# Sanjeevani School Drill Mode — Scoring & Signal Methodology (`SCORE_METHOD.md`)

## 1. Non-Clinical Disclaimer
All scores, weights, and timing thresholds in Sanjeevani Drill Mode are **educational program targets**, not clinical standards or medical certifications. Default program targets are explicitly marked *"to be confirmed by a certified first-aid instructor"* and are configurable per school in `schools/{schoolId}.settings.targets`.

---

## 2. Readiness Score v1 (`scoreVersion: 1`, 0–100 Points)

Each team run (`runs/{runId}`) is scored deterministically from its immutable event log (`events/{eventId}`) relative to the drill start timestamp (`t0 = run.startedAt`):

| Sub-Score Component | Max Points | Full-Points Threshold (Default) | Zero-Points Threshold (Default) | Interpolation / Rule |
| :--- | :---: | :---: | :---: | :--- |
| **1. Time to Simulated 112 Call** (`call112`) | **20** | $\le 30\text{s}$ | $\ge 120\text{s}$ | Linear interpolation between $30\text{s}$ and $120\text{s}$ |
| **2. Time to First Compression** (`firstCompression`) | **25** | $\le 30\text{s}$ | $\ge 120\text{s}$ | Linear interpolation between $30\text{s}$ and $120\text{s}$ |
| **3. CPR Rate & Hands-Off Quality** (`cprRateQuality`) | **25** | $100\%$ in $100\text{--}120\text{ BPM}$ & max pause $\le 5\text{s}$ | $0\%$ in range & max pause $\ge 20\text{s}$ | $15 \times (\text{cprInRangePct} / 100) + 10 \times \text{linearPause}(5\text{s}, 20\text{s})$ |
| **4. Squad Role Coverage** (`roleCoverage`) | **15** | $4/4$ roles claimed $\le 30\text{s}$ | $0$ roles claimed | $15 \times (\text{rolesFilled} / \text{rolesTotal})$, scaled down linearly up to $90\text{s}$ |
| **5. Handover Completeness** (`handoverCompleteness`) | **15** | $4/4$ fields before run end | $0/4$ fields | $15 \times (\text{completedFields} / 4)$ |
| **Total Team Run Score** | **100** | — | — | Rounded sum of the 5 sub-scores ($0\text{--}100$) |

---

## 3. Class & School Readiness Aggregation
- **Drill Summary Score**: For a completed drill with $k$ teams, `drill.summary.medianScore` is the **median** (with `p25` and `p75` interquartile range) across all scored team runs.
- **Class Readiness Score**: **Median of the last up to 3 completed drills** (`computeReadinessMedianOfLast3`). Medians are used instead of means so a single disrupted team or sensor glitch does not skew the class metric.
- **School Readiness Score**: **Median of active class Readiness Scores** in the current term.
- **Small-Sample Suppression (`n < 5`)**: Any group statistic with fewer than $5$ participating students (`n < 5`) is suppressed in the UI and displays `"Not enough data yet (n < 5)"`.
- **Zero Individual Rankings**: Individual students are never ranked or scored against each other. Student rosters record only `drillsParticipated` and `rolesPracticed`.

---

## 4. CPR Rhythm Estimator (`cprRateEstimator`)
Phone sensors can measure **rhythm rate (BPM)** and **hands-off pauses**, never chest compression depth.
1. **Accelerometer Pipeline (`source: "accelerometer"`)**:
   - Samples `DeviceMotion` acceleration magnitude at $\sim 50\text{ Hz}$ (requesting permission via `DeviceMotionEvent.requestPermission()` on iOS + HTTPS).
   - Applies a 3-point low-pass smoothing filter and subtracts a rolling $0.5\text{s}$ baseline to eliminate gravity and tilt drift.
   - Detects local maxima with prominence $\ge 1.35\text{ m/s}^2$ and a physiological refractory guard of $260\text{ ms}$ ($\le 230\text{ BPM}$).
2. **Tap-Along Fallback (`source: "tap"`)**:
   - On desktop browsers or devices without motion sensors, students tap the on-screen rhythm pad in time with the $110\text{ BPM}$ metronome.
3. **Output Metrics**:
   - `bpmSeries`: Instantaneous BPM ($60000 / \Delta t_{\text{ms}}$) for inter-beat intervals in $[250\text{ ms}, 2000\text{ ms}]$.
   - `medianBpm`: Median of `bpmSeries`.
   - `inRangePct`: Percentage of compression intervals within $[100, 120]\text{ BPM}$.
   - `longestPauseSec`: Longest inter-compression gap in seconds.

---

## 5. Clock Sync & Offline Drift Sanity Validation
- Every event stores `clientAt` (offset-adjusted client timestamp) and `receivedAt`.
- `validateEventTiming` flags `needsReview: true` if:
  1. `clientAt < run.startedAt - 1000ms` (event precedes drill start `t0`),
  2. `clientAt > run.endedAt + 5000ms` (event logged $>5\text{s}$ after drill ended), or
  3. `|receivedAt - clientAt| > 600,000ms` ($>10\text{ minutes}$ offline sync drift).
