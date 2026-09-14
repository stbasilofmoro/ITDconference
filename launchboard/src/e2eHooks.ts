import { appStore } from './state/store';
import { computeLayout, contentToScreen } from './tube/geometry';
import { paramsFor } from './tube/presets';
import { tubeBus } from './tube/tubeBus';
import { displayLayout, phoneScene, phoneStore } from './phone/viewport';

export function installE2eHooks(extra: Record<string, unknown> = {}) {
  if (!new URLSearchParams(window.location.search).has('e2e')) return;
  (window as unknown as { __launchboard: unknown }).__launchboard = {
    getState: () => appStore.getState(),
    contentToScreen: (x: number, y: number) => {
      if (phoneStore.getState().enabled) {
        const l = displayLayout(innerWidth, innerHeight), b = phoneScene(appStore.getState().activeGameId);
        return { px: l.tubeX + (x - b.x + b.w / 2) / b.w * l.tubeW, py: l.tubeY + (b.y + b.h / 2 - y) / b.h * l.tubeH };
      }
      const layout = computeLayout(window.innerWidth, window.innerHeight);
      const k = paramsFor(appStore.getState().quality, tubeBus.overrides).curvature;
      return contentToScreen(x, y, layout, k);
    },
    tubeOverrides: () => ({ ...tubeBus.overrides }),
    ...extra,
  };
}
