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
    }, 250);
    return () => clearInterval(id);
  }, [cfg, fallbackActive]);
}
