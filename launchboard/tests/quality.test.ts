import { describe, it, expect } from 'vitest';
import { isMobileClassDevice, paintInterval, resolveInitialQuality, parseStoredOverride } from '../src/state/quality';

describe('resolveInitialQuality', () => {
  it('auto-selects from pro when nothing is forced', () => {
    expect(resolveInitialQuality('auto', null, true)).toEqual({ quality: 'pro', qualityOverride: null, autoSelect: true });
  });
  it('honors a stored staff override', () => {
    expect(resolveInitialQuality('auto', 'standard', true)).toEqual({ quality: 'standard', qualityOverride: 'standard', autoSelect: false });
  });
  it('honors a fixed config default', () => {
    expect(resolveInitialQuality('standard', null, true)).toEqual({ quality: 'standard', qualityOverride: null, autoSelect: false });
  });
  it('starts tablet-class devices on standard, still auto-selecting', () => {
    expect(resolveInitialQuality('auto', null, true, true)).toEqual({ quality: 'standard', qualityOverride: null, autoSelect: true });
    expect(resolveInitialQuality('auto', 'pro', true, true).quality).toBe('pro');
  });
  it('forces safe without WebGL2', () => {
    expect(resolveInitialQuality('pro', 'pro', false)).toEqual({ quality: 'safe', qualityOverride: 'pro', autoSelect: false });
  });
});

describe('parseStoredOverride', () => {
  it('accepts only known presets', () => {
    expect(parseStoredOverride('pro')).toBe('pro');
    expect(parseStoredOverride('safe')).toBe('safe');
    expect(parseStoredOverride('ultra')).toBeNull();
    expect(parseStoredOverride(null)).toBeNull();
  });
});

describe('isMobileClassDevice', () => {
  it('recognises Android kiosks and UA client hints', () => {
    expect(isMobileClassDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 14; A25Q5) AppleWebKit/537.36 Chrome/130 Safari/537.36' })).toBe(true);
    expect(isMobileClassDevice({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130', userAgentData: { mobile: true } })).toBe(true);
    expect(isMobileClassDevice({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130' })).toBe(false);
  });
});

describe('paintInterval', () => {
  it('re-renders at 30 Hz on pro and 20 Hz otherwise', () => {
    expect(paintInterval('pro')).toBeCloseTo(1 / 30);
    expect(paintInterval('standard')).toBeCloseTo(1 / 20);
  });
});
