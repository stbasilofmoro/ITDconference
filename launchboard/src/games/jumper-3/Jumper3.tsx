import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { GameContext } from '../types';
import { appStore } from '../../state/store';
import { scoreStore } from '../../leaderboard/scores';
import { advance, newRun, pause, tick, type Input, type Run } from './engine';
import { JumperScene } from './Scene';
import { JumperControls } from './controls';
import { JumperHud } from './Hud';

export default function Jumper3({ ctx }: { ctx: GameContext }) {
  const [run] = useState(newRun), [controls] = useState(() => new JumperControls());
  const [, redraw] = useState(0), paint = useRef(0), scoreId = useRef(crypto.randomUUID());
  const refresh = useCallback(() => redraw((n) => n + 1), []);
  const next = useCallback(() => { if (scoreStore.getState().open || run.phase === 'playing' && !run.paused) return; if (run.phase === 'won' || run.phase === 'lost') scoreId.current = crypto.randomUUID(); controls.clear(); advance(run); refresh(); }, [run, controls, refresh]);
  const pauseGame = useCallback(() => { pause(run); controls.clear(); refresh(); }, [run, controls, refresh]);
  useEffect(() => ctx.input.subscribe((a) => { if (a === 'select') next(); }), [ctx.input, next]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-kiosk-form]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'KeyP' && !e.repeat) { e.preventDefault(); pauseGame(); }
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'ArrowUp', 'KeyW', 'Space', 'Enter', 'ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code)) { e.preventDefault(); controls.keys.add(e.code); if (!e.repeat && ['Space', 'Enter', 'KeyW', 'ArrowUp'].includes(e.code)) controls.jumpQueued = true; }
    };
    const up = (e: KeyboardEvent) => controls.keys.delete(e.code);
    const hide = () => { controls.clear(); if (run.phase === 'playing' && !run.paused) pauseGame(); };
    const visibility = () => { if (document.hidden) hide(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', hide); document.addEventListener('visibilitychange', visibility);
    return () => { controls.clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', visibility); };
  }, [run, controls, pauseGame]);
  useFrame((_, dt) => {
    const key = (...names: string[]) => names.some((name) => controls.keys.has(name));
    const pad = navigator.getGamepads?.().find((p) => p), button = (i: number) => pad?.buttons[i]?.pressed ?? false;
    const axis = pad?.axes[0] ?? 0;
    const input: Input = { move: Number(key('ArrowRight', 'KeyD') || controls.held('right') || button(15)) - Number(key('ArrowLeft', 'KeyA') || controls.held('left') || button(14)) + (Math.abs(axis) > 0.2 ? axis : 0), jump: key('Space', 'Enter', 'KeyW', 'ArrowUp') || controls.held('jump') || controls.jumpQueued || button(0), run: controls.sprint || key('ShiftLeft', 'ShiftRight') || button(7), fire: key('KeyX') || controls.held('fire') || button(2) };
    const before = run.phase, power = run.power, beforeTime = run.totalTime;
    if (!document.hidden && !scoreStore.getState().open) { if (input.move || input.jump || input.fire) appStore.getState().markInput(performance.now()); tick(run, dt, input); } else controls.clear();
    if (run.totalTime !== beforeTime) controls.jumpQueued = false;
    if (run.phase !== before || power !== run.power) ctx.tube.pulse(run.phase === 'hit' || run.phase === 'lost' ? 'static' : 'flash');
    if (run.phase !== 'playing' || run.paused) controls.clear();
    paint.current += dt; if (paint.current > 1 / 30) { paint.current = 0; refresh(); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __jumper3?: unknown }; w.__jumper3 = { getState: () => structuredClone(run), setState: (patch: Partial<Run>) => { Object.assign(run, patch); refresh(); } };
    return () => { delete w.__jumper3; };
  }, [run, refresh]);
  return <><JumperScene run={run} /><JumperHud run={run} controls={controls} next={next} pause={pauseGame} exit={ctx.exit} result={{ id: scoreId.current, game: 'jumper-3', score: run.score, detail: `${run.phase === 'won' ? 3 : run.stage} seals restored / ${run.credits} carbon credits` }} /></>;
}
