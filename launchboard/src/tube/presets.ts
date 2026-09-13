import type { QualityPreset } from '../state/store';

export type TubeParams = {
  curvature: number;
  cornerRadius: number;
  chroma: number;
  bloom: number;
  bloomThreshold: number;
  maskStrength: number;
  maskType: number; // 0 = aperture grille, 1 = slot mask
  maskPx: number;
  scanStrength: number;
  scanBeamMin: number;
  scanBeamMax: number;
  persistence: number;
  rollBand: number;
  flicker: number;
  vignette: number;
  glass: number;
  grain: number;
};

const pro: TubeParams = {
  curvature: 0.06,
  cornerRadius: 42,
  chroma: 0.0015,
  bloom: 0.35,
  bloomThreshold: 0.6,
  maskStrength: 0.35,
  maskType: 0,
  maskPx: 3,
  scanStrength: 0.45,
  scanBeamMin: 0.35,
  scanBeamMax: 0.9,
  persistence: 0.55,
  rollBand: 0.04,
  flicker: 0.012,
  vignette: 0.35,
  glass: 0.05,
  grain: 0.025,
};

export const PRESETS: { pro: TubeParams; standard: TubeParams } = {
  pro,
  standard: { ...pro, bloom: 0, persistence: 0, chroma: 0.001 },
};

export const PARAM_RANGES: Record<keyof TubeParams, { min: number; max: number; step: number }> = {
  curvature: { min: 0, max: 0.2, step: 0.005 },
  cornerRadius: { min: 0, max: 120, step: 1 },
  chroma: { min: 0, max: 0.01, step: 0.0005 },
  bloom: { min: 0, max: 1.5, step: 0.05 },
  bloomThreshold: { min: 0, max: 1, step: 0.05 },
  maskStrength: { min: 0, max: 1, step: 0.05 },
  maskType: { min: 0, max: 1, step: 1 },
  maskPx: { min: 2, max: 6, step: 1 },
  scanStrength: { min: 0, max: 1, step: 0.05 },
  scanBeamMin: { min: 0.1, max: 1, step: 0.05 },
  scanBeamMax: { min: 0.1, max: 1.5, step: 0.05 },
  persistence: { min: 0, max: 0.95, step: 0.05 },
  rollBand: { min: 0, max: 0.2, step: 0.01 },
  flicker: { min: 0, max: 0.05, step: 0.002 },
  vignette: { min: 0, max: 1, step: 0.05 },
  glass: { min: 0, max: 0.3, step: 0.01 },
  grain: { min: 0, max: 0.1, step: 0.005 },
};

export function paramsFor(q: QualityPreset, overrides: Partial<TubeParams> = {}): TubeParams {
  const base = q === 'pro' ? PRESETS.pro : PRESETS.standard;
  return { ...base, ...overrides };
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const STEP_DOWN: Record<QualityPreset, QualityPreset> = { pro: 'standard', standard: 'safe', safe: 'safe' };

export function pickPreset(frameTimesMs: number[], current: QualityPreset): QualityPreset {
  return median(frameTimesMs) > 20 ? STEP_DOWN[current] : current;
}

export function scanlineCount(canvasHeightPx: number): number {
  return Math.min(540, Math.max(120, Math.floor(canvasHeightPx / 2)));
}
