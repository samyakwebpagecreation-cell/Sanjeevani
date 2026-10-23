import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Upload, 
  Camera, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Share2, 
  ArrowRight, 
  Activity, 
  ShieldAlert, 
  FileText, 
  Volume2, 
  VolumeX, 
  Radio, 
  Check, 
  Flame, 
  HeartPulse, 
  Bone, 
  Droplet,
  ChevronRight,
  SwitchCamera
} from 'lucide-react';
import { 
  extractFramesFromVideo, 
  analyzeVideoIncident, 
  generateSampleIncidentVideo, 
  ExtractedFrame, 
  VideoIncidentAnalysis,
  formatVideoTime 
} from '../../services/videoAnalysisService';
import { audioEngine } from '../../utils/audio';

interface VideoForensicAnalyzerProps {
  onLaunchProtocol?: (protocolId: string) => void;
  onInjectIntoDocket?: (analysis: VideoIncidentAnalysis, frames: string[]) => void;
  onClose?: () => void;
}

export const VideoForensicAnalyzer: React.FC<VideoForensicAnalyzerProps> = ({
  onLaunchProtocol,
  onInjectIntoDocket,
  onClose
}) => {
  // Input mode: 'upload' | 'record' | 'samples'
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples'>('samples');

  // Video source & processing state
  const [videoFile, setVideoFile] = useState<File | Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('Uploaded Emergency Clip');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VideoIncidentAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Live recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSecs, setRecordingSecs] = useState<number>(0);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Playback & Filmstrip video player
  const playerRef = useRef<HTMLVideoElement>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(videoUrl);
        } catch {}
      }
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start live camera stream when 'record' tab is opened
  useEffect(() => {
    if (activeTab === 'record') {
      startCamera();
    } else {
      stopCameraStream();
    }
  }, [activeTab, cameraFacing]);

  const startCamera = async () => {
    stopCameraStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: cameraFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
    } catch (err) {
      console.warn('Live camera permission denied or unavailable:', err);
    }
  };

  // Handle Live Camera Clip Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      if (!mediaStreamRef.current) return;
      recordedChunksRef.current = [];
      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
      } catch {
        recorder = new MediaRecorder(mediaStreamRef.current);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        handleProcessVideo(recordedBlob, 'Recorded Live Scene Clip');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSecs(0);

      const interval = setInterval(() => {
        setRecordingSecs((prev) => {
          const next = prev + 1;
          if (next >= 15) {
            // Auto cap at 15s
            clearInterval(interval);
            if (recorder.state !== 'inactive') recorder.stop();
            setIsRecording(false);
          }
          return next;
        });
      }, 1000);
    }
  };

  // Main Pipeline: Extract Frames & Run Gemini 3.6 Multimodal Inference
  const handleProcessVideo = async (source: File | Blob, title: string) => {
    setVideoFile(source);
    setVideoTitle(title);
    if (videoUrl && videoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch {}
    }
    const newUrl = URL.createObjectURL(source);
    setVideoUrl(newUrl);

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressStatus('Decoding video stream and calculating key timestamps...');
    setAnalysisError(null);
    setAnalysisResult(null);
    setExtractedFrames([]);

    try {
      // 1. Extract sequential frames (8 frames)
      const { frames, durationSeconds } = await extractFramesFromVideo(
        source,
        8,
        (pct, status) => {
          setProgressPercent(pct);
          setProgressStatus(status);
        }
      );

      setExtractedFrames(frames);

      // 2. Multimodal Gemini 3.6 Flash Analysis
      const analysis = await analyzeVideoIncident(
        frames,
        title,
        durationSeconds,
        (pct, status) => {
          setProgressPercent(pct);
          setProgressStatus(status);
        }
      );

      setAnalysisResult(analysis);
      audioEngine.speak(analysis.whatHappenedSummary);

      if (onInjectIntoDocket) {
        onInjectIntoDocket(analysis, frames.map((f) => f.dataUrl));
      }
    } catch (err: any) {
      console.error('Video analysis pipeline error:', err);
      setAnalysisError(err?.message || 'Failed to analyze video incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Sample Video Generator
  const handleRunSampleScenario = async (scenario: 'fall' | 'burn' | 'collapse' | 'choking') => {
    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStatus(`Generating real simulated incident clip for ${scenario.toUpperCase()}...`);
    try {
      const sample = await generateSampleIncidentVideo(scenario);
      await handleProcessVideo(sample.blob, sample.title);
    } catch (err: any) {
      setIsProcessing(false);
      setAnalysisError(err?.message || 'Failed to generate sample simulation.');
    }
  };

  // Jump player to specific timestamp when filmstrip frame is tapped
  const handleSeekToTimestamp = (seconds: number, index: number) => {
    setSelectedFrameIndex(index);
    if (playerRef.current) {
      playerRef.current.currentTime = seconds;
      playerRef.current.play().catch(() => {});
    }
  };

  const handleCopySBAR = async () => {
    if (!analysisResult) return;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(analysisResult.paramedicSummary);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-primary/30 bg-surface shadow-lg overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-primary via-[#246b55] to-primary/95 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20">
            <Video className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                AI Forensic Video Incident Analyzer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-ink uppercase">
                Clinical Vision
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Deconstruct what happened in video footage second-by-second with medical-grade precision.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Navigation Tabs (Upload, Record, Sample Scenarios) */}
        {!isProcessing && !analysisResult && (
          <div className="flex items-center justify-center p-1.5 bg-base rounded-2xl border border-border max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('samples')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'samples'
                  ? 'bg-surface text-primary shadow-xs border border-border'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>1-Tap Scenarios</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-surface text-primary shadow-xs border border-border'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video</span>
            </button>

            <button
              onClick={() => setActiveTab('record')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'record'
                  ? 'bg-surface text-primary shadow-xs border border-border'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Record Clip</span>
            </button>
          </div>
        )}

        {/* TAB 1: SAMPLES (Fastest 1-tap testing!) */}
        {activeTab === 'samples' && !isProcessing && !analysisResult && (
          <div className="space-y-4 max-w-2xl mx-auto text-center">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink">
                Test Real AI Video Incident Reconstruction
              </h3>
              <p className="text-xs text-ink-muted">
                Tap any scenario below. Sanjeevani will generate a real 5-second video simulation, extract keyframes, and feed them into our clinical multimodal analysis engine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRunSampleScenario('fall')}
                className="p-4 rounded-2xl border border-border bg-base hover:border-primary/50 hover:shadow-sm text-left transition-all btn-press space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                    💥 Playground Trip & Fall
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-alert/15 text-alert">
                    Head Strike
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Child trips over obstacle and strikes forehead on concrete curb. Unconscious for 12 seconds.
                </p>
              </button>

              <button
                onClick={() => handleRunSampleScenario('burn')}
                className="p-4 rounded-2xl border border-border bg-base hover:border-primary/50 hover:shadow-sm text-left transition-all btn-press space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                    🔥 Kitchen Scald & Burn
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700">
                    Hot Tea Scald
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Boiling water kettle tips onto forearm. Rapid scald formation and severe pain reaction.
                </p>
              </button>

              <button
                onClick={() => handleRunSampleScenario('collapse')}
                className="p-4 rounded-2xl border border-border bg-base hover:border-primary/50 hover:shadow-sm text-left transition-all btn-press space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                    🫀 Sudden Cardiac Collapse
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-alert/15 text-alert">
                    CPR Urgent
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Adult runner clutches chest and collapses flat on pavement. Motionless, no chest rise.
                </p>
              </button>

              <button
                onClick={() => handleRunSampleScenario('choking')}
                className="p-4 rounded-2xl border border-border bg-base hover:border-primary/50 hover:shadow-sm text-left transition-all btn-press space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                    ⚠️ Cafeteria Choking Event
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700">
                    Airway Blocked
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Student clutches neck with universal choking sign. Cannot speak or cough.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD (Real user video files) */}
        {activeTab === 'upload' && !isProcessing && !analysisResult && (
          <div className="max-w-xl mx-auto space-y-4 text-center">
            <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-base/50 hover:bg-base transition-all space-y-3 block">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessVideo(file, file.name);
                }}
              />
              <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-ink block">
                  Click or drag emergency incident video here
                </span>
                <span className="text-xs text-ink-muted mt-1 block">
                  Supports MP4, MOV, WebM, AVI (up to 120MB)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-accent text-ink">
                Select Video File
              </span>
            </label>
          </div>
        )}

        {/* TAB 3: RECORD (Live camera recording) */}
        {activeTab === 'record' && !isProcessing && !analysisResult && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border-2 border-border shadow-inner flex items-center justify-center">
              <video
                ref={liveVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Top status bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                  <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-alert animate-ping' : 'bg-success'}`} />
                  <span className="font-mono font-bold">
                    {isRecording ? `REC 00:${recordingSecs.toString().padStart(2, '0')}` : 'CAMERA READY'}
                  </span>
                </div>

                <button
                  onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 border border-white/20"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom control bar */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                <button
                  onClick={handleToggleRecord}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold shadow-lg transition-all btn-press flex items-center space-x-2 ${
                    isRecording
                      ? 'bg-alert text-white animate-pulse'
                      : 'bg-gradient-to-r from-accent to-[#E08A35] text-ink'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${isRecording ? 'bg-white' : 'bg-alert'}`} />
                  <span>{isRecording ? 'Stop & Analyze (Max 15s)' : 'Record 5-10s Clip'}</span>
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-ink-muted">
              Point camera at patient or incident area. Record a 5 to 10 second clip to let AI reconstruct the timeline.
            </p>
          </div>
        )}

        {/* PROCESSING & NEURAL REASONING PROGRESS */}
        {isProcessing && (
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-base border border-border text-center space-y-5 animate-in fade-in">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="w-7 h-7 text-accent" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-ink">
                Extracting Video Telemetry & Multimodal Analysis
              </h3>
              <p className="text-xs text-ink-muted font-medium">
                {progressStatus}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-[11px] font-mono text-ink-muted">
              Clinical Multimodal Forensics • {progressPercent}%
            </span>
          </div>
        )}

        {/* ERROR STATE */}
        {analysisError && !isProcessing && (
          <div className="p-4 rounded-2xl bg-alert/10 border border-alert/30 text-alert text-xs flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
            <button
              onClick={() => {
                setAnalysisError(null);
                setAnalysisResult(null);
              }}
              className="px-3 py-1 rounded-lg bg-alert text-white font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPLETED AI FORENSIC INCIDENT RESULTS                                    */}
        {/* ========================================================================= */}
        {analysisResult && !isProcessing && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Video Player & Interactive Filmstrip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Video Player */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video relative shadow-sm">
                  {videoUrl && (
                    <video
                      ref={playerRef}
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-ink truncate max-w-[200px]">
                    {videoTitle}
                  </span>
                  <span className="text-ink-muted font-mono">
                    {formatVideoTime(analysisResult.videoDurationSeconds)} • {analysisResult.analyzedFramesCount} frames
                  </span>
                </div>

                {/* Filmstrip Thumbnails */}
                {extractedFrames.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                      Extracted Video Filmstrip (Tap to jump timestamp)
                    </span>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                      {extractedFrames.map((f, idx) => (
                        <button
                          key={f.index}
                          onClick={() => handleSeekToTimestamp(f.timestampSeconds, idx)}
                          className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${
                            selectedFrameIndex === idx
                              ? 'border-accent ring-2 ring-accent/30 scale-105'
                              : 'border-border hover:border-primary/60'
                          }`}
                        >
                          <img
                            src={f.dataUrl}
                            alt={`Frame ${f.index}`}
                            className="w-16 h-10 object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono text-white text-center py-0.5">
                            {f.timestampFormatted}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: AI "What Happened Exactly" Card */}
              <div className="lg:col-span-7 space-y-4">
                {/* Trauma Badge Header */}
                <div className="p-5 rounded-2xl bg-base border border-border space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                        Forensic Trauma Reconstruction
                      </span>
                      <h3 className="text-base font-bold text-ink">
                        {analysisResult.identifiedInjury}
                      </h3>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      analysisResult.urgencyLevel === 'CRITICAL_112'
                        ? 'bg-alert text-white shadow-xs'
                        : 'bg-amber-500/20 text-amber-800'
                    }`}>
                      {analysisResult.urgencyLevel === 'CRITICAL_112' ? '🚨 Immediate 112 Priority' : '⚠️ Moderate Attention'}
                    </span>
                  </div>

                  {/* Mechanism of Injury Pill */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-ink-muted">Mechanism:</span>
                    <span className="font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                      {analysisResult.mechanismOfInjury}
                    </span>
                  </div>

                  {/* Plain Language Summary */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                      What Happened Exactly:
                    </span>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                      {analysisResult.whatHappenedSummary}
                    </p>
                  </div>
                </div>

                {/* Pre-Hospital Data Blindness Answers Card */}
                <div className="p-4 rounded-2xl bg-surface border border-primary/30 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>Pre-Hospital Critical Answers (Extracted from Video)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-base border border-border">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block">Head Strike?</span>
                      <span className={`font-bold text-xs ${
                        analysisResult.preHospitalAnswers.headStrikeDetected === 'yes' ? 'text-alert' : 'text-ink'
                      }`}>
                        {analysisResult.preHospitalAnswers.headStrikeDetected.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-base border border-border">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block">Unresponsive?</span>
                      <span className="font-bold text-xs text-ink">
                        {analysisResult.preHospitalAnswers.unresponsiveObserved 
                          ? `YES (~${analysisResult.preHospitalAnswers.unresponsiveDurationSecs}s)` 
                          : 'NO'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-base border border-border">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block">Water Given?</span>
                      <span className={`font-bold text-xs ${
                        analysisResult.preHospitalAnswers.oralFluidsObserved === 'yes' ? 'text-alert' : 'text-success'
                      }`}>
                        {analysisResult.preHospitalAnswers.oralFluidsObserved === 'yes' ? 'YES (RISK)' : 'NO (SAFE)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-base border border-border">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block">Seizures?</span>
                      <span className="font-bold text-xs text-ink">
                        {analysisResult.preHospitalAnswers.seizuresObserved 
                          ? `YES (${analysisResult.preHospitalAnswers.seizureDurationSecs}s)` 
                          : 'NONE'}
                      </span>
                    </div>
                  </div>

                  {analysisResult.preHospitalAnswers.headStrikeDetails && (
                    <p className="text-[11px] text-ink-muted italic">
                      Head strike detail: {analysisResult.preHospitalAnswers.headStrikeDetails}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Second-by-Second Chronology Timeline */}
            <div className="p-5 rounded-2xl bg-base border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Second-by-Second Video Incident Chronology
                  </span>
                </div>
                <span className="text-[10px] text-ink-muted">Tap timestamp to jump</span>
              </div>

              <div className="space-y-2">
                {analysisResult.chronology.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border text-xs transition-all ${
                      item.severity === 'critical'
                        ? 'bg-alert/10 border-alert/30 text-ink'
                        : item.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-ink'
                        : 'bg-surface border-border text-ink'
                    }`}
                  >
                    <button
                      onClick={() => {
                        const [m, s] = item.timestamp.split(':').map(Number);
                        const sec = (m || 0) * 60 + (s || 0);
                        handleSeekToTimestamp(sec, idx);
                      }}
                      className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-primary text-white shrink-0 hover:bg-primary-dark"
                    >
                      {item.timestamp}
                    </button>
                    <span className="flex-1 leading-relaxed">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Action Plan */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                Immediate Action Steps To Take Now:
              </span>
              <div className="space-y-2">
                {analysisResult.immediateActions.map((step, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 text-xs font-medium text-ink bg-base p-2.5 rounded-xl border border-border/60">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paramedic SBAR Verbal Script */}
            <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wide">
                  Paramedic SBAR Verbal Handover Script
                </span>
                <button
                  onClick={handleCopySBAR}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed font-mono bg-surface p-3 rounded-xl border border-border/50">
                {analysisResult.paramedicSummary}
              </p>
            </div>

            {/* Action Bar (Launch Protocol / Export to Docket / Reset) */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {onLaunchProtocol && (
                <button
                  onClick={() => onLaunchProtocol(analysisResult.recommendedProtocolId)}
                  className="flex-1 flex items-center justify-center space-x-2 py-3.5 px-5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark btn-press"
                >
                  <Activity className="w-4 h-4" />
                  <span>
                    Launch Guided First-Aid ({analysisResult.recommendedProtocolId.toUpperCase()})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setVideoFile(null);
                  setVideoUrl(null);
                  setExtractedFrames([]);
                }}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl border border-border bg-surface text-xs font-semibold text-ink hover:bg-base btn-press"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Analyze Another Video</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
