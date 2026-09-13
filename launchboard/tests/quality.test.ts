import { describe, it, expect } from 'vitest';
import { resolveInitialQuality, parseStoredOverride } from '../src/state/quality';

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
