// Procedural Web Audio SFX + Berimbau/Atabaque beat pulse (M2 preview; full Bateria in M3).
import type { MatchState, SimEvent } from '../sim/state';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastBeat = -1;

  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
  }
  isMuted(): boolean {
    return this.muted;
  }

  private playTone(freqStart: number, freqEnd: number, dur: number, type: OscillatorType, gainVal: number): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private playNoise(dur: number, hpFreq: number, gainVal: number): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = hpFreq;
    filter.Q.value = 1.4;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  syncBeat(state: MatchState): void {
    if (state.beatPhase === 0 && this.lastBeat !== state.barBeat) {
      this.lastBeat = state.barBeat;
      if (state.roundPhase !== 'FIGHT') return;

      if (state.toque === 'angola') {
        // Meditative deep Gunga Angola pattern: low open Dong (0), pandeiro rest (1), warm Ding (2), muted Tch (3)
        if (state.barBeat === 0) {
          this.playTone(124, 114, 0.3, 'triangle', 0.16);
          this.playTone(86, 48, 0.22, 'sine', 0.18);
        } else if (state.barBeat === 1) {
          this.playNoise(0.055, 2100, 0.035);
        } else if (state.barBeat === 2) {
          this.playTone(152, 145, 0.24, 'triangle', 0.12);
          this.playNoise(0.06, 2300, 0.05);
        } else {
          this.playNoise(0.05, 2900, 0.045);
        }
        return;
      }

      if (state.toque === 'iuna') {
        // High-tempo celebratory Iúna pattern: crisp Dong (0), double accent Ding (1), soaring Ding (2), double Tch-tch (3)
        if (state.barBeat === 0) {
          this.playTone(164, 152, 0.19, 'triangle', 0.15);
          this.playTone(124, 66, 0.13, 'sine', 0.15);
        } else if (state.barBeat === 1) {
          this.playTone(188, 182, 0.13, 'triangle', 0.09);
          this.playNoise(0.04, 3400, 0.06);
        } else if (state.barBeat === 2) {
          this.playTone(204, 194, 0.17, 'triangle', 0.13);
          this.playTone(620, 610, 0.08, 'sine', 0.05);
          this.playNoise(0.05, 3100, 0.065);
        } else {
          this.playNoise(0.04, 3800, 0.055);
          this.playTone(460, 440, 0.05, 'triangle', 0.045);
        }
        return;
      }

      // São Bento Grande (default): Dong (0), Tch (1), Ding (2), Tch (3)
      if (state.barBeat === 0) {
        this.playTone(148, 138, 0.22, 'triangle', 0.14); // open dong
        this.playTone(110, 58, 0.14, 'sine', 0.16);      // atabaque bass
      } else if (state.barBeat === 2) {
        this.playTone(175, 168, 0.18, 'triangle', 0.11); // dobrão ding
        this.playNoise(0.06, 2600, 0.06);                // caxixi
      } else {
        this.playNoise(0.045, 3400, 0.045);              // caxixi / palmas
      }
    }
  }

  handleEvents(events: SimEvent[]): void {
    for (const ev of events) {
      switch (ev.type) {
        case 'HIT':
          this.playTone(170, 52, 0.14, 'sawtooth', 0.22);
          this.playNoise(0.09, 1200, 0.18);
          break;
        case 'COUNTER':
          this.playTone(260, 65, 0.18, 'sawtooth', 0.26);
          this.playTone(520, 440, 0.16, 'triangle', 0.16);
          this.playNoise(0.12, 1600, 0.22);
          break;
        case 'BLOCK':
          this.playTone(110, 65, 0.09, 'square', 0.12);
          this.playNoise(0.05, 800, 0.1);
          break;
        case 'BEAT_BONUS':
          this.playTone(587, 880, 0.16, 'sine', 0.14); // agogô chime
          break;
        case 'HARMONY': {
          // Ascending Agogô harmonic + soft Roda palmas handclap celebrating near-miss synchrony
          const stepIdx = Math.min(ev.value ?? 1, 8);
          const baseFreq = 523.25 * Math.pow(1.06, stepIdx);
          this.playTone(baseFreq, baseFreq * 1.25, 0.16, 'triangle', 0.13);
          this.playNoise(0.055, 2900, 0.08);
          break;
        }
        case 'GRAZE':
          this.playNoise(0.04, 750, 0.05);
          break;
        case 'KO':
          this.playTone(140, 42, 0.55, 'sawtooth', 0.3);
          this.playNoise(0.35, 900, 0.25);
          break;
      }
    }
  }
}
