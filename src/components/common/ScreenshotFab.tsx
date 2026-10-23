import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Check, 
  Loader2, 
  AlertCircle, 
  Download, 
  Copy, 
  ExternalLink, 
  X, 
  Maximize2, 
  Monitor, 
  FileText, 
  ChevronUp, 
  Sparkles
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';

type CaptureMode = 'full_page' | 'viewport' | 'native_screen';

interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  mode: CaptureMode;
  timestamp: string;
}

export const ScreenshotFab: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [captureProgress, setCaptureProgress] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  /**
   * Shutter flash effect
   */
  const triggerShutterFlash = () => {
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 300);
  };

  /**
   * Helper: Convert dataUrl to Blob
   */
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  /**
   * Core Screen & Page Capture Pipeline
   * Powered by html-to-image for 100% native support of Tailwind v4 oklab/oklch colors
   */
  const executeCapture = async (mode: CaptureMode) => {
    if (isCapturing) return;
    setIsMenuOpen(false);
    setIsCapturing(true);

    try {
      if (mode === 'native_screen') {
        // Native Screen / Window / Tab Capture via getDisplayMedia
        const mediaDevices = (navigator as any)?.mediaDevices;
        if (!mediaDevices || !mediaDevices.getDisplayMedia) {
          showToast('Native screen capture is not supported in this browser.', 'error');
          setIsCapturing(false);
          return;
        }

        setCaptureProgress('Select window or screen to capture...');
        const stream = await mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false
        });

        setCaptureProgress('Snapping screen frame...');
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        await new Promise((resolve) => setTimeout(resolve, 350));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || window.innerWidth;
        canvas.height = video.videoHeight || window.innerHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D canvas context.');

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

        const dataUrl = canvas.toDataURL('image/png');
        const blob = dataUrlToBlob(dataUrl);

        triggerShutterFlash();
        setCapturedImage({
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height,
          mode: 'native_screen',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        setIsCapturing(false);
        setCaptureProgress(null);
        return;
      }

      // DOM Rendering via html-to-image (Supports oklab, oklch, color-mix natively!)
      const targetElement = document.getElementById('root') || document.body;
      const originalScrollX = window.scrollX;
      const originalScrollY = window.scrollY;

      setCaptureProgress(mode === 'full_page' ? 'Rendering full page snapshot...' : 'Capturing visible screen...');

      // Scroll to top for full page to avoid sticky header and scroll clipping bugs
      if (mode === 'full_page') {
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      const totalScrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        targetElement.scrollWidth,
        window.innerWidth
      );
      const totalScrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        targetElement.scrollHeight,
        window.innerHeight
      );

      // Safe scale calculation to avoid exceeding mobile/desktop canvas limits
      const dpr = window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 2;
      const scale = mode === 'full_page' && totalScrollHeight * dpr > 10000 ? 1.5 : dpr;

      const captureWidth = mode === 'full_page' ? totalScrollWidth : window.innerWidth;
      const captureHeight = mode === 'full_page' ? totalScrollHeight : window.innerHeight;

      // Filter function to ignore floating action buttons, chat widgets, and modals
      const filterNode = (domNode: HTMLElement): boolean => {
        if (domNode && domNode.nodeType === Node.ELEMENT_NODE) {
          const el = domNode as HTMLElement;
          if (el.hasAttribute && (el.hasAttribute('data-html2canvas-ignore') || el.classList?.contains('screenshot-ignore'))) {
            return false;
          }
        }
        return true;
      };

      const captureOptions = {
        width: captureWidth,
        height: captureHeight,
        canvasWidth: Math.round(captureWidth * scale),
        canvasHeight: Math.round(captureHeight * scale),
        pixelRatio: scale,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0F1614' : '#F6F8F7',
        filter: filterNode,
        skipFonts: false,
        cacheBust: true,
        imagePlaceholder: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
      };

      // Temporary video frame overlays so videos don't render black in foreignObject
      const videoOverlays: { video: HTMLVideoElement; img: HTMLImageElement }[] = [];
      try {
        const liveVideos = targetElement.querySelectorAll('video');
        liveVideos.forEach((v) => {
          if (v.videoWidth > 0 && v.videoHeight > 0) {
            try {
              const vCanvas = document.createElement('canvas');
              vCanvas.width = v.videoWidth;
              vCanvas.height = v.videoHeight;
              const vCtx = vCanvas.getContext('2d');
              if (vCtx) {
                vCtx.drawImage(v, 0, 0);
                const img = document.createElement('img');
                img.src = vCanvas.toDataURL('image/jpeg', 0.85);
                img.style.position = 'absolute';
                img.style.top = `${v.offsetTop}px`;
                img.style.left = `${v.offsetLeft}px`;
                img.style.width = `${v.offsetWidth}px`;
                img.style.height = `${v.offsetHeight}px`;
                img.style.objectFit = 'cover';
                img.style.zIndex = '999';
                v.parentNode?.insertBefore(img, v);
                videoOverlays.push({ video: v, img });
              }
            } catch (e) {
              // Video frame extraction failed gracefully
            }
          }
        });
      } catch (e) {
        console.warn('Video overlay failed gracefully:', e);
      }

      let dataUrl: string;
      try {
        dataUrl = await htmlToImage.toPng(targetElement, captureOptions);
      } catch (primaryErr: any) {
        console.warn('Primary capture failed, retrying with skipFonts: true...', primaryErr);
        dataUrl = await htmlToImage.toPng(targetElement, {
          ...captureOptions,
          skipFonts: true
        });
      } finally {
        // Cleanup temporary video overlays
        videoOverlays.forEach(({ img }) => {
          img.parentNode?.removeChild(img);
        });
        // Restore scroll position
        if (mode === 'full_page') {
          window.scrollTo(originalScrollX, originalScrollY);
        }
      }

      triggerShutterFlash();

      const blob = dataUrlToBlob(dataUrl);

      // Extract image dimensions from canvas/dataUrl
      const imgTester = new Image();
      imgTester.onload = () => {
        setCapturedImage({
          dataUrl,
          blob,
          width: imgTester.naturalWidth || captureWidth,
          height: imgTester.naturalHeight || captureHeight,
          mode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        setIsCapturing(false);
        setCaptureProgress(null);
      };
      imgTester.onerror = () => {
        setCapturedImage({
          dataUrl,
          blob,
          width: captureWidth,
          height: captureHeight,
          mode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        setIsCapturing(false);
        setCaptureProgress(null);
      };
      imgTester.src = dataUrl;

    } catch (error: any) {
      console.error('Screenshot capture failed:', error);
      showToast(`Capture failed: ${error?.message || 'Unable to capture DOM'}. Try "Window / Display" mode.`, 'error');
      setIsCapturing(false);
      setCaptureProgress(null);
    }
  };

  /**
   * Copy image blob to system clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!capturedImage) return;

    try {
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': capturedImage.blob });
        await navigator.clipboard.write([item]);
        setCopiedSuccess(true);
        showToast('Screenshot image copied to clipboard!', 'success');
        setTimeout(() => setCopiedSuccess(false), 2500);
        return;
      }
      throw new Error('ClipboardItem write not supported in this browser.');
    } catch (err) {
      console.warn('Clipboard write failed, downloading file instead:', err);
      handleDownload();
      showToast('Clipboard write restricted by browser. File downloaded instead.', 'info');
    }
  };

  /**
   * Download image file (.png)
   */
  const handleDownload = () => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage.dataUrl;
    link.download = `sanjeevani-${capturedImage.mode}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Screenshot downloaded successfully!', 'success');
  };

  /**
   * Open full resolution in new browser tab
   */
  const handleOpenFull = () => {
    if (!capturedImage) return;
    const tab = window.open();
    if (tab) {
      tab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sanjeevani Screenshot (${capturedImage.width}x${capturedImage.height})</title>
            <style>
              body { margin: 0; background: #0F1614; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
            </style>
          </head>
          <body>
            <img src="${capturedImage.dataUrl}" alt="Sanjeevani Screenshot" />
          </body>
        </html>
      `);
      tab.document.close();
    }
  };

  const hasDisplayMedia = typeof navigator !== 'undefined' && Boolean((navigator as any).mediaDevices?.getDisplayMedia);

  return (
    <>
      {/* Visual Camera Shutter Flash */}
      {flashAnimation && (
        <div 
          data-html2canvas-ignore="true" 
          className="screenshot-ignore fixed inset-0 z-[9999] pointer-events-none bg-white/75 transition-opacity duration-300 ease-out" 
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div 
          data-html2canvas-ignore="true" 
          className="screenshot-ignore fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className={`flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-surface text-ink border-success/40' 
              : toast.type === 'error'
              ? 'bg-surface text-alert border-alert/40'
              : 'bg-surface text-info border-info/40'
          }`}>
            {toast.type === 'success' ? (
              <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-alert shrink-0" strokeWidth={2.5} />
            ) : (
              <Camera className="h-4 w-4 text-info shrink-0" strokeWidth={2} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Floating Capture Speed-Dial Menu & Main FAB (Desktop/Tablet) */}
      <div 
        data-html2canvas-ignore="true" 
        className="screenshot-ignore fixed bottom-20 right-6 sm:right-8 z-30 hidden sm:flex flex-col items-end space-y-2.5"
        ref={menuRef}
      >
        {/* Expanded Capture Options Menu */}
        {isMenuOpen && (
          <div className="glass-panel elevation-4 p-2.5 rounded-[28px] border border-border/80 shadow-2xl space-y-1 w-64 animate-in zoom-in-95 slide-in-from-bottom-2 duration-150 text-xs">
            <div className="px-3 py-1.5 border-b border-border/60 text-[10px] font-black uppercase tracking-wider text-ink-muted flex items-center justify-between">
              <span>Screen Capture Modes</span>
              <Sparkles className="w-3 h-3 text-accent" />
            </div>

            {/* Mode 1: Full Scrollable Page */}
            <button
              onClick={() => executeCapture('full_page')}
              className="w-full p-2.5 rounded-2xl hover:bg-base/80 flex items-center space-x-2.5 text-left btn-press transition-colors group"
            >
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-ink block">Full Page Snapshot</span>
                <span className="text-[10px] text-ink-muted block">Entire scroll height (top to bottom)</span>
              </div>
            </button>

            {/* Mode 2: Current Visible Viewport */}
            <button
              onClick={() => executeCapture('viewport')}
              className="w-full p-2.5 rounded-2xl hover:bg-base/80 flex items-center space-x-2.5 text-left btn-press transition-colors group"
            >
              <div className="p-2 rounded-xl bg-info/10 text-info group-hover:bg-info group-hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-ink block">Visible Screen</span>
                <span className="text-[10px] text-ink-muted block">Only what is visible on screen now</span>
              </div>
            </button>

            {/* Mode 3: Native Browser / Window Capture */}
            {hasDisplayMedia && (
              <button
                onClick={() => executeCapture('native_screen')}
                className="w-full p-2.5 rounded-2xl hover:bg-base/80 flex items-center space-x-2.5 text-left btn-press transition-colors group"
              >
                <div className="p-2 rounded-xl bg-accent/20 text-ink group-hover:bg-accent group-hover:text-ink transition-colors">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-ink block">Window / Display</span>
                  <span className="text-[10px] text-ink-muted block">Native hardware capture</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Main Camera Floating Action Button */}
        <div className="flex items-center space-x-2">
          {/* Quick Menu Toggle Arrow (Desktop / Tablet) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hidden sm:flex btn-fluid h-9 w-9 rounded-full bg-surface/90 border border-border/80 shadow-md text-ink-muted hover:text-ink items-center justify-center transition-transform"
            title={isMenuOpen ? 'Close menu' : 'Choose screenshot mode'}
            aria-label="Toggle screenshot options"
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Primary 1-Tap Trigger (Default: Full Page) */}
          <button
            onClick={() => executeCapture('full_page')}
            disabled={isCapturing}
            className="btn-fluid btn-fluid-primary elevation-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            title="Capture full page screenshot"
            aria-label="Capture full page screenshot"
          >
            {isCapturing ? (
              <Loader2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Camera className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" strokeWidth={1.75} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-accent"></span>
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Live Capture Progress Badge */}
        {isCapturing && (
          <div className="px-3 py-1.5 rounded-full bg-ink text-surface text-[10px] font-bold shadow-lg animate-pulse flex items-center space-x-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-accent" />
            <span>{captureProgress || 'Processing screenshot...'}</span>
          </div>
        )}
      </div>

      {/* Captured Image Preview & Action Modal */}
      {capturedImage && (
        <div 
          data-html2canvas-ignore="true" 
          className="screenshot-ignore fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-base/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Screenshot Captured</h3>
                  <p className="text-[11px] text-ink-muted">
                    {capturedImage.width} × {capturedImage.height} px • {capturedImage.mode.replace('_', ' ').toUpperCase()} • {capturedImage.timestamp}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCapturedImage(null)}
                className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-base btn-press"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body (Scrollable preview) */}
            <div className="flex-1 overflow-y-auto p-4 bg-base/30 flex items-center justify-center">
              <div className="max-w-full max-h-[50vh] overflow-hidden rounded-2xl border border-border shadow-md bg-white">
                <img 
                  src={capturedImage.dataUrl} 
                  alt="Captured screenshot preview" 
                  className="w-full h-auto max-h-[50vh] object-contain"
                />
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 border-t border-border bg-surface flex flex-wrap items-center justify-between gap-2.5">
              <button
                onClick={handleOpenFull}
                className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-ink hover:bg-base btn-press transition-colors flex items-center space-x-1.5"
                title="Open full-resolution image in new tab"
              >
                <ExternalLink className="w-4 h-4 text-ink-muted" />
                <span>Open Full Size</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyToClipboard}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold btn-press transition-all flex items-center space-x-1.5 shadow-xs ${
                    copiedSuccess 
                      ? 'bg-success text-white' 
                      : 'bg-base border border-border text-ink hover:border-primary/40'
                  }`}
                >
                  {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSuccess ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark btn-press transition-all flex items-center space-x-1.5 shadow-sm shadow-primary/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenshotFab;
