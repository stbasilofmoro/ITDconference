import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { fonts } from '../../brand';
import { hazardsAt, LEVELS, playerPosition, type Hazard, type Run } from './engine';
import { Beaver, Box, CarbonBag, CARBON, Cylinder, GREY, INK, LIGHT, ORANGE, Person, PINK, RotaryKiln, Shredder, Ties, Vehicle } from './Models';

function Road({ row, train, heat }: { row: number; train: boolean; heat: boolean }) {
  return <group position={[0, 0.025, 6 - row]}>
    <Box size={[9.4, 0.03, train ? 0.94 : 0.9]} color={train ? '#A6A4A3' : heat ? '#A8A3AA' : '#AAA9AB'} />
    {train ? <>
      {Array.from({ length: 16 }, (_, i) => <Box key={i} at={[i * 0.58 - 4.35, 0.02, 0]} size={[0.15, 0.05, 0.9]} color="#8B8177" />)}
      {[-0.28, 0.28].map((z) => <Box key={z} at={[0, 0.08, z]} size={[9.4, 0.06, 0.045]} color="#DEDEDE" />)}
    </> : Array.from({ length: 10 }, (_, i) => <Box key={i} at={[i - 4.5, 0.035, 0]} size={[0.3, 0.015, 0.025]} color="#D3D1D2" />)}
  </group>;
}
function HazardArt({ h, time, level }: { h: Hazard; time: number; level: number }) {
  if (h.kind === 'heat') {
    const active = h.dangerous;
    return <group>
      <Box at={[0, 0.08, 0]} size={[9, 0.055, 0.65]} color={active ? PINK : h.warning ? '#BC82B1' : '#939095'} />
      {Array.from({ length: 12 }, (_, i) => <Box key={i} at={[i * 0.73 - 4, 0.12, 0]} size={[0.035, 0.035, 0.5]} color={active || h.warning ? '#EAD7E5' : '#747076'} rotation={[0, -0.4, 0]} />)}
      {active && Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[i - 4, 0.5 + Math.sin(time * 8 + i) * 0.15, 0]}><coneGeometry args={[0.3, 1.1, 6]} /><meshBasicMaterial color={PINK} transparent opacity={0.4} depthWrite={false} /></mesh>)}
      {(active || h.warning) && <Text font={fonts.semibold} fontSize={0.25} color={INK} position={[0, 0.2, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>{active ? 'EXHAUST — WAIT' : 'VENTING SOON'}</Text>}
    </group>;
  }
  if (h.kind === 'throw') {
    const cycle = h.phase * 5;
    const flight = Math.max(0, Math.min(1, (cycle - 1.8) / 0.65));
    return <group>
      {(h.warning || h.dangerous) && <group>
        <Box at={[0, 0.1, 0]} size={[1.4, 0.04, 0.85]} color={h.dangerous ? ORANGE : '#C2A27E'} />
        {[-0.45, 0, 0.45].map((x) => <Box key={x} at={[x, 0.14, 0]} size={[0.07, 0.03, 0.7]} color="#E5D8C6" rotation={[0, -0.4, 0]} />)}
      </group>}
      <group position={[-0.65, 0, 1]}><Person phase={h.phase * 2} working /></group>
      <group position={[0.6, 0, 1]}><Person phase={h.phase * 2} working /></group>
      {cycle < 3.1 && <Box at={[0, 0.2 + (cycle < 1.8 ? Math.max(0, cycle - 0.5) * 0.35 : Math.sin(flight * Math.PI) * 1.65), 1 - flight]} size={[1.2, 0.16, 0.2]} color={ORANGE} rotation={[0, flight * 2, flight * 3]} />}
    </group>;
  }
  if (h.kind === 'grapple') return <group>
    <Cylinder at={[0, 1.5, 0]} radius={0.035} length={1.2} color={INK} />
    <Box at={[0, 2.1, 0]} size={[0.3, 0.22, 0.3]} color={GREY} />
    {[-1, 1].map((s) => <Box key={s} at={[s * 0.48, 0.83, 0]} size={[0.12, 0.65, 0.14]} rotation={[0, 0, s * -0.5]} color="#66666C" />)}
    <group position={[0, h.dangerous ? 0.35 : 1, 0]}><Ties count={6} /></group>
    {h.dangerous && <Box at={[0, 0.08, 0]} size={[1.8, 0.02, 0.85]} color="#BBA081" />}
  </group>;
  if (h.kind === 'person') return <Person phase={h.phase} />;
  if (h.kind === 'crew') return <group><Person phase={h.phase} working /><Box at={[0.6, 0.32, 0]} size={[0.9, 0.13, 0.18]} color={ORANGE} rotation={[0, 0, Math.sin(time * 3) * 0.3]} /></group>;
  return <group rotation={[0, h.direction < 0 ? Math.PI : 0, 0]}><Vehicle kind={h.kind} carbon={level >= 3} phase={h.phase} /></group>;
}

