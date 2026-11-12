import React, { useState, useEffect } from 'react';
import { Maximize2, Copy, Check, Download, X, ShieldCheck } from 'lucide-react';
import { Card, Badge, Button } from '../common/DesignSystem';

export interface QRCardProps {
  qrSvg: string;
  idLabel: string;
  modalEyebrow: string;
  modalTitle: string;
  modalSubtitle: string;
  caption: string;
  badgeText?: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel?: string;
  onDownload: () => void;
  primaryModalAction?: {
    label: string;
    activeLabel?: string;
    isActive?: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  };
}

export const QRCard: React.FC<QRCardProps> = ({
  qrSvg,
  modalEyebrow,
  modalTitle,
  modalSubtitle,
  caption,
  badgeText,
  onCopy,
  copied,
  copyLabel = 'Copy',
  onDownload,
  primaryModalAction
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Close fullscreen modal on Escape
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  return (
    <>
      <Card className="p-4 sm:p-5 flex flex-col items-center space-y-4">
        {badgeText && (
          <Badge
            variant="soft"
            icon={<ShieldCheck className="w-4 h-4" />}
            className="mx-auto"
          >
            {badgeText}
          </Badge>
        )}

        {/* Fixed 184px QR Frame inside subtle corner-bracket markers (zero overflow/overlap) */}
        <button
          type="button"
          onClick={() => setIsFullScreen(true)}
          className="group relative p-3.5 rounded-2xl bg-white border border-border shadow-2xs hover:border-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Open ${modalTitle} QR code in full screen`}
          title="Open QR code in full screen"
        >
          {/* Corner-bracket markers */}
          <div className="p-2 rounded-xl border-2 border-dashed border-primary/25 bg-white flex items-center justify-center">
            <div
              className="w-[184px] h-[184px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[184px] [&>svg]:max-h-[184px] [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: qrSvg || '' }}
            />
          </div>
        </button>

        {/* Caption */}
        <p className="text-sm text-ink-muted text-center leading-snug max-w-[30ch]">
          {caption}
        </p>

        {/* Consistent 40px+ (44px mobile) Action Row: Full Screen, Copy, Download */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full pt-1">
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="min-h-[44px] sm:min-h-[40px] px-2 py-2 rounded-xl bg-base hover:bg-primary-soft border border-border text-xs sm:text-sm font-semibold text-ink hover:text-primary flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Full Screen</span>
          </button>

          <button
            type="button"
            onClick={onCopy}
            className="min-h-[44px] sm:min-h-[40px] px-2 py-2 rounded-xl bg-base hover:bg-primary-soft border border-border text-xs sm:text-sm font-semibold text-ink hover:text-primary flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-primary font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" aria-hidden="true" />
                <span>{copyLabel}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="min-h-[44px] sm:min-h-[40px] px-2 py-2 rounded-xl bg-base hover:bg-primary-soft border border-border text-xs sm:text-sm font-semibold text-ink hover:text-primary flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Download</span>
          </button>
        </div>
      </Card>

      {/* Full-Screen QR Modal */}
      {isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md p-6 rounded-[20px] bg-surface border border-border text-ink shadow-xl flex flex-col items-center space-y-5">
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-base hover:bg-border/50 border border-border text-ink flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close full screen QR code"
              title="Close full screen"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="text-center space-y-1.5 pt-2 pr-8 pl-8">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block">
                {modalEyebrow}
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-ink tabular-nums">
                {modalTitle}
              </h3>
              <p className="text-sm text-ink-muted max-w-xs mx-auto leading-snug">
                {modalSubtitle}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-primary/25 shadow-xs flex items-center justify-center">
              <div
                className="w-60 h-60 sm:w-68 sm:h-68 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: qrSvg || '' }}
              />
            </div>

            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              {primaryModalAction && (
                <Button
                  type="button"
                  variant={primaryModalAction.isActive ? 'alert' : 'primary'}
                  size="sm"
                  onClick={primaryModalAction.onClick}
                  className="flex-1"
                >
                  {primaryModalAction.icon}
                  <span>
                    {primaryModalAction.isActive && primaryModalAction.activeLabel
                      ? primaryModalAction.activeLabel
                      : primaryModalAction.label}
                  </span>
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onDownload}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download SVG</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
