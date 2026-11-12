import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { ParamedicHandoutData } from '../../utils/handoutHelper';
import { audioEngine } from '../../utils/audio';
import { Button } from '../common/DesignSystem';
import { QRCard } from './QRCard';
import { SBARCard } from './SBARCard';

export interface ParamedicHandoutCardProps {
  handout: ParamedicHandoutData;
  defaultExpanded?: boolean;
}

export const ParamedicHandoutCard: React.FC<ParamedicHandoutCardProps> = ({
  handout
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSBAR, setCopiedSBAR] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

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

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(handout.handoutId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
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
    <div className="w-full space-y-5 text-ink">
      {/* 1. Header: Title, Neutral ID Chip with Copy Icon, Status Line */}
      <div className="p-4 rounded-[18px] bg-surface border border-border shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold tracking-tight text-ink">
              Paramedic Handout QR
            </h3>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base hover:bg-primary-soft border border-border text-sm font-medium text-ink-muted hover:text-ink tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Copy Handout ID"
              aria-label={`Copy Handout ID ${handout.handoutId}`}
            >
              <span>{handout.handoutId}</span>
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>

          {handout.isEmergency && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-alert/10 border border-alert/30 text-alert text-xs font-bold uppercase tracking-wider">
              112 Priority
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-ink-muted">
          Ready for arriving ambulance e-PCR scan
        </p>
      </div>

      {/* 2. Identical QR Card with "0.5s offline scannable" badge and action row */}
      <QRCard
        qrSvg={handout.qrSvg}
        idLabel={handout.handoutId}
        badgeText="0.5s offline scannable"
        modalEyebrow="Paramedic e-PCR QR Beacon"
        modalTitle={`Docket ${handout.handoutId}`}
        modalSubtitle="Hold up to ambulance scanner or paramedic phone. Scans in under 0.5s without internet."
        caption="Compatible with any ambulance tablet camera, e-PCR scanner, or phone. No cellular network required."
        onCopy={handleCopySBAR}
        copied={copiedSBAR}
        copyLabel="Copy"
        onDownload={handleDownloadSVG}
        primaryModalAction={{
          label: 'Play SBAR Verbal Handover',
          activeLabel: 'Stop Verbal Handover',
          isActive: isSpeaking,
          icon: isSpeaking ? (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          ),
          onClick: handleToggleSpeak
        }}
      />

      {/* 3. SBAR 4 Stacked Rows in One Unified Card */}
      <SBARCard handout={handout} />

      {/* 4. Handover Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <Button
          type="button"
          variant={isSpeaking ? 'alert' : 'primary'}
          size="sm"
          onClick={handleToggleSpeak}
          className="flex-1"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Stop Speech</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Speak Handover for Medic</span>
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopySBAR}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface hover:bg-base border border-border text-sm font-semibold text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
            title="Copy formatted SBAR note to clipboard"
          >
            {copiedSBAR ? (
              <>
                <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-primary font-bold">Copied SBAR</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Copy SBAR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyJSON}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface hover:bg-base border border-border text-sm font-semibold text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
            title="Copy raw JSON payload for e-PCR systems"
          >
            {copiedJSON ? (
              <>
                <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-primary font-bold">Copied JSON</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>JSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