function MovingHazards({ run }: { run: Run }) {
  const [frame, setFrame] = useState(0);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current > 1 / 30) { last.current = clock.elapsedTime; setFrame((f) => f + 1); }
  });
  void frame;
  return <>{hazardsAt(run.level, run.time).filter((h) => !h.id.endsWith('-throwers')).map((h) => <group key={h.id} position={[h.x - 4, 0, 6 - h.row]}><HazardArt h={h} time={run.time} level={run.level} /></group>)}</>;
}

function Machinery({ run }: { run: Run }) {
  const [time, setTime] = useState(0);
  const last = useRef(0);
  useFrame(({ clock }) => { if (clock.elapsedTime - last.current > 0.1) { last.current = clock.elapsedTime; setTime(run.time); } });
  const level = run.level;
  return <>
    {level === 0 && <>
      {[-4, 0, 4].map((z) => <group key={z} position={[5.6, 0, z]} rotation={[0, Math.PI / 2, 0]}><Ties count={9} /></group>)}
      <group position={[-5.5, 0, -2]}><Cylinder length={2.2} radius={0.06} at={[0, 1.1, 0]} /><Box at={[0, 2, 0]} size={[0.6, 0.15, 0.1]} color={LIGHT} rotation={[0, 0, 0.6]} /><Box at={[0, 2, 0]} size={[0.6, 0.15, 0.1]} color={LIGHT} rotation={[0, 0, -0.6]} /></group>
    </>}
    {level === 1 && <>
      {[1.6, -3.6].map((z) => <group key={z} position={[-5.7, 0, z]} rotation={[0, Math.PI / 2, 0]}><Vehicle kind="train" /></group>)}
      {[4, 9].map((row) => {
        const h = hazardsAt(level, time).find((x) => x.row === row)!;
        const reach = 5.9 - (h.x - 4);
        return <group key={row} position={[5.9, 0, 6 - row]}>
          <group rotation={[0, Math.PI / 2, 0]}><Vehicle kind="truck" /></group>
          <Cylinder at={[0, 1.7, 0]} radius={0.12} length={2.3} />
          <Box at={[-reach / 2, 2.3, 0]} size={[reach, 0.16, 0.16]} color="#79797E" />
          <group position={[0.8, 0, 0.7]} rotation={[0, Math.PI / 2, 0]}><Ties count={12} /></group>
        </group>;
      })}
    </>}
    {level === 2 && <>
      <group position={[-5.9, 0, 3.7]} scale={0.85}><Shredder time={time} /></group>
      <group position={[5.6, 0, 0.5]}><RotaryKiln time={time} /></group>
      <group position={[-5.7, 0, -2.6]}><RotaryKiln time={time} /></group>
      <Box at={[-5.7, 0.6, 1.3]} size={[0.75, 0.15, 2.8]} color="#77777B" rotation={[-0.1, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => <Box key={i} at={[-5.7, 0.78, 2.6 - ((time * 0.8 + i * 0.45) % 2.7)]} size={[0.16, 0.1, 0.13]} color={ORANGE} />)}
      <Box at={[5.2, 0.42, 3.8]} size={[1.1, 0.15, 2.4]} color="#77777B" rotation={[-0.12, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => <Box key={i} at={[5.2, 0.6, 4.9 - ((time * 0.8 + i * 0.4) % 2.4)]} size={[0.2, 0.12, 0.17]} color={ORANGE} />)}
      <Box at={[5.6, 0.55, -2.2]} size={[0.7, 0.3, 1.1]} color={CARBON} />
    </>}
    {level === 3 && <>
      {[-3, 0, 3, 5].map((z) => <group key={z} position={[5.7, 0, z]}><Box at={[0, 0.08, 0]} size={[1.1, 0.16, 1.1]} color="#92877C" /><group position={[0, 0.16, 0]}><CarbonBag /></group></group>)}
      <Box at={[-5.7, 0.08, -1]} size={[1, 0.16, 9]} color="#A7A5A4" />
      {[-3, 0, 3].map((z) => <group key={z} position={[-5.7, 0.16, z]}><CarbonBag /></group>)}
    </>}
    {level === 4 && <>
      <group position={[5.8, 0, 3.7]}>
        <Cylinder at={[0, 0.8, 0]} radius={0.85} length={1.4} color="#969699" />
        <Cylinder at={[0, 1.52, 0]} radius={0.75} length={0.06} color={CARBON} />
        <group position={[0, 1.62, 0]} rotation={[0, time, 0]}><Box size={[1.3, 0.09, 0.09]} color="#B7B7B9" /></group>
        <group position={[-0.8, 1.7, 0]} rotation={[0, 0, -0.7]}><CarbonBag /></group>
        <Box at={[0.8, 1.8, 0]} size={[0.7, 0.4, 0.7]} color="#77747B" rotation={[0, 0, 0.4]} />
        {[0, 1, 2].map((i) => <Box key={`coke-${i}`} at={[0.35, 1.8 - ((time + i / 3) % 1) * 0.4, 0]} size={[0.17, 0.15, 0.18]} color="#4E484F" rotation={[0.3, i, 0.3]} />)}
        {[0, 1, 2].map((i) => <Box key={i} at={[-0.25, 1.65 - ((time + i / 3) % 1) * 0.3, 0]} size={[0.12, 0.1, 0.15]} color={CARBON} />)}
      </group>
      <Box at={[5.8, 0.5, 1]} size={[0.75, 0.2, 3.2]} color="#6F6E75" rotation={[-0.15, 0, 0]} />
      {[0, 1, 2, 3].map((i) => <Box key={i} at={[5.8, 0.68, 2.4 - ((time * 0.7 + i * 0.75) % 3)]} size={[0.4, 0.17, 0.3]} color={CARBON} />)}
      <group position={[5.8, 0, -2.9]}>
        <Box at={[0, 1.25, 0]} size={[1.8, 2.5, 3.1]} color="#929094" round />
        <Box at={[-0.92, 0.85, 0.8]} size={[0.05, 1.1, 1.1]} color="#C6B9B0" />
        <Box at={[-0.96, 0.85, 0.8]} size={[0.02, 0.75, 0.72]} color={PINK} />
        <Cylinder at={[0.4, 3.1, -0.8]} radius={0.3} length={2.2} color="#77767D" />
        <Box at={[0, 1.25, -0.95]} size={[1.86, 0.12, 0.15]} color="#BDBBC0" />
      </group>
      <group position={[-5.7, 0, -4]}><CarbonBag /><group position={[0, 0, 1.2]}><CarbonBag /></group></group>
    </>}
  </>;
}

