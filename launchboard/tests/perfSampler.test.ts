import { describe, it, expect } from 'vitest';
import { initPerfSampler, recordFrame, samplerDone, MIN_KEPT_SAMPLES, MAX_DT_S, SAMPLE_SECONDS } from '../src/tube/perfSampler';

describe('perfSampler', () => {
  it('is not done before either the kept-time or kept-sample floor is reached', () => {
    const s = initPerfSampler();
    for (let i = 0; i < 10; i++) recordFrame(s, 1 / 60);
    expect(samplerDone(s)).toBe(false);
  });

  it('is done once it has both >= SAMPLE_SECONDS of kept time and >= MIN_KEPT_SAMPLES kept samples', () => {
    const s = initPerfSampler();
    // Slightly over the exact per-frame boundary so float summation error can't leave this
    // just short of SAMPLE_SECONDS.
    const dt = (SAMPLE_SECONDS / MIN_KEPT_SAMPLES) * 1.01;
    for (let i = 0; i < MIN_KEPT_SAMPLES; i++) recordFrame(s, dt);
    expect(samplerDone(s)).toBe(true);
  });

  it('ignores a stalled frame (dt over MAX_DT_S) entirely — no sample, no elapsed time', () => {
    const s = initPerfSampler();
    recordFrame(s, MAX_DT_S + 0.01);
    expect(s.samples).toHaveLength(0);
    expect(s.elapsed).toBe(0);
  });

  it('one long stall does not end sampling early (the original bug)', () => {
    const s = initPerfSampler();
    // A handful of normal frames — nowhere near 3s of kept time or 60 kept samples.
    for (let i = 0; i < 10; i++) recordFrame(s, 1 / 60);
    // A single huge stall (e.g. a GC pause or the tab being backgrounded) that, unfiltered,
    // would have pushed `elapsed` straight past SAMPLE_SECONDS on its own.
    recordFrame(s, 2.9);
    expect(samplerDone(s)).toBe(false);
    expect(s.samples).toHaveLength(10);
  });

  it('keeps sampling across many stalls until real frame time and count both clear the floor', () => {
    const s = initPerfSampler();
    for (let i = 0; i < 5; i++) {
      recordFrame(s, 3); // ignored stall
      for (let j = 0; j < 5; j++) recordFrame(s, 1 / 60); // 5 real frames
    }
    // 25 real frames kept so far — under MIN_KEPT_SAMPLES, so still not done.
    expect(samplerDone(s)).toBe(false);
    for (let i = 0; i < 60; i++) recordFrame(s, SAMPLE_SECONDS / MIN_KEPT_SAMPLES);
    expect(samplerDone(s)).toBe(true);
  });
});
