import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  X, 
  Camera, 
  SwitchCamera, 
  Upload, 
  PhoneCall, 
  ExternalLink, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Clock, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { decodeQRCodeFromImageData, parseSanjeevaniPayload, ParsedSanjeevaniQR } from '../../utils/qr';
import { 
  saveScannedQR, 
  getScannedQRHistory, 
  deleteScannedQR, 
  clearScannedQRHistory, 
  downloadMarkdownFile, 
  exportHistoryAsMarkdown,
  ScannedQREntry 
} from '../../services/qrStorageService';
import { audioEngine } from '../../utils/audio';

interface InAppQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSquad?: (squadId: string) => void;
  onViewDocket?: (docketId: string) => void;
}

export const InAppQRScannerModal: React.FC<InAppQRScannerModalProps> = ({
  isOpen,
  onClose,
  onJoinSquad,
  onViewDocket
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanned result state
  const [scannedResult, setScannedResult] = useState<ParsedSanjeevaniQR | null>(null);
  const [showMarkdownView, setShowMarkdownView] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  // History state
  const [historyList, setHistoryList] = useState<ScannedQREntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Refresh history on open or tab change
  useEffect(() => {
    if (isOpen) {
      setHistoryList(getScannedQRHistory());
    }
  }, [isOpen, activeTab]);

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. You can still upload QR images or test demo QRs below.');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera permission not granted or stream busy. Use photo upload or test demo QR below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Continuous Frame Scanning Loop
  const startScanningLoop = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decodeQRCodeFromImageData(imageData);

        if (code && code.data) {
          handleSuccessfulScan(code.data);
          return; // Pause scanning on match
        }
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  // Process Successful Decode
  const handleSuccessfulScan = (rawText: string) => {
    try {
      audioEngine.playClick(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch {}

    // Save to text storage
    const saved = saveScannedQR(rawText);
    setScannedResult(saved.parsed);
    setHistoryList(getScannedQRHistory());
  };

  // Handle Photo/File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = decodeQRCodeFromImageData(imageData);
          if (code && code.data) {
            handleSuccessfulScan(code.data);
          } else {
            alert('No valid QR code detected in the selected image. Please try another clear photo.');
          }
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Test Demo Preset QRs
  const handleLoadDemoQR = (type: 'squad' | 'docket' | 'sos') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';

    if (type === 'squad') {
      const demoSquad = `${origin}/?squad=SQUAD-849201&cat=cardiac_cpr&title=CARDIAC%20ARREST&addr=City%20Center%20Metro%20Gate%203`;
      handleSuccessfulScan(demoSquad);
    } else if (type === 'docket') {
      const demoDocket = `${origin}/?docket=TRAUMA-519284&title=Acute%20Road%20Trauma%20Handover&cpr=180&cycles=5&bpm=94&head=yes&water=no&sev=CRITICAL`;
      handleSuccessfulScan(demoDocket);
    } else {
      handleSuccessfulScan('tel:112\nSANJEEVANI-SOS: Immediate Ambulance Required at Main Crossroad.');
    }
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'scan' && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, facingMode, scannedResult]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyMd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleResetScanner = () => {
    setScannedResult(null);
    setShowMarkdownView(false);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Sanjeevani In-App QR Scanner
              </h3>
              <p className="text-xs text-ink-muted">
                Scan Squads, Paramedic Dockets, and Emergency SOS with instant calling & text storage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-base cursor-pointer transition-colors"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs: Scanner vs History */}
        <div className="flex items-center space-x-2 border-b border-border/60 pb-2 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('scan'); }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'scan' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Optical Camera Scanner
          </button>
          <button
            onClick={() => { setActiveTab('history'); }}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scanned History ({historyList.length})</span>
          </button>
        </div>

        {/* Hidden Canvas for Decoding */}
        <canvas ref={canvasRef} className="hidden" />
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* ======================================================== */}
        {/* TAB 1: OPTICAL SCANNER                                   */}
        {/* ======================================================== */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            
            {/* If a Result was Scanned */}
            {scannedResult ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-base border-2 border-primary/40 space-y-4 animate-in fade-in">
                
                {/* Result Header Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    scannedResult.type === 'squad' 
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : scannedResult.type === 'docket'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {scannedResult.type === 'squad' ? '🚨 BYSTANDER SQUAD' : scannedResult.type === 'docket' ? '📋 PARAMEDIC DOCKET' : '✅ QR VERIFIED'}
                  </span>

                  <span className="text-[10px] font-mono text-ink-muted">
                    Saved to Offline Storage
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-ink">
                    {scannedResult.title}
                  </h4>
                  <p className="text-xs text-ink-muted">
                    {scannedResult.summary}
                  </p>
                </div>

                {/* Direct Emergency Calling Section (Calling Data Extraction) */}
                {scannedResult.callingNumbers && scannedResult.callingNumbers.length > 0 && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center space-x-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                      <span>1-Tap Emergency Calling Data:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {scannedResult.callingNumbers.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Dial {num}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-1">
                  {scannedResult.type === 'squad' && scannedResult.squadId && (
                    <button
                      onClick={() => {
                        if (onJoinSquad) onJoinSquad(scannedResult.squadId!);
                        else if (typeof window !== 'undefined') {
                          window.location.search = `?squad=${scannedResult.squadId}`;
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-slate-950" />
                      <span>Join Rescue Squad & Take Task</span>
                    </button>
                  )}

                  {scannedResult.type === 'docket' && scannedResult.docketId && (
                    <button
                      onClick={() => {
                        if (onViewDocket) onViewDocket(scannedResult.docketId!);
                        else if (typeof window !== 'undefined') {
                          window.location.search = `?docket=${scannedResult.docketId}`;
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Open Clinical Paramedic Handover Docket</span>
                    </button>
                  )}

                  {scannedResult.type === 'url' && scannedResult.url && (
                    <a
                      href={scannedResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Link in Web Browser</span>
                    </a>
                  )}
                </div>

                {/* Markdown Viewer Toggle */}
                <div className="pt-1 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setShowMarkdownView(!showMarkdownView)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink hover:bg-base cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>{showMarkdownView ? 'Hide Markdown' : 'View as .md Docket'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(scannedResult.rawPayload)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleResetScanner}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Scan Another</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Markdown View */}
                {showMarkdownView && (
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Rendered Markdown Document:
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyMd(scannedResult.markdown)}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {copiedMd ? 'Copied!' : 'Copy .md'}
                        </button>
                        <button
                          onClick={() => downloadMarkdownFile(`${scannedResult.title.replace(/\s+/g, '_')}.md`, scannedResult.markdown)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface border border-border font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {scannedResult.markdown}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Live Camera Viewfinder */
              <div className="space-y-3">
                <div className="relative aspect-4/3 w-full rounded-3xl bg-slate-950 overflow-hidden border border-border flex items-center justify-center">
                  
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* High-Contrast Target Viewfinder Box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />

                      {/* Animated Laser Scanning Bar */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#F59E0B] animate-bounce" />
                    </div>
                  </div>

                  {/* Overlays / Camera Controls */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    <button
                      onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 cursor-pointer"
                      title="Flip Camera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                      Align QR Code within the reticle
                    </span>
                  </div>

                </div>

                {cameraError && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-ink flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-ink block">Camera Notice:</span>
                      <span className="text-ink-muted block">{cameraError}</span>
                    </div>
                  </div>
                )}

                {/* Upload & Preset Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-bold border border-border cursor-pointer btn-press"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload QR Image</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-bold text-ink-muted">
                      Quick Demo QRs:
                    </span>
                    <button
                      onClick={() => handleLoadDemoQR('squad')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-[11px] font-bold cursor-pointer"
                    >
                      Squad
                    </button>
                    <button
                      onClick={() => handleLoadDemoQR('docket')}
                      className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-[11px] font-bold cursor-pointer"
                    >
                      Docket
                    </button>
                    <button
                      onClick={() => handleLoadDemoQR('sos')}
                      className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 text-[11px] font-bold cursor-pointer"
                    >
                      112 Call
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SCANNED HISTORY LOG (TEXT STORAGE)                */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted">
                Offline Local Storage Log ({historyList.length} scans)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadMarkdownFile('Sanjeevani_QR_Scan_History.md', exportHistoryAsMarkdown())}
                  disabled={historyList.length === 0}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-base border border-border text-xs font-bold text-ink hover:bg-border/60 disabled:opacity-40 cursor-pointer"
                  title="Export all scans to Markdown"
                >
                  <Download className="w-3 h-3 text-primary" />
                  <span>Export .md</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all saved QR scan history?')) {
                      clearScannedQRHistory();
                      setHistoryList([]);
                    }
                  }}
                  disabled={historyList.length === 0}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-base border border-border text-xs font-bold text-alert hover:bg-alert/10 disabled:opacity-40 cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {historyList.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-base rounded-2xl border border-border">
                <QrCode className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
                <h5 className="text-xs font-bold text-ink">No Scans Recorded Yet</h5>
                <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                  When you scan a Sanjeevani QR code or upload an image, it will be automatically saved here for offline reference.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-base border border-border hover:border-primary/40 space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          item.parsed.type === 'squad' 
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' 
                            : item.parsed.type === 'docket' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {item.parsed.type}
                        </span>
                        <h5 className="text-xs font-bold text-ink truncate">
                          {item.parsed.title}
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-muted line-clamp-2">
                      {item.parsed.summary}
                    </p>

                    {item.parsed.callingNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.parsed.callingNumbers.map((num, idx) => (
                          <a
                            key={idx}
                            href={`tel:${num}`}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold"
                          >
                            <PhoneCall className="w-2.5 h-2.5" />
                            <span>Call {num}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setScannedResult(item.parsed);
                          setActiveTab('scan');
                        }}
                        className="text-primary font-bold hover:underline cursor-pointer"
                      >
                        View & Act →
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadMarkdownFile(`${item.parsed.title.replace(/\s+/g, '_')}.md`, item.parsed.markdown)}
                          className="text-[11px] text-ink-muted hover:text-ink cursor-pointer"
                          title="Download as .md"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deleteScannedQR(item.id);
                            setHistoryList(getScannedQRHistory());
                          }}
                          className="text-[11px] text-alert hover:opacity-80 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
