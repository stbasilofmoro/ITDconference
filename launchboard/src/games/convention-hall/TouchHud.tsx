import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStore } from 'zustand';
import { fonts } from '../../brand';
import { appStore } from '../../state/store';
import { scoreStore, showScores, type Result } from '../../leaderboard/scores';
import { displayLayout as computeLayout, usePhone } from '../../phone/viewport';
import { aim, aimedPerson, CONTACT_GOAL, currentTarget, SHIFT_SECONDS, type Run } from './engine';
import { COMPANIES } from './companies';
import { companyTexture } from './logos';
import type { HallTouchInput } from './touchInput';
import './touch.css';

type Props = { run: Run; touch: HallTouchInput; result: Result; select(): void; pause(): void; exit(): void; clear(): void };
const markInput = () => appStore.getState().markInput(performance.now());
const stop = (e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); markInput(); };

// Activate directly from pointerdown: secondary fingers do not reliably produce
// a synthesized click. detail=0 still supports native keyboard/assistive clicks.
function TouchButton({ children, onPress, className = '' }: { children: ReactNode; onPress(): void; className?: string }) {
  return <button className={className} onPointerDown={(e) => { stop(e); onPress(); }} onClick={(e) => { e.stopPropagation(); if (e.detail === 0) { markInput(); onPress(); } }}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}>{children}</button>;
}

function Clue({ company }: { company: number }) {
  const c = COMPANIES[company];
  const src = useMemo(() => (companyTexture(company).image as HTMLCanvasElement).toDataURL(), [company]);
  return <div className="hall-clue"><img src={src} alt={`${c.emblem.toLowerCase()} company emblem`} /><div><small>YOUR COMPANY CLUE</small><p>{c.clue}</p></div></div>;
}

