import { describe, it, expect, vi } from 'vitest';
import { keyToAction, readPad, padEdges, EMPTY_PAD } from '../src/ui/input';
import { createInputBus, PENDING_TTL_MS } from '../src/ui/inputBus';

/** A controllable clock so pending-action TTL tests don't depend on real time. */
function fakeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; } };
}

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

  describe('pending-action buffer', () => {
    it('delivers a buffered action to the first subscriber within the TTL', () => {
      const clock = fakeClock();
      const bus = createInputBus(clock.now);
      bus.emit('select');
      clock.advance(100);
      const fn = vi.fn();
      bus.subscribe(fn);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('select');
    });

    it('discards a pending action once it is older than the TTL', () => {
      const clock = fakeClock();
      const bus = createInputBus(clock.now);
      bus.emit('select');
      clock.advance(PENDING_TTL_MS + 50);
      const fn = vi.fn();
      bus.subscribe(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it('keeps only the most recent pending action', () => {
      const clock = fakeClock();
      const bus = createInputBus(clock.now);
      bus.emit('up');
      clock.advance(10);
      bus.emit('select');
      const fn = vi.fn();
      bus.subscribe(fn);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('select');
    });

    it('does not buffer while a subscriber already exists', () => {
      const clock = fakeClock();
      const bus = createInputBus(clock.now);
      const fn1 = vi.fn();
      bus.subscribe(fn1);
      bus.emit('select');
      expect(fn1).toHaveBeenCalledWith('select');

      const fn2 = vi.fn();
      bus.subscribe(fn2);
      expect(fn2).not.toHaveBeenCalled();
    });

    it('delivers a pending action once, not again to a later subscriber', () => {
      const clock = fakeClock();
      const bus = createInputBus(clock.now);
      bus.emit('select');
      const fn1 = vi.fn();
      bus.subscribe(fn1);
      expect(fn1).toHaveBeenCalledTimes(1);

      const fn2 = vi.fn();
      bus.subscribe(fn2);
      expect(fn2).not.toHaveBeenCalled();
    });
  });
});
