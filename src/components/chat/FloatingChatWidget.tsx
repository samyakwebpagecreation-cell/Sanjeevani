import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { askFirstAidAssistant } from '../../services/aiService';
import { FormattedAIMessage } from '../common/FormattedAIMessage';
import { getAutomaticEscalationDispatch, EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';
import { EmergencyRouteMap } from '../common/EmergencyRouteMap';

interface FloatingMessage {
  sender: 'user' | 'model';
  text: string;
  facility?: EmergencyFacility;
  route?: RouteComputationResult;
}

interface FloatingChatWidgetProps {
  onOpenFullChat: () => void;
  onTriggerEscalation: (reason?: string) => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onOpenFullChat,
  onTriggerEscalation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      sender: 'model',
      text: 'Hello! I am Sanjeevani AI Guardian. What first-aid question do you have right now?'
    }
  ]);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSpeak = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryOverride?: string) => {
    const q = (queryOverride || input).trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.sender, text: m.text }));
      const res = await askFirstAidAssistant(q, history);

      const isHospitalOrRouteQuery = /hospital|route|directions|trauma|emergency room|doctor|clinic|er|navigate|maps|where to go|ambulance|reach/i.test(q);

      let facilityData: EmergencyFacility | undefined = undefined;
      let routeData: RouteComputationResult | undefined = undefined;

      if (res.isEmergency || isHospitalOrRouteQuery) {
        try {
          const dispatch = await getAutomaticEscalationDispatch();
          facilityData = dispatch.nearestHospital;
          routeData = dispatch.route;
        } catch (dispatchErr) {
          console.warn('Dispatch failed in floating chat:', dispatchErr);
        }
      }

      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'model', 
          text: res.text,
          facility: facilityData,
          route: routeData
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'model', 
          text: 'Emergency tip: If bleeding, apply direct firm pressure. If unconscious, call 112 immediately.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div data-html2canvas-ignore="true" className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-8 z-30 flex items-center screenshot-ignore">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="btn-fluid btn-fluid-accent elevation-3 h-11 w-11 sm:h-auto sm:w-auto sm:pl-4 sm:pr-5 sm:py-3 rounded-full text-ink text-xs font-extrabold shadow-xl hover:scale-105 flex items-center justify-center sm:space-x-2.5"
            title="Ask Sanjeevani AI Guardian"
            aria-label="Open AI Guardian Chat"
          >
            <div className="relative">
              <Bot className="h-5 w-5 text-ink" strokeWidth={2.2} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <span className="hidden sm:inline">AI Guardian</span>
          </button>
        )}
      </div>

      {/* Floating Drawer / Popup Window */}
      {isOpen && (
        <div data-html2canvas-ignore="true" className="glass-panel elevation-4 fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] h-[520px] rounded-[32px] border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 screenshot-ignore">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-surface/80 via-surface/80 to-accent/20 border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-2xl bg-accent/25 flex items-center justify-center text-ink shadow-2xs">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink">AI First-Aid Guardian</h3>
                <span className="text-[10px] text-ink-muted">Gemma 4 31B</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullChat();
                }}
                className="btn-fluid p-2 rounded-full text-ink-muted hover:text-ink hover:bg-base"
                title="Expand to Fullscreen Chat"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="btn-fluid p-2 rounded-full text-ink-muted hover:text-ink hover:bg-base"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      isUser
                        ? 'bg-[#0E5A50] text-white rounded-tr-xs shadow-sm'
                        : 'bg-surface border border-border text-ink rounded-tl-xs shadow-xs'
                    }`}
                    style={isUser ? { backgroundColor: '#0E5A50', color: '#FFFFFF' } : undefined}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-line font-medium text-white" style={{ color: '#FFFFFF' }}>{m.text}</div>
                    ) : (
                      <>
                        <FormattedAIMessage
                          text={m.text}
                          onTriggerEscalation={onTriggerEscalation}
                        />

                        {/* Interactive Emergency Driving Route & Map Card */}
                        {m.facility && m.route && (
                          <div className="mt-2.5">
                            <EmergencyRouteMap
                              facility={m.facility}
                              route={m.route}
                              compact
                            />
                          </div>
                        )}
                      </>
                    )}
                    {!isUser && (
                      <div className="mt-2 pt-1 border-t border-border/50 flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => handleSpeak(m.text, idx)}
                          className="flex items-center space-x-1 text-primary hover:underline"
                        >
                          {speakingIdx === idx ? (
                            <>
                              <VolumeX className="w-3 h-3 text-alert" />
                              <span className="text-alert">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <span className="text-ink-muted">Gemma 4</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-ink-muted p-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                <span>Gemma 4 is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chip row */}
          <div className="px-3.5 py-2 border-t border-border/60 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
            {['Nearest Hospital Route', 'Stop Bleeding', 'Burn Care', 'CPR Steps', 'Choking'].map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                className="btn-fluid px-2.5 py-1 rounded-full bg-base/80 border border-border/80 text-ink-muted hover:text-ink whitespace-nowrap shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-border/60 bg-surface/90 backdrop-blur-md flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a quick first-aid question..."
              style={{ color: 'var(--app-ink)' }}
              className="flex-1 bg-base/80 border border-border/80 rounded-full px-4 py-2.5 text-xs text-ink text-[#12211D] dark:text-white placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="btn-fluid btn-fluid-primary h-9 w-9 p-0 flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
