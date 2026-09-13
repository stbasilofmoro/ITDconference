import { appStore } from './state/store';
import { computeLayout, contentToScreen } from './tube/geometry';
import { paramsFor } from './tube/presets';
import { tubeBus } from './tube/tubeBus';

export function installE2eHooks(extra: Record<string, unknown> = {}) {
  if (!new URLSearchParams(window.location.search).has('e2e')) return;
  (window as unknown as { __launchboard: unknown }).__launchboard = {
    getState: () => appStore.getState(),
    contentToScreen: (x: number, y: number) => {
      const layout = computeLayout(window.innerWidth, window.innerHeight);
      const k = paramsFor(appStore.getState().quality, tubeBus.overrides).curvature;
      return contentToScreen(x, y, layout, k);
    },
    ...extra,
  };
}
