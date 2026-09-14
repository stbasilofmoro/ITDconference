import { createStore } from 'zustand';
import { frequency, musicStep } from './score';
import type { Cue } from './events';

export const AUDIO_KEY = 'itd.audio.v1';
export type Settings = { muted: boolean; music: number; effects: number };
export const DEFAULTS: Settings = { muted: false, music: 0.28, effects: 0.45 };
export function readSettings(storage: Pick<Storage, 'getItem'>): Settings {
  try { const s = JSON.parse(storage.getItem(AUDIO_KEY) ?? '{}'); return { muted: typeof s?.muted === 'boolean' ? s.muted : false, music: volume(s?.music, DEFAULTS.music), effects: volume(s?.effects, DEFAULTS.effects) }; } catch { return { ...DEFAULTS }; }
}
function volume(value: unknown, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback; }
export const audioStore = createStore<Settings & { status: 'ready' | 'running' | 'paused' | 'unavailable' }>(() => ({ ...DEFAULTS, status: 'ready' }));
type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[] };

/** One shared, gesture-unlocked graph. All music and effects are synthesized locally. */
class BoothAudio {
  private ctx: AudioContext | null = null;
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private voices = new Set<Voice>();
  private active = false;
  private ducked = false;
  private next = 0;
  private step = 0;
  private lastCue = new Map<Cue, number>();
  private recent: { cue: Cue; game: string }[] = [];
  private musicSteps = 0;
  private generation = 0;

