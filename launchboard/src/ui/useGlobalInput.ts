import { useEffect } from 'react';
import { saveStoredOverride } from '../state/quality';
import { appStore } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { EMPTY_PAD, keyToAction, padEdges, readPad, type Action } from './input';
import { inputBus } from './inputBus';

/** Returns true when the input was consumed by a screen transition. */
function wakeOrRoute(action: Action | null): boolean {
  const s = appStore.getState();
  s.markInput(performance.now());
  if (s.screen === 'boot') return true;
  if (s.screen === 'attract') { tubeBus.pulse('channel'); s.toBoard(); return true; }
  if (s.screen === 'game' && action === 'back') { tubeBus.pulse('channel'); s.exitGame(); return true; }
  return false;
}

function dispatch(action: Action) {
  if (!wakeOrRoute(action)) inputBus.emit(action);
}

export function useGlobalInput() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyQ') {
        e.preventDefault();
        appStore.getState().cycleQualityOverride();
        saveStoredOverride(appStore.getState().qualityOverride);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        appStore.getState().toggleDebug();
        return;
      }
      const action = keyToAction(e.key);
      if (action) { e.preventDefault(); dispatch(action); }
      else wakeOrRoute(null);
    };
    const onPointer = () => { wakeOrRoute(null); };

    let prev = EMPTY_PAD;
    let raf = 0;
    const pollPads = () => {
      const pad = navigator.getGamepads?.().find((p) => p) ?? null;
      if (pad) {
        const next = readPad(pad);
        for (const a of padEdges(prev, next)) dispatch(a);
        prev = next;
      }
      raf = requestAnimationFrame(pollPads);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    raf = requestAnimationFrame(pollPads);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      cancelAnimationFrame(raf);
    };
  }, []);
}
