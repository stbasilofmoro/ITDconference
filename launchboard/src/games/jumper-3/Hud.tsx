import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStore } from 'zustand';
import { fonts } from '../../brand';
import { appStore } from '../../state/store';
import { scoreStore, showScores, type Result } from '../../leaderboard/scores';
import { LEVELS } from './levels';
import { STAGE_SECONDS, type Run } from './engine';
import type { Button, JumperControls } from './controls';
import './jumper.css';
import { usePhone } from '../../phone/viewport';

type Props = { run: Run; controls: JumperControls; result: Result; next(): void; pause(): void; exit(): void };
function Action({ children, onPress, secondary = false }: { children: ReactNode; onPress(): void; secondary?: boolean }) {
  return <button className={secondary ? 'jumper-secondary' : ''} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); appStore.getState().markInput(performance.now()); onPress(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} onClick={(e) => { if (e.detail === 0) onPress(); }}>{children}</button>;
}
function Hud({ run: r, controls, result, next, pause, exit }: Props) {
  const phone = usePhone();
  const jumpStart = useRef(new Map<number, number>());
  const moveStart = useRef(new Map<number, number>());
  const scoresOpen = useStore(scoreStore, (s) => s.open), [, redraw] = useState(0);
  const latest = useRef({ r, pause }); latest.current = { r, pause };
  const modal = r.phase !== 'playing' || r.paused;
  useEffect(() => {
    const end = (e: PointerEvent) => { controls.release(e.pointerId); jumpStart.current.delete(e.pointerId); if (moveStart.current.delete(e.pointerId)) controls.sprint = false; redraw((n) => n + 1); };
    let portrait = innerHeight > innerWidth;
    const resize = () => { controls.clear(); const next = innerHeight > innerWidth; if (portrait !== next && latest.current.r.phase === 'playing' && !latest.current.r.paused) latest.current.pause(); portrait = next; };
    window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true); window.addEventListener('lostpointercapture', end, true); window.addEventListener('resize', resize);
    return () => { controls.clear(); window.removeEventListener('pointerup', end, true); window.removeEventListener('pointercancel', end, true); window.removeEventListener('lostpointercapture', end, true); window.removeEventListener('resize', resize); };
  }, [controls]);
  useEffect(() => { if (modal || scoresOpen) controls.clear(); }, [modal, scoresOpen, controls]);
  if (scoresOpen) return null;
  const l = LEVELS[r.stage], finished = r.phase === 'won' || r.phase === 'lost';
  function held(button: Button, label: string) {
    return <button className={`jumper-held ${button}${controls.held(button) ? ' pressed' : ''}`} aria-label={label} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); appStore.getState().markInput(performance.now()); if (r.phase !== 'playing' || r.paused) return; controls.press(e.pointerId, button); e.currentTarget.setPointerCapture(e.pointerId); redraw((n) => n + 1); }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); controls.press(-1, button); } }} onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); controls.release(-1); } }} onBlur={() => controls.release(-1)}>{label}</button>;
  }
  return <div className={`jumper-hud${modal ? ' jumper-menu' : ''}`} onContextMenu={(e) => e.preventDefault()} onPointerDownCapture={() => appStore.getState().markInput(performance.now())}>
    <style>{`@font-face{font-family:JumperBarlow;src:url('${fonts.medium}')}@font-face{font-family:JumperBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    {modal ? <section className="jumper-card" aria-label="Jumper 3 menu"><small>ITD / AN ORIGINAL RAILROAD ADVENTURE</small>
      <h1>{r.paused ? 'Hold the line.' : r.phase === 'won' ? 'Industry rises again.' : r.phase === 'lost' ? 'An ember remains.' : r.phase === 'hit' ? 'Back on the line.' : r.phase === 'cleared' ? `${l.seal} restored.` : 'Jumper 3'}</h1>
      {r.phase === 'intro' && <h2>The Legend of Atom</h2>}
      <div className="jumper-chapter">{l.subtitle} / {l.title}</div>
      <p>{r.paused ? 'Your jump, the shift clock, and the Order are paused.' : r.phase === 'hit' ? `${r.message} ${r.lives} ${r.lives === 1 ? 'life' : 'lives'} remaining. Collected credits and defeated enemies stay saved.` : r.phase === 'lost' ? 'The Order still holds the seals. Atom can always pick up his tools and try again.' : r.phase === 'won' || r.phase === 'cleared' ? l.restored : l.story}</p>
      {r.phase === 'intro' && <><div className="jumper-kit"><span><b>HARDHAT</b>Extra protection</span><span><b>SPARK COIL</b>Bouncing carbon sparks</span><span><b>ATOM CORE</b>12-second shield</span></div><p className="jumper-help">Move left or right. Hold Jump to go higher; release for a short hop. Stomp the red-eyed hoods, bump C crates from below, and collect credits. Defeat the guardian, then reach the seal signal.</p><p className="jumper-help" hidden={phone}>Arrows / A-D: move · Space / W / Up: jump · Shift: run · X: blaster<br />Controller: stick / D-pad + A to jump, X to fire, RT to run. Touch buttons work together.</p></>}
      {finished && <p className="jumper-final-score">{r.score.toLocaleString()} points / {r.credits} carbon credits</p>}
      {phone && r.phase === "intro" && <p>Touch the left side to move: its left edge goes left, its inner edge goes right. Hold the right side to jump; release for a short hop. Swipe up on the right to fire. Slide your movement thumb to run. Use both thumbs together.</p>}<div className="jumper-menu-actions"><Action onPress={next}>{r.paused ? 'Resume adventure' : r.phase === 'hit' ? 'Retry checkpoint' : r.phase === 'cleared' ? 'Next chapter' : finished ? 'New adventure' : 'Start chapter'}</Action>
        {finished && <Action onPress={() => showScores('jumper-3', result)}>Save score / Leaderboard</Action>}<Action onPress={exit} secondary>Launchboard</Action></div>
    </section> : <>
      <header className="jumper-top"><div><small>JUMPER 3 / THE LEGEND OF ATOM</small><strong>{r.stage + 1} / 3 · {l.title}</strong><span>{r.messageTime > 0 ? r.message : `Recover the ${l.seal}. Follow the railway to the right.`}</span></div><aside><b>{r.lives} lives · {Math.max(0, Math.ceil(STAGE_SECONDS - r.elapsed))}s</b><span>{r.score.toLocaleString()} pts · {r.credits} credits</span><em>{r.core > 0 ? `ATOM CORE ${Math.ceil(r.core)}s` : r.power === 'spark' ? 'SPARK COIL' : r.power === 'helmet' ? 'RAIL HARDHAT' : 'ATOM / BEAVER HERO'}</em></aside></header>
      {phone ? <>
        <div className="phone-jumper-move" role="region" aria-label="Hold left or right to move" onPointerDown={(e) => { e.preventDefault(); moveStart.current.set(e.pointerId, e.clientX); controls.press(e.pointerId, e.clientX < innerWidth * .225 ? 'left' : 'right'); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) { controls.sprint = Math.abs(e.clientX - (moveStart.current.get(e.pointerId) ?? e.clientX)) > 35; controls.release(e.pointerId); controls.press(e.pointerId, e.clientX < innerWidth * .225 ? 'left' : 'right'); } }} />
        <div className="phone-jumper-jump" role="region" aria-label="Hold to jump, swipe up to fire" onPointerDown={(e) => { e.preventDefault(); jumpStart.current.set(e.pointerId, e.clientY); controls.press(e.pointerId, 'jump'); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { const y = jumpStart.current.get(e.pointerId); if (y !== undefined && y - e.clientY > 35) { controls.release(e.pointerId); controls.press(e.pointerId, 'fire'); controls.fireQueued = true; jumpStart.current.delete(e.pointerId); } }} onPointerUp={(e) => jumpStart.current.delete(e.pointerId)} onPointerCancel={(e) => jumpStart.current.delete(e.pointerId)} />
        <button className="phone-menu-toggle" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); appStore.getState().markInput(performance.now()); pause(); }} onClick={(e) => { if (e.detail === 0) pause(); }}>Menu</button><div className="phone-gesture-hint">Left half: hold left / right. Right half: hold to jump, swipe up to fire.</div>
      </> : <><div className="jumper-left">{held('left', 'Left')}{held('right', 'Right')}<button className="jumper-run" aria-pressed={controls.sprint} onPointerDown={(e) => { e.preventDefault(); controls.sprint = !controls.sprint; redraw((n) => n + 1); }} onClick={(e) => { if (e.detail === 0) { controls.sprint = !controls.sprint; redraw((n) => n + 1); } }} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); }}>Run: {controls.sprint ? 'on' : 'off'}</button></div>
      <div className="jumper-right">{held('fire', 'Blaster')}{held('jump', 'Jump')}<div><Action onPress={pause} secondary>Pause</Action><Action onPress={exit} secondary>Exit</Action></div></div>
      <div className="jumper-bottom-hint">Hold Jump to go higher.<br />100 carbon credits earn an extra life.</div>
      </>}
    </>}
  </div>;
}
export function JumperHud(props: Props) {
  const root = useRef<Root | null>(null);
  useEffect(() => { const host = document.createElement('div'); host.dataset.jumperHud = ''; document.body.append(host); const mounted = createRoot(host); root.current = mounted; return () => { props.controls.clear(); root.current = null; host.remove(); queueMicrotask(() => mounted.unmount()); }; }, [props.controls]);
  useEffect(() => { root.current?.render(<Hud {...props} />); }); return null;
}
