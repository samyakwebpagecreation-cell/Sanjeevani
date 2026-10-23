import React, { useState } from 'react';
import { 
  QrCode, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Maximize2, 
  X, 
  ShieldCheck, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';
import { ParamedicHandoutData } from '../../utils/handoutHelper';
import { audioEngine } from '../../utils/audio';

interface ParamedicHandoutCardProps {
  handout: ParamedicHandoutData;
  defaultExpanded?: boolean;
}

export const ParamedicHandoutCard: React.FC<ParamedicHandoutCardProps> = ({
  handout,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSBAR, setCopiedSBAR] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Toggle SBAR Speech Synthesis for arriving paramedics
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      audioEngine.stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToSpeak = handout.sbarText
        .replace(/[*_#`]/g, '')
        .replace(/\n+/g, '. ');
      audioEngine.speak(textToSpeak, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Copy SBAR Script
  const handleCopySBAR = async () => {
    try {
      await navigator.clipboard.writeText(handout.sbarText);
      setCopiedSBAR(true);
      setTimeout(() => setCopiedSBAR(false), 2000);
    } catch {
      // ignore
    }
  };

  // Copy Raw JSON telemetry
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(handout.qrPayloadString);
      setCopiedJSON(true);
      setTimeout(() => setCopiedJSON(false), 2000);
    } catch {
      // ignore
    }
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const blob = new Blob([handout.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanjeevani-${handout.handoutId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 w-full rounded-2xl border border-primary/25 bg-surface/80 dark:bg-surface/60 overflow-hidden shadow-xs transition-all">
      {/* 1. Header Bar: Compact Pill / Accordion Trigger */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between cursor-pointer hover:bg-primary/15 transition-colors select-none"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0 shadow-2xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-bold text-ink">
                Paramedic Handout QR Beacon
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                #{handout.handoutId}
              </span>
              {handout.isEmergency && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-alert/20 text-alert animate-pulse">
                  112 PRIORITY
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {isExpanded ? 'Ready for arriving ambulance e-PCR scan' : 'Tap to display offline SBAR QR Code & audible handover'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-2">
          <span className="hidden sm:inline text-[11px] font-semibold text-primary">
            {isExpanded ? 'Hide' : 'Open Beacon'}
          </span>
          <div className="p-1 rounded-lg bg-base border border-border text-ink-muted">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* 2. Expanded Content: High-Density Scannable QR + SBAR Medical Docket */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-border/80 space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left: QR Code Box */}
            <div className="md:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-base border border-border/80 space-y-3">
              <div 
                className="p-2.5 rounded-xl bg-white shadow-md cursor-pointer hover:scale-102 transition-transform relative group"
                onClick={() => setIsFullScreen(true)}
                title="Click to expand to maximum screen brightness"
              >
                <div 
                  className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: handout.qrSvg }}
                />
                <div className="absolute inset-0 bg-ink/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold space-y-1 backdrop-blur-2xs">
                  <Maximize2 className="w-5 h-5" />
                  <span>Tap to Enlarge</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center justify-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>0.5s Offline Scannable</span>
                </span>
                <p className="text-[10px] text-ink-muted max-w-[210px] leading-tight">
                  Compatible with any ambulance tablet camera, e-PCR scanner, or phone. No cellular network required.
                </p>
              </div>

              {/* QR Utilities */}
              <div className="flex items-center space-x-2 w-full pt-1">
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-surface hover:bg-base border border-border text-[11px] font-semibold text-ink btn-press"
                  title="Expand QR full-screen"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>Full Screen</span>
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="flex items-center justify-center p-1.5 rounded-xl bg-surface hover:bg-base border border-border text-ink-muted hover:text-ink btn-press"
                  title="Download offline QR Code SVG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: SBAR Clinical Telemetry */}
            <div className="md:col-span-7 space-y-3.5 text-xs">
              
              {/* Situation */}
              <div className="p-3 rounded-xl bg-base border border-border/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-primary font-bold">
                  <span className="px-1.5 py-0.2 rounded bg-primary/15 text-[10px]">S</span>
                  <span>SITUATION</span>
                </div>
                <p className="text-ink font-medium leading-relaxed">
                  {handout.situation}
                </p>
              </div>

              {/* Background */}
              <div className="p-3 rounded-xl bg-base border border-border/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-ink-muted font-bold">
                  <span className="px-1.5 py-0.2 rounded bg-border text-[10px]">B</span>
                  <span>BACKGROUND & SCENE</span>
                </div>
                <p className="text-ink font-medium leading-relaxed">
                  {handout.background}
                  {handout.locationAddress && ` • Scene Doorstep: ${handout.locationAddress}`}
                </p>
              </div>

              {/* Assessment */}
              <div className="p-3 rounded-xl bg-base border border-border/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-accent font-bold">
                  <span className="px-1.5 py-0.2 rounded bg-accent/20 text-[10px]">A</span>
                  <span>ASSESSMENT / PRIORITY</span>
                </div>
                <p className="text-ink font-medium leading-relaxed">
                  {handout.assessment}
                </p>
              </div>

              {/* Recommendations */}
              <div className="p-3 rounded-xl bg-base border border-border/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-[10px]">R</span>
                  <span>RECOMMENDATIONS & CONTRAINDICATIONS</span>
                </div>
                <ul className="space-y-1 text-ink-muted list-disc list-inside">
                  {handout.recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="text-ink font-medium">
                      {rec}
                    </li>
                  ))}
                  {handout.contraindications.slice(0, 2).map((contra, i) => (
                    <li key={'contra-' + i} className="text-alert font-medium">
                      Avoid: {contra}
                    </li>
                  ))}
                </ul>
                {handout.nearestHospitalName && (
                  <p className="text-[11px] text-primary font-semibold pt-1 border-t border-border/60">
                    🏥 Nearest Trauma Center: {handout.nearestHospitalName} {handout.nearestHospitalDistance && `(${handout.nearestHospitalDistance})`}
                  </p>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
                <button
                  onClick={handleToggleSpeak}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold btn-press transition-colors cursor-pointer ${
                    isSpeaking 
                      ? 'bg-alert text-white shadow-xs' 
                      : 'bg-primary text-white shadow-xs hover:bg-primary/90'
                  }`}
                  title="Speak SBAR Handover aloud for arriving medics"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop Speech</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>🔊 Speak Handover for Medic</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopySBAR}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-base hover:bg-border/60 border border-border text-xs font-semibold text-ink btn-press"
                  title="Copy formatted SBAR note to clipboard"
                >
                  {copiedSBAR ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied SBAR</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Copy SBAR</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyJSON}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-base hover:bg-border/60 border border-border text-xs font-semibold text-ink btn-press"
                  title="Copy raw JSON payload for e-PCR systems"
                >
                  {copiedJSON ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-ink-muted" />
                      <span>JSON</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. Full-Screen QR Beacon Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-white text-slate-900 shadow-2xl flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 btn-press cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 block">
                Paramedic e-PCR QR Beacon
              </span>
              <h3 className="text-xl font-black tracking-tight text-slate-900">
                Docket #{handout.handoutId}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Hold up to ambulance scanner or paramedic phone. Scans in &lt;0.5s without internet.
              </p>
            </div>

            {/* High-Contrast Large QR */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center">
              <div 
                className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: handout.qrSvg }}
              />
            </div>

            {/* SBAR Audio Trigger in Fullscreen */}
            <div className="w-full flex items-center space-x-2 pt-2">
              <button
                onClick={handleToggleSpeak}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-2 btn-press cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Stop Verbal Handover' : '🔊 Play SBAR Verbal Handover'}</span>
              </button>
              <button
                onClick={handleDownloadSVG}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center space-x-1.5 btn-press cursor-pointer"
                title="Save QR Code SVG"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
