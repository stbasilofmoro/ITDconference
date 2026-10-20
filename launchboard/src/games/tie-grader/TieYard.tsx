import { memo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { fonts } from '../../brand';
import { RotaryKilnDisplay } from '../../illustrations/RotaryKilnDisplay';
import { Box, CarbonBag, Cylinder, Person, Shadow, Vehicle } from '../beaver-crossing/Models';
import { STATIONS, type Grade, type Run, type StationId, type Tie } from './engine';

const TILT = 0.72;
const INK = '#37383D';
const GREEN = '#409C70';
const AMBER = '#C88C38';
const PINK = '#CF699A';
const ACCENTS: Record<Grade, string> = { grade1: GREEN, grade2: AMBER, junk: PINK };
type V3 = [number, number, number];

function Ball({ at, size, color }: { at: V3; size: V3; color: string }) {
  return <mesh position={at} scale={size}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>;
}

/** Deliberate physical cues: sound square timber, worn timber, or split/rotted timber. */
export function TieModel({ tie, scale = 1 }: { tie: Pick<Tie, 'grade' | 'id'>; scale?: number }) {
  const worn = tie.grade === 'grade2', junk = tie.grade === 'junk';
  const wood = junk ? '#766054' : worn ? '#A27A53' : '#936237';
  return <group scale={scale}>
    {junk ? <>
      <Box at={[-0.46, 0, 0]} size={[0.92, 0.22, 0.32]} color={wood} rotation={[0, 0.055, 0]} />
      <Box at={[0.4, 0.015, 0.035]} size={[0.86, 0.2, 0.3]} color="#806553" rotation={[0, -0.12, -0.04]} />
      <Box at={[0.09, 0.11, 0.02]} size={[0.5, 0.035, 0.09]} color="#352E2A" rotation={[0, -0.28, 0]} />
      <Box at={[-0.64, 0.12, -0.04]} size={[0.38, 0.018, 0.13]} color="#423B32" />
      <Box at={[0.64, 0.13, 0.09]} size={[0.24, 0.02, 0.12]} color="#44382D" rotation={[0, 0.3, 0]} />
      <Box at={[-0.08, -0.015, 0.13]} size={[0.62, 0.06, 0.06]} color="#BA9870" rotation={[0, -0.24, 0]} />
    </> : <>
      <Box size={[1.86, 0.24, 0.34]} color={wood} />
      {[-0.935, 0.935].map((x) => <Box key={x} at={[x, 0, 0]} size={[0.018, 0.235, 0.335]} color={worn ? '#B7956C' : '#C69B68'} />)}
      {worn && <>
        <Box at={[0.21, 0.124, 0.04]} size={[0.74, 0.008, 0.018]} color="#493E34" rotation={[0, 0.14, 0]} />
        <Box at={[0.65, 0.126, -0.08]} size={[0.39, 0.012, 0.07]} color="#CCAE84" rotation={[0, 0.22, 0]} />
        <Box at={[-0.72, 0.128, 0.11]} size={[0.31, 0.014, 0.08]} color="#C3A078" />
      </>}
    </>}
    {[-0.09, 0.04].map((z, i) => <Box key={z} at={[-0.15 + i * 0.17, 0.13, z]} size={[junk ? 0.68 : 1.53, 0.008, 0.012]} color={junk ? '#AA8A68' : '#715137'} rotation={[0, (tie.id % 3 - 1) * 0.012, 0]} />)}
    {[-0.48, 0.48].map((x) => <group key={x}>
      <Box at={[x, 0.132, 0]} size={[0.17, 0.012, 0.28]} color={junk ? '#645345' : '#70533A'} />
      {[-0.08, 0.08].map((z) => <Cylinder key={z} at={[x, 0.142, z]} radius={0.022} length={0.012} color="#403B35" />)}
    </group>)}
  </group>;
}

function StationLabel({ title, detail, color, y = 1.3, width = 3.1, compact = false }: { title: string; detail: string; color: string; y?: number; width?: number; compact?: boolean }) {
  return <group position={[0, y, 0.72]} rotation={[-TILT, 0, 0]}>
    <mesh renderOrder={20}><planeGeometry args={[width, compact ? 0.39 : 0.6]} /><meshBasicMaterial color="#E9E4D7" transparent opacity={0.97} depthTest={false} /></mesh>
    <mesh position={[-width / 2 + 0.035, 0, 0.004]} renderOrder={21}><planeGeometry args={[0.07, compact ? 0.39 : 0.6]} /><meshBasicMaterial color={color} depthTest={false} /></mesh>
    <Text font={fonts.semibold} fontSize={0.255} letterSpacing={0.055} color={INK} position={[0, compact ? 0 : 0.12, 0.01]} renderOrder={22} material-depthTest={false}>{title}</Text>
    {!compact && <Text font={fonts.semibold} fontSize={0.16} letterSpacing={0.045} color={color} position={[0, -0.15, 0.01]} renderOrder={22} material-depthTest={false}>{detail}</Text>}
  </group>;
}

function Station({ id, run, color, onStation, children, width = 3, depth = 2.3 }: { id: StationId; run: Run; color: string; onStation: (id: StationId) => void; children: ReactNode; width?: number; depth?: number }) {
  const station = STATIONS.find((s) => s.id === id)!;
  const active = run.target === id;
  const click = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onStation(id); };
  return <group position={[station.x, 0, station.z]} onClick={click} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Box at={[0, 0.025, 0]} size={[width, 0.04, depth]} color={active ? '#DFE7D9' : '#CECDC5'} />
    {[-1, 1].map((s) => <group key={s}>
      <Box at={[s * (width / 2 - 0.04), 0.06, 0]} size={[0.055, 0.025, depth]} color={color} />
      <Box at={[0, 0.06, s * (depth / 2 - 0.04)]} size={[width, 0.025, 0.055]} color={color} />
    </group>)}
    <mesh position={[0, 0.6, 0]}><boxGeometry args={[width, 1.2, depth]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    {children}
    {active && <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.05, 1.11, 40]} /><meshBasicMaterial color={color} transparent opacity={0.75} depthWrite={false} /></mesh>}
  </group>;
}

