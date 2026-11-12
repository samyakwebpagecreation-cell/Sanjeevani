import React, { useState, useEffect } from 'react';
import { perfMonitor, PerfSnapshot } from '../../utils/perfMonitor';

/**
 * Dev-only Performance Overlay (?debug=1)
 * Displays real-time performance.mark / performance.measure metrics for:
 *   send -> skeleton painted -> offline protocol -> first token -> complete (per tier) + hospital/route lookup.
 */
export const PerfDebugOverlay: React.FC = () => {
  const [isDebugEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  });

  const [snapshot, setSnapshot] = useState<PerfSnapshot | null>(() =>
    perfMonitor.getSnapshot()
  );

  useEffect(() => {
    if (!isDebugEnabled) return;
    return perfMonitor.subscribe(setSnapshot);
  }, [isDebugEnabled]);

  if (!isDebugEnabled) return null;

  const tiers = snapshot ? Object.values(snapshot.tiers) : [];

  return (
    <div
      aria-label="Developer latency telemetry"
      className="fixed bottom-20 right-3 xl:right-[342px] z-50 w-72 rounded-xl bg-slate-900/95 text-white p-3 text-[14px] font-mono shadow-lg border border-slate-700 pointer-events-none select-none space-y-1.5"
    >
      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
        <span className="font-bold text-teal-300">PERF (?debug=1)</span>
        <span className="text-slate-400">User Timing</span>
      </div>

      {!snapshot ? (
        <div className="text-slate-400">Waiting for first send…</div>
      ) : (
        <>
          <div className="truncate text-slate-300">
            Query: <span className="text-white">{snapshot.query}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 tabular-nums">
            <span className="text-slate-400">send → skeleton:</span>
            <span className="text-right font-bold text-emerald-300">
              {snapshot.skeletonPaintedMs !== undefined
                ? `${snapshot.skeletonPaintedMs} ms`
                : '—'}
            </span>

            <span className="text-slate-400">send → offline:</span>
            <span className="text-right font-bold text-emerald-300">
              {snapshot.offlineProtocolMs !== undefined
                ? `${snapshot.offlineProtocolMs} ms`
                : '—'}
            </span>

            <span className="text-slate-400">send → 1st token:</span>
            <span className="text-right font-bold text-teal-300">
              {snapshot.firstTokenMs !== undefined
                ? `${snapshot.firstTokenMs} ms (T${snapshot.firstTokenTier})`
                : '…'}
            </span>

            <span className="text-slate-400">send → complete:</span>
            <span className="text-right font-bold text-white">
              {snapshot.completeMs !== undefined
                ? `${snapshot.completeMs} ms (T${snapshot.completeTier})`
                : '…'}
            </span>

            <span className="text-slate-400">hospital/route:</span>
            <span className="text-right font-bold text-sky-300">
              {snapshot.hospitalLookupMs !== undefined
                ? `${snapshot.hospitalLookupMs} ms`
                : snapshot.hospitalStatus}
            </span>
          </div>

          {tiers.length > 0 && (
            <div className="border-t border-slate-700 pt-1 space-y-0.5 tabular-nums">
              {tiers.map((t) => (
                <div key={t.tier} className="flex items-center justify-between text-[14px]">
                  <span className="text-slate-300 truncate max-w-[120px]">
                    T{t.tier}
                  </span>
                  <span className="text-slate-200">
                    {t.status}
                    {t.firstTokenMs ? ` · ${t.firstTokenMs}ms` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
