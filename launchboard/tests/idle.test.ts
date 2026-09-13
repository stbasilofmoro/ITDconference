import { describe, it, expect } from 'vitest';
import { nextScreenForIdle } from '../src/state/idle';

const cfg = { idleToAttractMs: 60000, gameIdleExitMs: 120000 };

describe('nextScreenForIdle', () => {
  it('sends an idle board to attract', () => {
    expect(nextScreenForIdle('board', 0, 60000, cfg)).toBe('attract');
  });
  it('keeps an active board', () => {
    expect(nextScreenForIdle('board', 0, 59999, cfg)).toBeNull();
  });
  it('sends an idle game back to the board', () => {
    expect(nextScreenForIdle('game', 1000, 121000, cfg)).toBe('board');
    expect(nextScreenForIdle('game', 1000, 120999, cfg)).toBeNull();
  });
  it('never changes boot or attract', () => {
    expect(nextScreenForIdle('boot', 0, 1e9, cfg)).toBeNull();
    expect(nextScreenForIdle('attract', 0, 1e9, cfg)).toBeNull();
  });
});
