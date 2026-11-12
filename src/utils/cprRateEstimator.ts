export type CprSampleSource = 'accelerometer' | 'tap';

export interface CprSample {
  /** Timestamp in milliseconds (epoch or relative to drill start) */
  tMs: number;
  /** Optional raw acceleration magnitude (m/s^2) when sampled from DeviceMotion */
  magnitude?: number;
  /** Input source: accelerometer peak detection or on-screen tap fallback */
  source?: CprSampleSource;
}

export interface CprRateSummary {
  /** Instantaneous BPM values for each valid inter-compression interval */
  bpmSeries: number[];
  /** Median BPM across valid compressions (0 if < 2 compressions) */
  medianBpm: number;
  /** Percentage (0–100) of valid compression intervals within [minBpm, maxBpm] (default 100–120 BPM) */
  inRangePct: number;
  /** Longest gap between compressions in seconds */
  longestPauseSec: number;
  /** Total detected compressions */
  compressionCount: number;
  /** Dominant sample source */
  source: CprSampleSource;
}

export interface CprEstimatorOptions {
  minBpm?: number;
  maxBpm?: number;
  /** Optional window start (ms) to measure initial pause before first compression */
  windowStartMs?: number;
  /** Optional window end (ms) to measure trailing pause after last compression */
  windowEndMs?: number;
  /** Minimum prominence above rolling baseline (m/s^2) for accelerometer peaks */
  minProminence?: number;
}

export function computeMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Extracts compression peak timestamps (ms) from either discrete tap events
 * or continuous ~50Hz DeviceMotion magnitude samples using a 3-point low-pass
 * smoothing filter + local maxima detector with prominence & refractory guards.
 */
export function extractCompressionPeaksMs(
  samples: CprSample[],
  minProminence = 1.35
): { peaksMs: number[]; dominantSource: CprSampleSource } {
  if (!samples || samples.length === 0) {
    return { peaksMs: [], dominantSource: 'tap' };
  }

  const sorted = [...samples].sort((a, b) => a.tMs - b.tMs);
  const hasContinuousAccel = sorted.some(
    (s) => s.source === 'accelerometer' && typeof s.magnitude === 'number'
  );

  // Case 1: Discrete tap or pre-detected beat events
  if (!hasContinuousAccel) {
    const peaksMs: number[] = [];
    for (const s of sorted) {
      if (peaksMs.length === 0 || s.tMs - peaksMs[peaksMs.length - 1] >= 220) {
        peaksMs.push(s.tMs);
      }
    }
    const dominantSource: CprSampleSource = sorted.some((s) => s.source === 'accelerometer')
      ? 'accelerometer'
      : 'tap';
    return { peaksMs, dominantSource };
  }

  // Case 2: Continuous accelerometer stream -> 3-point low-pass filter + rolling baseline
  const mags = sorted.map((s) => s.magnitude ?? 9.81);
  const smoothed: number[] = mags.map((_, i) => {
    const prev = mags[Math.max(0, i - 1)];
    const curr = mags[i];
    const next = mags[Math.min(mags.length - 1, i + 1)];
    return (prev + 2 * curr + next) / 4;
  });

  // Compute local rolling mean over +/- 12 samples (~0.5s at 50Hz) to remove gravity/tilt drift
  const rollingMean: number[] = smoothed.map((_, i) => {
    const start = Math.max(0, i - 12);
    const end = Math.min(smoothed.length - 1, i + 12);
    let sum = 0;
    for (let j = start; j <= end; j++) sum += smoothed[j];
    return sum / (end - start + 1);
  });

  const peaksMs: number[] = [];
  const refractoryMs = 260; // Max physiologically plausible compression tempo ~230 BPM

  for (let i = 1; i < smoothed.length - 1; i++) {
    const val = smoothed[i];
    const prominence = val - rollingMean[i];
    if (
      prominence >= minProminence &&
      val >= smoothed[i - 1] &&
      val > smoothed[i + 1]
    ) {
      const tMs = sorted[i].tMs;
      if (peaksMs.length === 0 || tMs - peaksMs[peaksMs.length - 1] >= refractoryMs) {
        peaksMs.push(tMs);
      }
    }
  }

  return { peaksMs, dominantSource: 'accelerometer' };
}

/**
 * Pure CPR rate & rhythm estimator.
 * Reports compression RATE (BPM) and consistency only — never claims chest depth.
 */
