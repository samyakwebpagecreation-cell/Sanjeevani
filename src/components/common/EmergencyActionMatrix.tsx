import React, { useState } from 'react';
import { 
  HeartPulse, 
  Droplet, 
  Wind, 
  Flame, 
  Users, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Zap,
  Clock,
  Radio,
  Pill
} from 'lucide-react';

interface EmergencyActionMatrixProps {
  onLaunchProtocol: (protocolId: string) => void;
  onOpenCrowdModal?: () => void;
  onOpenHandoff?: () => void;
  onOpenMedicines?: () => void;
  className?: string;
}

export const EmergencyActionMatrix: React.FC<EmergencyActionMatrixProps> = ({
  onLaunchProtocol,
  onOpenCrowdModal,
  onOpenHandoff,
  onOpenMedicines,
  className = ''
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('unconscious');

  const protocols = [
    {
      id: 'unconscious',
      title: 'Cardiac Arrest / CPR',
      action: '110 BPM Chest Compressions',
      icon: HeartPulse,
      color: 'text-red-400',
      bg: 'bg-red-500/15 border-red-500/30 hover:border-red-400',
      badge: '110 BPM Metronome',
      priority: 'CRITICAL 112'
    },
    {
      id: 'bleeding',
      title: 'Severe Bleeding',
      action: 'Direct Arterial Pressure',
      icon: Droplet,
      color: 'text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30 hover:border-rose-400',
      badge: 'Tourniquet / Pressure',
      priority: 'CRITICAL 112'
    },
    {
      id: 'choking',
      title: 'Choking & Airway',
      action: '5 Back Blows + Thrusts',
      icon: Wind,
      color: 'text-sky-400',
      bg: 'bg-sky-500/15 border-sky-500/30 hover:border-sky-400',
      badge: 'Heimlich Maneuver',
      priority: 'URGENT'
    },
    {
      id: 'burn',
      title: 'Thermal & Scald Burn',
      action: '20 Mins Continuous Cool Water',
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30 hover:border-amber-400',
      badge: 'No Butter / No Ice',
      priority: 'URGENT'
    }
  ];

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 p-5 sm:p-6 text-white shadow-2xl space-y-4 ${className}`}>
      
      {/* Top Status Strip */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            AI Guardian Active
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
          <Zap className="w-3 h-3 text-accent" />
          <span>10s Fail-Safe Engine</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
          <span>Emergency Incident Action Deck</span>
        </h3>
        <p className="text-xs text-white/75 mt-0.5">
          Tap any incident below for instant clinical AI guidance and crowd task delegation:
        </p>
      </div>

      {/* 4 Protocol Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {protocols.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedProtocol === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProtocol(p.id);
                onLaunchProtocol(p.id);
              }}
              className={`text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                isSelected 
                  ? 'bg-white/20 border-accent shadow-lg shadow-accent/10' 
                  : p.bg
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl bg-black/40 ${p.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-white/80 font-mono">
                  {p.priority}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
                  <span>{p.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-accent" />
                </h4>
                <p className="text-[11px] text-white/75 leading-tight mt-0.5">
                  {p.action}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
                <span className="truncate">{p.badge}</span>
                <span className="text-accent font-semibold text-[9px]">Tap to Start →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Breakthrough Field Action Row */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {onOpenCrowdModal && (
          <button
            onClick={onOpenCrowdModal}
            className="flex items-center justify-between p-3 rounded-xl border border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 text-white transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 text-left">
              <div className="p-1.5 rounded-lg bg-amber-500/30 text-amber-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-amber-300 transition-colors">
                  Crowd Squad QR
                </span>
                <span className="text-[10px] text-white/70 block">
                  Upload scene pic & assign tasks
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-ink">
              QR Hub
            </span>
          </button>
        )}

        {onOpenHandoff && (
          <button
            onClick={onOpenHandoff}
            className="flex items-center justify-between p-3 rounded-xl border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-white transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 text-left">
              <div className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-emerald-300 transition-colors">
                  Paramedic SBAR
                </span>
                <span className="text-[10px] text-white/70 block">
                  Offline telemetry handoff QR
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400 text-ink">
              EMS Docket
            </span>
          </button>
        )}

        {onOpenMedicines && (
          <button
            onClick={onOpenMedicines}
            className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-sky-400/40 bg-sky-500/20 hover:bg-sky-500/30 text-white transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 text-left">
              <div className="p-1.5 rounded-lg bg-sky-500/30 text-sky-300">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-sky-300 transition-colors">
                  Cheap Medicines & Jan Aushadhi Radar
                </span>
                <span className="text-[10px] text-white/70 block">
                  Search real web for generic salt substitutes & save 50%-90%
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-400 text-slate-950">
              Save 90%
            </span>
          </button>
        )}
      </div>

      {/* Footer Compliance Strip */}
      <div className="pt-1 flex items-center justify-between text-[10px] text-white/70 font-mono">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>AHA 2020 & ERC 2021 Validated</span>
        </span>
        <span className="text-accent font-semibold">100% Offline Resilience</span>
      </div>

    </div>
  );
};