  load() { try { audioStore.setState(readSettings(localStorage)); } catch { /* Private browsing may deny storage. */ } }
  configure(patch: Partial<Settings>) {
    const old = audioStore.getState();
    audioStore.setState({ muted: patch.muted ?? old.muted, music: volume(patch.music, old.music), effects: volume(patch.effects, old.effects) });
    const { muted, music, effects } = audioStore.getState();
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify({ muted, music, effects })); } catch { /* The controls still work for this session. */ }
    this.apply(); this.sync();
  }
  unlock() {
    if (!this.ctx) {
      const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) { audioStore.setState({ status: 'unavailable' }); return; }
      try {
        const ctx = this.ctx = new Constructor();
        this.music = ctx.createGain(); this.effects = ctx.createGain(); this.master = ctx.createGain(); this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 1024;
        const musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 1900;
        const effectsFilter = ctx.createBiquadFilter(); effectsFilter.type = 'lowpass'; effectsFilter.frequency.value = 3200;
        const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -12; compressor.knee.value = 18; compressor.ratio.value = 6; compressor.attack.value = 0.01; compressor.release.value = 0.2;
        this.music.connect(musicFilter).connect(this.master); this.effects.connect(effectsFilter).connect(this.master); this.master.connect(compressor).connect(this.analyser).connect(ctx.destination);
        this.master.gain.value = 0;
        this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0); let seed = 71;
        for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 0xFFFFFFFF * 2 - 1; }
        ctx.onstatechange = () => {
          audioStore.setState({ status: ctx.state === 'running' ? 'running' : 'paused' });
          if (ctx.state !== 'running') { this.stopVoices(); this.next = ctx.currentTime + 0.06; }
        };
      } catch { this.dispose(); audioStore.setState({ status: 'unavailable' }); return; }
    }
    // resume() is invoked inside the pointer/key event, including after Safari interruption.
    const settings = audioStore.getState();
    if (!settings.muted && this.active && (settings.music > 0 || settings.effects > 0)) void this.ctx.resume().then(() => this.sync()).catch(() => audioStore.setState({ status: 'ready' }));
    this.apply(); this.sync();
  }
  setActive(value: boolean) { if (value === this.active) return; this.active = value; this.sync(); }
  duck(value: boolean) { if (value === this.ducked) return; this.ducked = value; this.apply(); }
  private apply() {
    if (!this.ctx || !this.master || !this.music || !this.effects) return;
    const s = audioStore.getState(), t = this.ctx.currentTime;
    for (const [param, value] of [[this.master.gain, s.muted || !this.active ? 0 : 0.65], [this.music.gain, s.music * (this.ducked ? 0.35 : 1)], [this.effects.gain, s.effects]] as const) { param.cancelScheduledValues(t); param.setTargetAtTime(value, t, 0.035); }
  }
  private sync() {
    const ctx = this.ctx; if (!ctx) return;
    this.apply();
    const s = audioStore.getState(), shouldRun = this.active && !s.muted && (s.music > 0 || s.effects > 0);
    const generation = ++this.generation;
    if (!shouldRun) {
      if (this.timer) clearInterval(this.timer); this.timer = null;
      // The master fades before suspending, preventing a click and stale sounds on return.
      setTimeout(() => { if (generation === this.generation) { this.stopVoices(); if (ctx.state === 'running') void ctx.suspend().catch(() => {}); } }, 140);
      return;
    }
    if (ctx.state !== 'running') void ctx.resume().catch(() => {});
    if (!this.timer) { this.next = ctx.currentTime + 0.06; this.timer = setInterval(() => this.schedule(), 80); this.schedule(); }
  }
  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    const voice = { source, nodes }; this.voices.add(voice);
    source.onended = () => { source.disconnect(); nodes.forEach((node) => node.disconnect()); this.voices.delete(voice); };
  }
  private tone(hz: number, time: number, duration: number, gain: number, bus: GainNode, wave: OscillatorType = 'sine', endHz = hz) {
    const ctx = this.ctx!; if (this.voices.size >= 56) return;
    const oscillator = ctx.createOscillator(), envelope = ctx.createGain(); oscillator.type = wave; oscillator.frequency.setValueAtTime(hz, time); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), time + duration);
    envelope.gain.setValueAtTime(0, time); envelope.gain.linearRampToValueAtTime(gain, time + 0.012); envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope).connect(bus); this.track(oscillator, [envelope]); oscillator.start(time); oscillator.stop(time + duration + 0.025);
  }
  private brush(time: number, gain: number, duration: number, high = false) {
    const ctx = this.ctx!; if (this.voices.size >= 56) return;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain(); source.buffer = this.noiseBuffer;
    filter.type = high ? 'highpass' : 'bandpass'; filter.frequency.value = high ? 2400 : 1200; filter.Q.value = 0.5;
    envelope.gain.setValueAtTime(0, time); envelope.gain.linearRampToValueAtTime(gain, time + 0.008); envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(envelope).connect(this.music!); this.track(source, [filter, envelope]); source.start(time); source.stop(time + duration + 0.02);
  }
  private schedule() {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running' || !this.active || audioStore.getState().muted) return;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.03; // Never replay a backlog after a stalled tab.
    while (this.next < ctx.currentTime + 0.2) {
      const part = musicStep(this.step++), t = this.next;
      if (audioStore.getState().music > 0) {
        part.chord.forEach((note, i) => this.tone(frequency(note), t + i * 0.018, 2.7, 0.055, this.music!, 'triangle'));
        if (part.bass !== null) this.tone(frequency(part.bass), t, 0.9, 0.15, this.music!);
        if (part.melody !== null) this.tone(frequency(part.melody), t + 0.018, 0.75, 0.045, this.music!, 'triangle');
        if (part.kick) this.tone(85, t, 0.16, 0.13, this.music!, 'sine', 42);
        if (part.brush) this.brush(t, 0.055, 0.13);
        if (part.hat) this.brush(t, 0.025, 0.06, true);
        this.musicSteps++;
      }
      this.next += part.duration;
    }
  }
  play(cue: Cue, game = 'launchboard') {
    const ctx = this.ctx, s = audioStore.getState();
    if (!ctx || ctx.state !== 'running' || !this.active || s.muted || s.effects === 0 || document.hidden) return;
    const t = ctx.currentTime;
    if (t - (this.lastCue.get(cue) ?? -10) < (cue === 'warning' ? 3 : cue === 'feed' ? 0.2 : 0.09)) return;
    this.lastCue.set(cue, t); this.recent.push({ cue, game }); if (this.recent.length > 24) this.recent.shift();
    const note = (hz: number, end = hz, duration = 0.16, delay = 0, gain = 0.1) => this.tone(hz, t + delay, duration, gain, this.effects!, 'sine', end);
    if (cue === 'win' || cue === 'start' || cue === 'power' || cue === 'contact') { (cue === 'win' ? [60, 64, 67, 72] : cue === 'power' ? [67, 71, 76] : [60, 64, 67]).forEach((n, i) => note(frequency(n), frequency(n), 0.42, i * 0.085, 0.075)); }
    else if (cue === 'hit') { note(220, 130, 0.35, 0, 0.085); note(165, 110, 0.32, 0.08, 0.055); }
    else if (cue === 'warning') { note(330, 330, 0.2, 0, 0.055); note(294, 294, 0.22, 0.28, 0.055); }
    else if (cue === 'hop' || cue === 'jump') note(210, 420, 0.18, 0, 0.08);
    else if (cue === 'scan') { note(520, 780, 0.13, 0, 0.06); note(1040, 780, 0.12, 0.08, 0.035); }
    else if (cue === 'spark') note(560, 260, 0.11, 0, 0.055);
    else if (cue === 'recycle' || cue === 'route') { note(523, 523, 0.24, 0, 0.075); note(659, 659, 0.28, 0.08, 0.055); }
    else if (cue === 'land' || cue === 'drop' || cue === 'stomp') note(140, 80, 0.12, 0, 0.08);
    else if (cue === 'rotate') note(390, 520, 0.12, 0, 0.065);
    else if (cue === 'card') note(440, 330, 0.09, 0, 0.055);
    else note(280, 240, 0.08, 0, 0.055);
  }
  private stopVoices() { for (const voice of this.voices) { try { voice.source.stop(); } catch { /* Already ended. */ } voice.source.disconnect(); voice.nodes.forEach((node) => node.disconnect()); } this.voices.clear(); }
  inspect() {
    let peak = 0; if (this.analyser) { const samples = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(samples); for (const sample of samples) peak = Math.max(peak, Math.abs(sample)); }
    return { context: this.ctx?.state ?? 'locked', active: this.active, ducked: this.ducked, voices: this.voices.size, musicSteps: this.musicSteps, recent: [...this.recent], peak, ...audioStore.getState() };
  }
  dispose() { this.generation++; if (this.timer) clearInterval(this.timer); this.timer = null; this.stopVoices(); if (this.ctx) { this.ctx.onstatechange = null; void this.ctx.close().catch(() => {}); } this.ctx = null; this.music = this.effects = this.master = null; this.analyser = null; this.noiseBuffer = null; this.active = false; this.ducked = false; this.step = this.musicSteps = 0; this.lastCue.clear(); this.recent = []; }
}
export const boothAudio = new BoothAudio();
