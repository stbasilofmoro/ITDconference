import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Box, Cylinder, Shadow } from '../games/beaver-crossing/Models';
import type { IllustrationProps } from './Iso';

export function ScannerModel({ scanning = false }: { scanning?: boolean }) {
  return <group>
    <Box at={[0, 0, 0]} size={[0.34, 0.24, 0.65]} color="#79777D" round />
    <Box at={[0, 0.02, -0.34]} size={[0.3, 0.17, 0.04]} color={scanning ? '#65FFAD' : '#236A54'} />
    <Box at={[0, -0.23, 0.17]} size={[0.2, 0.39, 0.22]} color="#46424B" rotation={[-0.2, 0, 0]} round />
    <Box at={[0, 0.135, 0.08]} size={[0.25, 0.015, 0.3]} color="#32333B" />
    <Box at={[0, 0.146, 0.08]} size={[0.19, 0.01, 0.18]} color="#A6D7B3" />
    <Cylinder at={[0.182, -0.02, 0.12]} radius={0.046} length={0.018} color="#E89A45" rotation={[0, 0, Math.PI / 2]} />
  </group>;
}
export function BadgeScanner({ active = false }: IllustrationProps) {
  const ref = useRef<Group>(null!);
  useFrame(({ clock }) => { ref.current.rotation.y = -0.25 + (active ? Math.sin(clock.elapsedTime * 2) * 0.2 : 0); });
  return <group><Shadow size={[2.6, 2.2]} /><group ref={ref} position={[-0.25, 0.8, 0]} rotation={[0.1, -0.25, 0.3]} scale={2.1}><ScannerModel scanning={active} /></group>
    <Box at={[1, 0.72, -0.25]} size={[0.65, 0.85, 0.05]} color="#EAE4D8" rotation={[0, -0.3, -0.12]} />
    <Box at={[1, 0.95, -0.19]} size={[0.5, 0.16, 0.03]} color="#53505B" rotation={[0, -0.3, -0.12]} />
    <Box at={[1, 0.7, -0.18]} size={[0.26, 0.22, 0.04]} color="#18BE78" rotation={[0, -0.3, -0.12]} />
  </group>;
}
