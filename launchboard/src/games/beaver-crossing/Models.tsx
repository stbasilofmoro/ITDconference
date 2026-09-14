import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';

type V3 = [number, number, number];
export const INK = '#36333B', GREY = '#969699', LIGHT = '#C4C4C4', ORANGE = '#E89A45', PINK = '#EE6BD2', CARBON = '#2E2A36';
export function Box({ at = [0, 0, 0], size = [1, 1, 1], color = GREY, rotation, round = false }: { at?: V3; size?: V3; color?: string; rotation?: V3; round?: boolean }) {
  const mat = <meshStandardMaterial color={color} roughness={0.82} />;
  return round ? <RoundedBox position={at} args={size} radius={0.07} smoothness={1} rotation={rotation}>{mat}</RoundedBox> : <mesh position={at} rotation={rotation}><boxGeometry args={size} />{mat}</mesh>;
}
export function Cylinder({ at = [0, 0, 0], radius = 0.2, length = 1, color = GREY, rotation }: { at?: V3; radius?: number; length?: number; color?: string; rotation?: V3 }) {
  return <mesh position={at} rotation={rotation}><cylinderGeometry args={[radius, radius, length, 12]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>;
}
function Ball({ at, size, color }: { at: V3; size: V3; color: string }) {
  return <mesh position={at} scale={size}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
}
export function Shadow({ size = [1, 1] }: { size?: [number, number] }) {
  return <mesh position={[-0.1, 0.035, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[size[0], size[1], 1]}><circleGeometry args={[0.6, 16]} /><meshBasicMaterial color="#242127" transparent opacity={0.12} depthWrite={false} /></mesh>;
}
export function Beaver({ celebrate = false }: { celebrate?: boolean }) {
  const arms = useRef<Group>(null!);
  useFrame(({ clock }) => { if (arms.current) arms.current.rotation.z = celebrate ? Math.sin(clock.elapsedTime * 6) * 0.2 : 0; });
  return <group>
    <Shadow size={[0.9, 1.1]} />
    <Ball at={[0, 0.12, -0.45]} size={[0.24, 0.075, 0.43]} color="#655348" />
    {[-0.12, 0.03, 0.18].map((x) => <Box key={x} at={[x, 0.19, -0.52]} size={[0.022, 0.015, 0.4]} color="#8E7560" rotation={[0, -0.25, 0]} />)}
    <Ball at={[0, 0.42, 0]} size={[0.32, 0.38, 0.27]} color="#95745A" />
    <Ball at={[0, 0.43, 0.19]} size={[0.23, 0.25, 0.11]} color="#C6A786" />
    <Box at={[-0.2, 0.09, 0.18]} size={[0.18, 0.13, 0.3]} color="#655348" round />
    <Box at={[0.2, 0.09, 0.18]} size={[0.18, 0.13, 0.3]} color="#655348" round />
    <group ref={arms} position={[0, 0.53, 0]}>
      <Ball at={[-0.31, 0, 0.02]} size={[0.11, 0.19, 0.12]} color="#95745A" />
      <Ball at={[0.31, 0, 0.02]} size={[0.11, 0.19, 0.12]} color="#95745A" />
    </group>
    <Box at={[0, 0.84, 0.06]} size={[0.61, 0.48, 0.5]} color="#95745A" round />
    {[-1, 1].map((s) => <group key={s}>
      <Ball at={[s * 0.27, 1.07, 0.02]} size={[0.11, 0.12, 0.075]} color="#655348" />
      <Ball at={[s * 0.18, 0.9, 0.316]} size={[0.046, 0.06, 0.025]} color="#252229" />
      <Ball at={[s * 0.19, 0.922, 0.337]} size={[0.012, 0.018, 0.012]} color="#FFFFFF" />
      <Ball at={[s * 0.105, 0.74, 0.32]} size={[0.14, 0.1, 0.08]} color="#D3B594" />
      <Box at={[s * 0.055, 0.625, 0.356]} size={[0.09, 0.14, 0.04]} color="#F5EEE2" />
    </group>)}
    <Ball at={[0, 0.8, 0.395]} size={[0.075, 0.05, 0.04]} color="#36333B" />
    <Cylinder at={[0, 1.09, 0.05]} radius={0.3} length={0.055} color="#E6DED0" />
    <Ball at={[0, 1.1, 0.05]} size={[0.235, 0.15, 0.22]} color="#E6DED0" />
  </group>;
}
export function Ties({ count = 4 }: { count?: number }) {
  return <group>{Array.from({ length: count }, (_, i) => <Box key={i} at={[0, 0.1 + Math.floor(i / 3) * 0.18, (i % 3 - 1) * 0.22]} size={[1.15, 0.16, 0.17]} color={i % 2 ? '#D68A3B' : ORANGE} />)}</group>;
}
export function CarbonBag() {
  return <group>
    <Box at={[0, 0.42, 0]} size={[0.65, 0.75, 0.62]} color="#DDDAD4" round />
    <Box at={[0, 0.82, 0]} size={[0.52, 0.06, 0.48]} color={CARBON} />
    {[-0.23, 0.23].map((x) => <mesh key={x} position={[x, 0.86, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.12, 0.025, 4, 8, Math.PI]} /><meshStandardMaterial color="#BDBAB4" /></mesh>)}
    <Box at={[0, 0.4, 0.317]} size={[0.24, 0.22, 0.014]} color={CARBON} />
  </group>;
}
export function Person({ phase = 0, working = false }: { phase?: number; working?: boolean }) {
  const stride = Math.sin(phase * Math.PI * 2) * 0.35;
  return <group>
    <Shadow size={[0.65, 0.7]} />
    <group position={[0, 0.62, 0]} rotation={[working ? -0.35 : 0, 0, 0]}>
      <Box at={[0, 0.12, 0]} size={[0.34, 0.43, 0.22]} color="#A5A19B" round />
      <Box at={[0, 0.48, 0]} size={[0.25, 0.24, 0.23]} color="#BDA58E" round />
      <Cylinder at={[0, 0.61, 0]} radius={0.18} length={0.12} color="#E7DDCB" />
      <Box at={[-0.23, 0.1, 0]} size={[0.12, 0.4, 0.12]} color={GREY} rotation={[working ? -1.1 : stride, 0, 0]} />
      <Box at={[0.23, 0.1, 0]} size={[0.12, 0.4, 0.12]} color={GREY} rotation={[working ? -1.1 : -stride, 0, 0]} />
    </group>
    {[-1, 1].map((s) => <Box key={s} at={[s * 0.11, 0.31, 0]} size={[0.14, 0.53, 0.17]} color="#57565C" rotation={[s * stride, 0, 0]} />)}
  </group>;
}
function Wheels({ length = 1.4, wide = 0.75 }: { length?: number; wide?: number }) {
  return <>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <Cylinder key={`${x}-${z}`} at={[x * length / 2, 0.25, z * wide / 2]} radius={0.25} length={0.17} rotation={[Math.PI / 2, 0, 0]} color="#555459" />))}</>;
}
export function Vehicle({ kind, carbon = false, phase = 0 }: { kind: 'train' | 'loader' | 'forklift' | 'truck'; carbon?: boolean; phase?: number }) {
  if (kind === 'train') return <group>
    <Shadow size={[4.4, 1]} /><Wheels length={3.2} wide={0.7} />
    <Box at={[0, 0.42, 0]} size={[4.4, 0.18, 0.86]} color="#78787B" />
    {[-0.44, 0.44].map((z) => <Box key={z} at={[0, 0.88, z]} size={[4.25, 0.82, 0.1]} color={GREY} />)}
    {[-2.08, 2.08].map((x) => <Box key={x} at={[x, 0.88, 0]} size={[0.1, 0.82, 0.9]} color={GREY} />)}
    {[-1.5, -0.5, 0.5, 1.5].map((x) => <group key={x} position={[x, 0.63, 0]}>{carbon ? <CarbonBag /> : <Ties count={7} />}</group>)}
    {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((x) => <Box key={x} at={[x, 0.87, 0.51]} size={[0.055, 0.85, 0.045]} color="#AAAAAC" />)}
  </group>;
  const truck = kind === 'truck', forklift = kind === 'forklift';
  return <group>
    <Shadow size={[truck ? 3.2 : 2, 1]} /><Wheels length={truck ? 2.3 : 1.15} />
    <Box at={[0, 0.47, 0]} size={[truck ? 3 : 1.7, 0.32, 0.8]} color={GREY} round />
    <Box at={[truck ? 1 : -0.25, 0.94, 0]} size={[0.75, 0.75, 0.75]} color="#AAAAAC" round />
    <Box at={[truck ? 1.1 : -0.22, 1.07, 0.39]} size={[0.52, 0.3, 0.02]} color="#595D63" />
    <Box at={[truck ? 1.39 : 0.14, 1.07, 0]} size={[0.02, 0.3, 0.59]} color="#595D63" />
    {truck ? <group position={[-0.55, 0.65, 0]}>{[-0.65, 0, 0.65].map((x) => <group key={x} position={[x, 0, 0]}>{carbon ? <CarbonBag /> : <Ties count={7} />}</group>)}</group> : forklift ? <group position={[0.85, 0, 0]}>
      <Box at={[0, 0.96, 0]} size={[0.12, 1.65, 0.72]} color="#65656A" />
      <Box at={[0.34, 0.3, 0]} size={[0.8, 0.09, 0.62]} color="#65656A" /><group position={[0.39, 0.35, 0]}><CarbonBag /></group>
    </group> : <group position={[0.4, 0.65, 0]} rotation={[0, 0, Math.sin(phase * Math.PI * 2) * 0.13]}>
      <Box at={[0.35, 0.25, 0]} size={[0.95, 0.15, 0.18]} rotation={[0, 0, 0.35]} color="#B6B6B8" />
      <Box at={[0.9, 0.05, 0]} size={[0.4, 0.4, 0.85]} color="#7E7E82" /><group position={[0.8, 0.26, 0]}>{carbon ? <>{[-0.2, 0, 0.2].map((z) => <Box key={z} at={[0, 0.05, z]} size={[0.3, 0.22, 0.22]} color={CARBON} rotation={[0, 0.2, 0.2]} />)}</> : <Ties count={3} />}</group>
    </group>}
  </group>;
}
export function RotaryKiln({ time = 0 }: { time?: number }) {
  return <group>
    <Shadow size={[1.8, 5]} />
    {[-1.55, 1.55].map((z) => <Box key={z} at={[0, 0.35, z]} size={[1.25, 0.7, 0.6]} color="#87878B" />)}
    <group position={[0, 1, 0]} rotation={[0, 0, time * 0.3]}>
      <Cylinder radius={0.62} length={4.8} rotation={[Math.PI / 2, 0, 0]} color="#9B9B9E" />
      {[0, 1, 2, 3].map((i) => <Box key={i} at={[Math.cos(i * Math.PI / 2) * 0.6, Math.sin(i * Math.PI / 2) * 0.6, 0]} size={[0.055, 0.055, 4.7]} color="#B9B9BC" />)}
    </group>
    {[-2.4, -1.4, 1.4, 2.4].map((z) => <mesh key={z} position={[0, 1, z]}><torusGeometry args={[0.64, 0.045, 6, 16]} /><meshStandardMaterial color="#747479" /></mesh>)}
    <Cylinder at={[0, 1, 2.42]} radius={0.48} length={0.035} rotation={[Math.PI / 2, 0, 0]} color={PINK} />
    <Cylinder at={[0, 2, -1.9]} radius={0.19} length={1.8} color="#85858A" />
  </group>;
}
export function Shredder({ time = 0 }: { time?: number }) {
  return <group>
    <Shadow size={[2, 2]} />
    {[-0.7, 0.7].flatMap((x) => [-0.55, 0.55].map((z) => <Box key={`${x}${z}`} at={[x, 0.8, z]} size={[0.15, 1.6, 0.15]} color="#737379" />))}
    <Box at={[0, 1.4, 0]} size={[1.8, 0.65, 1.45]} color={GREY} />
    <Box at={[0, 1.76, 0]} size={[1.5, 0.07, 1.2]} color={INK} />
    {[-0.34, 0.34].map((z) => <group key={z} position={[0, 1.8, z]} rotation={[time * 2, 0, 0]}><Cylinder length={1.45} radius={0.23} rotation={[0, 0, Math.PI / 2]} color="#707074" />{[-0.5, 0, 0.5].map((x) => <Box key={x} at={[x, 0, 0]} size={[0.17, 0.52, 0.3]} color="#99999B" />)}</group>)}
    <group position={[0, 2.05, 0]} rotation={[0, 0.2, Math.sin(time) * 0.1]}><Ties count={3} /></group>
    {Array.from({ length: 7 }, (_, i) => <Box key={i} at={[(i % 3 - 1) * 0.22, 1.15 - ((time * 0.8 + i / 7) % 1), 0.1]} size={[0.12, 0.15, 0.13]} color={ORANGE} />)}
  </group>;
}
export function SyrupBottle() {
  return <group>
    <Box at={[0, 0.66, 0]} size={[0.8, 1.1, 0.4]} color="#B87B37" round />
    <Cylinder at={[0, 1.27, 0]} radius={0.18} length={0.28} color="#684F3B" />
    <Cylinder at={[0, 1.45, 0]} radius={0.21} length={0.12} color="#DBD5C8" />
    <Box at={[0, 0.67, 0.21]} size={[0.65, 0.62, 0.02]} color="#F0E6D1" />
    <Box at={[0, 0.67, 0.23]} size={[0.23, 0.27, 0.01]} color={ORANGE} rotation={[0, 0, Math.PI / 4]} />
  </group>;
}
