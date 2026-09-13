import { describe, it, expect } from 'vitest';
import { PRESETS, PARAM_RANGES, paramsFor, median, pickPreset, scanlineCount } from '../src/tube/presets';

describe('presets', () => {
  it('standard disables bloom and persistence', () => {
    expect(PRESETS.pro.bloom).toBeGreaterThan(0);
    expect(PRESETS.pro.persistence).toBeGreaterThan(0);
    expect(PRESETS.standard.bloom).toBe(0);
    expect(PRESETS.standard.persistence).toBe(0);
  });

  it('every preset value is inside its debug range', () => {
    for (const p of [PRESETS.pro, PRESETS.standard]) {
      for (const [key, value] of Object.entries(p)) {
        const r = PARAM_RANGES[key as keyof typeof p];
        expect(value).toBeGreaterThanOrEqual(r.min);
        expect(value).toBeLessThanOrEqual(r.max);
      }
    }
  });

  it('applies overrides and maps safe to standard', () => {
    expect(paramsFor('pro', { curvature: 0.2 }).curvature).toBe(0.2);
    expect(paramsFor('safe')).toEqual(PRESETS.standard);
  });

  it('median handles odd and even lengths', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it('steps down one preset when median frame time exceeds 20 ms', () => {
    expect(pickPreset([16, 17, 15], 'pro')).toBe('pro');
    expect(pickPreset([25, 30, 22], 'pro')).toBe('standard');
    expect(pickPreset([25, 30, 22], 'standard')).toBe('safe');
    expect(pickPreset([25, 30, 22], 'safe')).toBe('safe');
  });

  it('chooses a scanline count from canvas height', () => {
    expect(scanlineCount(2160)).toBe(540);
    expect(scanlineCount(1080)).toBe(360);
    expect(scanlineCount(800)).toBe(266);
    expect(scanlineCount(100)).toBe(120);
  });
});
