import { describe, it, expect } from 'vitest';
import { evaluateFx, pruneEvents, IDLE_FX } from '../src/tube/timeline';
import { tubeBus } from '../src/tube/tubeBus';

describe('evaluateFx', () => {
  it('is idle with no events', () => {
    expect(evaluateFx([], 0)).toEqual(IDLE_FX);
  });

  it('boot: dark line first, then opens, then degauss + flash', () => {
    const ev = [{ kind: 'boot' as const, start: 1000 }];
    expect(evaluateFx(ev, 1000).warmup).toBe(0);
    expect(evaluateFx(ev, 1299).warmup).toBe(0);
    expect(evaluateFx(ev, 1600).warmup).toBeCloseTo(0.875, 9);
    const t1000 = evaluateFx(ev, 2000);
    expect(t1000.warmup).toBe(1);
    expect(t1000.degauss).toBeCloseTo(0.875, 9);
    expect(t1000.flash).toBeCloseTo(0.21, 9);
    expect(evaluateFx(ev, 2800)).toEqual(IDLE_FX);
  });

  it('boot ignores time before its start', () => {
    expect(evaluateFx([{ kind: 'boot', start: 500 }], 0)).toEqual(IDLE_FX);
  });

  it('channel peaks at its midpoint', () => {
    const fx = evaluateFx([{ kind: 'channel', start: 0 }], 350);
    expect(fx.staticAmt).toBeCloseTo(1, 9);
    expect(fx.roll).toBeCloseTo(0.5, 9);
    expect(fx.flash).toBeCloseTo(0.6, 9);
  });

  it('static and flash decay linearly; roll advances', () => {
    expect(evaluateFx([{ kind: 'static', start: 0 }], 100).staticAmt).toBeCloseTo(0.75, 9);
    expect(evaluateFx([{ kind: 'flash', start: 0 }], 125).flash).toBeCloseTo(0.5, 9);
    expect(evaluateFx([{ kind: 'roll', start: 0 }], 300).roll).toBeCloseTo(0.5, 9);
  });

  it('combines: max for amounts, fractional sum for roll', () => {
    const fx = evaluateFx([
      { kind: 'roll', start: 0 },
      { kind: 'roll', start: -150 },
      { kind: 'static', start: 0 },
      { kind: 'flash', start: 0 },
    ], 300);
    // 300/600 + 450/600 = 1.25 → fractional part 0.25; flash (250 ms) has already ended
    expect(fx.roll).toBeCloseTo(0.25, 9);
    expect(fx.staticAmt).toBeCloseTo(0.25, 9);
    expect(fx.flash).toBe(0);
  });
});

describe('pruneEvents', () => {
  it('drops finished events and keeps active or future ones', () => {
    const kept = pruneEvents([
      { kind: 'flash', start: 0 },
      { kind: 'boot', start: 0 },
      { kind: 'static', start: 5000 },
    ], 1000);
    expect(kept.map((e) => e.kind)).toEqual(['boot', 'static']);
  });
});

describe('tubeBus', () => {
  it('queues pulses', () => {
    tubeBus.events.length = 0;
    tubeBus.pulse('flash', 42);
    expect(tubeBus.events).toEqual([{ kind: 'flash', start: 42 }]);
  });
});