function TouchHud({ run, touch, result, select, pause, exit, clear }: Props) {
  const phone = usePhone();
  const tapStart = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const scoresOpen = useStore(scoreStore, (s) => s.open);
  const [viewport, setViewport] = useState(() => ({ width: innerWidth, height: innerHeight }));
  const [, redrawStick] = useState(0);
  const current = useRef({ run, pause, clear }); current.current = { run, pause, clear };
  const finished = run.phase === 'won' || run.phase === 'lost';
  const modal = run.phase === 'intro' || run.paused || finished;
  const enabled = !modal && !scoresOpen;
  useEffect(() => {
    let portrait = innerHeight > innerWidth;
    const resize = () => {
      const nextPortrait = innerHeight > innerWidth;
      current.current.clear();
      if (portrait !== nextPortrait && current.current.run.phase === 'playing' && !current.current.run.paused) current.current.pause();
      portrait = nextPortrait; setViewport({ width: innerWidth, height: innerHeight });
    };
    // Capture-phase cleanup also covers release outside a control, cancellation
    // by the browser, and explicit lost capture. Only the matching finger ends.
    const end = (e: globalThis.PointerEvent) => { touch.end(e.pointerId); redrawStick((n) => n + 1); };
    const reset = () => { touch.reset(); redrawStick((n) => n + 1); };
    window.addEventListener('resize', resize);
    window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true);
    window.addEventListener('lostpointercapture', end, true); window.addEventListener('blur', reset);
    return () => {
      touch.reset(); window.removeEventListener('resize', resize);
      window.removeEventListener('pointerup', end, true); window.removeEventListener('pointercancel', end, true);
      window.removeEventListener('lostpointercapture', end, true); window.removeEventListener('blur', reset);
    };
  }, [touch]);
  useEffect(() => { if (!enabled) { touch.reset(); redrawStick((n) => n + 1); } }, [enabled, touch]);
  if (scoresOpen) return null;
  const layout = computeLayout(viewport.width, viewport.height);
  const center = { left: layout.tubeX + layout.tubeW / 2, top: layout.tubeY + layout.tubeH / 2 };
  const company = currentTarget(run) ?? run.targets[run.targets.length - 1];
  const target = aimedPerson(run);
  const update = (e: PointerEvent) => {
    const p = tapStart.current;
    if (p?.id === e.pointerId && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12) p.moved = true;
    stop(e); const delta = touch.update(e.pointerId, e.clientX, e.clientY);
    aim(run, delta.yaw, delta.pitch); redrawStick((n) => n + 1);
  };
  const begin = (e: PointerEvent<HTMLDivElement>, kind: 'move' | 'look') => {
    stop(e); if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const accepted = kind === 'move' ? touch.beginMove(e.pointerId, phone ? e.clientX : rect.x + rect.width / 2, phone ? e.clientY : rect.y + rect.height / 2, phone ? 45 : rect.width * 0.36) : touch.beginLook(e.pointerId, e.clientX, e.clientY);
    if (phone && kind === 'look' && accepted) tapStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    if (accepted) { e.currentTarget.setPointerCapture(e.pointerId); update(e); }
  };
  return <div className={`hall-touch${modal ? ' hall-touch-modal' : ''}`} onContextMenu={(e) => e.preventDefault()} onPointerDownCapture={markInput}>
    <style>{`@font-face{font-family:HallBarlow;src:url('${fonts.medium}')}@font-face{font-family:HallBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    {modal ? <section className="hall-touch-card" aria-label="Convention Hall menu">
      <small>ITD / CONVENTION HALL</small>
      <h1>{run.paused ? 'Time for a mint.' : run.phase === 'won' ? 'Well connected.' : finished ? run.health === 0 ? 'Time for fresh air.' : 'The hall is closing.' : 'Make a connection.'}</h1>
      {run.paused ? <p>The clock and vendors are paused. Settle your thumbs, then resume.</p> : finished ? <><p>You found {run.found} of {CONTACT_GOAL} company contacts and scanned {run.scanCount} badges.</p><p className="hall-final-score">{run.score.toLocaleString()} points</p><p>{run.phase === 'won' ? 'All five companies found! Time and fresh-air bonuses included.' : 'Follow the company emblems. Scan pushy vendors before they breathe on you.'}</p></> : <>
        <p>Follow five company clues through the exhibit hall. Scan AREMA badges to reveal employers and turn attendees green.</p>
        <Clue company={company} />
        <p><strong>Left thumb: drag to move. Right thumb: drag to look.</strong> {phone ? 'Tap the right side to scan. Both thumbs work together.' : 'Tap Scan while moving or aiming.'} Scan pushy vendors before their bad-breath clouds reach you.</p>
        <p className="hall-muted">Three minutes. Four fresh-air bars. A fresh set of companies each run.</p>
      </>}
      <div className="hall-menu-actions"><TouchButton onPress={select}>{run.paused ? 'Resume exploring' : finished ? 'Try a fresh hall' : 'Enter the hall'}</TouchButton>
        {finished && <TouchButton className="hall-save" onPress={() => { clear(); showScores('convention-hall', result); }}>Save score / Leaderboard</TouchButton>}
        <TouchButton className="hall-secondary" onPress={exit}>Launchboard</TouchButton></div>
      <small className="hall-fiction">20 fictional exhibitors / Simulated badges</small>
    </section> : <>
      <div className="hall-look-area" role="region" aria-label="Look area" onPointerDown={(e) => begin(e, 'look')} onPointerMove={update}
        onPointerCancel={() => { tapStart.current = null; }} onPointerUp={(e) => { const p = tapStart.current; tapStart.current = null; if (phone && p?.id === e.pointerId && !p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) <= 12) select(); }} />
      <header className="hall-touch-header"><div className="hall-clue-card"><Clue company={company} /><span>{run.found} / {CONTACT_GOAL} contacts found</span></div>
        <div className="hall-touch-status"><small>TIME / FRESH AIR</small><strong>{Math.max(0, Math.ceil(SHIFT_SECONDS - run.elapsed))}s</strong>
          <div className="hall-air" aria-label={`${run.health}% fresh air`}>{[0, 1, 2, 3].map((i) => <i key={i} className={run.health > i * 25 ? 'full' : ''} />)}</div><span>{run.score} points</span></div>
      </header>
      <div className={`hall-touch-aim${target ? ' in-range' : ''}`} style={center}><span className="hall-reticle" /><span className="hall-aim-label">{target ? target.scanned ? 'Verified' : 'Scan badge' : 'Aim at a badge'}</span></div>
      {run.messageTime > 0 && <div className="hall-touch-message" role="status">{run.message}</div>}
      <div className="hall-movement"><span>MOVE</span><div className="hall-joystick" role="group" aria-label="Movement joystick" onPointerDown={(e) => begin(e, 'move')} onPointerMove={update}>
        <span className="hall-joystick-cross" /><span className="hall-joystick-thumb" style={{ transform: 'translate(-50%, -50%)', left: `${50 + touch.knobX * 36}%`, top: `${50 + touch.knobY * 36}%` }} />
      </div></div>
      {phone ? <><button className="phone-menu-toggle" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); appStore.getState().markInput(performance.now()); pause(); }} onClick={(e) => { if (e.detail === 0) pause(); }}>Menu</button><div className="phone-gesture-hint">Left: drag to move. Right: drag to look, tap to scan.</div></> : <div className="hall-touch-actions"><span>DRAG THE VIEW TO LOOK</span><TouchButton className="hall-scan" onPress={select}>Scan</TouchButton><div><TouchButton onPress={pause}>Pause</TouchButton><TouchButton onPress={exit}>Exit</TouchButton></div></div>}
      <p className="hall-touch-tip">Move, look, and scan together.<br />{viewport.height > viewport.width ? 'Turn your iPad sideways for a wider view.' : 'Scan a pushy vendor to stop their breath.'}</p>
      {run.hitTime > 0 && <div className="hall-touch-hit" style={{ opacity: run.hitTime * 0.35 }} />}
    </>}
  </div>;
}

// The game lives in the R3F renderer. Native pointer controls belong in a DOM
// root, following the existing prize form, with no 3D raycasting/click synthesis.
export function TouchHudPortal(props: Props) {
  const root = useRef<Root | null>(null);
  useEffect(() => {
    const host = document.createElement('div'); host.dataset.hallTouchHost = ''; document.body.append(host);
    const mounted = createRoot(host); root.current = mounted;
    return () => { props.touch.reset(); root.current = null; host.remove(); queueMicrotask(() => mounted.unmount()); };
  }, [props.touch]);
  useEffect(() => { root.current?.render(<TouchHud {...props} />); });
  return null;
}
