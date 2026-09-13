import type { PulseKind } from '../games/types';

export type TubeEvent = { kind: PulseKind; start: number };
export type TubeFx = { warmup: number; degauss: number; staticAmt: number; roll: number; flash: number };

export const DURATIONS: Record<PulseKind, number> = { boot: 1800, channel: 700, static: 400, flash: 250, roll: 600 };
export const IDLE_FX: TubeFx = { warmup: 1, degauss: 0, staticAmt: 0, roll: 0, flash: 0 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export function evaluateFx(events: TubeEvent[], now: number): TubeFx {
  const fx: TubeFx = { ...IDLE_FX };
  let roll = 0;
  for (const e of events) {
    const t = now - e.start;
    if (t < 0 || t >= DURATIONS[e.kind]) continue;
    switch (e.kind) {
      case 'boot': {
        const warm = t < 300 ? 0 : easeOutCubic(clamp01((t - 300) / 600));
        fx.warmup = Math.min(fx.warmup, warm);
        if (t >= 900 && t < 1700) fx.degauss = Math.max(fx.degauss, 1 - (t - 900) / 800);
        if (t >= 900 && t < 1150) fx.flash = Math.max(fx.flash, 0.35 * (1 - (t - 900) / 250));
        break;
      }
      case 'channel':
        fx.staticAmt = Math.max(fx.staticAmt, Math.sin((Math.PI * t) / 700));
        roll += t / 700;
        fx.flash = Math.max(fx.flash, 0.6 * Math.max(0, 1 - Math.abs(t - 350) / 120));
        break;
      case 'static':
        fx.staticAmt = Math.max(fx.staticAmt, 1 - t / 400);
        break;
      case 'flash':
        fx.flash = Math.max(fx.flash, 1 - t / 250);
        break;
      case 'roll':
        roll += t / 600;
        break;
    }
  }
  fx.roll = roll - Math.floor(roll);
  return fx;
}

export function pruneEvents(events: TubeEvent[], now: number): TubeEvent[] {
  return events.filter((e) => now - e.start < DURATIONS[e.kind]);
}