function TiePile({ grade, run }: { grade: Grade; run: Run }) {
  const ties = run.piles[grade];
  return <>
    {[-0.67, 0.67].map((x) => <Box key={x} at={[x, 0.15, 0]} size={[0.14, 0.18, 1.55]} color="#8F8878" />)}
    {ties.slice(-9).map((tie, i) => <group key={tie.id} position={[(i % 3 - 1) * 0.03, 0.34 + Math.floor(i / 3) * 0.26, (i % 3 - 1) * 0.43]} rotation={[0, grade === 'junk' ? (i % 3 - 1) * 0.075 : 0, 0]}><TieModel tie={tie} /></group>)}
    {!ties.length && <Text font={fonts.medium} fontSize={0.17} color="#8A8B7C" position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>PLACE TIES HERE</Text>}
    <StationLabel title={grade === 'grade1' ? 'GRADE 1' : grade === 'grade2' ? 'GRADE 2' : 'JUNK'} detail={`${ties.length} ${ties.length === 1 ? 'TIE' : 'TIES'} IN PILE`} color={ACCENTS[grade]} y={1.95} />
  </>;
}

function DeliveryTruck({ grade, count }: { grade: 'grade1' | 'grade2'; count: number }) {
  const color = ACCENTS[grade];
  return <>
    <Shadow size={[4.25, 1.5]} />
    {[-1.25, 1.3].flatMap((x) => [-0.59, 0.59].map((z) => <group key={`${x}-${z}`}>
      <Cylinder at={[x, 0.32, z]} radius={0.31} length={0.18} color="#48494A" rotation={[Math.PI / 2, 0, 0]} />
      <Cylinder at={[x, 0.32, z + Math.sign(z) * 0.1]} radius={0.16} length={0.025} color="#ACAFA9" rotation={[Math.PI / 2, 0, 0]} />
    </group>))}
    <Box at={[0, 0.56, 0]} size={[3.85, 0.23, 1.3]} color="#717975" />
    <Box at={[-0.65, 0.74, 0]} size={[2.5, 0.14, 1.35]} color="#A6ADA7" />
    <Box at={[1.35, 1.12, 0]} size={[1.15, 1.05, 1.24]} color="#D5D7CA" round />
    <Box at={[1.65, 0.87, 0]} size={[0.63, 0.46, 1.3]} color={color} round />
    <Box at={[1.94, 0.68, 0]} size={[0.06, 0.13, 1.37]} color="#6D7772" />
    {[-0.63, 0.63].map((z) => <group key={z}>
      <Box at={[1.28, 1.29, z]} size={[0.76, 0.39, 0.026]} color="#53676B" />
      <Box at={[1.14, 0.92, z]} size={[0.58, 0.14, 0.035]} color={color} />
      <Box at={[1.06, 1.03, z + Math.sign(z) * 0.015]} size={[0.13, 0.035, 0.035]} color="#68746E" />
    </group>)}
    <Box at={[1.93, 1.3, 0]} size={[0.03, 0.37, 1.04]} color="#53676B" />
    {[-0.46, 0.46].map((z) => <Box key={z} at={[1.99, 0.9, z]} size={[0.02, 0.14, 0.19]} color="#FFF0C1" />)}
    {[-1.75, 0.48].flatMap((x) => [-0.65, 0.65].map((z) => <Box key={`${x}-${z}`} at={[x, 1.03, z]} size={[0.07, 0.65, 0.07]} color="#818B82" />))}
    {Array.from({ length: Math.min(9, count) }, (_, i) => <group key={i} position={[-0.64, 0.94 + Math.floor(i / 3) * 0.25, (i % 3 - 1) * 0.4]}><TieModel tie={{ id: i, grade }} /></group>)}
    <StationLabel title={`${grade === 'grade1' ? 'GRADE 1' : 'GRADE 2'} TRUCK · ${count}`} detail="" color={color} y={2.8} width={3.9} compact />
  </>;
}

