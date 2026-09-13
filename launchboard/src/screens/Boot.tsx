import { useEffect } from 'react';
import { appStore } from '../state/store';
import { fontsReady } from '../text/preloadFonts';
import { DURATIONS } from '../tube/timeline';
import { tubeBus } from '../tube/tubeBus';
import { Attract } from './Attract';

/** Never block the kiosk on a font fetch that stalls or fails. */
const FONT_TIMEOUT_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function Boot() {
  useEffect(() => {
    tubeBus.pulse('boot');
    let cancelled = false;
    // Extend boot past the pulse animation if the fonts aren't ready yet, so drei's
    // <Text> never suspends on the very first screen that renders one.
    Promise.all([delay(DURATIONS.boot), Promise.race([fontsReady, delay(FONT_TIMEOUT_MS)])]).then(() => {
      if (!cancelled) appStore.getState().bootDone();
    });
    return () => { cancelled = true; };
  }, []);
  return <Attract />;
}
