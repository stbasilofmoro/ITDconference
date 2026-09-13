import type { PulseKind } from '../games/types';
import type { TubeEvent } from './timeline';
import type { TubeParams } from './presets';

export const tubeBus = {
  events: [] as TubeEvent[],
  overrides: {} as Partial<TubeParams>,
  fps: 0,
  pulse(kind: PulseKind, now: number = performance.now()) {
    this.events.push({ kind, start: now });
  },
};