function JunkShredder({ run }: { run: Run }) {
  const shafts = useRef<Group>(null!);
  useFrame(({ clock }) => { shafts.current.children.forEach((g, i) => { g.rotation.x = clock.elapsedTime * (i ? -1.6 : 1.6); }); });
  return <>
    <Shadow size={[3, 2]} />
    {[-1, 1].flatMap((x) => [-0.6, 0.6].map((z) => <Box key={`${x}/${z}`} at={[x, 0.52, z]} size={[0.18, 1.05, 0.2]} color="#778078" />))}
    <Box at={[0, 0.93, 0]} size={[2.6, 0.55, 1.65]} color="#A4ABA2" />
    <Box at={[0, 1.23, 0]} size={[2.25, 0.05, 1.3]} color="#353C38" />
    <group ref={shafts}>
      {[-0.34, 0.34].map((z) => <group key={z} position={[0, 1.28, z]}>
        <Cylinder radius={0.18} length={2.08} rotation={[0, 0, Math.PI / 2]} color="#757C74" />
        {[-0.85, -0.5, -0.15, 0.2, 0.55, 0.9].map((x) => <Box key={x} at={[x, 0, 0]} size={[0.15, 0.44, 0.3]} color="#BEC1B6" />)}
      </group>)}
    </group>
    {[-0.88, 0.88].map((z) => <Box key={z} at={[0, 1.47, z]} size={[2.85, 0.55, 0.14]} color="#AAB1A8" rotation={[Math.sign(z) * -0.25, 0, 0]} />)}
    {[-1.4, 1.4].map((x) => <Box key={x} at={[x, 1.47, 0]} size={[0.14, 0.55, 1.9]} color="#949E94" rotation={[0, 0, Math.sign(x) * 0.24]} />)}
    <Box at={[0, 0.94, 0.84]} size={[2.4, 0.23, 0.02]} color={PINK} />
    {Array.from({ length: 7 }, (_, i) => <Box key={i} at={[-1.02 + i * 0.34, 0.94, 0.86]} size={[0.13, 0.23, 0.02]} color="#414540" rotation={[0, 0, -0.4]} />)}
    <Box at={[-1.65, 0.8, 0]} size={[0.45, 0.56, 0.61]} color="#758479" />
    <Cylinder at={[-1.65, 1.11, 0]} radius={0.08} length={0.09} color={PINK} />
    <StationLabel title={`SHREDDER · ${run.delivered.junk}`} detail="" color={PINK} y={2.8} width={3.9} compact />
  </>;
}

