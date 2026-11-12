import React, { useState, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Video as VideoIcon,
  ShieldCheck,
  Maximize2,
  List,
  RotateCcw,
  HeartPulse
} from 'lucide-react';
import { EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';
import { VideoIncidentAnalysis } from '../../services/videoAnalysisService';
import { ParamedicHandoutData } from '../../utils/handoutHelper';
import { BystanderSquadSession } from '../../services/bystanderSquadEngine';
import { FormattedAIMessage, parseMedicalResponse } from '../common/FormattedAIMessage';
import {
  EmergencyRouteMap,
  EmergencyRouteCardSkeleton
} from '../common/EmergencyRouteMap';
import { useAppLanguage, UI_TRANSLATIONS } from '../../utils/languageStore';

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  imagePreview?: string;
  videoPreview?: string;
  videoName?: string;
  modelUsed?: string;
  modelDisplayName?: string;
  tierUsed?: number;
  latencyMs?: number;
  failSafeTriggered?: boolean;
  facility?: EmergencyFacility;
  route?: RouteComputationResult;
  isHospitalLoading?: boolean;
  forensicReport?: VideoIncidentAnalysis;
  handout?: ParamedicHandoutData;
  squadSession?: BystanderSquadSession;
  // Revision 4 streaming & instant offline protocol fields
  offlineProtocolTitle?: string;
  offlineProtocolText?: string;
  isStreaming?: boolean;
  streamingElapsedSeconds?: number;
  aiSlowNotice?: boolean;
  userQueryForRetry?: string;
}

