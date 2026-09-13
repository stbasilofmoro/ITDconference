import { describe, it, expect } from 'vitest';
import { fallbackEntryAction } from '../src/state/fallback';

describe('fallbackEntryAction', () => {
  it('does nothing when already on the board', () => {
    expect(fallbackEntryAction('board')).toBeNull();
  });
  it('exits an active game', () => {
    expect(fallbackEntryAction('game')).toBe('exitGame');
  });
  it('moves boot and attract straight to the board', () => {
    expect(fallbackEntryAction('boot')).toBe('toBoard');
    expect(fallbackEntryAction('attract')).toBe('toBoard');
  });
});