function WorkingBeaver({ run }: { run: Run }) {
  const beaver = useRef<Group>(null!), body = useRef<Group>(null!);
  const leftFoot = useRef<Group>(null!), rightFoot = useRef<Group>(null!);
  const previous = useRef({ x: run.player.x, z: run.player.z });
  useFrame(({ clock }, delta) => {
    const { x, z, facing } = run.player;
    const moving = Math.hypot(x - previous.current.x, z - previous.current.z) > 0.001;
    previous.current = { x, z };
    beaver.current.position.set(x, 0.03, z);
    const difference = Math.atan2(Math.sin(facing - beaver.current.rotation.y), Math.cos(facing - beaver.current.rotation.y));
    beaver.current.rotation.y += difference * Math.min(1, delta * 16);
    body.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.06 : Math.sin(clock.elapsedTime * 2.4) * 0.012;
    leftFoot.current.rotation.x = moving ? Math.sin(clock.elapsedTime * 12) * 0.25 : 0;
    rightFoot.current.rotation.x = -leftFoot.current.rotation.x;
  });
  return <group ref={beaver} scale={1.3}>
    <Shadow size={[1.25, 1.3]} />
    <group ref={body}>
      <Ball at={[0, 0.11, -0.58]} size={[0.3, 0.08, 0.53]} color="#6C5140" />
      {[-0.14, 0, 0.14].map((x) => <Box key={x} at={[x, 0.19, -0.64]} size={[0.024, 0.014, 0.58]} color="#997655" rotation={[0, -0.25, 0]} />)}
      <Ball at={[0, 0.52, 0]} size={[0.36, 0.45, 0.3]} color="#957151" />
      <Ball at={[0, 0.5, 0.22]} size={[0.27, 0.31, 0.12]} color="#D2B18A" />
      {[-1, 1].map((s) => <group key={s}>
        <Box at={[s * 0.255, 0.55, 0.15]} size={[0.13, 0.43, 0.24]} color="#E5A64C" round />
        <Box at={[s * 0.255, 0.5, 0.281]} size={[0.13, 0.055, 0.018]} color="#F6E7B8" />
        <group position={[s * 0.36, 0.64, 0.05]} rotation={[run.held ? -1.55 : -0.05, 0, s * -0.18]}>
          <Ball at={[0, -0.1, 0]} size={[0.115, 0.23, 0.12]} color="#957151" />
          <Ball at={[0, -0.26, 0.01]} size={[0.13, 0.115, 0.13]} color="#70513D" />
        </group>
      </group>)}
      <Box at={[0, 1.01, 0.065]} size={[0.67, 0.51, 0.54]} color="#9C7857" round />
      {[-1, 1].map((s) => <group key={s}>
        <Ball at={[s * 0.3, 1.24, 0.01]} size={[0.115, 0.13, 0.09]} color="#70513D" />
        <Ball at={[s * 0.19, 1.065, 0.345]} size={[0.045, 0.061, 0.028]} color="#27292A" />
        <Ball at={[s * 0.2, 1.085, 0.367]} size={[0.012, 0.017, 0.012]} color="#FFFFFF" />
        <Ball at={[s * 0.115, 0.9, 0.36]} size={[0.15, 0.11, 0.085]} color="#DFC09B" />
        <Box at={[s * 0.057, 0.785, 0.395]} size={[0.095, 0.15, 0.05]} color="#FFF2D9" />
      </group>)}
      <Ball at={[0, 0.955, 0.435]} size={[0.085, 0.052, 0.045]} color="#36343A" />
      <Cylinder at={[0, 1.27, 0.04]} radius={0.37} length={0.055} color="#F4DEAB" />
      <Ball at={[0, 1.3, 0.04]} size={[0.29, 0.19, 0.265]} color="#F4DEAB" />
      <Box at={[0, 1.39, 0.12]} size={[0.075, 0.12, 0.28]} color="#E4C78F" round />
      {run.held && <group position={[0, 0.69, 0.44]} scale={0.9}><TieModel tie={run.held.tie} />{run.held.graded && <Box at={[0, 0.13, 0]} size={[0.11, 0.02, 0.36]} color={ACCENTS[run.held.graded]} />}</group>}
    </group>
    <group ref={leftFoot} position={[-0.23, 0.16, 0]}><Box at={[0, -0.06, 0.18]} size={[0.2, 0.14, 0.38]} color="#65503E" round /></group>
    <group ref={rightFoot} position={[0.23, 0.16, 0]}><Box at={[0, -0.06, 0.18]} size={[0.2, 0.14, 0.38]} color="#65503E" round /></group>
  </group>;
}

