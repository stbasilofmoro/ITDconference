import type { QualitySetting } from '../config';
import { QUALITY_STORAGE_KEY, type QualityPreset } from './store';

const PRESETS: QualityPreset[] = ['pro', 'standard', 'safe'];

export function parseStoredOverride(value: string | null): QualityPreset | null {
  return PRESETS.includes(value as QualityPreset) ? (value as QualityPreset) : null;
}

/**
 * Tablet-class hardware (the KTC MegPad A25Q5 kiosk is a Snapdragon 662 / Adreno 610 Android
 * device) cannot hold 30 fps with bloom, persistence and 4x MSAA at 1080p, and the board is too
 * light a scene for the frame sampler to notice in time. Auto mode starts such devices on
 * 'standard' and still lets the sampler step down from there.
 */
export function isMobileClassDevice(nav: { userAgent: string; userAgentData?: { mobile?: boolean } } = navigator): boolean {
  return nav.userAgentData?.mobile === true || /Android|iPhone|iPad|Mobile/i.test(nav.userAgent);
}

export function resolveInitialQuality(defaultQuality: QualitySetting, stored: QualityPreset | null, hasWebGL2: boolean, mobileClass = false) {
  if (!hasWebGL2) return { quality: 'safe' as const, qualityOverride: stored, autoSelect: false };
  if (stored) return { quality: stored, qualityOverride: stored, autoSelect: false };
  if (defaultQuality !== 'auto') return { quality: defaultQuality, qualityOverride: null, autoSelect: false };
  return { quality: mobileClass ? 'standard' as const : 'pro' as const, qualityOverride: null, autoSelect: true };
}

/** How often games re-render their HUD/scene details. Motion is ref-driven and stays per-frame;
 * on 'standard' the React pass runs at 20 Hz to leave CPU for the render itself. */
export function paintInterval(q: QualityPreset): number {
  return q === 'pro' ? 1 / 30 : 1 / 20;
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
