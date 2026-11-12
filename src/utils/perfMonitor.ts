/**
 * Performance Telemetry & Measurement Utility (G.1)
 * Uses User Timing API (performance.mark / performance.measure) to record:
 *   - send -> skeleton painted
 *   - send -> offline protocol painted
 *   - send -> first token (per tier)
 *   - send -> complete (per tier)
 *   - hospital/route lookup
 */

export interface TierTimingEntry {
  tier: number;
  modelId: string;
  status: 'pending' | 'streaming' | 'completed' | 'aborted' | 'failed';
  startedAtOffsetMs: number;
  firstTokenMs?: number;
  completeMs?: number;
  reason?: string;
}

export interface PerfSnapshot {
  query: string;
  sendTimestamp: number;
  skeletonPaintedMs?: number;
  offlineProtocolMs?: number;
  firstTokenMs?: number;
  firstTokenTier?: number;
  completeMs?: number;
  completeTier?: number;
  hospitalLookupMs?: number;
  hospitalStatus: 'idle' | 'pending' | 'resolved' | 'error';
  tiers: Record<number, TierTimingEntry>;
}

type PerfListener = (snapshot: PerfSnapshot | null) => void;

class PerfMonitor {
  private current: PerfSnapshot | null = null;
  private hospitalStartPerf: number = 0;
  private listeners: Set<PerfListener> = new Set();

  private safeMark(name: string) {
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(name);
      }
    } catch {
      // ignore
    }
  }

  private safeMeasure(name: string, startMark: string, endMark: string): number {
    try {
      if (typeof performance !== 'undefined' && performance.measure) {
        const m = performance.measure(name, startMark, endMark);
        if (m && typeof m.duration === 'number') {
          return Math.round(m.duration * 10) / 10;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  }

  private notify() {
    const snap = this.current ? { ...this.current, tiers: { ...this.current.tiers } } : null;
    this.listeners.forEach((fn) => fn(snap));
  }

  public subscribe(listener: PerfListener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): PerfSnapshot | null {
    return this.current;
  }

  public markSend(query: string) {
    try {
      if (typeof performance !== 'undefined' && performance.clearMarks) {
        performance.clearMarks();
        performance.clearMeasures();
      }
    } catch {
      // ignore
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.safeMark('sanjeevani:send');
    this.current = {
      query: query.slice(0, 60),
      sendTimestamp: now,
      hospitalStatus: 'idle',
      tiers: {}
    };
    this.notify();
  }

  public markSkeletonPainted() {
    if (!this.current) return;
    if (this.current.skeletonPaintedMs !== undefined) return;
    this.safeMark('sanjeevani:skeleton-painted');
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const measured =
      this.safeMeasure('sanjeevani:send->skeleton', 'sanjeevani:send', 'sanjeevani:skeleton-painted') ||
      Math.max(1, Math.round((now - this.current.sendTimestamp) * 10) / 10);
    this.current.skeletonPaintedMs = measured;
    this.notify();
  }

  public markOfflineProtocolPainted() {
    if (!this.current) return;
    if (this.current.offlineProtocolMs !== undefined) return;
    this.safeMark('sanjeevani:offline-painted');
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const measured =
      this.safeMeasure('sanjeevani:send->offline', 'sanjeevani:send', 'sanjeevani:offline-painted') ||
      Math.max(1, Math.round((now - this.current.sendTimestamp) * 10) / 10);
    this.current.offlineProtocolMs = measured;
    this.notify();
  }

  public markTierStart(tier: number, modelId: string) {
    if (!this.current) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.safeMark(`sanjeevani:tier-${tier}-start`);
    this.current.tiers[tier] = {
      tier,
      modelId,
      status: 'pending',
      startedAtOffsetMs: Math.round(now - this.current.sendTimestamp)
    };
    this.notify();
  }

  public markFirstToken(tier: number, modelId: string) {
    if (!this.current) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const markName = `sanjeevani:tier-${tier}-first-token`;
    this.safeMark(markName);
    const elapsed =
      this.safeMeasure(`sanjeevani:send->first-token-t${tier}`, 'sanjeevani:send', markName) ||
      Math.round(now - this.current.sendTimestamp);

    const existing = this.current.tiers[tier] || {
      tier,
      modelId,
      status: 'streaming',
      startedAtOffsetMs: 0
    };
    existing.status = 'streaming';
    existing.firstTokenMs = elapsed;
    this.current.tiers[tier] = existing;

    if (this.current.firstTokenMs === undefined) {
      this.current.firstTokenMs = elapsed;
      this.current.firstTokenTier = tier;
    }
    this.notify();
  }

  public markTierComplete(tier: number, modelId: string) {
    if (!this.current) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const markName = `sanjeevani:tier-${tier}-complete`;
    this.safeMark(markName);
    const elapsed =
      this.safeMeasure(`sanjeevani:send->complete-t${tier}`, 'sanjeevani:send', markName) ||
      Math.round(now - this.current.sendTimestamp);

    const existing = this.current.tiers[tier] || {
      tier,
      modelId,
      status: 'completed',
      startedAtOffsetMs: 0
    };
    existing.status = 'completed';
    existing.completeMs = elapsed;
    this.current.tiers[tier] = existing;

    this.current.completeMs = elapsed;
    this.current.completeTier = tier;
    this.notify();
  }

  public markTierAbortedOrFailed(
    tier: number,
    modelId: string,
    status: 'aborted' | 'failed',
    reason?: string
  ) {
    if (!this.current) return;
    const existing = this.current.tiers[tier] || {
      tier,
      modelId,
      status,
      startedAtOffsetMs: 0
    };
    existing.status = status;
    existing.reason = reason;
    this.current.tiers[tier] = existing;
    this.notify();
  }

  public markHospitalStart() {
    if (!this.current) return;
    this.hospitalStartPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.safeMark('sanjeevani:hospital-start');
    this.current.hospitalStatus = 'pending';
    this.notify();
  }

  public markHospitalComplete(ok: boolean = true) {
    if (!this.current) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.safeMark('sanjeevani:hospital-complete');
    const elapsed =
      this.safeMeasure(
        'sanjeevani:hospital-lookup',
        'sanjeevani:hospital-start',
        'sanjeevani:hospital-complete'
      ) || Math.round(now - this.hospitalStartPerf);
    this.current.hospitalLookupMs = elapsed;
    this.current.hospitalStatus = ok ? 'resolved' : 'error';
    this.notify();
  }
}

export const perfMonitor = new PerfMonitor();