const PlantActivity = memo(function PlantActivity() {
  const forklift = useRef<Group>(null!), chips = useRef<Group>(null!), crew = useRef<Group>(null!), steam = useRef<Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const route = Math.sin(t * 0.17);
    forklift.current.position.x = route * 5.4;
    forklift.current.rotation.y = Math.cos(t * 0.17) < 0 ? Math.PI : 0;
    crew.current.position.x = -4.3 + Math.sin(t * 0.22) * 0.6;
    crew.current.rotation.y = Math.cos(t * 0.22) < 0 ? -Math.PI / 2 : Math.PI / 2;
    chips.current.children.forEach((child, i) => { child.position.z = 4.3 - (t * 1.1 + i * 0.64) % 9.2; });
    steam.current.children.forEach((child, i) => {
      const progress = (t * 0.15 + i / 4) % 1;
      child.position.set(0.4 * progress, progress * 1.2, 0);
      child.scale.setScalar(0.1 + progress * 0.27);
      child.visible = progress < 0.88;
    });
  });
  return <>
    <Box at={[0, 0.035, -4.5]} size={[17, 0.045, 1.2]} color="#A4AAA2" />
    {Array.from({ length: 18 }, (_, i) => <Box key={i} at={[-8.15 + i * 0.94, 0.065, -4.5]} size={[0.37, 0.025, 0.035]} color="#E3DFCF" />)}
    <group ref={forklift} position={[0, 0.08, -4.5]} scale={0.65}><Vehicle kind="forklift" /></group>
    <group position={[-1.1, 0, -6.65]} scale={0.43}><RotaryKilnDisplay /></group>
    <group ref={steam} position={[0.88, 3.22, -6.65]}>{[0, 1, 2, 3].map((i) => <mesh key={i}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#D9D8D1" transparent opacity={0.24 - i * 0.035} depthWrite={false} /></mesh>)}</group>
    <group ref={crew} position={[-4.3, 0.08, -6]} scale={0.7}><Person phase={0.14} /></group>
    <group position={[3.3, 0.08, -6]} rotation={[0, -0.9, 0]} scale={0.68}><Person working /></group>
    <Box at={[4.3, 0.72, -6.5]} size={[1, 1.35, 0.62]} color="#89958B" />
    <Box at={[4.3, 0.93, -6.17]} size={[0.61, 0.42, 0.02]} color="#4E6256" />
    {[0, 1, 2].map((i) => <Cylinder key={i} at={[4.08 + i * 0.22, 0.57, -6.16]} radius={0.045} length={0.03} color={i === 2 ? '#CE9C53' : '#70B589'} rotation={[Math.PI / 2, 0, 0]} />)}
    <Box at={[8.05, 0.47, -0.25]} size={[0.8, 0.17, 9.5]} color="#65726B" />
    {[-4.25, -0.25, 3.75].map((z) => <Box key={z} at={[8.05, 0.23, z]} size={[0.7, 0.46, 0.17]} color="#92998F" />)}
    {[7.56, 8.54].map((x) => <Box key={x} at={[x, 0.6, -0.25]} size={[0.085, 0.15, 9.7]} color="#AEB6AA" />)}
    <group ref={chips}>{Array.from({ length: 14 }, (_, i) => <Box key={i} at={[8.05 + Math.sin(i * 4) * 0.19, 0.61, 0]} size={[0.16 + (i % 3) * 0.04, 0.1, 0.18]} rotation={[0, i * 0.8, 0]} color={i % 3 ? '#A38359' : '#574D3E'} />)}</group>
    {[-7.6, -6.6].flatMap((x) => [-6.7, -5.65].map((z) => <group key={`${x}/${z}`} position={[x, 0.08, z]} scale={0.8}><CarbonBag /></group>))}
    <Text font={fonts.semibold} fontSize={0.19} letterSpacing={0.12} color="#616F63" position={[-6.95, 0.12, -7.7]} rotation={[-Math.PI / 2, 0, 0]}>BIOCARBON OUT</Text>
  </>;
});

