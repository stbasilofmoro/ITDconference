import { describe, it, expect } from 'vitest';
import { moveFocus } from '../src/ui/focus';

describe('moveFocus on a 3×2 grid', () => {
  it('moves right and wraps from the last tile to the first', () => {
    expect(moveFocus(0, 'right')).toBe(1);
    expect(moveFocus(2, 'right')).toBe(3);
    expect(moveFocus(5, 'right')).toBe(0);
  });
  it('moves left and wraps from the first tile to the last', () => {
    expect(moveFocus(1, 'left')).toBe(0);
    expect(moveFocus(0, 'left')).toBe(5);
  });
  it('moves down/up by a row and stays put at edges', () => {
    expect(moveFocus(1, 'down')).toBe(4);
    expect(moveFocus(4, 'down')).toBe(4);
    expect(moveFocus(4, 'up')).toBe(1);
    expect(moveFocus(1, 'up')).toBe(1);
  });
  it('supports other grid sizes', () => {
    expect(moveFocus(3, 'down', 4, 6)).toBe(3);
    expect(moveFocus(1, 'down', 4, 6)).toBe(5);
  });
});
