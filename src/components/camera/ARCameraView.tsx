import React, { useRef, useEffect, useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  RefreshCw, 
  Move, 
  SwitchCamera, 
  Box,
  Eye,
  EyeOff,
  Rotate3d
} from 'lucide-react';

export type AROverlayType = 'cpr_hands' | 'pressure_point' | 'burn_cooling' | 'posture_check' | 'choking_thrust' | 'none';

interface ARCameraViewProps {
  overlayType?: AROverlayType;
  isActive: boolean;
  statusText?: string;
  isCPR?: boolean;
  bpm?: number;
  elapsedSeconds?: number;
  onCaptureFrame?: (base64: string) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  overlayType = 'cpr_hands',
  isActive,
  statusText,
  isCPR = false,
  bpm = 110,
  elapsedSeconds = 0,
  onCaptureFrame,
  onClose,
  allowClose = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mode: 'camera' (live webcam/rear camera) | 'mannequin3d' (interactive 3D anatomical hologram) | 'hidden'
  const [viewMode, setViewMode] = useState<'camera' | 'hidden'>('camera');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [pulsePhase, setPulsePhase] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 640, height: 360 });

  // Interactive 2D AR anchor positioning (0.0 to 1.0)
  const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const [waterFrame, setWaterFrame] = useState(0);

  

  // Keep canvas resolution synced to container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        if (w > 0 && h > 0) {
          setCanvasDimensions({ width: w, height: h });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Frame snap for multimodal AI vision analysis
  const handleSnap = () => {
    if (!onCaptureFrame) return;

    const tempCanvas = document.createElement('canvas');
    const w = 640;
    const h = 480;
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (viewMode === 'camera' && videoRef.current && videoRef.current.videoWidth > 0) {
      tempCtx.drawImage(videoRef.current, 0, 0, w, h);
    } else if (canvasRef.current) {
      tempCtx.drawImage(canvasRef.current, 0, 0, w, h);
    } else {
      tempCtx.fillStyle = '#0A4740';
      tempCtx.fillRect(0, 0, w, h);
    }

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
    onCaptureFrame(dataUrl);
  };

  // Initialize physical camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isActive || viewMode !== 'camera') return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setHasPermission(true);
      } catch (err) {
        console.warn('Physical camera unavailable or permission denied:', err);
        setHasPermission(false);
      }
    };

    if (isActive && viewMode === 'camera') {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, viewMode, facingMode]);

  // CPR pulse ticker for visual rhythm (110 BPM)
  useEffect(() => {
    if (!isCPR || !isActive) return;
    const intervalMs = (60 / (bpm || 110)) * 1000;
    const timer = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 2);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isCPR, bpm, isActive]);

  // Water streaming animation timer for burn cooling
  useEffect(() => {
    if (overlayType !== 'burn_cooling' || !isActive) return;
    const interval = setInterval(() => {
      setWaterFrame((prev) => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, [overlayType, isActive]);

  // Reposition reticle anchor
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.12, Math.min(0.88, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.12, Math.min(0.88, (e.clientY - rect.top) / rect.height));
    setAnchor({ x, y });
    setIsDraggingAnchor(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingAnchor || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.12, Math.min(0.88, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.12, Math.min(0.88, (e.clientY - rect.top) / rect.height));
    setAnchor({ x, y });
  };

  const handlePointerUp = () => {
    setIsDraggingAnchor(false);
  };

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ==========================================
  // RENDER 1: 2D CAMERA HUD OVERLAY
  // ==========================================
  useEffect(() => {
    if (!isActive || viewMode !== 'camera') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const centerX = width * anchor.x;
      const centerY = height * anchor.y;

      // Spatial HUD corner brackets
      ctx.strokeStyle = 'rgba(240, 168, 91, 0.45)';
      ctx.lineWidth = 2.5;
      const bracket = 24;
      const margin = 20;
      // Top Left
      ctx.beginPath();
      ctx.moveTo(margin, margin + bracket);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + bracket, margin);
      ctx.stroke();
      // Top Right
      ctx.beginPath();
      ctx.moveTo(width - margin - bracket, margin);
      ctx.lineTo(width - margin, margin);
      ctx.lineTo(width - margin, margin + bracket);
      ctx.stroke();
      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(margin, height - margin - bracket);
      ctx.lineTo(margin, height - margin);
      ctx.lineTo(margin + bracket, height - margin);
      ctx.stroke();
      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(width - margin - bracket, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.lineTo(width - margin, height - margin - bracket);
      ctx.stroke();

      // ==========================================
      // CPR HAND PLACEMENT RETICLE
      // ==========================================
      if (overlayType === 'cpr_hands') {
        const baseRadius = Math.min(width, height) * 0.12;
        const radius = pulsePhase === 1 ? baseRadius * 1.12 : baseRadius;

        // Shockwave pulse
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 22, 0, 2 * Math.PI);
        ctx.strokeStyle = pulsePhase === 1 ? 'rgba(240, 168, 91, 0.9)' : 'rgba(240, 168, 91, 0.25)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Core compression circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(14, 90, 80, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#F0A85B';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 3D Interlocked hands crosshair
        ctx.save();
        ctx.translate(centerX, centerY);
        const scale = Math.min(width, height) / 680;
        ctx.scale(scale, scale);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#F0A85B';
        ctx.lineWidth = 3;
        [-20, -7, 7, 20].forEach((ox) => {
          ctx.beginPath();
          ctx.moveTo(ox, -20);
          ctx.lineTo(ox * 0.8, -52);
          ctx.stroke();
        });

        ctx.restore();

        // Target depth track
        const gaugeX = centerX + radius + 26;
        const gaugeH = 75;
        const gaugeY = centerY - gaugeH / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.roundRect(gaugeX, gaugeY, 14, gaugeH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        ctx.fillStyle = '#22C55E';
        ctx.fillRect(gaugeX + 2, gaugeY + gaugeH * 0.55, 10, gaugeH * 0.35);

        const indY = pulsePhase === 1 ? gaugeY + gaugeH * 0.72 : gaugeY + gaugeH * 0.15;
        ctx.fillStyle = '#F0A85B';
        ctx.beginPath();
        ctx.moveTo(gaugeX - 4, indY);
        ctx.lineTo(gaugeX + 18, indY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 11px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText('Target: 5-6 cm', gaugeX + 20, gaugeY + gaugeH * 0.7);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE HEEL OF HAND HERE', centerX, centerY - radius - 16);

        ctx.fillStyle = '#F0A85B';
        ctx.font = '600 12px system-ui';
        ctx.fillText('LOWER HALF OF STERNUM • 110 BPM RHYTHM', centerX, centerY + radius + 22);

      // ==========================================
      // SEVERE BLEEDING PRESSURE TARGET
      // ==========================================
      } else if (overlayType === 'pressure_point') {
        const rad = Math.min(width, height) * 0.13;

        ctx.beginPath();
        ctx.arc(centerX, centerY, rad + 18, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(centerX, centerY, rad, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Pressure down arrow
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 22);
        ctx.lineTo(centerX, centerY + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 9, centerY + 6);
        ctx.lineTo(centerX, centerY + 22);
        ctx.lineTo(centerX + 9, centerY + 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('APPLY FIRM CONTINUOUS PRESSURE', centerX, centerY - rad - 16);

        ctx.fillStyle = '#FCA5A5';
        ctx.font = '600 12px system-ui';
        ctx.fillText('HOLD FIRM FOR 10 MINUTES • DO NOT LIFT GAUZE', centerX, centerY + rad + 24);

      // ==========================================
      // BURN COOLING WATER STREAM
      // ==========================================
      } else if (overlayType === 'burn_cooling') {
        const boxW = Math.min(width * 0.5, 230);
        const boxH = Math.min(height * 0.45, 150);

        ctx.beginPath();
        ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 18);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.28)';
        ctx.fill();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.5;
        const streams = 8;
        for (let i = 0; i < streams; i++) {
          const sx = centerX - boxW / 2 + 18 + i * ((boxW - 36) / (streams - 1));
          ctx.beginPath();
          const offset = (waterFrame * 3 + i * 14) % boxH;
          ctx.moveTo(sx, centerY - boxH / 2 + offset);
          ctx.lineTo(sx + Math.sin((waterFrame + i) * 0.4) * 6, centerY - boxH / 2 + offset + 24);
          ctx.stroke();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('COOL RUNNING TAP WATER (15–20 MIN)', centerX, centerY - boxH / 2 - 14);

        ctx.fillStyle = '#93C5FD';
        ctx.font = '600 12px system-ui';
        ctx.fillText('15–20°C GENTLE FLOW • NO RAW ICE • NO OINTMENTS', centerX, centerY + boxH / 2 + 22);

      // ==========================================
      // AIRWAY POSTURE CHECK
      // ==========================================
      } else if (overlayType === 'posture_check') {
        const rad = Math.min(width, height) * 0.14;

        ctx.beginPath();
        ctx.arc(centerX, centerY, rad, Math.PI * 0.8, Math.PI * 1.8);
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX - 30, centerY + 12);
        ctx.lineTo(centerX + 30, centerY - 20);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('AIRWAY ALIGNMENT TARGET (HEAD-TILT CHIN-LIFT)', centerX, centerY - rad - 16);

        ctx.fillStyle = '#86EFAC';
        ctx.font = '600 12px system-ui';
        ctx.fillText('TILT HEAD GENTLY BACK • LIFT CHIN WITH TWO FINGERS', centerX, centerY + rad + 24);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, viewMode, overlayType, pulsePhase, anchor, canvasDimensions, waterFrame]);

  // If user minimized / hid AR guide
  if (viewMode === 'hidden') {
    return (
      <div className="w-full p-3 rounded-2xl bg-surface/80 border border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <EyeOff className="w-4 h-4 text-ink-muted" />
          <span className="text-xs font-semibold text-ink-muted">
            AR Visual Overlay minimized
          </span>
        </div>
        <button
          onClick={() => setViewMode('camera')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 btn-press"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Visual Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full aspect-video max-h-80 sm:max-h-96 rounded-2xl overflow-hidden bg-black border border-border shadow-2xl flex items-center justify-center select-none cursor-crosshair"
      title="Tap or drag anywhere to position visual target"
    >
      {/* Live Physical Camera Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover ${
          viewMode === 'camera' && hasPermission !== false ? 'block' : 'hidden'
        }`}
      />

      {/* 2D Camera HUD Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
          viewMode === 'camera' ? 'block' : 'hidden'
        }`}
      />



      {/* Top Controls Bar */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-auto">
        
        {/* Right Tools: Camera Flip, Reset 3D, Snapshot & Close/Hide */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Flip Camera */}
          {viewMode === 'camera' && hasPermission !== false && (
            <button
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white/90 hover:text-white border border-white/15 btn-press shadow-xs"
              title="Flip between front and rear camera"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-accent" />
            </button>
          )}

          {/* Multimodal AI Vision Scan */}
          {onCaptureFrame && (
            <button
              onClick={handleSnap}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r from-accent to-[#E08A35] text-[11px] font-bold text-ink shadow-md hover:brightness-105 btn-press"
              title="Scan frame with Clinical AI Vision"
            >
              <Sparkles className="w-3 h-3 text-ink" />
              <span>AI Scan</span>
            </button>
          )}

          {/* Minimize / Hide AR Overlay */}
          {allowClose && (
            <button
              onClick={() => {
                if (onClose) onClose();
                else setViewMode('hidden');
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white/80 hover:text-white border border-white/15 btn-press text-[11px] font-semibold"
              title="Minimize visual overlay to focus on text"
            >
              <EyeOff className="w-3 h-3 text-white/80" />
              <span className="hidden sm:inline">Hide AR</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive Hint */}
      <div className="absolute top-12 left-3 z-20 pointer-events-none hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-black/70 text-[10px] text-white/90 border border-white/10 backdrop-blur-xs">
        <>
          <Move className="w-3 h-3 text-accent" />
          <span>Tap / drag to reposition target reticle</span>
        </>
      </div>

      {/* Bottom Medical Telemetry Badge */}
      {statusText && (
        <div className="absolute bottom-3 inset-x-3 z-20 flex justify-center pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md text-xs font-semibold text-white border border-white/15 shadow-lg text-center max-w-md">
            {statusText}
          </div>
        </div>
      )}
    </div>
  );
};
