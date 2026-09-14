import { useGameAudio, snapshot } from '../../audio/useGameAudio';
import { phoneGameBlocked } from '../../phone/viewport';
import { PhoneButton, PhonePanel, PhonePortal } from '../../phone/PhonePortal';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import type { Group } from 'three';
import { fonts } from '../../brand';
import { MaterialModel, MATERIAL_COLORS, RecoveredMaterials } from '../../illustrations/RecoveredMaterials';
import { appStore } from '../../state/store';
import type { Action } from '../../ui/input';
import type { GameContext } from '../types';
import { command, HEIGHT, landingPair, MATERIALS, newRun, pairCells, ROUND_TARGETS, targetCount, tick, WIDTH, type Cell, type Command, type Material, type Run } from './engine';

const CELL = 55;
const BOARD_X = 25;
const TOP = 335;
const cellX = (x: number) => BOARD_X + (x - (WIDTH - 1) / 2) * CELL;
const cellY = (y: number) => TOP - y * CELL;
const ROUND_NAMES = ['Sort the yard.', 'Recover more.', 'Close the loop.'];
const MATERIAL_NAMES = { ties: 'Railroad ties', carbon: 'Biocarbon bags', metal: 'Scrap metal' };
const MATERIAL_USES = { ties: 'Recover useful material', carbon: 'Put carbon to work', metal: 'Return metal to production' };