export interface ChatMessageProps {
  message: ChatMessageData;
  isLatestBotMsg: boolean;
  isCompleted: boolean;
  onMarkCompleted: (id: string) => void;
  isSpeaking: boolean;
  onSpeak: (text: string, id: string) => void;
  onTriggerEscalation: (reason?: string) => void;
  onLaunchProtocol?: (protocolId: string) => void;
  onOpenToolkit?: () => void;
  onRetryQuery?: (query: string, msgId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message: msg,
  isCompleted,
  onMarkCompleted,
  isSpeaking,
  onSpeak,
  onTriggerEscalation,
  onLaunchProtocol,
  onRetryQuery
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isUser = msg.sender === 'user';

  const primaryTextToParse = msg.offlineProtocolText || msg.text;
  const parsedBlocks = useMemo(
    () => (isUser ? [] : parseMedicalResponse(primaryTextToParse)),
    [isUser, primaryTextToParse]
  );
  const hasSteps = useMemo(
    () =>
      parsedBlocks.some(
        (b) => b.type === 'steps_group' && (b.steps?.length || 0) > 1
      ),
    [parsedBlocks]
  );

  const fullSpeechText = useMemo(() => {
    if (msg.offlineProtocolText && msg.text) {
      return `${msg.offlineProtocolText}\n\n${msg.text}`;
    }
    return msg.offlineProtocolText || msg.text;
  }, [msg.offlineProtocolText, msg.text]);

  /* ==========================================================================
   * USER MESSAGE: Right-aligned, max 80% width, primary background (Section C)
   * ========================================================================== */
  if (isUser) {
    return (
      <div
        data-message-id={msg.id}
        className="flex flex-col items-end w-full scroll-mt-3"
      >
        <div className="max-w-[80%] rounded-2xl bg-primary text-white px-4 py-2.5 space-y-2.5">
          {msg.imagePreview && (
            <div className="overflow-hidden rounded-xl border border-white/20">
              <img
                src={msg.imagePreview}
                alt="Uploaded injury visual"
                className="w-full h-auto max-h-60 object-cover"
              />
            </div>
          )}

          {msg.videoPreview && (
            <div className="overflow-hidden rounded-xl bg-navy border border-white/20">
              <video
                src={msg.videoPreview}
                controls
                className="w-full h-auto max-h-56"
              />
              {msg.videoName && (
                <div className="px-3 py-1.5 bg-navy text-[14px] text-white/90 flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{msg.videoName}</span>
                </div>
              )}
            </div>
          )}

          <p className="whitespace-pre-wrap text-[17px] leading-[1.6] font-normal text-white">
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================================
   * ASSISTANT MESSAGE (Section C):
   * - Full column width, NO bubble border or shadow
   * - 28px avatar, name/time as 14px caption
   * - Instant offline protocol (<100ms) with "Offline protocol · verified" badge
   * - Streamed additive AI answer below as "Details for your situation"
   * - Never nests more than one container level inside a message
   * ========================================================================== */
  const showSkeletonPlaceholder =
    msg.isStreaming && !msg.text && !msg.offlineProtocolText;
  const showAdditiveSkeleton =
    msg.isStreaming && Boolean(msg.offlineProtocolText) && !msg.text;

  return (
    <article
      data-message-id={msg.id}
      aria-label="Sanjeevani AI response"
      className="w-full space-y-4 scroll-mt-3 py-1"
    >
      {/* Header Row: 28px Avatar + 14px Name/Time Caption + Compact Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0"
          >
            <HeartPulse className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5 text-[14px] text-ink-muted flex-wrap">
            <span className="font-semibold text-ink">Sanjeevani AI</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{msg.timestamp}</span>

            {msg.offlineProtocolText && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{copy.offlineVerifiedBadge}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls (Read Aloud & Focus Mode) */}
        {(msg.offlineProtocolText || msg.text) && (
          <div className="flex items-center gap-1.5">
            {hasSteps && (
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                aria-pressed={isFocusMode}
                className={`h-10 min-h-[40px] px-3 rounded-lg border text-[14px] font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isFocusMode
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface hover:bg-primary-soft text-ink hover:text-primary border-border'
                }`}
                title={
                  isFocusMode
                    ? copy.allSteps
                    : copy.focusMode
                }
              >
                {isFocusMode ? (
                  <>
                    <List className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{copy.allSteps}</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{copy.focusMode}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onSpeak(fullSpeechText, msg.id)}
              aria-pressed={isSpeaking}
              aria-label={isSpeaking ? copy.stopReading : copy.readAloud}
              title={isSpeaking ? copy.stopReading : copy.readAloud}
              className="h-10 min-h-[40px] px-3 rounded-lg bg-surface hover:bg-primary-soft border border-border text-[14px] font-semibold text-ink hover:text-primary inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-alert shrink-0" aria-hidden="true" />
                  <span>{copy.stopReading}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>{copy.readAloud}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 1. 8s Slow / Offline Fallback Notice with Retry Button (G.5) */}
      {msg.aiSlowNotice && (
        <div
          role="status"
          data-testid="ai-slow-notice"
          className="max-w-[68ch] rounded-xl bg-base border border-border px-3.5 py-2 flex items-center justify-between gap-3 flex-wrap text-[15px] text-slate-800"
        >
          <span className="font-medium text-slate-800">
            AI is slow, showing offline protocol
          </span>
          {onRetryQuery && msg.userQueryForRetry && (
            <button
              type="button"
              onClick={() => onRetryQuery(msg.userQueryForRetry!, msg.id)}
              className="h-10 min-h-[40px] px-3.5 rounded-lg bg-surface hover:bg-primary-soft border border-border text-[14px] font-semibold text-primary inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Instant Feedback Skeleton (<= 100ms, G.2) when no offline protocol matched */}
      {showSkeletonPlaceholder && (
        <div
          role="status"
          aria-live="polite"
          data-testid="assistant-skeleton"
          className="max-w-[68ch] space-y-2.5 py-1"
        >
          <div className="flex items-center gap-2 text-[15px] font-medium text-ink-muted">
            <span>Getting guidance…</span>
            {(msg.streamingElapsedSeconds || 0) >= 3 && (
              <span className="font-mono font-semibold text-ink tabular-nums">
                {msg.streamingElapsedSeconds}s
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-11/12 rounded bg-border/70" />
            <div className="h-4 w-4/5 rounded bg-border/60" />
            <div className="h-4 w-2/3 rounded bg-border/50" />
          </div>
        </div>
      )}

      {/* 3. Instant Verified Offline Protocol (< 100ms, G.3) */}
      {msg.offlineProtocolText && (
        <div data-testid="offline-protocol-block" className="space-y-4">
          <FormattedAIMessage
            text={msg.offlineProtocolText}
            onTriggerEscalation={onTriggerEscalation}
            animate={false}
            onComplete={() => {
              if (!msg.isStreaming && !isCompleted) {
                onMarkCompleted(msg.id);
              }
            }}
            focusMode={isFocusMode}
            showDeepDiveDoc={true}
          />
        </div>
      )}

      {/* 4. Streamed AI Answer: Additive "Details for your situation" (when offline protocol is present) or Primary Answer */}
      {msg.offlineProtocolText ? (
        <>
          {showAdditiveSkeleton && (
            <div
              role="status"
              aria-live="polite"
              data-testid="assistant-skeleton"
              className="max-w-[68ch] pt-2 border-t border-border/70 space-y-2"
            >
              <div className="flex items-center gap-2 text-[15px] font-medium text-ink-muted">
                <span>Getting guidance…</span>
                {(msg.streamingElapsedSeconds || 0) >= 3 && (
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {msg.streamingElapsedSeconds}s
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-10/12 rounded bg-border/60" />
                <div className="h-3.5 w-3/4 rounded bg-border/50" />
                <div className="h-3.5 w-1/2 rounded bg-border/40" />
              </div>
            </div>
          )}

          {msg.text && !msg.aiSlowNotice && (
            <div
              data-testid="streamed-details-block"
              className="pt-3 border-t border-border/80 space-y-3"
            >
              <h4 className="text-[18px] font-semibold text-ink">
                Details for your situation
              </h4>
              <FormattedAIMessage
                text={msg.text}
                onTriggerEscalation={onTriggerEscalation}
                animate={false}
                onComplete={() => {
                  if (!msg.isStreaming && !isCompleted) {
                    onMarkCompleted(msg.id);
                  }
                }}
                focusMode={false}
                showDeepDiveDoc={false}
              />
            </div>
          )}
        </>
      ) : (
        msg.text && (
          <FormattedAIMessage
            text={msg.text}
            onTriggerEscalation={onTriggerEscalation}
            animate={false}
            onComplete={() => {
              if (!msg.isStreaming && !isCompleted) {
                onMarkCompleted(msg.id);
              }
            }}
            focusMode={isFocusMode}
          />
        )
      )}

      {/* 5. Recommended Protocol Action (if video forensic report present) */}
      {msg.forensicReport && onLaunchProtocol && (
        <div className="max-w-[68ch] p-3.5 rounded-xl bg-primary-soft/60 border border-primary/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[16px] font-semibold text-ink capitalize">
            {msg.forensicReport.recommendedProtocolId} emergency protocol
          </span>
          <button
            type="button"
            onClick={() => onLaunchProtocol(msg.forensicReport!.recommendedProtocolId)}
            className="h-10 min-h-[40px] px-3.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[14px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-150"
          >
            <span>Start protocol</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 6. Parallel Hospital / Route Card or Reserved Height Skeleton (D.3 & G.7) */}
      {msg.facility && msg.route ? (
        <EmergencyRouteMap facility={msg.facility} route={msg.route} />
      ) : msg.isHospitalLoading ? (
        <EmergencyRouteCardSkeleton />
      ) : null}
    </article>
  );
};
