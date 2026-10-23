import React from 'react';
import { 
  Scan, 
  ShieldCheck, 
  Video
} from 'lucide-react';
import { VideoForensicAnalyzer } from '../video/VideoForensicAnalyzer';

interface DrishtiViewProps {
  onTriggerEscalation: (reason: string) => void;
  onLaunchRespondWithProtocol: (protocolId: string) => void;
}

export const DrishtiView: React.FC<DrishtiViewProps> = ({
  onTriggerEscalation,
  onLaunchRespondWithProtocol
}) => {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & PRIVACY BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm">
              <Video className="h-5 w-5 text-accent" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Drishti Forensic Video Reconstruction
              </h1>
              <p className="text-xs text-ink-muted">
                Clinical Multimodal Video Forensics • Keyframe Extraction • Paramedic SBAR Handoff
              </p>
            </div>
          </div>
        </div>

        {/* Ephemeral Privacy Guarantee Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success text-[11px] font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Frames Processed In-Memory • Zero Cloud Retention</span>
        </div>
      </div>

      {/* 2. REAL AI FORENSIC VIDEO ANALYZER */}
      <div className="rounded-3xl bg-surface border border-border p-4 sm:p-6 shadow-sm">
        <VideoForensicAnalyzer
          onLaunchProtocol={onLaunchRespondWithProtocol}
          onInjectIntoDocket={() => {}}
        />
      </div>
    </div>
  );
};
