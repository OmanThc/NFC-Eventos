/**
 * Web Audio API synthesizer for realistic POS terminal acoustic feedback.
 * Works completely in-browser without requiring external audio assets.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Success Chime: Upbeat, crystal-clear 2-tone chime (D5 -> A5)
   */
  playSuccess(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);

      this.triggerHaptic([30, 40, 60]);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Error / Insufficient Balance Tone: Two low-pitched sawtooth buzzes (180Hz -> 130Hz)
   */
  playError(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);

      this.triggerHaptic([100, 50, 100]);
    } catch {
      // Audio fallback
    }
  }

  /**
   * POS Keypad tap click (subtle high-speed blip)
   */
  playClick(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.start(now);
      osc.stop(now + 0.04);

      this.triggerHaptic(15);
    } catch {
      // Audio fallback
    }
  }

  /**
   * NFC scanning beep (RFID radio ping tone)
   */
  playNfcPing(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);

      this.triggerHaptic(40);
    } catch {
      // Audio fallback
    }
  }

  private triggerHaptic(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptic unsupported
      }
    }
  }
}

export const soundSynth = new SoundSynthesizer();
