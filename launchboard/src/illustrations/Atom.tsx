import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Box, Cylinder } from '../games/beaver-crossing/Models';
import type { IllustrationProps } from './Iso';

export function AtomBeaver({ power = 'small', stride = 0, core = false }: { power?: string; stride?: number; core?: boolean }) {
  return <group>
    <group position={[-0.12, 0.2, -0.38]} rotation={[0.15, -0.35, 0]}><Box size={[0.45, 0.16, 0.76]} color="#665247" round />{[-0.12, 0, 0.12].map((x) => <Box key={x} at={[x, 0.09, 0]} size={[0.018, 0.015, 0.64]} color="#9B8064" rotation={[0, 0.3, 0]} />)}</group>
    {[-1, 1].map((s) => <group key={s} position={[s * 0.22, 0.28, 0]} rotation={[Math.sin(stride) * s * 0.6, 0, 0]}><Box at={[0, -0.12, 0.08]} size={[0.27, 0.22, 0.43]} color="#605048" round /></group>)}
    <Box at={[0, 0.63, 0]} size={[0.67, 0.79, 0.5]} color="#98765A" round />
    <Box at={[0, 0.59, 0.26]} size={[0.43, 0.52, 0.1]} color="#C4A27B" round />
    <Box at={[0, 1.2, 0.05]} size={[0.74, 0.57, 0.57]} color="#A58362" round />
    {[-1, 1].map((s) => <group key={s}>
      <Cylinder at={[s * 0.31, 1.53, 0.015]} radius={0.13} length={0.12} color="#785E4C" rotation={[Math.PI / 2, 0, 0]} />
      <Box at={[s * 0.21, 1.3, 0.345]} size={[0.08, 0.1, 0.035]} color="#29262E" round /><Box at={[s * 0.21 - 0.015, 1.33, 0.368]} size={[0.025, 0.03, 0.015]} color="#FCF6E8" />
      <Box at={[s * 0.09, 0.96, 0.39]} size={[0.135, 0.21, 0.08]} color="#F5EFDC" />
      <group position={[s * 0.44, 0.9, 0]} rotation={[Math.sin(stride) * -s * 0.45, 0, 0]}><Box at={[0, -0.13, 0]} size={[0.2, 0.4, 0.22]} color="#98765A" round /></group>
    </group>)}
    <Box at={[0, 1.12, 0.4]} size={[0.24, 0.13, 0.12]} color="#41353A" round />
    <Box at={[0, 0.91, 0.31]} size={[0.58, 0.12, 0.11]} color="#287B5A" /><Box at={[-0.29, 0.77, 0.27]} size={[0.14, 0.34, 0.12]} color="#287B5A" rotation={[0, 0, -0.3]} />
    {power !== 'small' && <><Cylinder at={[0, 1.51, 0.06]} radius={0.46} length={0.08} color="#E89A45" /><mesh position={[0, 1.57, 0.05]} scale={[0.37, 0.25, 0.33]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#E89A45" /></mesh></>}
    {power === 'spark' && <group position={[0.46, 0.8, 0.25]}><Box size={[0.23, 0.22, 0.6]} color="#536369" /><Cylinder at={[0, 0, 0.33]} radius={0.12} length={0.15} color="#9CE7B4" rotation={[Math.PI / 2, 0, 0]} /></group>}
    {core && <mesh position={[0, 0.9, 0]} rotation={[0.3, 0.6, 0.3]}><torusGeometry args={[1, 0.035, 5, 32]} /><meshBasicMaterial color="#80FFB5" toneMapped={false} /></mesh>}
  </group>;
}
export function Atom({ active = false }: IllustrationProps) {
  const ref = useRef<Group>(null!); useFrame(({ clock }) => { ref.current.position.y = active ? Math.abs(Math.sin(clock.elapsedTime * 2.5)) * 0.25 : 0; });
  return <group><Box at={[0, -0.12, 0]} size={[1.7, 0.24, 1.25]} color="#77727C" /><group ref={ref}><AtomBeaver power="spark" core={active} /></group></group>;
}
