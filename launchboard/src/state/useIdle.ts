import { useEffect } from 'react';
import { tubeBus } from '../tube/tubeBus';
import { nextScreenForIdle } from './idle';
import { appStore } from './store';

export function useIdle(cfg: { idleToAttractMs: number; gameIdleExitMs: number }, fallbackActive = false) {
  useEffect(() => {
    const id = setInterval(() => {
      const s = appStore.getState();
      const next = nextScreenForIdle(s.screen, s.lastInputAt, performance.now(), cfg);
      // The CSS fallback has no attract screen of its own — never idle into a screen it can't show.
      if (next === 'attract' && !fallbackActive) { tubeBus.pulse('channel'); s.toAttract(); }
      if (next === 'board') {
        tubeBus.pulse('channel');
        s.exitGame();
        // Refresh lastInputAt so the board doesn't already read as idle on the very next
        // tick and fall straight through to attract with a second, spurious channel pulse.
        s.markInput(performance.now());
      }
    }, 250);
    return () => clearInterval(id);
  }, [cfg, fallbackActive]);
}
