// Audio synthesis and Web Speech API utilities for hands-free guidance & CPR pacing

class AudioEngine {
  private ctx: AudioContext | null = null;
  private metronomeInterval: number | null = null;
  private isMuted: boolean = false;
  private metronomeGainMultiplier: number = 1.0; // Ducks to 0.2 when TTS is speaking

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playClick(accent: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = accent ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(accent ? 880 : 540, this.ctx.currentTime);

      const baseGain = accent ? 0.35 : 0.25;
      const effectiveGain = baseGain * this.metronomeGainMultiplier;

      gain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);

      // Trigger haptic if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(accent ? [30, 20] : 20);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public startMetronome(bpm: number = 110, onTick?: (tickNumber: number) => void) {
    this.stopMetronome();
    this.initCtx();
    let tickCount = 0;
    const intervalMs = (60 / bpm) * 1000;

    // First tick immediately
    this.playClick(true);
    tickCount++;
    if (onTick) onTick(tickCount);

    this.metronomeInterval = window.setInterval(() => {
      tickCount++;
      const isAccent = tickCount % 4 === 1;
      this.playClick(isAccent);
      if (onTick) onTick(tickCount);
    }, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeInterval !== null) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Duck metronome clicks to 20% while voice is speaking
      this.metronomeGainMultiplier = 0.2;

      // Clean text of markdown asterisks for smoother TTS
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 0.95;
      
      const restoreAndFinish = () => {
        this.metronomeGainMultiplier = 1.0;
        if (onEnd) onEnd();
      };

      utterance.onend = restoreAndFinish;
      utterance.onerror = restoreAndFinish;

      window.speechSynthesis.speak(utterance);
    } catch {
      this.metronomeGainMultiplier = 1.0;
      if (onEnd) onEnd();
    }
  }

  public stopSpeech() {
    this.metronomeGainMultiplier = 1.0;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeech();
      this.stopMetronome();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const audioEngine = new AudioEngine();
