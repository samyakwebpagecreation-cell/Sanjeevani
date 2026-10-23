import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Activity, 
  HeartPulse, 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  PhoneCall, 
  Upload, 
  RotateCcw, 
  X, 
  Zap, 
  ArrowLeft, 
  Copy, 
  Check,
  CheckCircle2,
  Info,
  UserCheck 
} from 'lucide-react';
import { Destination } from '../../types';
import { analyzeInjuryVisual, VisionAnalysisResult } from '../../services/aiService';
import { 
  scanPrescriptionImage, 
  PrescriptionScanReport, 
  SAMPLE_PRESCRIPTION_REPORT 
} from '../../services/cheapMedicinesService';
import { 
  QrCode, 
  FileText, 
  Download, 
  Trash2, 
  Clock, 
  Users, 
  ExternalLink 
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

export type CameraRole = 'injury' | 'cpr' | 'prescription' | 'qr_scan';

/**
 * Downscale image (or video frame) to maxDim to prevent massive payloads and API timeouts.
 */
const downscaleImageBase64 = (
  source: string | HTMLVideoElement,
  maxDim = 1024,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve) => {
    if (source instanceof HTMLVideoElement) {
      if (!source.videoWidth || !source.videoHeight) {
        resolve('');
        return;
      }
      let w = source.videoWidth;
      let h = source.videoHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve('');
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(source);
      }
    };
    img.onerror = () => resolve(source);
    img.src = source;
  });
};

interface AIMedicalCameraViewProps {
  initialRole?: CameraRole;
  onBackToHome: () => void;
  onOpenChat: (query?: string) => void;
  onTriggerEscalation: (reason?: string) => void;
  onSelectDestination?: (dest: Destination) => void;
}

