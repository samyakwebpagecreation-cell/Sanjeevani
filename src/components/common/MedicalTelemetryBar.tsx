import React, { useEffect, useRef, useState } from 'react';
import { Activity, Clock, HeartPulse, AlertCircle, ShieldCheck } from 'lucide-react';

interface MedicalTelemetryBarProps {
  isCPR?: boolean;
  bpm?: number;
  elapsedSeconds?: number;
  triageLevel?: 'immediate' | 'urgent' | 'routine';
  protocolTitle?: string;
  className?: string;
}

export const MedicalTelemetryBar: React.FC<MedicalTelemetryBarProps> = ({
  isCPR = false,
  bpm = 110,
  elapsedSeconds = 0,
  triageLevel = 'immediate',
  protocolTitle = 'Active Trauma Sequence',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulseBeat, setPulseBeat] = useState(false);

  // Live ECG Waveform Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let x = 0;
    const targetBpm = isCPR ? bpm || 110 : 75;
    const speed = (targetBpm / 60) * 1.6;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    ctx.fillStyle = '#0F1614';
    ctx.fillRect(0, 0, width, height);

    const getEcgSample = (phase: number) => {
      const p = phase % 1.0;
      if (p < 0.15) return 0;
      if (p < 0.22) return Math.sin(((p - 0.15) / 0.07) * Math.PI) * 4;
      if (p < 0.28) return 0;
      if (p < 0.31) return -4;
      if (p < 0.36) return 22;
      if (p < 0.40) return -7;
      if (p < 0.50) return 0;
      if (p < 0.65) return Math.sin(((p - 0.50) / 0.15) * Math.PI) * 7;
      return 0;
    };

    let phase = 0;
    let prevY = midY;

    const render = () => {
      ctx.fillStyle = 'rgba(15, 22, 20, 0.08)';
      ctx.fillRect(x, 0, 4, height);

      const ecgVal = getEcgSample(phase);
      const curY = midY - ecgVal;

      ctx.beginPath();
      ctx.strokeStyle = isCPR ? '#F0A85B' : '#22C55E';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.moveTo(x - speed, prevY);
      ctx.lineTo(x, curY);
      ctx.stroke();

      prevY = curY;
      x += speed;

      ctx.fillStyle = isCPR ? '#F0A85B' : '#86EFAC';
      ctx.beginPath();
      ctx.arc(x, curY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (x >= width) {
        x = 0;
        prevY = midY;
      }

      phase += 0.012 * (targetBpm / 60);
      if (phase >= 1.0) {
        phase = 0;
        setPulseBeat(true);
        setTimeout(() => setPulseBeat(false), 120);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isCPR, bpm]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className={`w-full rounded-2xl bezel-titanium text-white p-3 sm:p-4 shadow-xl border border-white/10 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Live Protocol & Triage Status */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                triageLevel === 'immediate' ? 'bg-red-500' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                triageLevel === 'immediate' ? 'bg-red-500' : 'bg-amber-400'
              }`} />
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">
                  AHA 2020 / ERC 2021 PROTOCOL
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {protocolTitle}
              </h4>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide uppercase border ${
            triageLevel === 'immediate' 
              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {triageLevel === 'immediate' ? 'P1 • Critical' : 'P2 • Urgent'}
          </span>
        </div>

        {/* Center: Live ECG Waveform Monitor */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-center">
          <div className="relative rounded-xl overflow-hidden border border-white/15 bg-[#0F1614] shadow-inner flex items-center">
            <canvas
              ref={canvasRef}
              width={160}
              height={44}
              className="w-36 sm:w-44 h-9 sm:h-10 block"
            />
            <div className="absolute inset-0 ecg-grid pointer-events-none opacity-40" />
            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-white/50">
              LEAD II
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <HeartPulse className={`w-3.5 h-3.5 transition-transform duration-100 ${
                pulseBeat ? 'scale-125 text-accent' : 'text-emerald-400'
              }`} />
              <span className="text-sm font-bold font-mono text-white">
                {isCPR ? bpm || 110 : 75}
              </span>
              <span className="text-[10px] font-mono text-white/60">BPM</span>
            </div>
            <span className="text-[9px] font-mono text-accent">
              {isCPR ? 'METRONOME LOCK' : 'SINUS RHYTHM'}
            </span>
          </div>
        </div>

        {/* Right: Forensic Elapsed Trauma Timer */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase text-white/50 block leading-none">
                TRAUMA TIME
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};
