import { describe, it, expect, vi } from 'vitest';
import { keyToAction, readPad, padEdges, EMPTY_PAD } from '../src/ui/input';
import { createInputBus } from '../src/ui/inputBus';

function pad(pressed: number[], axes: number[] = [0, 0]) {
  return { buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })), axes };
}

describe('keyToAction', () => {
  it('maps arrows, enter/space and escape/backspace', () => {
    expect(keyToAction('ArrowUp')).toBe('up');
    expect(keyToAction('ArrowDown')).toBe('down');
    expect(keyToAction('ArrowLeft')).toBe('left');
    expect(keyToAction('ArrowRight')).toBe('right');
    expect(keyToAction('Enter')).toBe('select');
    expect(keyToAction(' ')).toBe('select');
    expect(keyToAction('Escape')).toBe('back');
    expect(keyToAction('Backspace')).toBe('back');
    expect(keyToAction('q')).toBeNull();
  });
});

describe('gamepad', () => {
  it('reads d-pad, A/B and left stick', () => {
    expect(readPad(pad([12, 0]))).toMatchObject({ up: true, select: true, down: false });
    expect(readPad(pad([1]))).toMatchObject({ back: true });
    expect(readPad(pad([], [-0.8, 0.9]))).toMatchObject({ left: true, down: true, right: false, up: false });
    expect(readPad(pad([], [0.3, -0.3]))).toEqual(EMPTY_PAD);
  });
  it('emits only rising edges', () => {
    const a = readPad(pad([15]));
    expect(padEdges(EMPTY_PAD, a)).toEqual(['right']);
    expect(padEdges(a, a)).toEqual([]);
    expect(padEdges(a, readPad(pad([15, 0])))).toEqual(['select']);
  });
});

describe('inputBus', () => {
  it('delivers to subscribers until unsubscribed', () => {
    const bus = createInputBus();
    const fn = vi.fn();
    const off = bus.subscribe(fn);
    bus.emit('select');
    off();
    bus.emit('back');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('select');
  });
});
