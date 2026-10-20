import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameAudio, snapshot } from '../../audio/useGameAudio';
import { appStore } from '../../state/store';
import { paintInterval } from '../../state/quality';
import { scoreStore } from '../../leaderboard/scores';
import type { GameContext } from '../types';
import { interact, move, newRun, start, tick, togglePause, visit, type Run, type StationId } from './engine';
import { TieYard } from './TieYard';
import { TieHud } from './TieHud';

export default function TieGrader({ ctx }: { ctx: GameContext }) {
  const [run] = useState(newRun), [, redraw] = useState(0);
  const keys = useRef(new Set<string>()), paint = useRef(0), scoreId = useRef(crypto.randomUUID());
  const refresh = useCallback(() => redraw(n => n + 1), []);
  useGameAudio('tie-grader', () => snapshot.tieGrader(run));
  const select = useCallback(() => {
    if (scoreStore.getState().open) return;
    if (run.paused) togglePause(run);
    else if (run.phase !== 'playing') { if (run.phase !== 'intro') Object.assign(run, newRun()); start(run); keys.current.clear(); scoreId.current = crypto.randomUUID(); }
    else interact(run);
    refresh();
  }, [run, refresh]);
  const pause = useCallback(() => { if (scoreStore.getState().open) return; keys.current.clear(); togglePause(run); refresh(); }, [run, refresh]);
  const go = useCallback((id: StationId) => {
    if (scoreStore.getState().open) return;
    appStore.getState().markInput(performance.now()); keys.current.clear(); visit(run, id); refresh();
  }, [run, refresh]);
  useEffect(() => ctx.input.subscribe(action => { if (action === 'select') select(); }), [ctx.input, select]);
  useEffect(() => {
    const suppressRepeat = (e: KeyboardEvent) => {
      if (e.repeat && ['Space', 'Enter'].includes(e.code) && !(e.target instanceof Element && e.target.closest('input, textarea, select, [data-kiosk-form]'))) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    const shortcuts: Record<string, StationId> = { KeyI: 'incoming', Digit1: 'grade1', Digit2: 'grade2', Digit3: 'junk', Digit4: 'truck1', Digit5: 'truck2', Digit6: 'shredder' };
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [data-kiosk-form]') || e.ctrlKey || e.metaKey || e.altKey || scoreStore.getState().open) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) { e.preventDefault(); keys.current.add(e.code); }
      if (e.repeat) return;
      if (e.code === 'KeyP') { e.preventDefault(); pause(); }
      if (e.code === 'KeyE') { e.preventDefault(); select(); }
      if (shortcuts[e.code]) { e.preventDefault(); go(shortcuts[e.code]); }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const hide = () => { keys.current.clear(); if (run.phase === 'playing' && !run.paused) pause(); };
    const visibility = () => { if (document.hidden) hide(); };
    window.addEventListener('keydown', suppressRepeat, true); window.addEventListener('keydown', down); window.addEventListener('keyup', up, true); window.addEventListener('blur', hide); document.addEventListener('visibilitychange', visibility);
    return () => { keys.current.clear(); window.removeEventListener('keydown', suppressRepeat, true); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up, true); window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', visibility); };
  }, [run, go, pause, select]);
  useFrame((_, dt) => {
    if (!document.hidden && !scoreStore.getState().open) {
      const key = (...names: string[]) => names.some(n => keys.current.has(n));
      const pad = navigator.getGamepads?.().find(p => p), b = (i: number) => pad?.buttons[i]?.pressed ?? false;
      const axis = (i: number) => Math.abs(pad?.axes[i] ?? 0) > .22 ? pad!.axes[i] : 0;
      const dx = Number(key('ArrowRight', 'KeyD') || b(15)) - Number(key('ArrowLeft', 'KeyA') || b(14)) + axis(0);
      const dz = Number(key('ArrowDown', 'KeyS') || b(13)) - Number(key('ArrowUp', 'KeyW') || b(12)) + axis(1);
      if (dx || dz) { appStore.getState().markInput(performance.now()); move(run, dx, dz, Math.min(dt, .1)); }
      const previous = run.phase; tick(run, Math.min(dt, .1));
      if (run.phase !== previous && (run.phase === 'won' || run.phase === 'lost')) ctx.tube.pulse(run.phase === 'won' ? 'flash' : 'static');
    } else keys.current.clear();
    if (run.phase !== 'playing' || run.paused) keys.current.clear();
    paint.current += dt; if (paint.current >= paintInterval(appStore.getState().quality)) { paint.current = 0; refresh(); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __tieGrader?: unknown };
    w.__tieGrader = { getState: () => structuredClone(run), setState: (patch: Partial<Run>) => { Object.assign(run, patch); refresh(); }, action: (action: string, id?: StationId) => { if (action === 'start') select(); if (action === 'interact') interact(run, id); if (action === 'visit' && id) go(id); if (action === 'pause') pause(); refresh(); } };
    return () => { delete w.__tieGrader; };
  }, [run, select, go, pause, refresh]);
  return <><TieYard run={run} onStation={go} /><TieHud run={run} select={select} pause={pause} go={go} exit={ctx.exit} result={{ id: scoreId.current, game: 'tie-grader', score: run.score, detail: `${run.handled} ties dispatched / ${run.mistakes} grading or loading mistakes` }} /></>;
}