export function Yard({ run }: { run: Run }) {
  const beaver = useRef<Group>(null!);
  const turn = useRef(0);
  useFrame(() => {
    const p = playerPosition(run);
    beaver.current.position.set(p.x - 4, p.height, 6 - p.row);
    if (run.hop < 1) {
      const dx = run.x - run.fromX, dz = run.fromRow - run.row;
      turn.current = Math.atan2(dx, dz);
    }
    beaver.current.rotation.y = turn.current;
    beaver.current.rotation.z = run.phase === 'hit' ? 0.8 : 0;
  });
  const level = LEVELS[run.level];
  return <group position={[245, -25, 0]} rotation={[0.85, -0.22, 0]} scale={68}>
    <Box at={[0, -0.2, 0]} size={[14, 0.35, 14]} color="#B3B1B0" round />
    <Box at={[0, 0, 0]} size={[9.5, 0.05, 13.5]} color="#B8B7B3" />
    {Array.from({ length: 13 }, (_, row) => <group key={row} position={[0, 0.03, 6 - row]}>
      <Box size={[9.5, 0.02, 0.035]} color="#BCBBB8" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => <Box key={x} at={[x - 4, 0.01, 0]} size={[0.035, 0.01, 0.06]} color="#B1B0AD" />)}
    </group>)}
    {level.lanes.map((l) => <Road key={l.row} row={l.row} train={l.kind === 'train'} heat={l.kind === 'heat'} />)}
    <Box at={[0, 0.05, -6]} size={[9.4, 0.04, 0.85]} color="#98B3A4" />
    <Text font={fonts.semibold} fontSize={0.3} letterSpacing={0.1} color="#335645" position={[0, 0.09, -6]} rotation={[-Math.PI / 2, 0, 0]}>SAFE & SOUND</Text>
    <Text font={fonts.semibold} fontSize={0.2} letterSpacing={0.06} color="#71716E" position={[-2.5, 0.09, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>START HERE</Text>
    <Machinery run={run} />
    <MovingHazards run={run} />
    <group ref={beaver}><Beaver celebrate={run.phase === 'cleared' || run.phase === 'won'} /></group>
    {[-4.8, 4.8].map((x) => <group key={x} position={[x, 0, -6]}><Cylinder at={[0, 0.7, 0]} radius={0.045} length={1.4} color="#747377" /><Box at={[0.28, 1.2, 0]} size={[0.55, 0.32, 0.04]} color={level.accent} /></group>)}
  </group>;
}
