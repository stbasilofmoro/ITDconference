import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Box, Cylinder, Shadow } from '../beaver-crossing/Models';
import { KilnDrum } from '../../illustrations/RotaryKiln';
import { BELT_END, SAFE_MAX, SAFE_MIN, type Run } from './engine';

export function KilnScene({ run }: { run: Run }) {
  const rumble = useRef<Group>(null!);
  const hot = (run.temperature - SAFE_MIN) / (SAFE_MAX - SAFE_MIN);
  const burst = run.phase === 'exploded' ? Math.min(2.2, run.animationTime * 1.7) : 0;
  useFrame(({ clock }) => {
    rumble.current.position.y = run.hotTime > 0 && run.phase === 'running' ? Math.sin(clock.elapsedTime * 40) * run.hotTime * 0.012 : 0;
  });
  return <group position={[345, 115, 0]} rotation={[0.42, -0.3, 0]} scale={78}>
    <Box at={[-0.9, -0.17, 0]} size={[12, 0.25, 3.4]} color="#B5B4B3" round />
    <group ref={rumble}><KilnDrum time={run.elapsed} heat={hot} explosion={burst} /></group>
    <group position={[-4.25, 0, 0]}>
      <Shadow size={[4.5, 1.5]} />
      {[-1.65, 1.65].map((x) => <Box key={x} at={[x, 0.35 + (x + 1.65) * 0.13, 0]} size={[0.18, 0.7 + (x + 1.65) * 0.26, 0.95]} color="#77777D" />)}
      <group position={[0, 1, 0]} rotation={[0, 0, 0.2]}>
        <Box size={[4.3, 0.18, 1.08]} color="#76747B" round />
        {Array.from({ length: 12 }, (_, i) => <Cylinder key={i} at={[-2 + i * 0.36, 0.05, 0]} radius={0.11} length={1.12} color="#9C9BA0" rotation={[Math.PI / 2, 0, 0]} />)}
        {Array.from({ length: 14 }, (_, i) => <Box key={i} at={[-2.05 + ((i * 0.3 + run.beltDistance * 2.6) % 4.2), 0.17, 0]} size={[0.035, 0.035, 0.95]} color="#49464E" />)}
        {[-0.61, 0.61].map((z) => <Box key={z} at={[0, 0.24, z]} size={[4.5, 0.16, 0.08]} color="#B2B0B4" />)}
      </group>
      <Box at={[-1.65, 0.6, 0.8]} size={[0.75, 0.5, 0.55]} color="#99989D" round />
      <Cylinder at={[-1.65, 0.62, 1.1]} radius={0.2} length={0.04} rotation={[Math.PI / 2, 0, 0]} color="#747179" />
    </group>
    <Box at={[-6.1, 1.5, 0]} size={[1.25, 0.5, 1.2]} color="#9C999B" />
    <Box at={[-6.1, 1.77, 0]} size={[1, 0.06, 0.95]} color="#625D5B" />
    {run.pieces.map((piece) => {
      const progress = piece.progress / BELT_END;
      const drop = Math.max(0, (piece.progress - BELT_END) / 0.2);
      return <Box key={piece.id} at={[-6.2 + Math.min(1, progress) * 4.25 + drop * 0.16, 0.85 + Math.min(1, progress) * 0.85 - drop * 0.38, Math.sin(piece.id * 3) * 0.2]} size={[0.4 * piece.size, 0.17, 0.23]} rotation={[0, piece.id * 0.4, drop * 2]} color={piece.id % 2 ? '#D89140' : '#E89A45'} />;
    })}
    {run.phase !== 'cold' && run.phase !== 'exploded' && Array.from({ length: 5 }, (_, i) => {
      const phase = (run.elapsed * 0.5 + i / 5) % 1;
      return <mesh key={i} position={[3.8 + phase * 0.2, 3.35 + phase * 1.2, 0]} scale={0.1 + phase * 0.32}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={hot > 1 ? '#DD91C4' : '#ADABAE'} transparent opacity={(1 - phase) * 0.28} depthWrite={false} /></mesh>;
    })}
    {run.phase === 'exploded' && Array.from({ length: 16 }, (_, i) => {
      const t = Math.min(run.animationTime, 2.3);
      return <mesh key={i} position={[1 + Math.cos(i * 2.4) * t * 3, 1.2 + Math.sin(i * 1.6) * t * 2 + t * 1.2, Math.sin(i * 2.4) * t * 2]} scale={Math.max(0.02, 0.5 - t * 0.15)}><icosahedronGeometry args={[1, 0]} /><meshBasicMaterial color={i % 2 ? '#EE6BD2' : '#E89A45'} transparent opacity={Math.max(0, 1 - t / 2.3)} /></mesh>;
    })}
  </group>;
}
