import type { QualitySetting } from '../config';
import { QUALITY_STORAGE_KEY, type QualityPreset } from './store';

const PRESETS: QualityPreset[] = ['pro', 'standard', 'safe'];

export function parseStoredOverride(value: string | null): QualityPreset | null {
  return PRESETS.includes(value as QualityPreset) ? (value as QualityPreset) : null;
}

export function resolveInitialQuality(defaultQuality: QualitySetting, stored: QualityPreset | null, hasWebGL2: boolean) {
  if (!hasWebGL2) return { quality: 'safe' as const, qualityOverride: stored, autoSelect: false };
  if (stored) return { quality: stored, qualityOverride: stored, autoSelect: false };
  if (defaultQuality !== 'auto') return { quality: defaultQuality, qualityOverride: null, autoSelect: false };
  return { quality: 'pro' as const, qualityOverride: null, autoSelect: true };
}

export function loadStoredOverride(): QualityPreset | null {
  try { return parseStoredOverride(localStorage.getItem(QUALITY_STORAGE_KEY)); } catch { return null; }
}

export function saveStoredOverride(q: QualityPreset | null): void {
  try {
    if (q) localStorage.setItem(QUALITY_STORAGE_KEY, q);
    else localStorage.removeItem(QUALITY_STORAGE_KEY);
  } catch { /* storage unavailable: override lasts for this session only */ }
}