function Label({ children, x, y, size = 28, color = '#47424B', width = 380, center = false }: { children: ReactNode; x: number; y: number; size?: number; color?: string; width?: number; center?: boolean }) {
  return <Text font={fonts.medium} fontSize={size} color={color} maxWidth={width} anchorX={center ? 'center' : 'left'} anchorY="top" textAlign={center ? 'center' : 'left'} lineHeight={1.15} position={[x, y, 650]}>{children}</Text>;
}
function Plate({ x, y, w, h, color, z = 600 }: { x: number; y: number; w: number; h: number; color: string; z?: number }) {
  return <mesh position={[x, y, z]}><planeGeometry args={[w, h]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
}
function Arrow({ rotation = 0 }: { rotation?: number }) {
  return <group rotation={[0, 0, rotation]}>{[[0, -3, 0, 5, 26], [-6, 5, -Math.PI / 4, 5, 19], [6, 5, Math.PI / 4, 5, 19]].map(([x, y, angle, w, h], i) => <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#F3F0E8" toneMapped={false} /></mesh>)}</group>;
}
function Button({ x, y, w = 320, h = 68, children, onClick, arrow, secondary = false }: { x: number; y: number; w?: number; h?: number; children?: string; onClick(): void; arrow?: number; secondary?: boolean }) {
  const [hover, setHover] = useState(false);
  return <group position={[x, y, 720]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); onClick(); }} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
    <RoundedBox args={[w, h, 3]} radius={8} smoothness={1}><meshBasicMaterial color={secondary ? hover ? '#E0DED8' : '#CBC8C4' : hover ? '#4A4550' : '#2D2933'} toneMapped={false} /></RoundedBox>
    <group position={[0, 0, 5]}>{arrow !== undefined ? <Arrow rotation={arrow} /> : <Text font={fonts.semibold} fontSize={28} color={secondary ? '#39343D' : '#F4F0E8'}>{children}</Text>}</group>
  </group>;
}
function MaterialBlock({ cell, x, y, marked = false, active = false }: { cell: Pick<Cell, 'material' | 'target'>; x: number; y: number; marked?: boolean; active?: boolean }) {
  const group = useRef<Group>(null!);
  const visual = useRef({ x, y });
  useFrame((_, dt) => {
    const speed = Math.min(1, dt * 24);
    visual.current.x += (x - visual.current.x) * speed; visual.current.y += (y - visual.current.y) * speed;
    group.current.position.set(visual.current.x, visual.current.y, 150);
    group.current.scale.setScalar(marked ? 0.88 + Math.sin(performance.now() / 55) * 0.08 : 1);
  });
  return <group ref={group} position={[x, y, 150]}>
    <RoundedBox args={[CELL - 4, CELL - 4, 9]} radius={5} smoothness={1}><meshBasicMaterial color={marked ? '#F0F6DC' : cell.target ? '#9D9A97' : '#D2D0CA'} toneMapped={false} /></RoundedBox>
    <mesh position={[0, -21, 6]}><planeGeometry args={[36, 4]} /><meshBasicMaterial color={MATERIAL_COLORS[cell.material]} toneMapped={false} /></mesh>
    <group position={[0, -8, 12]} rotation={[0.5, -0.35, 0]} scale={32}><MaterialModel material={cell.material} /></group>
    {cell.target && <>{[-1, 1].map((s) => <mesh key={s} position={[s * 19, 18, 30]} rotation={[0, 0, s * 0.55]}><planeGeometry args={[5, 11]} /><meshBasicMaterial color="#28252E" toneMapped={false} /></mesh>)}</>}
    {active && <mesh position={[0, -19, 32]}><circleGeometry args={[3, 8]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>}
  </group>;
}
function PairLink({ cells }: { cells: { x: number; y: number }[] }) {
  if (cells.length !== 2) return null;
  return <Plate x={(cellX(cells[0].x) + cellX(cells[1].x)) / 2} y={(cellY(cells[0].y) + cellY(cells[1].y)) / 2} w={cells[0].y === cells[1].y ? CELL : 10} h={cells[0].x === cells[1].x ? CELL : 10} color="#E4DED2" z={140} />;
}
function Chamber({ run }: { run: Run }) {
  const ghost = landingPair(run);
  const bonds = new Map<number, { x: number; y: number }[]>();
  run.board.forEach((row, y) => row.forEach((c, x) => { if (c?.bond != null) bonds.set(c.bond, [...(bonds.get(c.bond) ?? []), { x, y }]); }));
  return <>
    <RoundedBox position={[BOARD_X, -22, 0]} args={[508, 902, 45]} radius={22} smoothness={2}><meshStandardMaterial color="#77767A" roughness={0.7} /></RoundedBox>
    <Plate x={BOARD_X} y={-23} w={WIDTH * CELL + 8} h={HEIGHT * CELL + 8} color="#444149" z={35} />
    {Array.from({ length: HEIGHT }, (_, y) => Array.from({ length: WIDTH }, (_, x) => <Plate key={`${x}-${y}`} x={cellX(x)} y={cellY(y)} w={CELL - 2} h={CELL - 2} color={(x + y) % 2 ? '#514D55' : '#555159'} z={40} />))}
    <Label x={BOARD_X} y={411} size={23} color="#DFDCD5" center width={450}>MATERIAL RECOVERY CHAMBER</Label>
    <Label x={BOARD_X} y={-436} size={21} color="#DCD9D4" center width={450}>MATCH 4 / HORIZONTAL OR VERTICAL</Label>
    {ghost && pairCells(ghost).map(({ x, y }, i) => <group key={i}>
      <Plate x={cellX(x)} y={cellY(y)} w={CELL - 8} h={CELL - 8} color="#8C9A8E" z={55} />
      <Plate x={cellX(x)} y={cellY(y)} w={CELL - 14} h={CELL - 14} color="#514D55" z={56} />
    </group>)}
    {[...bonds.entries()].map(([id, cells]) => <PairLink key={id} cells={cells} />)}
    {run.board.flatMap((row, y) => row.map((cell, x) => cell && <MaterialBlock key={cell.id} cell={cell} x={cellX(x)} y={cellY(y)} marked={run.marked.some(([mx, my]) => mx === x && my === y)} />))}
    {run.active && <>
      <PairLink cells={pairCells(run.active)} />
      {pairCells(run.active).map((p, i) => <MaterialBlock key={`active-${i}-${run.dealt}`} cell={{ material: p.material, target: false }} x={cellX(p.x)} y={cellY(p.y)} active />)}
    </>}
  </>;
}

import { ScoreButton } from '../../leaderboard/ScoreButton';
import { scoreStore } from '../../leaderboard/scores';

export default function CarbonSort({ ctx }: { ctx: GameContext }) {
  const run = useRef<Run>(newRun()).current;
  useGameAudio('carbon-sort', () => snapshot.sort(run));
  const [, redraw] = useState(0);
  const lastRevision = useRef(-1);
  const scoreId = useRef(crypto.randomUUID());
  const act = useCallback((action: Command) => { if (scoreStore.getState().open) return; const ended = run.phase === 'won' || run.phase === 'lost'; command(run, action); if (ended && run.phase === 'intro') scoreId.current = crypto.randomUUID(); lastRevision.current = run.revision; redraw((v) => v + 1); }, [run]);
  useEffect(() => ctx.input.subscribe((a: Action) => {
    if (a === 'back') return;
    act(a === 'select' || a === 'up' ? 'rotate' : a);
  }), [ctx.input, act]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-kiosk-form]') || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.code === 'KeyX') { e.preventDefault(); if (!e.repeat) act('drop'); }
      if (e.code === 'KeyP') { e.preventDefault(); if (!e.repeat) act('pause'); }
    };
    const hide = () => { if (document.hidden && !run.paused) act('pause'); };
    window.addEventListener('keydown', key); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', hide); };
  }, [act, run]);
  useFrame((_, dt) => {
    const phase = run.phase;
    if (!document.hidden && !scoreStore.getState().open && !phoneGameBlocked()) tick(run, dt);
    if (phase !== 'clearing' && run.phase === 'clearing') ctx.tube.pulse('flash');
    if (phase !== 'lost' && run.phase === 'lost') ctx.tube.pulse('static');
    if (run.revision !== lastRevision.current) { lastRevision.current = run.revision; redraw((v) => v + 1); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __carbonSort?: unknown };
    w.__carbonSort = { getState: () => structuredClone(run), action: act, setState: (patch: Partial<Run>) => { Object.assign(run, patch); run.revision++; redraw((v) => v + 1); } };
    return () => { delete w.__carbonSort; };
  }, [run, act]);
  const left = targetCount(run.board);
  const pressure = Math.round(left / ROUND_TARGETS[run.round] * 100);
  const modal = run.paused || ['intro', 'round-won', 'won', 'lost'].includes(run.phase);

  return <>
    <Label x={-865} y={460} size={25}>ITD / RECYCLE & REPEAT</Label>
    <PhonePortal><PhonePanel title="Carbon Sort" status={`Round ${run.round + 1} / 3 · ${run.score} points · ${left} stock left`} modal={modal} exit={ctx.exit} result={run.phase === 'won' || run.phase === 'lost' ? { id: scoreId.current, game: 'carbon-sort', score: run.score, detail: `${run.recovered} materials recovered / ${run.targetsCleared} stock cleared` } : undefined}>
      {modal ? <><p>{run.paused ? 'Paused. Your materials will wait.' : run.phase === 'won' ? 'All three rounds recovered!' : run.phase === 'lost' ? 'The chamber is full. Try a fresh start.' : run.phase === 'round-won' ? 'Nothing wasted. This round is complete.' : 'Match four of the same material in a row or column. Clear all marked stock to finish each round.'}</p><PhoneButton onPress={() => act('continue')}>{run.paused ? 'Resume sorting' : run.phase === 'round-won' ? 'Next round' : run.phase === 'won' || run.phase === 'lost' ? 'Play again' : 'Start sorting'}</PhoneButton></> : <>
        <p>Next: {run.next.map((m) => MATERIAL_NAMES[m]).join(' + ')}</p>
        <div className="phone-row"><PhoneButton onPress={() => act('left')}>Left</PhoneButton><PhoneButton onPress={() => act('right')}>Right</PhoneButton></div>
        <div className="phone-row"><PhoneButton onPress={() => act('rotate')}>Rotate</PhoneButton><PhoneButton onPress={() => act('down')}>Lower</PhoneButton></div>
        <div className="phone-row"><PhoneButton onPress={() => act('drop')}>Drop</PhoneButton><PhoneButton onPress={() => act('pause')}>Pause</PhoneButton></div>
      </>}
    </PhonePanel></PhonePortal>
    <Label x={-865} y={396} size={94} color="#29252E" width={480}>Carbon Sort</Label>
    <Label x={-865} y={155} size={30}>{'Small matches.\nA bigger second life.'}</Label>
    {MATERIALS.map((material, i) => <group key={material}>
      <group position={[-815, 13 - i * 105, 350]} rotation={[0.5, -0.4, 0]} scale={58}><MaterialModel material={material} /></group>
      <Label x={-747} y={37 - i * 105} size={29}>{MATERIAL_NAMES[material]}</Label>
      <Label x={-747} y={-3 - i * 105} size={22} width={340}>{MATERIAL_USES[material]}</Label>
    </group>)}
    <Label x={-865} y={-295} size={25}>EMISSIONS INDEX</Label>
    <Label x={-865} y={-330} size={61} color="#315442">{String(pressure).padStart(2, '0')}</Label>
    <Label x={-720} y={-346} size={24} width={250}>{'Clear marked stock\nto bring it down.'}</Label>
    <Plate x={-665} y={-422} w={400} h={12} color="#A7A5A3" />
    {pressure > 0 && <Plate x={-865 + 200 * pressure / 100} y={-422} w={400 * pressure / 100} h={12} color="#18BE78" z={610} />}
    <Label x={-865} y={-449} size={20} width={420}>Game index / not measured CO2 savings</Label>

    <Chamber run={run} />

    <Label x={420} y={457} size={25}>{`ROUND ${run.round + 1} / ${ROUND_TARGETS.length}`}</Label>
    <Label x={420} y={407} size={47} color="#2B2730" width={470}>{ROUND_NAMES[run.round]}</Label>
    <Plate x={637} y={291} w={435} h={130} color="#D3D0CB" />
    <Label x={444} y={335} size={23}>NEXT PAIR</Label>
    {run.next.map((material, i) => <group key={i} position={[665 + i * 93, 282, 660]} rotation={[0.5, -0.35, 0]} scale={60}><MaterialModel material={material} /></group>)}
    <Label x={420} y={191} size={25}>STOCK LEFT</Label>
    <Label x={420} y={146} size={66} color="#2C2931">{String(left).padStart(2, '0')}</Label>
    <Label x={635} y={190} size={25}>SCORE</Label>
    <Label x={635} y={145} size={49} color="#2C2931">{String(run.score).padStart(4, '0')}</Label>
    <Label x={420} y={54} size={26} color={run.combo > 1 ? '#266849' : '#69636B'} width={460}>{run.combo > 1 ? `CHAIN x${run.combo} / KEEP IT CIRCULAR` : `${run.recovered} materials recovered`}</Label>
    <Button x={477} y={-52} w={110} h={83} arrow={Math.PI / 2} onClick={() => act('left')} />
    <Button x={637} y={-52} w={180} h={83} onClick={() => act('rotate')}>Rotate</Button>
    <Button x={797} y={-52} w={110} h={83} arrow={-Math.PI / 2} onClick={() => act('right')} />
    <Button x={517} y={-155} w={190} h={74} onClick={() => act('down')}>Lower</Button>
    <Button x={744} y={-155} w={217} h={74} onClick={() => act('drop')}>Drop / X</Button>
    <Label x={420} y={-220} size={24} width={460}>{'Left / right: move   Down: lower\nUp / Enter / A: rotate   X: drop'}</Label>
    <Label x={420} y={-297} size={24} width={455}>{'Striped corners mark the stock.\nRecycle all of it to finish the round.'}</Label>
    <Button x={517} y={-406} w={190} h={58} secondary onClick={() => act('pause')}>Pause / P</Button>
    <Button x={744} y={-406} w={217} h={58} secondary onClick={ctx.exit}>Exit</Button>
    <Label x={420} y={-460} size={21} width={455}>Build chains. Make room. Keep material moving.</Label>

    {modal && <group position={[0, 0, 1000]}>
      <Plate x={0} y={0} w={1860} h={1030} color="#A7A5A3" z={0} />
      <RoundedBox position={[0, 0, 30]} args={[1380, 800, 10]} radius={20} smoothness={2}><meshBasicMaterial color="#DAD8D2" toneMapped={false} /></RoundedBox>
      <Label x={-580} y={325} size={25} width={1080}>{run.paused ? 'TAKE A BREATHER' : run.phase === 'won' ? 'ALL THREE ROUNDS RECOVERED' : run.phase === 'lost' ? 'THE CHAMBER IS FULL' : run.phase === 'round-won' ? 'ROUND COMPLETE / MATERIAL RECOVERED' : `CARBON SORT / ROUND ${run.round + 1}`}</Label>
      <Label x={-580} y={247} size={78} color="#28242D" width={1140}>{run.paused ? 'Paused.' : run.phase === 'won' ? 'A better kind of chain reaction.' : run.phase === 'lost' ? 'Time for a fresh start.' : run.phase === 'round-won' ? 'Nothing wasted.' : 'Match four. Make a difference.'}</Label>
      <Label x={-580} y={35} size={34} width={730}>{run.paused ? 'Your materials will wait. Resume when you are ready.' : run.phase === 'won' ? `You recovered all 39 marked stock items. ${run.recovered} materials recycled. ${run.score} points earned.` : run.phase === 'lost' ? `You recovered ${run.recovered} materials and scored ${run.score} points. Keep the top clear and use the next pair to plan ahead.` : run.phase === 'round-won' ? `You brought this round's emissions index to zero. ${run.score} points so far. The next round brings more stock and faster pairs.` : 'Turn and place falling pairs. Connect four of the same material in a row or column to recycle them. Clear every marked stock item to finish.'}</Label>
      <group position={[400, -80, 450]} rotation={[0.45, -0.6, 0]} scale={140}><RecoveredMaterials active /></group>
      <Button x={-170} y={-225} w={810} h={85} onClick={() => act('continue')}>{run.paused ? 'Resume sorting' : run.phase === 'won' || run.phase === 'lost' ? 'Play again' : run.phase === 'round-won' ? 'Next round' : 'Start sorting'}</Button>
      <Label x={-170} y={-294} size={24} center width={860}>ENTER / A TO CONTINUE</Label>
      <Button x={464} y={-280} w={230} h={58} secondary onClick={ctx.exit}>Launchboard</Button>
      {(run.phase === 'won' || run.phase === 'lost') && <ScoreButton x={-170} y={-350} z={1100} result={{ id: scoreId.current, game: 'carbon-sort', score: run.score, detail: `${run.recovered} materials recovered / ${run.targetsCleared} stock cleared` }} />}
    </group>}
  </>;
}
