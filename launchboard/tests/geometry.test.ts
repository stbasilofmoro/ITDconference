import { describe, it, expect } from 'vitest';
import {
  computeLayout, screenToTubeUv, barrel, inverseBarrel, insideTube,
  contentToWorld, worldToContent, contentToScreen, MONITOR_W, MONITOR_H,
} from '../src/tube/geometry';

describe('computeLayout', () => {
  it('is 1:1 at the monitor design size', () => {
    const l = computeLayout(MONITOR_W, MONITOR_H);
    expect(l).toMatchObject({ scale: 1, monitorX: 0, monitorY: 0, tubeX: 120, tubeY: 110, tubeW: 1920, tubeH: 1080 });
  });
  it('letterboxes horizontally on a 1920×1080 viewport', () => {
    const l = computeLayout(1920, 1080);
    expect(l.scale).toBeCloseTo(1080 / 1410, 6);
    expect(l.monitorY).toBeCloseTo(0, 6);
    expect(l.monitorX).toBeCloseTo((1920 - 2160 * l.scale) / 2, 6);
    expect(l.tubeW / l.tubeH).toBeCloseTo(16 / 9, 6);
  });
});

describe('screenToTubeUv', () => {
  it('maps tube corners to UV corners with v up', () => {
    const l = computeLayout(MONITOR_W, MONITOR_H);
    expect(screenToTubeUv(120, 110, l)).toEqual({ u: 0, v: 1 });
    expect(screenToTubeUv(120 + 1920, 110 + 1080, l)).toEqual({ u: 1, v: 0 });
  });
});

describe('barrel', () => {
  const k = 0.1;
  it('keeps the center and the corners fixed', () => {
    expect(barrel({ u: 0.5, v: 0.5 }, k)).toEqual({ u: 0.5, v: 0.5 });
    const c = barrel({ u: 1, v: 1 }, k);
    expect(c.u).toBeCloseTo(1, 9);
    expect(c.v).toBeCloseTo(1, 9);
  });
  it('pulls edge midpoints inward (content bulges out past the edge)', () => {
    const m = barrel({ u: 1, v: 0.5 }, k);
    expect(m.u).toBeCloseTo((1.1 / 1.2 + 1) / 2, 9);
    expect(m.v).toBeCloseTo(0.5, 9);
  });
  it('is the identity when k = 0', () => {
    expect(barrel({ u: 0.2, v: 0.7 }, 0)).toEqual({ u: 0.2, v: 0.7 });
  });
  it('round-trips through inverseBarrel', () => {
    for (const uv of [{ u: 0.1, v: 0.9 }, { u: 0.73, v: 0.31 }, { u: 0.5, v: 0.02 }]) {
      const back = barrel(inverseBarrel(uv, 0.06), 0.06);
      expect(back.u).toBeCloseTo(uv.u, 6);
      expect(back.v).toBeCloseTo(uv.v, 6);
    }
  });
});

describe('insideTube', () => {
  it('rejects points outside the unit square and in rounded corners', () => {
    expect(insideTube({ u: 0.5, v: 0.5 }, 42)).toBe(true);
    expect(insideTube({ u: -0.01, v: 0.5 }, 42)).toBe(false);
    expect(insideTube({ u: 0, v: 0 }, 42)).toBe(false);
    expect(insideTube({ u: 0.5 / 1920 * 42 * 2, v: 0.5 }, 42)).toBe(true);
    expect(insideTube({ u: 0, v: 0 }, 0)).toBe(true);
  });
});

describe('content ↔ world ↔ screen', () => {
  it('converts between content UV and centered world coordinates', () => {
    expect(contentToWorld({ u: 0, v: 0 })).toEqual({ x: -960, y: -540 });
    expect(worldToContent(960, 540)).toEqual({ u: 1, v: 1 });
  });
  it('contentToScreen inverts the pointer mapping', () => {
    const l = computeLayout(1920, 1080);
    const k = 0.06;
    const { px, py } = contentToScreen(-55, 270, l, k);
    const back = contentToWorld(barrel(screenToTubeUv(px, py, l), k));
    expect(back.x).toBeCloseTo(-55, 3);
    expect(back.y).toBeCloseTo(270, 3);
  });
});
