import { useGameAudio, snapshot } from '../../audio/useGameAudio';
import { phoneGameBlocked } from '../../phone/viewport';
import { PhoneButton, PhonePanel, PhonePortal, phoneInput } from '../../phone/PhonePortal';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Line, RoundedBox, Text } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import { fonts } from '../../brand';
import { appStore } from '../../state/store';
import type { GameContext } from '../types';
import { KilnScene } from './KilnScene';
import { ScoreButton } from '../../leaderboard/ScoreButton';
import { scoreStore } from '../../leaderboard/scores';
import { addPiece, clamp, CONDITIONS, GRACE_SECONDS, newRun, RUN_SECONDS, SAFE_MAX, SAFE_MIN, setFeed, start, tick, togglePause, warning, type Run } from './engine';

const RANGE = `${SAFE_MIN}\u2013${SAFE_MAX}\u00b0C`;
function Label({ children, x, y, size = 28, color = '#514A55', width = 380, center = false }: { children: ReactNode; x: number; y: number; size?: number; color?: string; width?: number; center?: boolean }) {
  return <Text font={fonts.medium} fontSize={size} color={color} maxWidth={width} lineHeight={1.14} anchorX={center ? 'center' : 'left'} anchorY="top" textAlign={center ? 'center' : 'left'} position={[x, y, 650]}>{children}</Text>;
}
function Panel({ x, y, width, height, color, z = 600 }: { x: number; y: number; width: number; height: number; color: string; z?: number }) {
  return <mesh position={[x, y, z]}><planeGeometry args={[width, height]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
}
function Button({ x, y, width = 340, height = 68, children, onClick, light = false }: { x: number; y: number; width?: number; height?: number; children: string; onClick(): void; light?: boolean }) {
  const [hover, setHover] = useState(false);
  return <group position={[x, y, 700]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); onClick(); }} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
    <RoundedBox args={[width, height, 3]} radius={8} smoothness={1}><meshBasicMaterial color={light ? hover ? '#E2DFD8' : '#CEC9C5' : hover ? '#49404C' : '#302933'} toneMapped={false} /></RoundedBox>
    <Text font={fonts.semibold} fontSize={29} color={light ? '#39313C' : '#F4EEE6'} position={[0, 0, 5]}>{children}</Text>
  </group>;
}

function TemperatureGraph({ run }: { run: Run }) {
  const x0 = -210, x1 = 835, top = -58, bottom = -328;
  const span = SAFE_MAX - SAFE_MIN;
  const minimum = Math.max(0, SAFE_MIN - span * 0.4), maximum = SAFE_MAX + span * 0.4;
  const mapY = (t: number) => bottom + clamp((t - minimum) / (maximum - minimum), 0, 1) * (top - bottom);
  const startTime = Math.max(0, run.elapsed - 30);
  const mapX = (t: number) => x0 + clamp((t - startTime) / 30, 0, 1) * (x1 - x0);
  const points: [number, number, number][] = run.history.filter((p) => p.time >= startTime).map((p) => [mapX(p.time), mapY(p.temperature), 520]);
  points.push([mapX(run.elapsed) + 0.01, mapY(run.temperature), 520]);
  const outside = warning(run);
  return <>
    <RoundedBox position={[270, -184, 350]} args={[1195, 385, 8]} radius={14} smoothness={1}><meshBasicMaterial color="#D4D0CC" toneMapped={false} /></RoundedBox>
    <Label x={-285} y={-7} size={24} width={800}>TEMPERATURE / LAST 30 SECONDS</Label>
    <Label x={690} y={-8} size={23} width={330} center color="#355E48">{`SAFE BAND ${RANGE}`}</Label>
    <Panel x={(x0 + x1) / 2} y={(top + bottom) / 2} width={x1 - x0} height={top - bottom} color="#BDB9B7" z={420} />
    <Panel x={(x0 + x1) / 2} y={(mapY(SAFE_MAX) + mapY(SAFE_MIN)) / 2} width={x1 - x0} height={mapY(SAFE_MAX) - mapY(SAFE_MIN)} color="#B2C9B6" z={425} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <Panel key={i} x={x0 + i / 6 * (x1 - x0)} y={(top + bottom) / 2} width={1.5} height={top - bottom} color="#AAA9A1" z={430} />)}
    {[SAFE_MIN, SAFE_MAX].map((t) => <group key={t}>
      <Panel x={(x0 + x1) / 2} y={mapY(t)} width={x1 - x0} height={2} color="#71917B" z={435} />
      <Label x={-295} y={mapY(t) + 12} size={23} width={80}>{String(t)}</Label>
    </group>)}
    <Label x={-290} y={top + 28} size={23}>{'\u00b0C'}</Label>
    <Line points={points} color={outside ? '#A13254' : '#73385E'} lineWidth={3.5} />
    <mesh position={[mapX(run.elapsed), mapY(run.temperature), 530]}><circleGeometry args={[6, 16]} /><meshBasicMaterial color={outside ? '#A13254' : '#73385E'} toneMapped={false} /></mesh>
    {[0, 10, 20, 30].map((second) => <Label key={second} x={x0 + second / 30 * (x1 - x0)} y={bottom - 13} size={20} width={90} center>{`${Math.round(startTime + second)}s`}</Label>)}
  </>;
}