export function cprRateEstimator(
  samples: CprSample[],
  options: CprEstimatorOptions = {}
): CprRateSummary {
  const minBpm = options.minBpm ?? 100;
  const maxBpm = options.maxBpm ?? 120;
  const { peaksMs, dominantSource } = extractCompressionPeaksMs(
    samples,
    options.minProminence ?? 1.35
  );

  if (peaksMs.length < 2) {
    let longestPauseSec = 0;
    if (
      typeof options.windowStartMs === 'number' &&
      typeof options.windowEndMs === 'number' &&
      options.windowEndMs > options.windowStartMs
    ) {
      longestPauseSec = Number(
        ((options.windowEndMs - options.windowStartMs) / 1000).toFixed(1)
      );
    }
    return {
      bpmSeries: [],
      medianBpm: 0,
      inRangePct: 0,
      longestPauseSec,
      compressionCount: peaksMs.length,
      source: dominantSource
    };
  }

  const bpmSeries: number[] = [];
  let longestGapMs = 0;

  if (typeof options.windowStartMs === 'number' && peaksMs[0] > options.windowStartMs) {
    longestGapMs = Math.max(longestGapMs, peaksMs[0] - options.windowStartMs);
  }

  for (let i = 1; i < peaksMs.length; i++) {
    const deltaMs = peaksMs[i] - peaksMs[i - 1];
    if (deltaMs > longestGapMs) {
      longestGapMs = deltaMs;
    }
    // Intervals <= 2000ms (>= 30 BPM) are active compression intervals; > 2000ms is a hands-off pause
    if (deltaMs >= 250 && deltaMs <= 2000) {
      const bpm = Math.round(60000 / deltaMs);
      bpmSeries.push(bpm);
    }
  }

  if (
    typeof options.windowEndMs === 'number' &&
    options.windowEndMs > peaksMs[peaksMs.length - 1]
  ) {
    longestGapMs = Math.max(
      longestGapMs,
      options.windowEndMs - peaksMs[peaksMs.length - 1]
    );
  }

  const medianBpm = Math.round(computeMedian(bpmSeries));
  const inRangeCount = bpmSeries.filter((bpm) => bpm >= minBpm && bpm <= maxBpm).length;
  const inRangePct =
    bpmSeries.length > 0 ? Math.round((inRangeCount / bpmSeries.length) * 100) : 0;

  // Pause is any gap exceeding 2.0 seconds; otherwise report longest inter-beat gap in sec
  const longestPauseSec =
    longestGapMs >= 2000 ? Number((longestGapMs / 1000).toFixed(1)) : Number((longestGapMs / 1000).toFixed(1));

  return {
    bpmSeries,
    medianBpm,
    inRangePct,
    longestPauseSec,
    compressionCount: peaksMs.length,
    source: dominantSource
  };
}

/**
 * Generates deterministic synthetic accelerometer or tap signals for unit testing
 * and classroom calibration:
 * - steady_110: 110 BPM sine peaks (inRangePct >= 95%, medianBpm ~110)
 * - slow_80: 80 BPM (inRangePct == 0%, medianBpm ~80)
 * - irregular: alternating 75 BPM and 145 BPM
 * - long_pause_9s: steady 110 BPM with a 9-second hands-off pause in the middle
 * - pure_noise: low-amplitude random sensor jitter below prominence threshold
 */
export function generateSyntheticCprSamples(
  pattern: 'steady_110' | 'slow_80' | 'irregular' | 'long_pause_9s' | 'pure_noise',
  durationSec = 20
): CprSample[] {
  const samples: CprSample[] = [];
  const sampleRateHz = 50;
  const dtMs = 1000 / sampleRateHz;
  const totalSamples = Math.floor((durationSec * 1000) / dtMs);

  if (pattern === 'pure_noise') {
    for (let i = 0; i < totalSamples; i++) {
      const tMs = i * dtMs;
      // Deterministic pseudo-noise amplitude +/- 0.35 m/s^2 (well below 1.35 m/s^2 prominence)
      const jitter = Math.sin(i * 1.7) * 0.25 + Math.cos(i * 3.1) * 0.15;
      samples.push({
        tMs,
        magnitude: 9.81 + jitter,
        source: 'accelerometer'
      });
    }
    return samples;
  }

  if (pattern === 'steady_110' || pattern === 'slow_80') {
    const targetBpm = pattern === 'steady_110' ? 110 : 80;
    const periodMs = 60000 / targetBpm;
    for (let i = 0; i < totalSamples; i++) {
      const tMs = i * dtMs;
      const phase = ((tMs % periodMs) / periodMs) * 2 * Math.PI;
      // Sharp positive peak once per period with amplitude +3.2 m/s^2
      const pulse = Math.pow(Math.max(0, Math.sin(phase)), 4) * 3.5;
      samples.push({
        tMs,
        magnitude: 9.81 + pulse,
        source: 'accelerometer'
      });
    }
    return samples;
  }

  if (pattern === 'long_pause_9s') {
    const periodMs = 60000 / 110;
    for (let i = 0; i < totalSamples; i++) {
      const tMs = i * dtMs;
      const inPauseWindow = tMs >= 5000 && tMs < 14000; // 9-second pause
      const phase = ((tMs % periodMs) / periodMs) * 2 * Math.PI;
      const pulse = inPauseWindow ? 0 : Math.pow(Math.max(0, Math.sin(phase)), 4) * 3.5;
      samples.push({
        tMs,
        magnitude: 9.81 + pulse,
        source: 'accelerometer'
      });
    }
    return samples;
  }

  // 'irregular': discrete taps alternating between 800ms (75 BPM), 410ms (146 BPM), and 650ms (92 BPM)
  const intervals = [800, 410, 820, 400, 680, 390, 850, 420];
  let cursorMs = 500;
  let idx = 0;
  while (cursorMs < durationSec * 1000) {
    samples.push({
      tMs: cursorMs,
      source: 'tap'
    });
    cursorMs += intervals[idx % intervals.length];
    idx++;
  }
  return samples;
}