const YardFloor = memo(function YardFloor() {
  return <>
    <Box at={[0, -0.23, -1]} size={[18.4, 0.45, 14.5]} color="#A4ADA1" round />
    <Box at={[0, 0, -0.25]} size={[17.9, 0.03, 12.4]} color="#BEC2B5" />
    {[-3.75, -0.3, 3.1].map((z) => <Box key={z} at={[0, 0.028, z]} size={[17.8, 0.012, 0.025]} color="#ADBAA8" />)}
    {[-8.5, -4, 0.5, 8.7].map((x) => <Box key={x} at={[x, 0.03, 0.5]} size={[0.025, 0.012, 10.4]} color="#AFB8A7" />)}
    {[0, 1, 2].map((row) => <group key={row} position={[1.3, 0.07, -2.5 + row * 3.25]}>
      {[0, 1, 2].map((i) => <group key={i} position={[i * 0.55 - 0.55, 0, 0]}><Box size={[0.28, 0.012, 0.055]} color="#E4E6D7" rotation={[0, -0.65, 0]} at={[0, 0, -0.075]} /><Box size={[0.28, 0.012, 0.055]} color="#E4E6D7" rotation={[0, 0.65, 0]} at={[0, 0, 0.075]} /></group>)}
    </group>)}
    {[-8.5, 8.8].flatMap((x) => [-7.6, 5.8].map((z) => <group key={`${x}/${z}`} position={[x, 0.05, z]}>
      <Box at={[0, 0.05, 0]} size={[0.4, 0.08, 0.4]} color="#677464" />
      <mesh position={[0, 0.26, 0]}><coneGeometry args={[0.15, 0.43, 8]} /><meshStandardMaterial color="#D0A15B" /></mesh>
      <Cylinder at={[0, 0.25, 0]} radius={0.105} length={0.07} color="#F0E8C8" />
    </group>))}
    <Text font={fonts.semibold} fontSize={0.24} letterSpacing={0.16} color="#6E7D6C" position={[0, 0.06, 5.9]} rotation={[-Math.PI / 2, 0, 0]}>RECLAIM  /  REUSE  /  RENEW</Text>
  </>;
});

export function TieYard({ run, onStation }: { run: Run; onStation: (id: StationId) => void }) {
  return <group position={[0, -20, 0]} rotation={[TILT, 0, 0]} scale={70}>
    <YardFloor />
    <PlantActivity />
    <Station id="incoming" run={run} color="#6A827C" onStation={onStation} width={2.8} depth={3.45}>
      {[-0.85, 0.85].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}/${z}`} at={[x, 0.43, z]} size={[0.12, 0.84, 0.12]} color="#858E82" />))}
      <Box at={[0, 0.82, 0]} size={[2.5, 0.15, 2.85]} color="#8D988E" />
      {Array.from({ length: 8 }, (_, i) => <Cylinder key={i} at={[0, 0.94, -1.18 + i * 0.34]} radius={0.1} length={2.3} rotation={[0, 0, Math.PI / 2]} color="#BBC1B5" />)}
      {run.incoming.slice(0, 5).map((tie, i) => <group key={tie.id} position={[0, 1.13 + (i === 0 ? 0.06 : 0), 1.05 - i * 0.5]}><TieModel tie={tie} /></group>)}
      <StationLabel title="INCOMING TIES" detail={`${run.incoming.length} WAITING · PICK ONE UP`} color="#5F7871" y={2.15} width={3.2} />
    </Station>
    {(['grade1', 'grade2', 'junk'] as const).map((grade) => <Station key={grade} id={grade} run={run} color={ACCENTS[grade]} onStation={onStation}><TiePile grade={grade} run={run} /></Station>)}
    <Station id="truck1" run={run} color={GREEN} onStation={onStation} width={4.5} depth={2.35}><DeliveryTruck grade="grade1" count={run.delivered.grade1} /></Station>
    <Station id="truck2" run={run} color={AMBER} onStation={onStation} width={4.5} depth={2.35}><DeliveryTruck grade="grade2" count={run.delivered.grade2} /></Station>
    <Station id="shredder" run={run} color={PINK} onStation={onStation} width={4.5} depth={2.35}><JunkShredder run={run} /></Station>
    <WorkingBeaver run={run} />
  </group>;
}
