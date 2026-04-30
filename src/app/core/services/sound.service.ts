import { Injectable } from '@angular/core';

export type SoundCue =
  | 'footstep' | 'wall-bump' | 'door' | 'chest' | 'trap'
  | 'encounter' | 'stairs-down' | 'stairs-up'
  | 'hit' | 'miss' | 'victory' | 'defeat' | 'flee';

// ─── Synthesis helpers ────────────────────────────────────────────────────────

function osc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  startOffset: number,
  duration: number,
  peakGain: number,
  freqEnd?: number
): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.type = type;
  const t0 = ctx.currentTime + startOffset;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    o.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
  }
  const attack = Math.min(0.01, duration * 0.1);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peakGain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  o.start(t0);
  o.stop(t0 + duration + 0.02);
}

function noise(
  ctx: AudioContext,
  startOffset: number,
  duration: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  filterQ: number,
  peakGain: number
): void {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const flt = ctx.createBiquadFilter();
  flt.type = filterType;
  flt.frequency.value = filterFreq;
  flt.Q.value = filterQ;
  const g = ctx.createGain();
  const t0 = ctx.currentTime + startOffset;
  g.gain.setValueAtTime(peakGain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(flt);
  flt.connect(g);
  g.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

// ─── Sound definitions ────────────────────────────────────────────────────────

const SOUNDS: Record<SoundCue, (ctx: AudioContext) => void> = {
  footstep(ctx) {
    noise(ctx, 0, 0.08, 'bandpass', 180, 1.5, 0.25);
    noise(ctx, 0, 0.08, 'lowpass', 100, 1.0, 0.15);
  },

  'wall-bump'(ctx) {
    osc(ctx, 'sine', 90, 0, 0.12, 0.3, 50);
    noise(ctx, 0, 0.1, 'lowpass', 200, 0.8, 0.2);
  },

  door(ctx) {
    // Slow creak: frequency-swept filtered noise
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.Q.value = 8;
    flt.frequency.setValueAtTime(300, ctx.currentTime);
    flt.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.25);
    flt.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    src.connect(flt);
    flt.connect(g);
    g.connect(ctx.destination);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + 0.55);
  },

  chest(ctx) {
    // Ascending sparkle: C5 E5 G5 C6
    [523, 659, 784, 1047].forEach((f, i) => osc(ctx, 'triangle', f, i * 0.07, 0.18, 0.22));
  },

  trap(ctx) {
    // Harsh alarm buzz
    osc(ctx, 'sawtooth', 220, 0,    0.12, 0.3);
    osc(ctx, 'sawtooth', 220, 0.15, 0.12, 0.3);
    osc(ctx, 'sawtooth', 220, 0.30, 0.12, 0.3);
    noise(ctx, 0, 0.42, 'highpass', 1200, 2, 0.12);
  },

  encounter(ctx) {
    // Dramatic minor sting: low bass + tritone hit
    osc(ctx, 'sawtooth', 110, 0,    0.35, 0.35, 80);
    osc(ctx, 'sawtooth', 155, 0,    0.35, 0.25, 140);
    osc(ctx, 'square',   220, 0.05, 0.3,  0.2);
    noise(ctx, 0, 0.2, 'highpass', 2000, 1, 0.15);
  },

  'stairs-down'(ctx) {
    [440, 370, 311, 262, 220].forEach((f, i) => osc(ctx, 'sine', f, i * 0.07, 0.15, 0.25));
  },

  'stairs-up'(ctx) {
    [220, 262, 311, 370, 440].forEach((f, i) => osc(ctx, 'sine', f, i * 0.07, 0.15, 0.25));
  },

  hit(ctx) {
    noise(ctx, 0, 0.06, 'bandpass', 800, 2, 0.5);
    osc(ctx, 'square', 180, 0, 0.1, 0.25, 80);
  },

  miss(ctx) {
    // Quick whoosh
    noise(ctx, 0, 0.15, 'bandpass', 1200, 3, 0.2);
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.15), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.Q.value = 4;
    flt.frequency.setValueAtTime(2000, ctx.currentTime);
    flt.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    src.connect(flt); flt.connect(g); g.connect(ctx.destination);
    src.start(ctx.currentTime); src.stop(ctx.currentTime + 0.18);
  },

  victory(ctx) {
    // Short major fanfare: C-E-G then C5
    [262, 330, 392].forEach((f, i) => osc(ctx, 'square', f, i * 0.06, 0.25, 0.2));
    osc(ctx, 'square', 523, 0.25, 0.45, 0.28);
    osc(ctx, 'square', 659, 0.35, 0.35, 0.2);
    osc(ctx, 'square', 784, 0.45, 0.45, 0.25);
  },

  defeat(ctx) {
    // Descending minor: A3 F3 D3 A2
    [220, 175, 147, 110].forEach((f, i) => osc(ctx, 'sine', f, i * 0.15, 0.3, 0.3));
    noise(ctx, 0, 0.7, 'lowpass', 300, 1, 0.08);
  },

  flee(ctx) {
    // Quick ascending scale
    [330, 392, 494, 587, 740].forEach((f, i) => osc(ctx, 'triangle', f, i * 0.05, 0.1, 0.2));
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  private _muted = false;

  get isMuted(): boolean { return this._muted; }

  toggleMute(): void { this._muted = !this._muted; }

  play(cue: SoundCue): void {
    if (this._muted) return;
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      SOUNDS[cue](this.ctx);
    } catch { /* silently ignore audio errors */ }
  }
}
