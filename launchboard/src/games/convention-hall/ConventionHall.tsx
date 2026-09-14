import { useGameAudio, snapshot } from '../../audio/useGameAudio';
import { phoneGameBlocked } from '../../phone/viewport';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { fonts } from '../../brand';
import type { GameContext } from '../types';
import { appStore } from '../../state/store';
import { scoreStore } from '../../leaderboard/scores';
import { ScoreButton } from '../../leaderboard/ScoreButton';
import { HallScene } from './HallScene';
import { HallTouchInput } from './touchInput';
import { TouchHudPortal } from './TouchHud';
import { aim, aimedPerson, CONTACT_GOAL, currentTarget, newRun, scan, SHIFT_SECONDS, start, tick, togglePause, type Controls, type Run } from './engine';
import { ATTENDEE_NAMES, COMPANIES } from './companies';
import { companyTexture } from './logos';

function Label({ children, x, y, size = 26, width = 600, color = '#F3EFE5', center = false }: { children: ReactNode; x: number; y: number; size?: number; width?: number; color?: string; center?: boolean }) { return <Text position={[x, y, 650]} font={fonts.medium} fontSize={size} color={color} maxWidth={width} lineHeight={1.13} anchorX={center ? 'center' : 'left'} anchorY="top" textAlign={center ? 'center' : 'left'}>{children}</Text>; }
function Plate({ x, y, width, height, color = '#342D3B', opacity = 0.92, z = 600 }: { x: number; y: number; width: number; height: number; color?: string; opacity?: number; z?: number }) { return <mesh position={[x, y, z]}><planeGeometry args={[width, height]} /><meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} /></mesh>; }
function Button({ x, y, width = 160, height = 60, children, onClick, hold }: { x: number; y: number; width?: number; height?: number; children: string; onClick?(): void; hold?(down: boolean): void }) {
  const [pressed, setPressed] = useState(false);
  return <group position={[x, y, 750]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); onClick?.(); }}
    onPointerDown={(e) => { if (!hold) return; e.stopPropagation(); appStore.getState().markInput(performance.now()); setPressed(true); hold(true); (e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId); }}
    onPointerUp={(e) => { if (!hold) return; e.stopPropagation(); setPressed(false); hold(false); (e.target as unknown as { releasePointerCapture(id: number): void }).releasePointerCapture(e.pointerId); }}
    onPointerCancel={() => { setPressed(false); hold?.(false); }}>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial color={pressed ? '#477A5C' : '#332D3A'} transparent opacity={0.94} toneMapped={false} /></mesh>
    <Text font={fonts.semibold} position={[0, 0, 4]} fontSize={height >= 80 ? 34 : 25} color="#F5EEE4">{children}</Text>
  </group>;
}
export default function ConventionHall({ ctx }: { ctx: GameContext }) {
  const [run] = useState(newRun), [, redraw] = useState(0);
  useGameAudio('convention-hall', () => snapshot.hall(run));
  const [touch] = useState(() => new HallTouchInput());
  const [touchMode] = useState(() => navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches);
  const paint = useRef(0), scoreId = useRef(crypto.randomUUID()), keys = useRef(new Set<string>()), held = useRef(new Set<string>());
  const drag = useRef<{ id: number; x: number; y: number; distance: number } | null>(null);
  const refresh = useCallback(() => redraw((v) => v + 1), []);
  const clearControls = useCallback(() => { keys.current.clear(); held.current.clear(); drag.current = null; touch.reset(); }, [touch]);
  const select = useCallback(() => {
    if (scoreStore.getState().open) return;
    if (run.paused) { togglePause(run); clearControls(); }
    else if (run.phase === 'intro') start(run);
    else if (run.phase === 'won' || run.phase === 'lost') { Object.assign(run, newRun()); scoreId.current = crypto.randomUUID(); clearControls(); start(run); }
    else { const before = run.found; scan(run); if (run.found > before) ctx.tube.pulse('flash'); if (run.found === CONTACT_GOAL) clearControls(); }
    refresh();
  }, [run, refresh, clearControls, ctx.tube]);
  const pause = useCallback(() => { togglePause(run); clearControls(); refresh(); }, [run, clearControls, refresh]);
  useEffect(() => ctx.input.subscribe((action) => { if (action === 'select') select(); }), [ctx.input, select]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-kiosk-form]') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyP' && !e.repeat) { e.preventDefault(); pause(); return; }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { e.preventDefault(); keys.current.add(e.code); }
    };
    const keyup = (e: KeyboardEvent) => { keys.current.delete(e.code); };
    const hide = () => { clearControls(); if (run.phase === 'playing' && !run.paused) pause(); };
    const visibility = () => { if (document.hidden) hide(); };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', hide); document.addEventListener('visibilitychange', visibility);
    return () => { clearControls(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', visibility); };
  }, [run, pause, clearControls]);
  useFrame((_, dt) => {
    const before = run.health;
    if (!document.hidden && !scoreStore.getState().open && !phoneGameBlocked()) {
      const down = (...codes: string[]) => codes.some((code) => keys.current.has(code) || held.current.has(code)) ? 1 : 0;
      const controls: Controls = { forward: touch.forward + down('KeyW', 'ArrowUp', 'forward') - down('KeyS', 'ArrowDown', 'back'), strafe: touch.strafe + down('KeyD', 'right') - down('KeyA', 'left'), turn: down('ArrowRight', 'KeyE', 'turnRight') - down('ArrowLeft', 'KeyQ', 'turnLeft'), look: 0 };
      const pad = navigator.getGamepads?.().find((p) => p);
      if (pad) {
        const axis = (i: number) => Math.abs(pad.axes[i] ?? 0) > 0.2 ? pad.axes[i] : 0;
        controls.forward += -axis(1) + Number(pad.buttons[12]?.pressed ?? false) - Number(pad.buttons[13]?.pressed ?? false);
        controls.strafe += axis(0); controls.turn += axis(2) + Number(pad.buttons[15]?.pressed ?? false) - Number(pad.buttons[14]?.pressed ?? false); controls.look = -axis(3);
      }
      if (Object.values(controls).some((v) => v !== 0)) appStore.getState().markInput(performance.now());
      tick(run, dt, controls);
      if (run.phase !== 'playing' || run.paused) touch.reset();
    } else clearControls();
    if (run.health < before) ctx.tube.pulse('static');
    paint.current += dt; if (paint.current > 1 / 30) { paint.current = 0; refresh(); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __conventionHall?: unknown };
    w.__conventionHall = { getState: () => structuredClone(run), setState: (patch: Partial<Run>) => { Object.assign(run, patch); refresh(); } };
    return () => { delete w.__conventionHall; };
  }, [run, refresh]);
  const lookMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return; e.stopPropagation();
    const dx = e.nativeEvent.clientX - drag.current.x, dy = e.nativeEvent.clientY - drag.current.y;
    drag.current.distance += Math.abs(dx) + Math.abs(dy); drag.current.x = e.nativeEvent.clientX; drag.current.y = e.nativeEvent.clientY;
    if (drag.current.distance > 5) { aim(run, dx * 0.005, -dy * 0.004); appStore.getState().markInput(performance.now()); }
  };
  const hold = (id: string) => (down: boolean) => { if (down) held.current.add(id); else held.current.delete(id); };
  const company = currentTarget(run) ?? run.targets[run.targets.length - 1], clue = COMPANIES[company], aimed = aimedPerson(run);
  const result = run.phase === 'won' || run.phase === 'lost', modal = run.phase === 'intro' || run.paused || result;
  if (touchMode) return <>
    <HallScene run={run} touch />
    <TouchHudPortal run={run} touch={touch} select={select} pause={pause} exit={ctx.exit} clear={clearControls}
      result={{ id: scoreId.current, game: 'convention-hall', score: run.score, detail: `${run.found} company contacts / ${run.scanCount} scanned badges / ${run.health}% fresh air` }} />
  </>;
  return <>
    <HallScene run={run} />
    <mesh position={[0, 0, 300]} onPointerDown={(e) => { if (modal) return; e.stopPropagation(); drag.current = { id: e.pointerId, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, distance: 0 }; (e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId); }} onPointerMove={lookMove}
      onPointerUp={(e) => { const click = drag.current?.id === e.pointerId && drag.current.distance <= 5; drag.current = null; (e.target as unknown as { releasePointerCapture(id: number): void }).releasePointerCapture(e.pointerId); if (click && !modal) select(); }} onPointerCancel={() => { drag.current = null; }}>
      <planeGeometry args={[1920, 1080]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    {run.hitTime > 0 && <Plate x={0} y={0} width={1920} height={1080} color="#B6AC42" opacity={run.hitTime * 0.35} z={350} />}
    <Plate x={-510} y={377} width={810} height={276} />
    <Label x={-880} y={489} size={24}>CONVENTION HALL / YOUR COMPANY CLUE</Label>
    <mesh position={[-821, 364, 660]}><planeGeometry args={[118, 118]} /><meshBasicMaterial map={companyTexture(company)} toneMapped={false} /></mesh>
    <Label x={-731} y={431} size={29} width={600}>{clue.clue}</Label>
    <Label x={-731} y={310} size={23} width={610} color="#B9DFC6">{`${run.found} / ${CONTACT_GOAL} contacts found / Look for matching badges & booths`}</Label>
    <Plate x={735} y={401} width={330} height={229} />
    <Label x={598} y={487} size={21}>TIME / FRESH AIR</Label>
    <Label x={598} y={448} size={60}>{`${Math.max(0, Math.ceil(SHIFT_SECONDS - run.elapsed))}s`}</Label>
    {[0, 1, 2, 3].map((i) => <Plate key={i} x={626 + i * 70} y={347} width={58} height={17} color={run.health > i * 25 ? '#84C890' : '#736574'} opacity={1} z={655} />)}
    <Label x={598} y={320} size={20}>{`${run.score} points / ${run.scanCount} badges scanned`}</Label>
    <group position={[0, 0, 700]}>
      {[[-17, 0, 10, 2], [17, 0, 10, 2], [0, -17, 2, 10], [0, 17, 2, 10]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0]}><planeGeometry args={[w, h]} /><meshBasicMaterial color={aimed ? '#6EFFAC' : '#FFFFFF'} toneMapped={false} /></mesh>)}
      <mesh><ringGeometry args={[5, 6.5, 20]} /><meshBasicMaterial color={aimed ? '#6EFFAC' : '#FFFFFF'} toneMapped={false} /></mesh>
    </group>
    <Label x={0} y={-39} center width={550} size={22}>{aimed ? aimed.scanned ? 'BADGE VERIFIED' : 'BADGE IN RANGE / SCAN' : 'AIM AT A BADGE'}</Label>
    {run.messageTime > 0 && <><Plate x={0} y={-181} width={1110} height={90} opacity={0.88} /><Label x={0} y={-151} center width={1060} size={26}>{run.message}</Label></>}
    <Button x={-758} y={-298} width={146} hold={hold('forward')}>Forward</Button>
    <Button x={-843} y={-379} width={128} hold={hold('left')}>Left</Button>
    <Button x={-672} y={-379} width={128} hold={hold('right')}>Right</Button>
    <Button x={-758} y={-461} width={146} hold={hold('back')}>Back</Button>
    <Button x={625} y={-298} width={176} hold={hold('turnLeft')}>Look left</Button>
    <Button x={816} y={-298} width={176} hold={hold('turnRight')}>Look right</Button>
    <Button x={721} y={-391} width={367} height={94} onClick={select}>SCAN / A</Button>
    <Button x={625} y={-483} width={176} onClick={pause}>Pause / P</Button>
    <Button x={816} y={-483} width={176} onClick={ctx.exit}>Exit</Button>
    <Label x={0} y={-467} center width={990} size={20}>{'WASD: move / Arrows: walk & turn / Drag: look\nClick, Space or Enter: scan / Controller: sticks + A'}</Label>
    {run.lastScan !== null && <Label x={0} y={-343} center width={860} size={25} color="#DAFFE1">{`LAST SCAN / ${ATTENDEE_NAMES[run.lastScan]} / ${COMPANIES[run.people[run.lastScan].company].name}`}</Label>}
    {modal && <group position={[0, 0, 1100]}>
      <Plate x={0} y={0} width={1920} height={1080} color="#C8C5C2" opacity={1} z={0} />
      <Label x={-790} y={459} color="#6F626F" size={25}>ITD / BADGES, BOOTHS & A BREATH OF FRESH AIR</Label>
      <Label x={-790} y={386} size={90} width={1600} color="#302735">{run.paused ? 'Time for a mint.' : run.phase === 'won' ? 'Well connected.' : run.phase === 'lost' ? run.health === 0 ? 'That was a close conversation.' : 'The hall is closing.' : 'Convention Hall'}</Label>
      <Label x={-790} y={229} size={35} width={1530} color="#514551">{run.paused ? 'Your scanner, the clock, and the vendors are paused.' : result ? `You found ${run.found} of ${CONTACT_GOAL} company contacts, scanned ${run.scanCount} badges, and earned ${run.score} points. ${run.phase === 'won' ? 'Every connection counts.' : 'Try a fresh hall and follow the company emblems.'}` : 'Your scanner is your conversation starter. Follow five company clues, explore the booths, and scan AREMA badges to discover who people work for. Scanned people turn green.'}</Label>
      {!result && !run.paused && <>
        <mesh position={[-706, 14, 680]}><planeGeometry args={[164, 164]} /><meshBasicMaterial map={companyTexture(company)} toneMapped={false} /></mesh>
        <Label x={-566} y={92} size={25} color="#7B5C46" width={1200}>YOUR FIRST CLUE</Label>
        <Label x={-566} y={44} size={35} width={1270} color="#332D3A">{clue.clue}</Label>
        <Label x={-790} y={-128} size={29} width={1550} color="#5A4E5C">Watch out for pushy vendors! Their mouths open before a bad-breath attack. Scan them to stop the clouds, or dodge out of the way. You have three minutes and four fresh-air bars.</Label>
      </>}
      {result && <Label x={-790} y={30} size={31} width={1520} color="#5B4F5E">{run.phase === 'won' ? 'All five companies found. Your time and remaining fresh air earned bonus points.' : run.health === 0 ? 'Scan a vendor while they wind up. Once scanned, they turn green and stop attacking.' : 'Match the clue emblem to booth signs, then scan the exhibitor standing nearby.'}</Label>}
      <Button x={-211} y={-307} width={1150} height={91} onClick={select}>{run.paused ? 'Resume exploring' : result ? 'Try a fresh hall' : 'Enter the hall / Enter / A'}</Button>
      <Button x={612} y={-307} width={427} height={91} onClick={ctx.exit}>Launchboard</Button>
      {result ? <ScoreButton x={-211} y={-423} z={1100} result={{ id: scoreId.current, game: 'convention-hall', score: run.score, detail: `${run.found} company contacts / ${run.scanCount} scanned badges / ${run.health}% fresh air` }} /> : <Label x={-211} y={-398} size={24} center width={1190} color="#5C5060">WASD + drag to look / Click or Space to scan / Touch controls included</Label>}
      <Label x={-790} y={-493} size={19} width={1570} color="#766B77">20 fictional railroad exhibitors / Original company emblems / No real badges or personal information are scanned</Label>
    </group>}
  </>;
}
