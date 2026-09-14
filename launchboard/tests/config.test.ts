import { describe, it, expect } from 'vitest';
import { config, tickerItems, readUrlOverrides, effectiveConfig } from '../src/config';
import { asset } from '../src/asset';
import { colors, MONOGRAM_PATHS } from '../src/brand';

describe('config', () => {
  it('has the spec defaults', () => {
    expect(config.title).toBe('Have Some Fun At AREMA');
    expect(config.headlineLines).toEqual(['Have', 'Some Fun', 'At AREMA']);
    expect(config.idleToAttractMs).toBe(300000);
    expect(config.gameIdleExitMs).toBe(300000);
    expect(config.boothNumber).toBe('');
  });

  it('omits the booth segment when boothNumber is empty', () => {
    expect(tickerItems(config)).toEqual(config.tickerLines);
  });

  it('appends the booth segment when set', () => {
    expect(tickerItems({ ...config, boothNumber: '1204' }).at(-1)).toBe('Booth #1204');
  });

  it('reads URL overrides', () => {
    expect(readUrlOverrides('?e2e&debug&idle=1500&gameidle=900')).toEqual({
      e2e: true, debug: true, idleToAttractMs: 1500, gameIdleExitMs: 900,
    });
    expect(readUrlOverrides('')).toEqual({ e2e: false, debug: false });
    expect(readUrlOverrides('?idle=abc')).toEqual({ e2e: false, debug: false });
  });

  it('merges overrides into effective config', () => {
    const c = effectiveConfig('?idle=2000');
    expect(c.idleToAttractMs).toBe(2000);
    expect(c.gameIdleExitMs).toBe(300000);
  });
});

describe('asset', () => {
  it('prefixes BASE_URL and strips a leading slash', () => {
    expect(asset('/fonts/Barlow-Medium.ttf')).toBe('/fonts/Barlow-Medium.ttf');
    expect(asset('fonts/Barlow-Medium.ttf')).toBe('/fonts/Barlow-Medium.ttf');
  });
});

describe('brand', () => {
  it('exposes exact brand colors and 6 monogram paths', () => {
    expect(colors.tieOrange).toBe('#ED9833');
    expect(colors.kilnPink).toBe('#F861D6');
    expect(colors.studioGrey).toBe('#C4C4C4');
    expect(MONOGRAM_PATHS).toHaveLength(6);
  });
});