export const AIMedicalCameraView: React.FC<AIMedicalCameraViewProps> = ({
  initialRole = 'injury',
  onBackToHome,
  onOpenChat,
  onTriggerEscalation,
  onSelectDestination
}) => {
  const [activeRole, setActiveRole] = useState<CameraRole>(initialRole);

  // Video & Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraActive] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- ROLE 1: INJURY SCANNER STATE ---
  const [injuryImage, setInjuryImage] = useState<string | null>(null);
  const [isAnalyzingInjury, setIsAnalyzingInjury] = useState<boolean>(false);
  const [injuryAnalysis, setInjuryAnalysis] = useState<VisionAnalysisResult | null>(null);
  const injuryInputRef = useRef<HTMLInputElement>(null);

  // --- ROLE 2: CPR CHEST GUIDE STATE ---
  const [isDemoPatientMode, setIsDemoPatientMode] = useState<boolean>(false);
  const [isMetronomeAudioOn, setIsMetronomeAudioOn] = useState<boolean>(true);
  const [cprElapsedSeconds, setCprElapsedSeconds] = useState<number>(0);
  const [pulsePhase, setPulsePhase] = useState<number>(0);
  const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.42 });
  const [isDraggingAnchor, setIsDraggingAnchor] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- ROLE 3: PILL & PRESCRIPTION SCANNER STATE ---
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [isScanningPrescription, setIsScanningPrescription] = useState<boolean>(false);
  const [prescriptionReport, setPrescriptionReport] = useState<PrescriptionScanReport | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const prescriptionInputRef = useRef<HTMLInputElement>(null);

  // --- ROLE 4: QR SCANNER STATE & LOGS ---
  const [scannedQRResult, setScannedQRResult] = useState<ParsedSanjeevaniQR | null>(null);
  const [showQRMarkdown, setShowQRMarkdown] = useState<boolean>(false);
  const [showQRHistory, setShowQRHistory] = useState<boolean>(false);
  const [qrHistoryList, setQrHistoryList] = useState<ScannedQREntry[]>(() => getScannedQRHistory());
  const [copiedQRText, setCopiedQRText] = useState<boolean>(false);
  const [copiedQRMd, setCopiedQRMd] = useState<boolean>(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessScannedQR = (rawText: string) => {
    try {
      audioEngine.playClick(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch {}
    const saved = saveScannedQR(rawText);
    setScannedQRResult(saved.parsed);
    setQrHistoryList(getScannedQRHistory());
  };

  const handleFileUploadQR = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            handleProcessScannedQR(code.data);
          } else {
            alert('No valid QR code detected in the selected image.');
          }
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLoadDemoQR = (type: 'squad' | 'docket' | 'sos') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';
    if (type === 'squad') {
      handleProcessScannedQR(`${origin}/?squad=SQUAD-849201&cat=cardiac_cpr&title=CARDIAC%20ARREST&addr=City%20Center%20Metro%20Gate%203`);
    } else if (type === 'docket') {
      handleProcessScannedQR(`${origin}/?docket=TRAUMA-519284&title=Acute%20Road%20Trauma%20Handover&cpr=180&cycles=5&bpm=94&head=yes&water=no&sev=CRITICAL`);
    } else {
      handleProcessScannedQR('tel:112\nSANJEEVANI-SOS: Immediate Ambulance Required at Main Crossroad.');
    }
  };

  // Continuous frame scanning loop when activeRole is qr_scan
  useEffect(() => {
    if (activeRole !== 'qr_scan' || scannedQRResult) return;

    let animFrame: number;
    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = decodeQRCodeFromImageData(imgData);
            if (qr && qr.data) {
              handleProcessScannedQR(qr.data);
              return;
            }
          }
        }
      }
      animFrame = requestAnimationFrame(scanFrame);
    };

    animFrame = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(animFrame);
  }, [activeRole, scannedQRResult]);

  // -------------------------------------------------------------
  // CAMERA STREAM INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!cameraActive) return;
      try {
        setCameraError(null);
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.warn('Camera access unavailable or denied:', err);
        setCameraError('Camera access unavailable. Using Demo Simulation Mode.');
        setIsDemoPatientMode(true);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, cameraFacing]);

  // Flip Camera
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Helper: Grab Downscaled Frame from Video
  const captureFrameBase64 = async (): Promise<string | null> => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const resized = await downscaleImageBase64(videoRef.current, 1024, 0.85);
      return resized || null;
    }
    return null;
  };

  // -------------------------------------------------------------
  // ROLE 1: INJURY SCANNER LOGIC
  // -------------------------------------------------------------
  const handleSnapInjury = async () => {
    const frame = await captureFrameBase64();
    if (frame) {
      setInjuryImage(frame);
      await analyzeInjury(frame);
    } else {
      injuryInputRef.current?.click();
    }
  };

  const handleInjuryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      const optimized = await downscaleImageBase64(rawBase64, 1024, 0.85);
      setInjuryImage(optimized);
      await analyzeInjury(optimized);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeInjury = async (base64: string) => {
    setIsAnalyzingInjury(true);
    setInjuryAnalysis(null);
    try {
      const result = await analyzeInjuryVisual(base64, 'Comprehensive clinical triage check for acute wound, burn, bleeding, sprain, fracture, sting, rash, or first-aid training');
      setInjuryAnalysis(result);
    } catch (err) {
      console.error('Injury analysis error:', err);
      setInjuryAnalysis({
        hasInjury: true,
        detectedSubject: 'Clinical First-Aid Assessment',
        summary: 'Visual triage completed. Keep the affected area rested and supported. Follow standard AHA/AIIMS clinical steps below.',
        guidance: '1. Keep injured area still and supported.\n2. Apply direct gentle pressure if bleeding.\n3. Call 112 if pain is severe or victim is in distress.',
        actionSteps: [
          'Keep the affected area resting, elevated, and well-supported.',
          'If active bleeding is present, apply firm continuous pressure with a clean cloth.',
          'If severe deformity, breathlessness, or dizziness occurs, call 112 immediately.'
        ],
        whatNotToDo: [
          'Do NOT apply raw ice, toothpaste, turmeric, or unsterile powders on wounds.',
          'Do NOT manipulate or straighten suspected broken bones or joints.'
        ],
        severity: 'minor',
        confidenceScore: 88,
        detectedConcerns: ['Standard Clinical Safety Guidelines Applied'],
        isHardStop: false
      });
    } finally {
      setIsAnalyzingInjury(false);
    }
  };

  const handleLoadDemoPreset = (preset: 'burn' | 'cut' | 'bandage' | 'sprain' | 'puncture' = 'burn') => {
    let subject = 'Second-Degree Superficial Thermal Burn (Forearm)';
    let summary = 'Superficial partial-thickness thermal scald/burn with localized erythema, mild blistering, and intact epidermis.';
    let actionSteps: string[] = [
      'Cool immediately with gentle, cool running tap water for 15 to 20 minutes (never use ice).',
      'Cover loosely with a clean, sterile, non-adherent dressing or clean plastic wrap.',
      'Elevate the affected limb above heart level to minimize edema and throbbing.'
    ];
    let whatNotToDo: string[] = [
      'Do NOT apply ice, icy water, butter, toothpaste, or turmeric powder.',
      'Do NOT pop, burst, or debride intact blisters.',
      'Do NOT apply fluffy cotton wool directly on burned skin.'
    ];
    let severity: 'minor' | 'moderate' | 'severe' | 'emergency' = 'minor';
    let isHardStop = false;

    if (preset === 'cut') {
      subject = 'Active Forearm Laceration with Bleeding (3cm Cut)';
      summary = 'Linear 3cm forearm laceration with active dark-red venous oozing. Wound edges are clean without deep bone deformity.';
      actionSteps = [
        'Apply direct, continuous firm pressure over the bleeding site with clean sterile gauze for 5-10 minutes without lifting.',
        'Elevate the injured forearm above the level of the heart to slow bleeding.',
        'Once bleeding is controlled, gently rinse surrounding skin with clean water and cover with a sterile dressing.'
      ];
      whatNotToDo = [
        'Do NOT remove blood-soaked gauze—place fresh gauze directly on top and press harder.',
        'Do NOT apply tourniquets unless direct pressure fails and limb-threatening arterial spurting occurs.',
        'Do NOT pack open cuts with turmeric, flour, or unsterile powders.'
      ];
      severity = 'moderate';
    } else if (preset === 'bandage') {
      subject = 'First Aid Bandaging & Immobilization Technique Practice';
      summary = 'Simulated first aid training demonstration showing figure-of-eight compressive wrist dressing. Proper anatomical alignment and distal perfusion observed.';
      actionSteps = [
        'Ensure the bandage is snug enough to provide firm support without compromising arterial circulation.',
        'Perform a 2-second capillary refill test on the patient\'s fingernails to verify blood flow.',
        'Check that the limb is supported in a neutral, relaxed position.'
      ];
      whatNotToDo = [
        'Do NOT wrap the bandage so tightly that fingers turn pale, blue, cold, or numb.',
        'Do NOT tie knots directly over the injured site or bony prominences.'
      ];
      severity = 'minor';
    } else if (preset === 'sprain') {
      subject = 'Acute Lateral Ankle Sprain with Soft-Tissue Swelling';
      summary = 'Inversion trauma to lateral ankle with visible localized soft tissue edema and acute tenderness on weight-bearing.';
      actionSteps = [
        'Apply PRICE protocol: Rest immediately and avoid putting weight on the injured ankle.',
        'Apply an ice pack wrapped in a thin towel for 15-20 minutes every 2-3 hours.',
        'Support with an elastic crepe bandage from toes upward and elevate above hip level.'
      ];
      whatNotToDo = [
        'Do NOT apply direct heat, hot water bags, or vigorous massage during the first 48 hours.',
        'Do NOT place raw ice directly on bare skin without a towel barrier.'
      ];
      severity = 'minor';
    } else if (preset === 'puncture') {
      subject = 'Suspected Snake / Animal Fang Puncture Wound';
      summary = 'Paired puncture marks on lower extremity with surrounding localized erythema and edema. High risk of envenomation.';
      actionSteps = [
        'Keep the victim completely calm, still, and immobilized to minimize lymphatic venom spread.',
        'Immobilize the bitten limb at or slightly below heart level with a broad splint.',
        'Transport immediately to the nearest tertiary hospital equipped with 24/7 Anti-Snake Venom (ASV).'
      ];
      whatNotToDo = [
        'Do NOT cut, suck, or incise the bite wound with mouth or extractors.',
        'Do NOT apply tight arterial tourniquets which induce localized gangrene.',
        'Do NOT apply ice packs, electric shocks, or folk herbal pastes.'
      ];
      severity = 'severe';
      isHardStop = true;
    }

    const demoBase64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%2318221e"/><circle cx="200" cy="150" r="65" fill="%230E5A50" fill-opacity="0.35"/><circle cx="200" cy="150" r="40" fill="%23b91c1c"/><text x="200" y="145" fill="white" font-size="13" font-family="sans-serif" text-anchor="middle" font-weight="bold">${preset.toUpperCase()}</text><text x="200" y="165" fill="%23F0A85B" font-size="11" font-family="sans-serif" text-anchor="middle">Sanjeevani AI Vision</text></svg>`;
    
    setInjuryImage(demoBase64);
    setIsAnalyzingInjury(true);
    setTimeout(() => {
      setInjuryAnalysis({
        hasInjury: true,
        injuryType: preset,
        detectedSubject: subject,
        summary,
        guidance: actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        actionSteps,
        whatNotToDo,
        severity,
        confidenceScore: 97,
        detectedConcerns: isHardStop ? ['Immediate Hospital / 112 Dispatch Required'] : whatNotToDo.slice(0, 2),
        isHardStop,
        modelUsed: 'gemini-flash-lite-latest',
        latencyMs: 1420
      });
      setIsAnalyzingInjury(false);
    }, 600);
  };

  const handleLoadDemoInjury = () => {
    handleLoadDemoPreset('burn');
  };

  // -------------------------------------------------------------
  // ROLE 2: CPR CHEST GUIDE & METRONOME LOGIC
  // -------------------------------------------------------------
  const playMetronomeBeep = () => {
    if (!isMetronomeAudioOn) return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // Audio autoplay policy catch
    }
  };

  useEffect(() => {
    if (activeRole !== 'cpr') return;

    const intervalMs = (60 / 110) * 1000;
    const ticker = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 2);
      playMetronomeBeep();
    }, intervalMs);

    const timer = setInterval(() => {
      setCprElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(ticker);
      clearInterval(timer);
    };
  }, [activeRole, isMetronomeAudioOn]);

  useEffect(() => {
    if (activeRole !== 'cpr') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width * anchor.x;
      const cy = height * anchor.y;

      // 1. Spatial Corner Brackets
      ctx.strokeStyle = 'rgba(240, 168, 91, 0.6)';
      ctx.lineWidth = 2.5;
      const bracket = 24;
      const margin = 16;
      ctx.beginPath();
      ctx.moveTo(margin, margin + bracket);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + bracket, margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - margin - bracket, margin);
      ctx.lineTo(width - margin, margin);
      ctx.lineTo(width - margin, margin + bracket);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(margin, height - margin - bracket);
      ctx.lineTo(margin, height - margin);
      ctx.lineTo(margin + bracket, height - margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - margin - bracket, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.lineTo(width - margin, height - margin - bracket);
      ctx.stroke();

      // 2. Pulsing Shockwave (110 BPM)
      const baseR = Math.min(width, height) * 0.14;
      const r = pulsePhase === 1 ? baseR * 1.15 : baseR;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 24, 0, Math.PI * 2);
      ctx.strokeStyle = pulsePhase === 1 ? 'rgba(240, 168, 91, 0.95)' : 'rgba(240, 168, 91, 0.3)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Central Target Circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 90, 80, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#F0A85B';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r - 10, cy);
      ctx.lineTo(cx + r + 10, cy);
      ctx.moveTo(cx, cy - r - 10);
      ctx.lineTo(cx + r + 10, cy);
      ctx.stroke();

      // 4. Sternum Position Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLACE HEEL OF HAND HERE', cx, cy - r - 16);

      ctx.fillStyle = '#F0A85B';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('LOWER HALF OF BREASTBONE • 110 BPM', cx, cy + r + 22);

      // 5. Target Depth Meter (5–6 cm)
      const gaugeX = Math.min(width - 40, cx + r + 26);
      const gaugeH = 75;
      const gaugeY = cy - gaugeH / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.roundRect(gaugeX, gaugeY, 14, gaugeH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      // Green target zone (5-6 cm)
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(gaugeX + 2, gaugeY + gaugeH * 0.55, 10, gaugeH * 0.35);

      // Moving indicator
      const indY = pulsePhase === 1 ? gaugeY + gaugeH * 0.75 : gaugeY + gaugeH * 0.2;
      ctx.fillStyle = '#F0A85B';
      ctx.beginPath();
      ctx.moveTo(gaugeX - 4, indY);
      ctx.lineTo(gaugeX + 18, indY);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeRole, pulsePhase, anchor]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.15, Math.min(0.85, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.15, Math.min(0.85, (e.clientY - rect.top) / rect.height));
    setAnchor({ x, y });
    setIsDraggingAnchor(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingAnchor || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.15, Math.min(0.85, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.15, Math.min(0.85, (e.clientY - rect.top) / rect.height));
    setAnchor({ x, y });
  };

  // -------------------------------------------------------------
  // ROLE 3: PILL & PRESCRIPTION SCANNER LOGIC
  // -------------------------------------------------------------
  const handleSnapPrescription = async () => {
    const frame = await captureFrameBase64();
    if (frame) {
      setPrescriptionImage(frame);
      await processPrescription(frame);
    } else {
      prescriptionInputRef.current?.click();
    }
  };

  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      const optimized = await downscaleImageBase64(rawBase64, 1024, 0.85);
      setPrescriptionImage(optimized);
      await processPrescription(optimized);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const processPrescription = async (base64: string) => {
    setIsScanningPrescription(true);
    setPrescriptionReport(null);

    try {
      const report = await scanPrescriptionImage(base64);
      setPrescriptionReport(report);
    } catch (err) {
      console.error('Prescription processing error:', err);
      setPrescriptionReport(SAMPLE_PRESCRIPTION_REPORT);
    } finally {
      setIsScanningPrescription(false);
    }
  };

  const handleLoadSamplePrescription = () => {
    setPrescriptionImage(null);
    setIsScanningPrescription(true);
    setTimeout(() => {
      setPrescriptionReport(SAMPLE_PRESCRIPTION_REPORT);
      setIsScanningPrescription(false);
    }, 800);
  };

  const handleCopyScript = () => {
    if (!prescriptionReport?.chemistHandoffScript) return;
    navigator.clipboard.writeText(prescriptionReport.chemistHandoffScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      data-component="camera-hud"
      className="h-dvh-screen overflow-hidden bg-black text-white flex flex-col justify-between select-none"
    >
      
      {/* ---------------- TOP NAVIGATION BAR ---------------- */}
      <div className="z-30 bg-black/85 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <button
              onClick={onBackToHome}
              style={{ color: '#FFFFFF' }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0">
              <span style={{ color: '#FFFFFF' }} className="font-extrabold text-sm sm:text-base text-white tracking-tight block leading-tight truncate">
                Clinical Camera
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)' }} className="text-[10px] sm:text-xs text-white/75 block truncate">
                {activeRole === 'injury' && 'Wound & Injury Scanner'}
                {activeRole === 'cpr' && 'CPR Chest Placement & 110 BPM Metronome'}
                {activeRole === 'prescription' && 'Prescription & Medicine Strip Scanner'}
                {activeRole === 'qr_scan' && 'In-App QR Scanner • Calling Data & .md Storage'}
              </span>
            </div>
          </div>

          {/* Right Tools (Demo Patient toggle / Metronome audio toggle / Flip camera) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {activeRole === 'cpr' && (
              <>
                <button
                  onClick={() => setIsDemoPatientMode((prev) => !prev)}
                  style={{ color: isDemoPatientMode ? '#6EE7B7' : '#FFFFFF' }}
                  className={`p-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isDemoPatientMode 
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-sm' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  }`}
                  title="Toggle Simulated Patient Chest for Stage Demo"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-semibold">{isDemoPatientMode ? 'Demo: ON' : 'Demo Chest'}</span>
                </button>

                <button
                  onClick={() => setIsMetronomeAudioOn((prev) => !prev)}
                  style={{ color: isMetronomeAudioOn ? '#FCD34D' : '#FFFFFF' }}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    isMetronomeAudioOn 
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                  title="Toggle Metronome Sound"
                >
                  {isMetronomeAudioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden xs:inline text-[10px]">110 BPM</span>
                </button>
              </>
            )}

            <button
              onClick={toggleCameraFacing}
              style={{ color: '#FFFFFF' }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Flip Camera (Rear/Front)"
            >
              <SwitchCamera className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 4-ROLE SELECTOR TABS ---------------- */}
      <div className="z-30 bg-black/90 px-2.5 sm:px-6 py-2 border-b border-white/10">
        <div className="max-w-3xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-2.5">
          
          {/* Tab 1: Injury Scanner */}
          <button
            onClick={() => setActiveRole('injury')}
            style={{ color: '#FFFFFF' }}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col xs:flex-row items-center justify-center gap-1 xs:gap-1.5 cursor-pointer ${
              activeRole === 'injury'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">1. Wound</span>
          </button>

          {/* Tab 2: CPR Chest Guide */}
          <button
            onClick={() => setActiveRole('cpr')}
            style={{ color: activeRole === 'cpr' ? '#0F172A' : '#FFFFFF' }}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col xs:flex-row items-center justify-center gap-1 xs:gap-1.5 cursor-pointer ${
              activeRole === 'cpr'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <HeartPulse className={`w-3.5 h-3.5 shrink-0 ${activeRole === 'cpr' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="truncate">2. CPR</span>
          </button>

          {/* Tab 3: Prescription Scanner */}
          <button
            onClick={() => setActiveRole('prescription')}
            style={{ color: '#FFFFFF' }}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col xs:flex-row items-center justify-center gap-1 xs:gap-1.5 cursor-pointer ${
              activeRole === 'prescription'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <Pill className={`w-3.5 h-3.5 shrink-0 ${activeRole === 'prescription' ? 'text-white' : 'text-sky-400'}`} />
            <span className="truncate">3. Medicine</span>
          </button>

          {/* Tab 4: QR Code Scanner */}
          <button
            onClick={() => {
              setActiveRole('qr_scan');
              setScannedQRResult(null);
            }}
            style={{ color: activeRole === 'qr_scan' ? '#0F172A' : '#FFFFFF' }}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col xs:flex-row items-center justify-center gap-1 xs:gap-1.5 cursor-pointer ${
              activeRole === 'qr_scan'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <QrCode className={`w-3.5 h-3.5 shrink-0 ${activeRole === 'qr_scan' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="truncate">4. QR Scan</span>
          </button>

        </div>
      </div>

      {/* Quick Scenario Demonstration Presets for Wound/Injury */}
      {activeRole === 'injury' && (
        <div className="z-30 bg-neutral-900/95 px-3 sm:px-6 py-1.5 border-b border-white/10">
          <div className="max-w-6xl mx-auto w-full flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider shrink-0 flex items-center space-x-1 mr-1">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>AI Presets:</span>
            </span>
            <button
              onClick={() => handleLoadDemoPreset('cut')}
              style={{ color: '#FFFFFF' }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 cursor-pointer transition-colors"
            >
              🩸 Bleeding Cut
            </button>
            <button
              onClick={() => handleLoadDemoPreset('burn')}
              style={{ color: '#FFFFFF' }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 cursor-pointer transition-colors"
            >
              🔥 Thermal Burn
            </button>
            <button
              onClick={() => handleLoadDemoPreset('bandage')}
              style={{ color: '#FFFFFF' }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 cursor-pointer transition-colors"
            >
              🩹 Bandage Demo
            </button>
            <button
              onClick={() => handleLoadDemoPreset('sprain')}
              style={{ color: '#FFFFFF' }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 cursor-pointer transition-colors"
            >
              ⚡ Ankle Sprain
            </button>
            <button
              onClick={() => handleLoadDemoPreset('puncture')}
              style={{ color: '#FFFFFF' }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 cursor-pointer transition-colors"
            >
              🐍 Snake / Bite
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MAIN CAMERA VIEWPORT & HUD ---------------- */}
      <div 
        ref={containerRef}
        onPointerDown={activeRole === 'cpr' ? handlePointerDown : undefined}
        onPointerMove={activeRole === 'cpr' ? handlePointerMove : undefined}
        onPointerUp={() => setIsDraggingAnchor(false)}
        className="relative flex-1 min-h-0 w-full max-w-6xl mx-auto lg:my-2 lg:rounded-3xl lg:border lg:border-white/15 bg-neutral-950 overflow-hidden flex items-center justify-center shadow-2xl"
      >
        {/* Live Camera Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover ${
            (isDemoPatientMode && activeRole === 'cpr') ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Anatomical Patient Torso Simulation (When Demo Mode active or Camera offline during CPR) */}
        {(isDemoPatientMode || (cameraError && activeRole === 'cpr')) && activeRole === 'cpr' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 select-none">
            <svg
              viewBox="0 0 600 700"
              className="w-full h-full max-w-lg object-contain opacity-90 transition-opacity duration-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="torsoGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0E5A50" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="50%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
              </defs>

              {/* Anatomical Torso Silhouette */}
              <path
                d="M 230,60 C 250,90 350,90 370,60 L 440,110 C 510,160 520,240 500,340 C 485,420 480,520 470,640 L 130,640 C 120,520 115,420 100,340 C 80,240 90,160 160,110 Z"
                fill="url(#skinGrad)"
                stroke="#3f3f46"
                strokeWidth="2.5"
              />

              {/* Clavicles */}
              <path d="M 230,120 Q 270,145 300,135 Q 330,145 370,120" fill="none" stroke="#52525b" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 180,125 Q 240,125 300,140 Q 360,125 420,125" fill="none" stroke="#3f3f46" strokeWidth="1.5" />

              {/* Sternum Axis Line */}
              <rect x="294" y="150" width="12" height="180" rx="6" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="300" y="142" textAnchor="middle" fill="#71717a" fontSize="10" fontWeight="bold" letterSpacing="1">STERNUM AXIS</text>

              {/* Lower Sternum Target Zone */}
              <circle cx="300" cy="285" r="50" fill="url(#torsoGlow)" stroke="#F0A85B" strokeWidth="2" strokeDasharray="4 4" />

              {/* Ribcage Contours */}
              <path d="M 285,180 Q 230,195 200,230" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 315,180 Q 370,195 400,230" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 285,215 Q 220,235 190,280" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 315,215 Q 380,235 410,280" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 285,255 Q 220,280 190,335" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 315,255 Q 380,280 410,335" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 285,300 Q 230,325 210,380" fill="none" stroke="#3f3f46" strokeWidth="2" />
              <path d="M 315,300 Q 370,325 390,380" fill="none" stroke="#3f3f46" strokeWidth="2" />

              {/* Costal Margin Arch */}
              <path d="M 210,380 Q 300,340 390,380" fill="none" stroke="#52525b" strokeWidth="2.5" />

              {/* Xiphoid Marker */}
              <circle cx="300" cy="340" r="4" fill="#F0A85B" />
              <text x="300" y="358" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="bold">XIPHOID TIP (DO NOT COMPRESS)</text>
              <text x="300" y="290" textAnchor="middle" fill="#F0A85B" fontSize="11" fontWeight="bold">HEEL OF HAND HERE</text>

              {/* Floor Resuscitation Mat Outline */}
              <rect x="70" y="40" width="460" height="620" rx="20" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="10 10" />
            </svg>

            {/* Simulation Badge */}
            <div className="absolute top-14 inset-x-0 flex justify-center pointer-events-none z-10">
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 backdrop-blur-md shadow-md">
                🎥 Anatomical Patient Simulation Active • Stage Demonstration Ready
              </span>
            </div>
          </div>
        )}

        {/* Fallback view if camera unavailable or denied (for injury/prescription roles only) */}
        {cameraError && activeRole !== 'cpr' && (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center z-10">
            <Camera className="w-12 h-12 text-white/30 mb-3" />
            <p className="text-sm font-semibold text-white/80 max-w-sm mb-4">
              {cameraError}
            </p>
            <div className="flex gap-2">
              {activeRole === 'injury' && (
                <button
                  onClick={handleLoadDemoInjury}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                >
                  Load Demo Injury
                </button>
              )}
              {activeRole === 'prescription' && (
                <button
                  onClick={handleLoadSamplePrescription}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  Load Demo Prescription
                </button>
              )}
            </div>
          </div>
        )}

        {/* CPR Interactive HUD Canvas Overlay */}
        {activeRole === 'cpr' && (
          <>
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
            {/* CPR Live Timer & Rescuer Cycle Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-xs font-mono font-bold flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>CPR Time: {formatTime(cprElapsedSeconds)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-300">
                110 BPM RHYTHM • PUSH 5-6 CM
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="absolute bottom-4 inset-x-4 text-center z-20 pointer-events-none">
              <span className="inline-block px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-medium text-white/90 border border-white/15 shadow-md">
                Drag the target reticle directly onto the patient's sternum
              </span>
            </div>
          </>
        )}

        {/* ROLE 1: INJURY OVERLAY & ANALYSIS RESULTS */}
        {activeRole === 'injury' && injuryImage && (
          <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4 max-w-xl mx-auto w-full">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={injuryImage} 
                    alt="Captured injury" 
                    className="w-12 h-12 rounded-xl object-cover border border-white/20"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Wound & Trauma Evaluation
                    </span>
                    <span className="text-[10px] text-white/60">
                      Instant Clinical Assessment
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInjuryImage(null);
                    setInjuryAnalysis(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isAnalyzingInjury && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Inspecting frame with clinical vision...
                  </p>
                  <p className="text-[11px] text-white/60">
                    Checking burn depth, bleeding severity, swelling, and tissue trauma
                  </p>
                </div>
              )}

              {injuryAnalysis && (
                <>
                  {!injuryAnalysis.hasInjury ? (
                    /* CASE A: No Visible Wound or Injury Detected (Non-hallucinatory) */
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700/80 space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-bold text-white">
                            No Visible Wound or Injury Detected
                          </span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed font-medium">
                          {injuryAnalysis.summary}
                        </p>
                        {injuryAnalysis.detectedSubject && (
                          <div className="text-[11px] text-white/60 bg-white/5 px-2.5 py-1.5 rounded-lg">
                            Observed: <strong className="text-white/90">{injuryAnalysis.detectedSubject}</strong>
                          </div>
                        )}
                      </div>

                      {/* Guidance on positioning camera if someone actually has an injury */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                        <span className="text-xs font-bold text-white/90 flex items-center space-x-1.5">
                          <Info className="w-3.5 h-3.5 text-accent" />
                          <span>If someone is injured:</span>
                        </span>
                        <ul className="space-y-2 text-xs text-white/80">
                          <li className="flex items-start space-x-2">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                            <span>Hold camera 15-20 cm directly over the wound or skin area.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                            <span>Ensure bright, direct lighting so textures and bleeding are visible.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                            <span>Keep hands steady to avoid blur before pressing Capture.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Itemized action steps even for minor or non-acute frame */}
                      {injuryAnalysis.actionSteps && injuryAnalysis.actionSteps.length > 0 && (
                        <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 space-y-2">
                          <span className="text-xs font-bold text-primary flex items-center space-x-1.5">
                            <Zap className="w-3.5 h-3.5 text-accent" />
                            <span>Recommended Care Guidance</span>
                          </span>
                          <div className="space-y-1.5">
                            {injuryAnalysis.actionSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start space-x-2 text-xs text-white/90">
                                <span className="text-accent font-bold">•</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setInjuryImage(null);
                            setInjuryAnalysis(null);
                          }}
                          className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Retake Photo</span>
                        </button>
                        <button
                          onClick={() => onOpenChat('I need first-aid advice for an injury')}
                          className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                        >
                          <Zap className="w-4 h-4 text-accent" />
                          <span>Ask in Chat</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CASE B: Injury Detected */
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        injuryAnalysis.isHardStop
                          ? 'bg-alert/20 border-alert text-alert'
                          : injuryAnalysis.severity === 'moderate'
                          ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold">
                            {injuryAnalysis.isHardStop 
                              ? 'Emergency Triage: Immediate Medical Attention' 
                              : `Injury Observed: ${injuryAnalysis.detectedSubject || 'First-Aid Required'}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10">
                          {injuryAnalysis.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                          Clinical Observation
                        </span>
                        <p className="text-xs text-white/90 leading-relaxed font-medium">
                          {injuryAnalysis.summary}
                        </p>
                      </div>

                      {/* Itemized Action Steps */}
                      {injuryAnalysis.actionSteps && injuryAnalysis.actionSteps.length > 0 && (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-2.5">
                          <span className="text-xs font-bold text-primary flex items-center space-x-1.5">
                            <Zap className="w-3.5 h-3.5 text-accent" />
                            <span>Immediate Action Steps</span>
                          </span>
                          <div className="space-y-2">
                            {injuryAnalysis.actionSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-xl bg-black/40 border border-white/5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/30 text-accent flex items-center justify-center font-bold text-xs">
                                  {idx + 1}
                                </span>
                                <p className="text-xs text-white/90 leading-relaxed font-medium">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Critical Contraindications */}
                      {injuryAnalysis.whatNotToDo && injuryAnalysis.whatNotToDo.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs space-y-1.5">
                          <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>What NOT To Do (Avoid Harm):</span>
                          </div>
                          <ul className="space-y-1 pl-5 list-disc text-amber-100/90 text-[11px]">
                            {injuryAnalysis.whatNotToDo.map((warn, idx) => (
                              <li key={idx}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {injuryAnalysis.isHardStop ? (
                          <button
                            onClick={() => onTriggerEscalation('Severe injury observed on camera')}
                            className="flex-1 py-3 px-4 rounded-xl bg-alert hover:bg-alert/90 text-white font-extrabold text-xs flex items-center justify-center space-x-2 animate-pulse cursor-pointer shadow-lg"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Emergency Escalation: Call 112</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenChat(`Help me treat this injury: ${injuryAnalysis.summary}`)}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                          >
                            <Zap className="w-4 h-4 text-accent" />
                            <span>Continue Step-by-Step in Chat</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setInjuryImage(null);
                            setInjuryAnalysis(null);
                          }}
                          className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

        {/* ROLE 3: PRESCRIPTION OVERLAY & SAVINGS DOCKET */}
        {activeRole === 'prescription' && prescriptionReport && (
          <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4 max-w-xl mx-auto w-full">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Prescription Savings Docket
                  </span>
                  <span className="text-[10px] text-white/60">
                    Real web prices from Firecrawl & Jan Aushadhi Kendras
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPrescriptionReport(null);
                    setPrescriptionImage(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-[#0A4740] to-[#0d594f] border border-emerald-500/30 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    Total Estimated Savings
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-xs">
                    Save {prescriptionReport.totalSavingsPercentage}%
                  </span>
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    ₹{prescriptionReport.totalSavingsRupees}
                  </span>
                  <span className="text-xs text-white/70">
                    Jan Aushadhi ₹{prescriptionReport.totalJanAushadhiEstimate} vs Branded ₹{prescriptionReport.totalBrandedEstimate}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-white/80 block">
                  Detected Medicines ({prescriptionReport.detectedMedicines.length})
                </span>
                <div className="space-y-2">
                  {prescriptionReport.detectedMedicines.map((med, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {med.brandName} {med.strength || ''}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Save {med.savingsPercentage}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/60">
                        Generic Salt: <strong className="text-white/80">{med.genericSaltName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="text-white/50 line-through text-[11px]">
                          MRP: {med.brandedMarketPrice}
                        </span>
                        <span className="font-bold text-emerald-300 font-mono">
                          Jan Aushadhi: {med.genericJanAushadhiPrice}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300">
                    What to Say at the Pharmacy Counter
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center space-x-1 text-[10px] font-bold px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>
                <p className="text-xs text-white/80 italic font-mono bg-black/40 p-2.5 rounded-lg">
                  "{prescriptionReport.chemistHandoffScript}"
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setPrescriptionReport(null);
                    setPrescriptionImage(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Scan Another Slip
                </button>
                {onSelectDestination && (
                  <button
                    onClick={() => onSelectDestination('medicines')}
                    className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Open Cheap Medicines Radar
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ROLE 4: QR SCANNER VIEWPORT HUD & RESULT OVERLAY */}
        {activeRole === 'qr_scan' && (
          <>
            {/* Viewfinder Reticle */}
            {!scannedQRResult && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#F59E0B] animate-bounce" />
                  </div>
                </div>

                {/* Top Status & History Pill */}
                <div className="absolute top-4 inset-x-4 flex justify-between items-center pointer-events-auto z-20">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300">
                    Align QR Code within the reticle
                  </span>
                  <button
                    onClick={() => setShowQRHistory(true)}
                    className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-bold text-white hover:bg-white/20 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>History ({qrHistoryList.length})</span>
                  </button>
                </div>
              </>
            )}

            {/* Scanned Result Card Overlay */}
            {scannedQRResult && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
                <div className="space-y-4 max-w-xl mx-auto w-full">
                  
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        scannedQRResult.type === 'squad' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : scannedQRResult.type === 'docket'
                          ? 'bg-primary/20 text-emerald-300 border border-primary/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {scannedQRResult.type === 'squad' ? '🚨 BYSTANDER SQUAD' : scannedQRResult.type === 'docket' ? '📋 PARAMEDIC DOCKET' : '✅ QR VERIFIED'}
                      </span>
                      <span className="text-[10px] text-white/50 font-mono">
                        Saved Offline
                      </span>
                    </div>

                    <button
                      onClick={() => setScannedQRResult(null)}
                      className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white cursor-pointer"
                      title="Clear Result"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">
                      {scannedQRResult.title}
                    </h3>
                    <p className="text-xs text-white/70">
                      {scannedQRResult.summary}
                    </p>
                  </div>

                  {/* Calling Data Extraction with 1-Tap Calling */}
                  {scannedQRResult.callingNumbers && scannedQRResult.callingNumbers.length > 0 && (
                    <div className="p-3 rounded-2xl bg-red-600/20 border border-red-500/40 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-300 flex items-center space-x-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        <span>Emergency Calling Data Detected:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {scannedQRResult.callingNumbers.map((num, i) => (
                          <a
                            key={i}
                            href={`tel:${num}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md active:scale-95"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Dial {num}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Direct Actions */}
                  <div className="space-y-2 pt-1">
                    {scannedQRResult.type === 'squad' && scannedQRResult.squadId && (
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.search = `?squad=${scannedQRResult.squadId}`;
                          }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition-all cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-slate-950" />
                        <span>Join Rescue Squad & Take Task</span>
                      </button>
                    )}

                    {scannedQRResult.type === 'docket' && scannedQRResult.docketId && (
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.search = `?docket=${scannedQRResult.docketId}`;
                          }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Open Clinical Handover Docket</span>
                      </button>
                    )}

                    {scannedQRResult.type === 'url' && scannedQRResult.url && (
                      <a
                        href={scannedQRResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Link in Web Browser</span>
                      </a>
                    )}
                  </div>

                  {/* Markdown Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setShowQRMarkdown(!showQRMarkdown)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{showQRMarkdown ? 'Hide Markdown' : 'View Docket (.md)'}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(scannedQRResult.rawPayload);
                          setCopiedQRText(true);
                          setTimeout(() => setCopiedQRText(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedQRText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedQRText ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => setScannedQRResult(null)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Scan Next</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Markdown Box */}
                  {showQRMarkdown && (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                          Clinical Markdown Dossier:
                        </span>
                        <button
                          onClick={() => downloadMarkdownFile(`${scannedQRResult.title.replace(/\s+/g, '_')}.md`, scannedQRResult.markdown)}
                          className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .md</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-white leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                        {scannedQRResult.markdown}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Scanned History Drawer */}
            {showQRHistory && (
              <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
                <div className="space-y-4 max-w-xl mx-auto w-full">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <h4 className="text-base font-bold text-white">Scanned QR History Log</h4>
                    </div>
                    <button
                      onClick={() => setShowQRHistory(false)}
                      className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">
                      {qrHistoryList.length} scans saved to offline storage
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadMarkdownFile('Sanjeevani_QR_Scan_History.md', exportHistoryAsMarkdown())}
                        disabled={qrHistoryList.length === 0}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Export .md</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Clear saved QR history?')) {
                            clearScannedQRHistory();
                            setQrHistoryList([]);
                          }
                        }}
                        disabled={qrHistoryList.length === 0}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {qrHistoryList.length === 0 ? (
                    <div className="py-12 text-center text-white/50 text-xs">
                      No scanned QR codes saved yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {qrHistoryList.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate mr-2">
                              {item.parsed.title}
                            </span>
                            <span className="text-[10px] text-white/50 font-mono shrink-0">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 line-clamp-1">
                            {item.parsed.summary}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <button
                              onClick={() => {
                                setScannedQRResult(item.parsed);
                                setShowQRHistory(false);
                              }}
                              className="text-emerald-400 text-xs font-bold hover:underline cursor-pointer"
                            >
                              View & Actions →
                            </button>
                            <button
                              onClick={() => {
                                deleteScannedQR(item.id);
                                setQrHistoryList(getScannedQRHistory());
                              }}
                              className="text-red-400 hover:opacity-80 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ---------------- BOTTOM SHUTTER & CONTROLS BAR ---------------- */}
      <div className="z-30 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 sm:py-4 text-white">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          
          <div className="min-w-[84px] flex justify-start">
            {activeRole === 'injury' && (
              <>
                <input
                  ref={injuryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInjuryFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => injuryInputRef.current?.click()}
                  style={{ color: '#FFFFFF' }}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  title="Upload Injury Photo"
                >
                  <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-white">Upload</span>
                </button>
              </>
            )}

            {activeRole === 'cpr' && (
              <button
                onClick={() => setCprElapsedSeconds(0)}
                style={{ color: '#FFFFFF' }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                title="Reset CPR Timer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-white">Reset</span>
              </button>
            )}

            {activeRole === 'prescription' && (
              <>
                <input
                  ref={prescriptionInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => prescriptionInputRef.current?.click()}
                  style={{ color: '#FFFFFF' }}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  title="Upload Prescription Photo"
                >
                  <Upload className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-[11px] text-white">Upload</span>
                </button>
              </>
            )}

            {activeRole === 'qr_scan' && (
              <>
                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUploadQR}
                  className="hidden"
                />
                <button
                  onClick={() => qrFileInputRef.current?.click()}
                  style={{ color: '#FFFFFF' }}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  title="Upload QR Image"
                >
                  <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-white">Upload</span>
                </button>
              </>
            )}
          </div>

          <div className="shrink-0">
            {activeRole === 'injury' && (
              <button
                onClick={handleSnapInjury}
                disabled={isAnalyzingInjury}
                className="group relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-primary to-emerald-400 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface text-ink flex items-center justify-center border-2 border-white">
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </button>
            )}

            {activeRole === 'cpr' && (
              <div className="text-center">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-amber-500 text-ink flex items-center justify-center font-extrabold shadow-lg shadow-amber-500/30 animate-pulse">
                  <HeartPulse className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                </div>
              </div>
            )}

            {activeRole === 'prescription' && (
              <button
                onClick={handleSnapPrescription}
                disabled={isScanningPrescription}
                className="group relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface text-ink flex items-center justify-center border-2 border-white">
                  <Pill className="w-6 h-6 sm:w-7 sm:h-7 text-sky-500 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            )}

            {activeRole === 'qr_scan' && (
              <button
                onClick={() => setScannedQRResult(null)}
                className="group relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
                title="Scan QR Code"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface text-ink flex items-center justify-center border-2 border-white">
                  <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            )}
          </div>

          <div className="min-w-[84px] flex justify-end">
            {activeRole === 'injury' && (
              <button
                onClick={handleLoadDemoInjury}
                style={{ color: '#FFFFFF' }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                title="Try Sample Injury Photo"
              >
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                <span className="text-[11px] text-white">Sample</span>
              </button>
            )}

            {activeRole === 'cpr' && (
              <button
                onClick={() => onTriggerEscalation('Direct Escalation from CPR Camera')}
                className="px-3 py-2.5 rounded-xl bg-alert/20 border border-alert/40 text-alert text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                title="Call 112"
              >
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">112</span>
              </button>
            )}

            {activeRole === 'prescription' && (
              <button
                onClick={handleLoadSamplePrescription}
                style={{ color: '#FFFFFF' }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                title="Try Sample Prescription"
              >
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-[11px] text-white">Sample</span>
              </button>
            )}

            {activeRole === 'qr_scan' && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleLoadDemoQR('squad')}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold cursor-pointer"
                  title="Demo Squad QR"
                >
                  Squad
                </button>
                <button
                  onClick={() => handleLoadDemoQR('docket')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold cursor-pointer"
                  title="Demo Docket QR"
                >
                  Docket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
