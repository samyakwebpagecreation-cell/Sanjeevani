import React, { useState, useEffect, useRef } from 'react';
import { Mic, HeartPulse, QrCode } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { CountdownRing } from '../common/CountdownRing';

export const Timeline: React.FC = () => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      time: '00:00',
      phase: 'Recognition',
      title: 'Voice, Text or Optical Triage',
      desc: 'Triage airway patency, bleeding, and consciousness in under 2 seconds hands-free.',
      icon: <Mic className="w-5 h-5 text-primary" aria-hidden="true" />,
      active: true
    },
    {
      time: '00:30',
      phase: 'Mobilization',
      title: 'Guided CPR & Crowd Tasks',
      desc: 'Locked chest compression audio cadence while onlookers scan Crowd QR to fetch AEDs.',
      icon: <HeartPulse className="w-5 h-5 text-primary" aria-hidden="true" />,
      active: false
    },
    {
      time: '04:30',
      phase: 'Handover',
      title: '0.5s Paramedic SBAR Docket',
      desc: 'Ambulance crew scans complete offline vitals telemetry instantly without confusion.',
      icon: <QrCode className="w-5 h-5 text-primary" aria-hidden="true" />,
      active: false
    }
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop Horizontal Track + Animated Progress Fill Line */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute top-10 left-[16%] right-[16%] h-1 rounded-full bg-border overflow-hidden"
      >
        <div
          className={`h-full bg-primary transition-all duration-1000 ease-out ${
            inView ? 'w-full' : 'w-0'
          }`}
        />
      </div>

      {/* Mobile Vertical Track + Animated Progress Fill Line */}
      <div
        aria-hidden="true"
        className="md:hidden absolute left-10 top-10 bottom-10 w-1 rounded-full bg-border overflow-hidden"
      >
        <div
          className={`w-full bg-primary transition-all duration-1000 ease-out ${
            inView ? 'h-full' : 'h-0'
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {steps.map((step, i) => (
          <div
            key={step.time}
            className="relative flex md:flex-col items-start md:items-center gap-5"
          >
            {/* Node with Circular Countdown Ring Echo & Active Pulse */}
            <div className="relative flex items-center justify-center bg-surface rounded-full p-1 shadow-xs shrink-0">
              {step.active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-primary/50 animate-metronome-ring"
                />
              )}
              <CountdownRing size="sm" label={step.time} />
            </div>

            {/* Step Content Card */}
            <Card className="p-6 flex-1 w-full md:text-center space-y-3 border-2 border-border hover:border-primary/40 transition-colors">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary-soft text-primary text-sm font-bold">
                {step.icon}
                <span>
                  Step 0{i + 1} · {step.phase}
                </span>
              </div>
              <h3 className="text-xl font-bold text-ink">{step.title}</h3>
              <p className="text-base text-ink-muted font-normal leading-relaxed">
                {step.desc}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
