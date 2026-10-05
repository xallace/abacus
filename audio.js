/**
 * Web Audio API Procedural Synthesizer for Abacus Simulation
 * Zero external audio assets - 100% lightweight procedural sound
 * Simulates tactile acoustic wooden beads, clearing cascade, and chimes.
 */

class AbacusAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initOnFirstUserGesture();
  }

  initOnFirstUserGesture() {
    const unlock = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx && this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Realistic wooden bead impact sound (wood-on-wood click)
  playBeadClack(pitchModifier = 1.0, intensity = 1.0) {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const duration = 0.045;

    // 1. Resonant wooden body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    const baseFreq = 880 * pitchModifier;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);

    const vol = Math.min(1.0, Math.max(0.1, 0.22 * intensity));
    oscGain.gain.setValueAtTime(vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // 2. High-frequency click transient (noise burst)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.015);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 * pitchModifier, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Cascading wooden clatter when resetting/clearing the abacus
  playClearCascade(rods = 6) {
    if (!this.ensureContext()) return;
    const count = Math.min(rods, 10);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const pitch = 0.9 + Math.random() * 0.4;
        this.playBeadClack(pitch, 0.65);
      }, i * 22);
    }
  }

  // Pleasant harmonic major chord on puzzle success
  playSuccess() {
    if (!this.ensureContext()) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      }, idx * 70);
    });
  }

  // Gentle low thud for invalid input
  playError() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}
