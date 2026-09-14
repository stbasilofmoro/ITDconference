import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import type { IllustrationProps } from './Iso';

export type RecoveredMaterial = 'ties' | 'carbon' | 'metal';
export const MATERIAL_COLORS = { ties: '#E89A45', carbon: '#18BE78', metal: '#B9BAC2' };
export function MaterialModel({ material }: { material: RecoveredMaterial }) {
  if (material === 'ties') return <group>
    {[-0.27, 0, 0.27].map((z, i) => <RoundedBox key={z} position={[0, 0.16 + i * 0.03, z]} args={[1.05, 0.23, 0.22]} radius={0.035} smoothness={1}><meshStandardMaterial color={i === 1 ? '#D58C3B' : '#E89A45'} roughness={0.9} /></RoundedBox>)}
    {[-0.32, 0.32].map((x) => <mesh key={x} position={[x, 0.31, 0]}><boxGeometry args={[0.05, 0.02, 0.8]} /><meshStandardMaterial color="#6B6053" /></mesh>)}
  </group>;
  if (material === 'carbon') return <group>
    <RoundedBox position={[0, 0.4, 0]} args={[0.76, 0.8, 0.67]} radius={0.13} smoothness={2}><meshStandardMaterial color="#DEDCD5" roughness={0.95} /></RoundedBox>
    <mesh position={[0, 0.81, 0]}><boxGeometry args={[0.5, 0.04, 0.44]} /><meshStandardMaterial color="#2E2A36" /></mesh>
    {[-0.24, 0.24].map((x) => <mesh key={x} position={[x, 0.87, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.13, 0.03, 4, 8, Math.PI]} /><meshStandardMaterial color="#B3B1A9" /></mesh>)}
    <mesh position={[0, 0.37, 0.342]}><boxGeometry args={[0.3, 0.32, 0.025]} /><meshStandardMaterial color="#18BE78" /></mesh>
    <mesh position={[0, 0.37, 0.365]}><boxGeometry args={[0.1, 0.13, 0.02]} /><meshStandardMaterial color="#2E2A36" /></mesh>
  </group>;
  return <group>
    <mesh position={[-0.2, 0.28, 0.1]} rotation={[Math.PI / 2, 0, 0.2]}><torusGeometry args={[0.27, 0.12, 6, 12]} /><meshStandardMaterial color="#9C9DA5" metalness={0.35} roughness={0.55} /></mesh>
    <mesh position={[0.25, 0.14, 0.12]} rotation={[0, 0.3, 0.15]}><boxGeometry args={[0.36, 0.2, 0.72]} /><meshStandardMaterial color="#777981" metalness={0.3} roughness={0.6} /></mesh>
    <mesh position={[0.1, 0.3, -0.16]} rotation={[0.2, 0.2, -0.25]}><boxGeometry args={[0.8, 0.1, 0.28]} /><meshStandardMaterial color="#BBBCC1" metalness={0.3} roughness={0.6} /></mesh>
  </group>;
}
export function RecoveredMaterials({ active }: IllustrationProps) {
  const group = useRef<Group>(null!);
  useFrame(({ clock }) => { group.current.position.y = active ? Math.sin(clock.elapsedTime * 2) * 0.05 : 0; });
  return <group ref={group}>
    <RoundedBox position={[0, -0.16, 0]} args={[2.2, 0.22, 1.4]} radius={0.08} smoothness={1}><meshStandardMaterial color="#929296" roughness={0.8} /></RoundedBox>
    <group position={[-0.55, 0, 0.2]}><MaterialModel material="ties" /></group>
    <group position={[0.45, 0, -0.2]}><MaterialModel material="carbon" /></group>
    <group position={[0.55, 0, 0.45]} scale={0.65}><MaterialModel material="metal" /></group>
  </group>;
}
