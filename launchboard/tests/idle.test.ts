import { describe, it, expect } from 'vitest';
import { nextScreenForIdle } from '../src/state/idle';

const cfg = { idleToAttractMs: 300000, gameIdleExitMs: 300000 };

describe('nextScreenForIdle', () => {
  it('sends an idle board to attract', () => {
    expect(nextScreenForIdle('board', 0, 300000, cfg)).toBe('attract');
  });
  it('keeps an active board', () => {
    expect(nextScreenForIdle('board', 0, 299999, cfg)).toBeNull();
  });
  it('sends an idle game directly to attract after five minutes', () => {
    expect(nextScreenForIdle('game', 1000, 301000, cfg)).toBe('attract');
    expect(nextScreenForIdle('game', 1000, 300999, cfg)).toBeNull();
  });
  it('counts five minutes from the latest interaction on either screen', () => {
    for (const screen of ['board', 'game'] as const) {
      expect(nextScreenForIdle(screen, 240000, 300000, cfg)).toBeNull();
      expect(nextScreenForIdle(screen, 240000, 539999, cfg)).toBeNull();
      expect(nextScreenForIdle(screen, 240000, 540000, cfg)).toBe('attract');
    }
  });
  it('never changes boot or attract', () => {
    expect(nextScreenForIdle('boot', 0, 1e9, cfg)).toBeNull();
    expect(nextScreenForIdle('attract', 0, 1e9, cfg)).toBeNull();
  });
});