function FeedSlider({ run, change }: { run: Run; change(value: number): void }) {
  const dragging = useRef(false);
  const plane = useRef(new Plane(new Vector3(0, 0, 1), -680));
  const point = useRef(new Vector3());
  const left = -240, width = 1000;
  const update = (e: ThreeEvent<PointerEvent>) => {
    if (e.ray.intersectPlane(plane.current, point.current)) {
      appStore.getState().markInput(performance.now()); change(clamp((point.current.x - left) / width, 0, 1));
    }
  };
  return <>
    <Label x={-290} y={-402} size={24} width={600}>CONVEYOR SPEED / DRAG TO ADJUST</Label>
    <Label x={760} y={-391} size={41} width={130} center color="#302833">{`${Math.round(run.feed * 100)}%`}</Label>
    <group>
      <Panel x={left + width / 2} y={-464} width={width} height={12} color="#9C959A" z={655} />
      {run.feed > 0 && <Panel x={left + width * run.feed / 2} y={-464} width={width * run.feed} height={12} color="#E89A45" z={658} />}
      <mesh position={[left + run.feed * width, -464, 670]}><circleGeometry args={[19, 24]} /><meshBasicMaterial color="#EFE8DD" toneMapped={false} /></mesh>
      <mesh position={[left + run.feed * width, -464, 674]}><circleGeometry args={[8, 16]} /><meshBasicMaterial color="#A47646" toneMapped={false} /></mesh>
      <mesh position={[left + width / 2, -464, 680]}
        onPointerDown={(e) => { e.stopPropagation(); dragging.current = true; (e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId); update(e); }}
        onPointerMove={(e) => { if (dragging.current) { e.stopPropagation(); update(e); } }}
        onPointerUp={(e) => { e.stopPropagation(); dragging.current = false; (e.target as unknown as { releasePointerCapture(id: number): void }).releasePointerCapture(e.pointerId); }}
        onPointerCancel={() => { dragging.current = false; }}>
        <planeGeometry args={[width + 40, 60]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
    <Label x={left} y={-495} size={20}>STOPPED</Label>
    <Label x={left + width} y={-495} size={20} width={150} center>FULL SPEED</Label>
  </>;
}

export default function KilnKeeper({ ctx }: { ctx: GameContext }) {
  const [run] = useState(newRun);
  useGameAudio('kiln-keeper', () => snapshot.kiln(run));
  const [, redraw] = useState(0);
  const lastPaint = useRef(0);
  const scoreId = useRef(crypto.randomUUID());
  const refresh = useCallback(() => redraw((v) => v + 1), []);
  const change = useCallback((feed: number) => { setFeed(run, feed); refresh(); }, [run, refresh]);
  const pause = useCallback(() => { togglePause(run); refresh(); }, [run, refresh]);
  const select = useCallback(() => {
    if (scoreStore.getState().open) return;
    if (run.paused) togglePause(run);
    else if (run.phase === 'intro' || run.phase === 'won' || (run.phase === 'cold' && run.animationTime >= 0.6) || (run.phase === 'exploded' && run.animationTime >= 2.2)) { start(run); scoreId.current = crypto.randomUUID(); }
    else addPiece(run);
    refresh();
  }, [run, refresh]);
  useEffect(() => ctx.input.subscribe((action) => {
    if (action === 'select') select();
    else if (action === 'left' || action === 'down') change(run.feed - 0.05);
    else if (action === 'right' || action === 'up') change(run.feed + 0.05);
  }), [ctx.input, run, select, change]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-kiosk-form]') || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      if (e.code === 'KeyP') { e.preventDefault(); pause(); }
      if (e.code === 'KeyX') { e.preventDefault(); change(0); }
    };
    const visibility = () => { if (document.hidden && !run.paused) pause(); };
    window.addEventListener('keydown', key); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); };
  }, [run, pause, change]);
  useFrame(({ clock }, dt) => {
    const phase = run.phase;
    if (!document.hidden && !scoreStore.getState().open && !phoneGameBlocked()) tick(run, dt);
    if (phase !== run.phase) {
      if (run.phase === 'exploded') ctx.tube.pulse('flash');
      else if (run.phase === 'cold') ctx.tube.pulse('static');
      else if (run.phase === 'won') ctx.tube.pulse('flash');
      refresh();
    }
    if (clock.elapsedTime - lastPaint.current >= 1 / 25) { lastPaint.current = clock.elapsedTime; refresh(); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __kilnKeeper?: unknown };
    w.__kilnKeeper = { getState: () => structuredClone(run), setState: (patch: Partial<Run>) => { Object.assign(run, patch); refresh(); } };
    return () => { delete w.__kilnKeeper; };
  }, [run, refresh]);
  const outside = warning(run);
  const debt = Math.max(run.hotTime, run.coldTime);
  const condition = CONDITIONS[run.condition];
  const won = run.phase === 'won', cold = run.phase === 'cold', exploded = run.phase === 'exploded';
  const result = won || (cold && run.animationTime >= 0.6) || (exploded && run.animationTime >= 2.2);
  const modal = run.phase === 'intro' || run.paused || result;
  const quality = Math.round(100 * run.inBand / Math.max(0.01, run.elapsed));

  return <>
    <KilnScene run={run} />
    <PhonePortal><PhonePanel title="Kiln Keeper" status={`${Math.max(0, Math.ceil(RUN_SECONDS - run.elapsed))}s left · Target ${RANGE}`} modal={modal} exit={ctx.exit} result={result ? { id: scoreId.current, game: 'kiln-keeper', score: Math.floor(run.inBand * 100) + (won ? 10000 : 0), detail: `${run.inBand.toFixed(1)} seconds in range / ${won ? 'Batch complete' : cold ? 'Cold batch' : 'Overheated'}` } : undefined}>
      {modal ? <><p>{run.paused ? 'Paused. The conveyor and temperature will wait.' : won ? `Batch complete! ${quality}% of the shift was in range.` : exploded ? 'Too hot for too long. Reduce feed sooner; wood already inside keeps giving off heat.' : cold ? 'The fire went out. Increase feed before the temperature falls too far.' : `Keep the kiln between ${RANGE} for 90 seconds. Adjust the conveyor and drop extra wood. Heat changes take time, so watch the graph and experiment.`}</p><p>{`You have ${GRACE_SECONDS} seconds to recover outside the safe band.`}</p><PhoneButton onPress={select}>{run.paused ? 'Resume the batch' : result ? 'Try a fresh batch' : 'Start the conveyor'}</PhoneButton></> : <>
        <p className="phone-temperature">{Math.round(run.temperature)}°C</p><p>{outside ? `Too ${outside}! ${(Math.max(0, GRACE_SECONDS - debt)).toFixed(1)}s to recover` : `${run.trend >= 0 ? '+' : ''}${run.trend.toFixed(1)}°C/s · In range`}</p>
        <label>Conveyor: {Math.round(run.feed * 100)}%<input aria-label="Conveyor speed" type="range" min="0" max="100" value={Math.round(run.feed * 100)} onChange={(e) => { phoneInput(); change(Number(e.target.value) / 100); }} /></label>
        <div className="phone-row"><PhoneButton onPress={select}>Drop wood</PhoneButton><PhoneButton onPress={() => change(0)}>Stop feed</PhoneButton></div><PhoneButton onPress={pause}>Pause</PhoneButton>
      </>}
    </PhonePanel></PhonePortal>
    <Panel x={-677} y={0} width={430} height={1030} color="#C4C4C4" z={560} />
    <Label x={-865} y={463} size={25}>ITD / CONTROL THE HEAT</Label>
    <Label x={-865} y={405} size={87} color="#2C2630">{'Kiln\nKeeper'}</Label>
    <Label x={-865} y={182} size={24}>{`TARGET ${RANGE}`}</Label>
    <Label x={-865} y={132} size={93} color={outside ? '#9C3253' : '#332B37'}>{`${Math.round(run.temperature)}\u00b0C`}</Label>
    <Label x={-865} y={14} size={27} color={outside ? '#9C3253' : '#5D5260'}>{`${run.trend >= 0 ? '+' : ''}${run.trend.toFixed(1)}\u00b0C / sec`}</Label>
    <Label x={-865} y={-42} size={24} width={360}>{outside === 'hot' ? `TOO HOT / ${(Math.max(0, GRACE_SECONDS - run.hotTime)).toFixed(1)}s to rupture` : outside === 'cold' ? `TOO COLD / ${(Math.max(0, GRACE_SECONDS - run.coldTime)).toFixed(1)}s to failure` : debt > 0 ? 'BACK IN RANGE / recovering' : 'IN RANGE / keep watching'}</Label>
    <Panel x={-695} y={-90} width={340} height={7} color="#AAA3A7" />
    {debt > 0 && <Panel x={-865 + 170 * Math.min(1, debt / GRACE_SECONDS)} y={-90} width={340 * Math.min(1, debt / GRACE_SECONDS)} height={7} color="#BA4464" z={610} />}
    <Button x={-785} y={-146} width={160} onClick={() => change(run.feed - 0.05)}>-  Slower</Button>
    <Button x={-605} y={-146} width={160} onClick={() => change(run.feed + 0.05)}>Faster  +</Button>
    <Button x={-695} y={-231} onClick={select}>Drop wood / A</Button>
    <Button x={-695} y={-316} light onClick={() => change(0)}>Stop feed / X</Button>
    <Label x={-865} y={-367} size={22} width={380}>Arrows / D-pad: adjust speed</Label>
    <Button x={-785} y={-432} width={160} height={55} light onClick={pause}>Pause / P</Button>
    <Button x={-605} y={-432} width={160} height={55} light onClick={ctx.exit}>Exit</Button>
    <Label x={-865} y={-480} size={20}>Arcade simulation</Label>

    <Label x={-305} y={461} size={35} color="#302A35" width={940}>Keep the heat. Make good carbon.</Label>
    <Label x={-305} y={405} size={29} color="#77546B" width={770}>{condition.title}</Label>
    <Label x={-305} y={360} size={25} width={720}>{condition.hint}</Label>
    <Label x={764} y={450} size={53} color="#302A35" center width={220}>{`${Math.max(0, Math.ceil(RUN_SECONDS - run.elapsed))}s`}</Label>
    <Label x={764} y={382} size={23} center width={230}>BATCH REMAINING</Label>
    <TemperatureGraph run={run} />
    <FeedSlider run={run} change={change} />

    {modal && <group position={[0, 0, 1000]}>
      <Panel x={0} y={0} width={1920} height={1080} color="#A6A2A5" z={0} />
      <RoundedBox position={[0, 0, 20]} args={[1370, 840, 8]} radius={20} smoothness={2}><meshBasicMaterial color="#DAD6D1" toneMapped={false} /></RoundedBox>
      <Label x={-565} y={340} size={25} width={1140}>{run.paused ? 'THE BATCH CAN WAIT' : won ? 'BATCH COMPLETE' : exploded ? 'OVERHEAT / KILN RUPTURE' : cold ? 'TOO COLD / BATCH LOST' : 'KILN KEEPER / A 90-SECOND SHIFT'}</Label>
      <Label x={-565} y={263} size={79} color="#2F2733" width={1140}>{run.paused ? 'Paused.' : won ? 'Steady hands. Good carbon.' : exploded ? 'A little too much firepower.' : cold ? 'The fire went out.' : 'Find the sweet spot.'}</Label>
      <Label x={-565} y={82} size={35} width={1120}>{run.paused ? 'Your conveyor, wood and temperature are paused.' : won ? `You kept the kiln running for ${RUN_SECONDS} seconds. ${quality}% of the batch was inside ${RANGE}. ${run.fed} pieces of wood fed.` : exploded ? 'The kiln stayed too hot for too long. Reduce feed sooner: wood already inside keeps giving off heat.' : cold ? 'The kiln stayed below the safe band for too long. Increase the conveyor speed or drop extra wood before the line falls too far.' : `Keep the temperature between ${RANGE}. Adjust the conveyor speed and drop extra wood. Changing loads and draft mean the right setting will keep changing.`}</Label>
      <Label x={-565} y={-97} size={28} width={1130}>{run.paused ? 'Press Enter / A or Resume to carry on.' : result ? `Time in range: ${run.inBand.toFixed(1)}s / Feed changes take time to show their full effect.` : `Watch the graph and experiment. More wood adds heat, less wood lets it cool. You have ${GRACE_SECONDS} seconds to recover outside the safe band.`}</Label>
      <Button x={-150} y={-259} width={825} height={84} onClick={select}>{run.paused ? 'Resume the batch' : result ? 'Try a fresh batch' : 'Start the conveyor'}</Button>
      <Button x={437} y={-259} width={270} height={84} light onClick={ctx.exit}>Launchboard</Button>
      <Label x={-150} y={-331} size={24} center width={825}>ENTER / A TO CONTINUE</Label>
      {result && <ScoreButton x={-150} y={-382} z={1100} result={{ id: scoreId.current, game: 'kiln-keeper', score: Math.floor(run.inBand * 100) + (won ? 10000 : 0), detail: `${run.inBand.toFixed(1)} seconds in range / ${won ? 'Batch complete' : cold ? 'Cold batch' : 'Overheated'}` }} />}
    </group>}
  </>;
}
