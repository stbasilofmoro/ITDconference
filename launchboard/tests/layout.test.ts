import { describe, it, expect } from 'vitest';
import { tilePosition, accentColor, easeInOut, TILE_W, TILE_H } from '../src/ui/layout';

describe('board layout', () => {
  it('places six tiles in a 3×2 grid in the right 62% of the frame', () => {
    expect([0, 1, 2, 3, 4, 5].map(tilePosition)).toEqual([
      [-55, 270], [325, 270], [705, 270],
      [-55, -140], [325, -140], [705, -140],
    ]);
  });
  it('keeps every tile inside the 80 px safe margin', () => {
    for (let i = 0; i < 6; i++) {
      const [x, y] = tilePosition(i);
      expect(x + TILE_W / 2).toBeLessThanOrEqual(960 - 80);
      expect(y + TILE_H / 2).toBeLessThanOrEqual(540 - 80);
      expect(y - TILE_H / 2).toBeGreaterThan(-470 + 40);
    }
  });
  it('maps accents to phosphor-safe colors', () => {
    expect(accentColor('orange')).toBe('#E89A45');
    expect(accentColor('pink')).toBe('#EE6BD2');
    expect(accentColor('green')).toBe('#18BE78');
  });
  it('eases from 0 to 1 symmetrically', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 9);
    expect(easeInOut(2)).toBe(1);
  });
});
