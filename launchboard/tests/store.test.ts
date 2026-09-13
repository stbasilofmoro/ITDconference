import { describe, it, expect } from 'vitest';
import { createAppStore } from '../src/state/store';

describe('app store', () => {
  it('starts in boot on the pro preset', () => {
    const s = createAppStore();
    expect(s.getState().screen).toBe('boot');
    expect(s.getState().quality).toBe('pro');
  });

  it('walks boot → attract → board → game → board', () => {
    const s = createAppStore();
    s.getState().bootDone();
    expect(s.getState().screen).toBe('attract');
    s.getState().toBoard();
    expect(s.getState().screen).toBe('board');
    s.getState().launch('test-pattern');
    expect(s.getState()).toMatchObject({ screen: 'game', activeGameId: 'test-pattern' });
    s.getState().exitGame();
    expect(s.getState()).toMatchObject({ screen: 'board', activeGameId: null });
  });

  it('ignores launch unless on the board', () => {
    const s = createAppStore();
    s.getState().launch('x');
    expect(s.getState().screen).toBe('boot');
  });

  it('bootDone only acts during boot', () => {
    const s = createAppStore({ screen: 'board' });
    s.getState().bootDone();
    expect(s.getState().screen).toBe('board');
  });

  it('cycles quality override none → pro → standard → safe → none', () => {
    const s = createAppStore();
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'pro', quality: 'pro' });
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'standard', quality: 'standard' });
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'safe', quality: 'safe' });
    s.getState().cycleQualityOverride();
    // Clearing the override returns to the full tube so a staff member is never stuck in the fallback
    expect(s.getState()).toMatchObject({ qualityOverride: null, quality: 'pro' });
  });

  it('ignores setQuality while an override is set', () => {
    const s = createAppStore({ qualityOverride: 'pro', quality: 'pro' });
    s.getState().setQuality('standard');
    expect(s.getState().quality).toBe('pro');
  });

  it('records input time, focus, debug and context loss', () => {
    const s = createAppStore();
    s.getState().markInput(1234);
    s.getState().setFocus(4);
    s.getState().toggleDebug();
    s.getState().setContextLost(true);
    expect(s.getState()).toMatchObject({ lastInputAt: 1234, focusIndex: 4, debug: true, contextLost: true });
  });
});
