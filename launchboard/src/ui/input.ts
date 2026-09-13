import type { Direction } from './focus';

export type Action = Direction | 'select' | 'back';

const KEYS: Record<string, Action> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'select', ' ': 'select', Escape: 'back', Backspace: 'back',
};

export function keyToAction(key: string): Action | null {
  return KEYS[key] ?? null;
}

export type PadSnapshot = { up: boolean; down: boolean; left: boolean; right: boolean; select: boolean; back: boolean };
export const EMPTY_PAD: PadSnapshot = { up: false, down: false, left: false, right: false, select: false, back: false };

const STICK = 0.5;

export function readPad(pad: { buttons: ReadonlyArray<{ pressed: boolean }>; axes: ReadonlyArray<number> }): PadSnapshot {
  const b = (i: number) => pad.buttons[i]?.pressed ?? false;
  const x = pad.axes[0] ?? 0;
  const y = pad.axes[1] ?? 0;
  return {
    up: b(12) || y < -STICK,
    down: b(13) || y > STICK,
    left: b(14) || x < -STICK,
    right: b(15) || x > STICK,
    select: b(0),
    back: b(1),
  };
}

const ORDER: Action[] = ['up', 'down', 'left', 'right', 'select', 'back'];

export function padEdges(prev: PadSnapshot, next: PadSnapshot): Action[] {
  return ORDER.filter((a) => next[a] && !prev[a]);
}
