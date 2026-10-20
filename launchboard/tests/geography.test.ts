import { describe, expect, it } from 'vitest';
import { landPolygons, onLand, spherePoint } from '../src/geography/earth';

describe('shared globe illustration geography', () => {
  it('keeps land polygons, including Antarctica and Greenland, on an undistorted sphere', () => {
    expect(landPolygons.length).toBeGreaterThan(100);
    expect(onLand(-42, 73)).toBe(true);
    expect(onLand(0, -85)).toBe(true);
    expect(onLand(-30, 0)).toBe(false);
    expect(spherePoint(0, 0).length()).toBeCloseTo(1);
    expect(spherePoint(180, 80).length()).toBeCloseTo(1);
  });
});
