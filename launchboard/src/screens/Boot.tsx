import { useEffect } from 'react';
import { appStore } from '../state/store';
import { DURATIONS } from '../tube/timeline';
import { tubeBus } from '../tube/tubeBus';
import { Attract } from './Attract';

export function Boot() {
  useEffect(() => {
    tubeBus.pulse('boot');
    const t = setTimeout(() => appStore.getState().bootDone(), DURATIONS.boot);
    return () => clearTimeout(t);
  }, []);
  return <Attract />;
}
