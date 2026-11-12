import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { Button } from '../common/DesignSystem';
import {
  ExtractedPrescriptionCandidate,
  extractPrescriptionCandidatesFromImage,
  SAMPLE_PRESCRIPTION_CANDIDATES
} from '../../services/cheapMedicinesService';

export interface PrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedicineForDetail?: (medicineName: string) => void;
}

export const PrescriptionScannerModal: React.FC<PrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectMedicineForDetail
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReadingOcr, setIsReadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ExtractedPrescriptionCandidate[]>([]);
  const [hasExtracted, setHasExtracted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetScanner = () => {
    setPreviewUrl(null);
    setOcrError(null);
    setCandidates([]);
    setHasExtracted(false);
    setIsReadingOcr(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrError(null);
    setCandidates([]);
    setHasExtracted(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      const base64Parts = dataUrl.split(',');
      const base64Data = base64Parts[1];
      const mimeType = file.type || 'image/jpeg';

      if (!base64Data) {
        setOcrError("We couldn't read this photo. Type the medicine name instead.");
        return;
      }

      setIsReadingOcr(true);
      try {
        const res = await extractPrescriptionCandidatesFromImage(base64Data, mimeType);
        if (!res.ok || res.candidates.length === 0) {
          setOcrError(
            res.error_message ||
              "We couldn't read this photo. Type the medicine name instead."
          );
          setCandidates([]);
        } else {
          setCandidates(res.candidates);
          setHasExtracted(true);
        }
      } catch {
        setOcrError("We couldn't read this photo. Type the medicine name instead.");
      } finally {
        setIsReadingOcr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleCandidates = () => {
    setOcrError(null);
    setPreviewUrl(null);
    setCandidates(SAMPLE_PRESCRIPTION_CANDIDATES.map((c) => ({ ...c })));
    setHasExtracted(true);
  };

  const handleCandidateChange = (
    id: string,
    field: 'medicine_name' | 'strength' | 'dosage_form',
    value: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddEmptyCandidate = () => {
    setCandidates((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        raw_line: 'Added manually',
        medicine_name: '',
        strength: '',
        dosage_form: 'Tablet',
        selected: true
      }
    ]);
    setHasExtracted(true);
  };

  const handleConfirmMedicineSearch = (cand: ExtractedPrescriptionCandidate) => {
    const combinedQuery = [cand.medicine_name.trim(), cand.strength.trim()]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!combinedQuery) return;
    onSelectMedicineForDetail?.(combinedQuery);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-rx-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-surface rounded-[20px] border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-border flex items-center justify-between gap-3 bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="scan-rx-modal-title"
                className="text-lg sm:text-xl font-bold text-ink leading-snug"
              >
                Scan prescription (with confirmation step)
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-snug">
                Review and edit extracted medicine names before running a price check.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close prescription scanner"
            className="w-10 h-10 rounded-xl bg-base hover:bg-primary-soft/40 border border-border flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-base border border-border flex items-start gap-2.5 text-xs sm:text-sm text-ink-muted">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="font-semibold text-ink">Privacy notice:</strong> Your prescription photo is processed in memory to read medicine lines and is never stored or saved.
            </span>
          </div>

          {/* Step 1: Upload or Camera if not yet extracted */}
          {!hasExtracted && !isReadingOcr && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-base hover:bg-primary-soft/30 border border-border hover:border-primary/40 flex flex-col items-center text-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-base text-ink">Take prescription photo</div>
                  <p className="text-xs text-ink-muted">
                    Use your camera in good lighting
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-base hover:bg-primary-soft/30 border border-border hover:border-primary/40 flex flex-col items-center text-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-base text-ink">Upload prescription image</div>
                  <p className="text-xs text-ink-muted">
                    JPG, PNG, or WebP photo from your device
                  </p>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleLoadSampleCandidates}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-base hover:bg-primary-soft/40 border border-border text-sm font-semibold text-primary cursor-pointer whitespace-nowrap"
                >
                  Try sample extracted prescription
                </button>
                <button
                  type="button"
                  onClick={handleAddEmptyCandidate}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-surface hover:bg-base border border-border text-sm font-semibold text-ink cursor-pointer whitespace-nowrap"
                >
                  Type medicine manually instead
                </button>
              </div>
            </div>
          )}

          {/* Loading OCR state */}
          {isReadingOcr && (
            <div className="p-8 rounded-2xl bg-base border border-border flex flex-col items-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="font-bold text-base text-ink">
                Reading medicine names from photo…
              </div>
              <p className="text-sm text-ink-muted max-w-md">
                We will show you the extracted lines to confirm before searching any prices.
              </p>
            </div>
          )}

          {/* Blurry / Unreadable Photo Error State */}
          {ocrError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#7F1D1D] dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-200 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-base leading-snug">
                    We couldn't read this photo. Type the medicine name instead.
                  </p>
                  <p className="text-sm opacity-90">{ocrError}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm" variant="secondary" onClick={handleAddEmptyCandidate}>
                  Type medicine name manually
                </Button>
                <Button size="sm" variant="neutral" onClick={resetScanner}>
                  Try another photo
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Editable Confirmation List ("Is this right?") BEFORE any search runs */}
          {hasExtracted && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink leading-snug">
                    Is this right? Confirm extracted medicine names
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Fix any spelling or strength mistakes below, then click &ldquo;Check verified prices&rdquo; on the medicine you want to inspect.
                  </p>
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={resetScanner}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Scan different photo
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {candidates.map((cand, index) => (
                  <div
                    key={cand.id}
                    className="p-4 rounded-2xl bg-base border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>
                        Line {index + 1}: <q className="text-ink font-medium">{cand.raw_line}</q>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(cand.id)}
                        aria-label={`Remove medicine line ${index + 1}`}
                        className="inline-flex items-center gap-1 text-alert hover:underline font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label
                          htmlFor={`med-name-${cand.id}`}
                          className="block text-xs font-semibold text-ink-muted mb-1"
                        >
                          Medicine / brand name
                        </label>
                        <input
                          id={`med-name-${cand.id}`}
                          type="text"
                          value={cand.medicine_name}
                          onChange={(e) =>
                            handleCandidateChange(cand.id, 'medicine_name', e.target.value)
                          }
                          placeholder="e.g., Augmentin 625"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`med-str-${cand.id}`}
                          className="block text-xs font-semibold text-ink-muted mb-1"
                        >
                          Strength (optional if in name)
                        </label>
                        <input
                          id={`med-str-${cand.id}`}
                          type="text"
                          value={cand.strength}
                          onChange={(e) =>
                            handleCandidateChange(cand.id, 'strength', e.target.value)
                          }
                          placeholder="e.g., 650mg"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`med-form-${cand.id}`}
                          className="block text-xs font-semibold text-ink-muted mb-1"
                        >
                          Dosage form
                        </label>
                        <input
                          id={`med-form-${cand.id}`}
                          type="text"
                          value={cand.dosage_form}
                          onChange={(e) =>
                            handleCandidateChange(cand.id, 'dosage_form', e.target.value)
                          }
                          placeholder="Tablet / Capsule"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!cand.medicine_name.trim()}
                        onClick={() => handleConfirmMedicineSearch(cand)}
                      >
                        <Check className="w-4 h-4" />
                        <span>Check verified prices for {cand.medicine_name || 'this item'}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddEmptyCandidate}
                  className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-xl bg-base hover:bg-primary-soft/30 border border-border text-sm font-semibold text-ink cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Add another medicine</span>
                </button>

                <Button size="sm" variant="neutral" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
