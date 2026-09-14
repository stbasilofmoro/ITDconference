import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Box, Cylinder, Shadow } from '../games/beaver-crossing/Models';
import type { IllustrationProps } from './Iso';

export function KilnDrum({ time = 0, heat = 0.5, explosion = 0 }: { time?: number; heat?: number; explosion?: number }) {
  return <group>
    <Shadow size={[6.8, 2]} />
    {[-0.5, 2.7].map((x) => <group key={x}>
      <Box at={[x, 0.22, 0]} size={[1, 0.44, 1.4]} color="#8D8D92" round />
      {[-0.57, 0.57].map((z) => <Cylinder key={z} at={[x, 0.63, z]} radius={0.22} length={0.8} color="#69696F" rotation={[0, 0, Math.PI / 2]} />)}
    </group>)}
    {[0, 1, 2, 3].map((i) => <group key={i} position={[-1.1 + i * 1.42 + (i - 1.5) * explosion * 1.5, 1.2 + Math.sin(i * 2 + 1) * explosion + explosion, Math.cos(i * 1.7) * explosion]}
      rotation={[time * 0.35 + explosion * (i + 1), explosion * (i - 1), explosion * (i - 1.5) * 0.4]}>
      <Cylinder radius={0.79} length={1.38} rotation={[0, 0, Math.PI / 2]} color={heat > 1 ? '#B3909D' : '#96969A'} />
      {[0, 1, 2, 3, 4, 5].map((j) => <Box key={j} at={[0, Math.cos(j * Math.PI / 3) * 0.8, Math.sin(j * Math.PI / 3) * 0.8]} size={[1.36, 0.045, 0.045]} color="#BABABD" />)}
    </group>)}
    {[-1.78, -0.48, 2.64, 3.88].map((x) => <mesh key={x} position={[x, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.84, 0.055, 6, 24]} /><meshStandardMaterial color="#717177" /></mesh>)}
    {explosion < 0.15 && <>
      <Cylinder at={[-1.82, 1.2, 0]} radius={0.68} length={0.025} rotation={[0, 0, Math.PI / 2]} color="#3D343F" />
      <Cylinder at={[-1.845, 1.2, 0]} radius={0.47} length={0.028} rotation={[0, 0, Math.PI / 2]} color={heat < 0 ? '#5C5860' : '#EE6BD2'} />
    </>}
    <Cylinder at={[3.8, 2.1, 0]} radius={0.23} length={2.1} color="#85858B" />
    <Cylinder at={[3.8, 3.17, 0]} radius={0.29} length={0.13} color="#6B6B72" />
    <Box at={[1.1, 0.12, 0.95]} size={[5.5, 0.12, 0.8]} color="#AAA9AC" />
  </group>;
}
export function RotaryKiln({ active }: IllustrationProps) {
  const drum = useRef<Group>(null!);
  useFrame(({ clock }) => { drum.current.rotation.y = active ? Math.sin(clock.elapsedTime) * 0.045 : 0; });
  return <group ref={drum} position={[-1, 0, 0]}><KilnDrum heat={0.5} /></group>;
}
