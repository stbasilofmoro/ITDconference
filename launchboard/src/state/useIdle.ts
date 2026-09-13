import { useEffect } from 'react';
import { tubeBus } from '../tube/tubeBus';
import { nextScreenForIdle } from './idle';
import { appStore } from './store';

export function useIdle(cfg: { idleToAttractMs: number; gameIdleExitMs: number }) {
  useEffect(() => {
    const id = setInterval(() => {
      const s = appStore.getState();
      const next = nextScreenForIdle(s.screen, s.lastInputAt, performance.now(), cfg);
      if (next === 'attract') { tubeBus.pulse('channel'); s.toAttract(); }
      if (next === 'board') { tubeBus.pulse('channel'); s.exitGame(); }
    }, 250);
    return () => clearInterval(id);
  }, [cfg]);
}
