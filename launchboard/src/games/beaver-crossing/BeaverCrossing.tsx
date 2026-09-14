import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { fonts } from '../../brand';
import type { GameContext } from '../types';
import type { Action } from '../../ui/input';
import { appStore } from '../../state/store';
import { advance, FINISH_ROW, LEVELS, move, newRun, tick, type Run } from './engine';
import { Beaver, SyrupBottle } from './Models';
import { PrizePortal } from './PrizeForm';
import { Yard } from './Yard';

function Label({ children, x, y, size = 28, color = '#59555F', width = 370, center = false }: { children: React.ReactNode; x: number; y: number; size?: number; color?: string; width?: number; center?: boolean }) {
  return <Text font={fonts.medium} fontSize={size} color={color} position={[x, y, 1250]} anchorX={center ? 'center' : 'left'} anchorY="top" maxWidth={width} lineHeight={1.2} textAlign={center ? 'center' : 'left'}>{children}</Text>;
}
function Button({ x, y, width = 330, height = 72, children, onClick, dark = true }: { x: number; y: number; width?: number; height?: number; children: string; onClick(): void; dark?: boolean }) {
  const [hover, setHover] = useState(false);
  const arrowRotation: Record<string, number> = { '↑': 0, '←': Math.PI / 2, '↓': Math.PI, '→': -Math.PI / 2 };
  return <group position={[x, y, 1300]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); onClick(); }} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
    <RoundedBox args={[width, height, 2]} radius={8} smoothness={1}><meshBasicMaterial color={dark ? hover ? '#4A454F' : '#29272E' : hover ? '#E8E5DF' : '#DAD8D3'} toneMapped={false} /></RoundedBox>
    {children in arrowRotation ? <group position={[0, 0, 4]} rotation={[0, 0, arrowRotation[children]]}>
      {/* Geometry avoids a remote fallback-font request for missing arrow glyphs. */}
      {[[0, -3, 0, 6, 32], [-7, 7, -Math.PI / 4, 6, 23], [7, 7, Math.PI / 4, 6, 23]].map(([px, py, rz, w, h], i) => <mesh key={i} position={[px, py, 0]} rotation={[0, 0, rz]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#F2EDE4" toneMapped={false} /></mesh>)}
    </group> : <Text font={fonts.semibold} fontSize={height > 80 ? 46 : 29} color={dark ? '#F2EDE4' : '#38343C'} position={[0, 0, 3]}>{children}</Text>}
  </group>;
}
const HIT_COPY = {
  train: 'A train car got there first.', crew: 'Give the tie gang a little more room.', loader: 'That loader needs a wide berth.', forklift: 'Watch those carbon carriers.', truck: 'Wait for a gap in the trucks.', person: 'Busy people. Small beaver.', heat: 'Too toasty! Wait until the exhaust clears.', throw: 'Timber! Watch the striped landing spots.', grapple: 'Mind the swinging grapple load.',
};

import { ScoreButton } from '../../leaderboard/ScoreButton';
import { scoreStore } from '../../leaderboard/scores';

export default function BeaverCrossing({ ctx }: { ctx: GameContext }) {
  const run = useRef<Run>(newRun()).current;
  const [view, setView] = useState({ level: run.level, phase: run.phase, bestRow: 0, attempts: 0 });
  const [claimOpen, setClaimOpen] = useState(false);
  const claimRef = useRef(false);
  const scoreId = useRef(crypto.randomUUID());
  const refresh = useCallback(() => setView({ level: run.level, phase: run.phase, bestRow: run.bestRow, attempts: run.attempts }), [run]);
  const act = useCallback((action: Action) => {
    if (claimRef.current || scoreStore.getState().open) return;
    if (action === 'select') {
      if (run.phase === 'won') { claimRef.current = true; setClaimOpen(true); }
      else if (run.phase !== 'playing') { advance(run); refresh(); }
      else move(run, 'up');
    } else move(run, action);
  }, [run, refresh]);
  useEffect(() => ctx.input.subscribe(act), [ctx.input, act]);
  useFrame((_, delta) => {
    const before = run.phase, row = run.bestRow;
    if (!document.hidden && !scoreStore.getState().open) tick(run, delta);
    if (before !== run.phase || row !== run.bestRow) {
      if (run.phase === 'hit') ctx.tube.pulse('static');
      if (run.phase === 'cleared' || run.phase === 'won') ctx.tube.pulse('flash');
      refresh();
    }
  });
  // Development-only inspection hooks; production builds never expose level shortcuts.
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __beaver?: unknown };
    w.__beaver = { getState: () => ({ ...run }), action: act, setScenario: (level: number, row = 0, x = 4, time = 0) => {
      Object.assign(run, { level, row, x, time, fromX: x, fromRow: row, hop: 1, phase: 'playing', bestRow: row, hitKind: null }); refresh();
    } };
    return () => { delete w.__beaver; };
  }, [run, act, refresh]);

  const level = LEVELS[view.level];
  const panel = view.phase !== 'playing';
  const result = { id: scoreId.current, game: 'beaver-crossing' as const, score: Math.max(0, (run.level * FINISH_ROW + run.bestRow) * 100 - run.attempts * 10), detail: `${run.phase === 'won' ? 5 : run.level} levels complete / ${run.attempts} retries` };
  return <>
    <Yard key={view.level} run={run} />
    <mesh position={[-690, 0, 1150]}><planeGeometry args={[450, 1040]} /><meshBasicMaterial color="#C4C4C4" toneMapped={false} /></mesh>
    <Label x={-865} y={455} size={25}>ITD / BEAVER CROSSING</Label>
    <Label x={-865} y={395} size={65} color="#26232B">{level.title}</Label>
    <Label x={-865} y={205} size={25}>{level.subtitle}</Label>
    <group position={[-695, 125, 1220]}>{LEVELS.map((l, i) => <mesh key={i} position={[(i - 2) * 70, 0, 0]}><planeGeometry args={[55, 8]} /><meshBasicMaterial color={i <= view.level ? l.accent : '#ABA8AC'} toneMapped={false} /></mesh>)}</group>
    <Label x={-865} y={88} size={30} color="#302C35">{view.phase === 'playing' ? `${String(view.bestRow).padStart(2, '0')} / ${FINISH_ROW} rows crossed` : `Level ${view.level + 1} of 5`}</Label>
    <Label x={-865} y={25} size={28}>{level.tips[0]}</Label>
    <Label x={-865} y={-55} size={26}>{level.tips[1]}</Label>
    <Label x={-865} y={-157} size={23}>ONE PRESS. ONE HOP.</Label>
    <Button x={-695} y={-245} width={90} height={86} onClick={() => act('up')}>↑</Button>
    <Button x={-797} y={-342} width={90} height={86} onClick={() => act('left')}>←</Button>
    <Button x={-695} y={-342} width={90} height={86} onClick={() => act('down')}>↓</Button>
    <Button x={-593} y={-342} width={90} height={86} onClick={() => act('right')}>→</Button>
    <Label x={-865} y={-410} size={22}>Arrows / D-pad · Enter / A to hop</Label>
    <Button x={-695} y={-480} height={48} dark={false} onClick={ctx.exit}>Exit to launchboard</Button>
    <Label x={175} y={-465} size={24} width={1100} center>{`OLD TIES / CARBON / NEW POSSIBILITIES     /     ${view.attempts} ${view.attempts === 1 ? 'retry' : 'retries'}`}</Label>

    {panel && <group>
      <mesh position={[260, 25, 1500]}><planeGeometry args={[1160, 890]} /><meshBasicMaterial color="#25232A" transparent opacity={0.38} toneMapped={false} /></mesh>
      <RoundedBox position={[260, 25, 1550]} args={[830, 790, 8]} radius={18} smoothness={2}><meshBasicMaterial color="#DEDDD8" toneMapped={false} /></RoundedBox>
      <group position={[0, 0, 400]}>
        <Label x={-90} y={360} size={23} width={720} color="#6D6563">{view.phase === 'won' ? 'FIVE CROSSINGS. ONE SWEET FINISH.' : view.phase === 'hit' ? 'A LITTLE SETBACK' : view.phase === 'cleared' ? 'SAFE & SOUND' : level.subtitle}</Label>
        <Label x={-90} y={295} size={62} width={710} color="#29252E">{view.phase === 'won' ? 'Sweet success.' : view.phase === 'hit' ? 'Tail down. Try again.' : view.phase === 'cleared' ? 'Nice crossing.' : 'Meet your beaver.'}</Label>
        <group position={[515, 65, 1300]} rotation={[0.12, -0.35, 0]} scale={view.phase === 'won' ? 100 : 125}>{view.phase === 'won' ? <SyrupBottle /> : <Beaver celebrate={view.phase === 'cleared'} />}</group>
        <Label x={-90} y={166} size={32} width={430} color="#49424B">{view.phase === 'won' ? 'You made it through all five levels. ITD will send you delicious maple syrup for your success.' : view.phase === 'hit' ? HIT_COPY[run.hitKind ?? 'train'] : view.phase === 'cleared' ? `${level.title}: complete. Your next crossing is ready.` : level.story}</Label>
        <Label x={-90} y={-35} size={27} width={690}>{view.phase === 'won' ? 'Share your name, company, phone number, and mailing address to claim your prize.' : view.phase === 'hit' ? 'Restart this level. Your completed levels are safe.' : view.phase === 'cleared' ? `Up next: ${LEVELS[Math.min(view.level + 1, 4)].title}` : 'Hop to the green finish row. Use the arrows, D-pad, or on-screen controls. Enter / A also hops forward.'}</Label>
        <Button x={260} y={-205} width={680} height={82} onClick={() => act('select')}>{view.phase === 'won' ? 'Claim my maple syrup' : view.phase === 'hit' ? 'Try this level again' : view.phase === 'cleared' ? 'Next crossing' : 'Start crossing'}</Button>
        <Label x={260} y={-275} center width={680} size={24}>ENTER / A TO CONTINUE</Label>
        {(view.phase === 'won' || view.phase === 'hit') && <ScoreButton x={260} y={-330} z={1400} result={result} />}
      </group>
    </group>}
    {claimOpen && <PrizePortal onExit={ctx.exit} result={result} />}
  </>;
}
