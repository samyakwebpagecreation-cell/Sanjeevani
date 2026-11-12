import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, X } from 'lucide-react';
import { Button } from '../common/DesignSystem';

export interface QRTileProps {
  label: string;
  caption?: string;
  qrSvg: string;
  idValue: string;
  modalTitle: string;
  modalSubtitle: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel?: string;
  onDownload: () => void;
  extraModalAction?: {
    label: string;
    activeLabel?: string;
    isActive?: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  };
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

/**
 * Compact Side-by-Side QR Tile (Section F):
 * - QR size is 112–128px when viewport height < 800px and 160px at >= 800px.
 * - Each tile has the QR plus ONE label only (no caption line).
 * - Tapping a tile opens the existing full-screen QR view, unchanged.
 */
export const QRTile: React.FC<QRTileProps> = ({
  label,
  qrSvg,
  idValue,
  modalTitle,
  modalSubtitle,
  onCopy,
  copied,
  copyLabel = 'Copy',
  onDownload,
  extraModalAction,
  externalOpen,
  onExternalClose
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isTallViewport, setIsTallViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 800 : false
  );

  useEffect(() => {
    const updateHeight = () => {
      setIsTallViewport(window.innerHeight >= 800);
    };
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const isFullScreen = externalOpen !== undefined ? externalOpen : internalOpen;

  const closeFullScreen = () => {
    setInternalOpen(false);
    onExternalClose?.();
  };

  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(idValue);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Glanceable Thumbnail Tile: 118px (<800px height) or 160px (>=800px height) + 1 Label Only */}
      <button
        type="button"
        onClick={() => setInternalOpen(true)}
        className="w-full p-2 rounded-xl bg-surface hover:bg-primary-soft/40 border border-border hover:border-primary/40 flex flex-col items-center text-center overflow-hidden transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${label} QR code. Tap to open full screen.`}
        title={`Tap to enlarge ${label} QR code`}
      >
        <div
          style={{
            width: isTallViewport ? '144px' : '116px',
            height: isTallViewport ? '144px' : '116px'
          }}
          className="aspect-square p-1.5 rounded-lg bg-white border border-border/70 flex items-center justify-center overflow-hidden shrink-0"
        >
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: qrSvg || '' }}
          />
        </div>

        <span className="mt-1.5 text-[14px] font-semibold text-ink leading-tight truncate w-full">
          {label}
        </span>
      </button>

      {/* Full-Screen QR Modal (~90vmin container, large QR, ID chip, Copy & Download buttons) */}
      {isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/85 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFullScreen();
          }}
        >
          <div className="w-[min(92vw,540px)] max-h-[92dvh] overflow-y-auto p-5 sm:p-6 rounded-[24px] bg-surface border border-border text-ink shadow-xl flex flex-col items-center space-y-4">
            <div className="w-full flex items-start justify-between gap-3">
              <div className="space-y-1 text-left min-w-0">
                <h3 className="text-xl font-extrabold tracking-tight text-ink">
                  {modalTitle}
                </h3>
                <p className="text-sm text-ink-muted leading-snug">
                  {modalSubtitle}
                </p>
                {idValue && (
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="mt-1 inline-flex min-h-[36px] items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base hover:bg-primary-soft border border-border text-sm font-mono font-semibold text-ink-muted hover:text-ink cursor-pointer"
                    title="Copy ID"
                    aria-label={`Copy ID ${idValue}`}
                  >
                    <span>{idValue}</span>
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={closeFullScreen}
                className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl bg-base hover:bg-border/50 border border-border text-ink flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close full screen QR code"
                title="Close"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="w-[min(64vmin,380px)] h-[min(64vmin,380px)] aspect-square p-4 rounded-2xl bg-white border-2 border-border flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: qrSvg || '' }}
              />
            </div>

            <div className="w-full grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onCopy}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{copyLabel}</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onDownload}
                className="w-full"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Download</span>
              </Button>
            </div>

            {extraModalAction && (
              <Button
                type="button"
                variant={extraModalAction.isActive ? 'alert' : 'primary'}
                size="md"
                fullWidth
                onClick={extraModalAction.onClick}
              >
                {extraModalAction.icon}
                <span>
                  {extraModalAction.isActive && extraModalAction.activeLabel
                    ? extraModalAction.activeLabel
                    : extraModalAction.label}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
