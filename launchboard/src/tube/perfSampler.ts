/**
 * Pure frame-sampling logic for PerfAutoSelect, split out of the component so it's testable
 * without a @react-three/fiber render tree — see tests/perfSampler.test.ts.
 */

/** How much *kept* frame time to accumulate before deciding (see samplerDone). */
export const SAMPLE_SECONDS = 3;

/** How many *kept* frame samples to require before deciding (see samplerDone). Guards
 * against a handful of long-but-not-quite-stalled frames satisfying SAMPLE_SECONDS on their
 * own without ever building a distribution worth taking a median of. */
export const MIN_KEPT_SAMPLES = 60;

/**
 * Frames slower than this (seconds) are treated as stalls — a GC pause, the tab being
 * backgrounded, a one-off dropped frame — not real rendering performance, and are ignored
 * entirely: they count toward neither kept time nor the kept-sample count, and never enter
 * the frame-time distribution `pickPreset` judges. Without this, a single such frame could
 * both end sampling early (by itself clearing SAMPLE_SECONDS) and skew the median it's judged
 * against.
 */
export const MAX_DT_S = 0.25;

export type PerfSamplerState = { samples: number[]; elapsed: number };

export function initPerfSampler(): PerfSamplerState {
  return { samples: [], elapsed: 0 };
}

/** Feed one frame's delta (seconds) into the sampler. */
export function recordFrame(state: PerfSamplerState, dt: number): void {
  if (dt > MAX_DT_S) return;
  state.samples.push(dt * 1000);
  state.elapsed += dt;
}

/** True once both the kept-time and kept-sample floors have been cleared. */
export function samplerDone(state: PerfSamplerState): boolean {
  return state.elapsed >= SAMPLE_SECONDS && state.samples.length >= MIN_KEPT_SAMPLES;
}
