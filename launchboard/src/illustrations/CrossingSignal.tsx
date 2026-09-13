import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

export function CrossingSignal({ active = false }: IllustrationProps) {
  const lamps = useMemo(() => [materials.signalLamp.clone(), materials.signalLamp.clone()], []);
  useFrame(({ clock }) => {
    const on = Math.floor(clock.elapsedTime * 2.4) % 2;
    lamps[0].emissiveIntensity = active && on === 0 ? 1.6 : 0;
    lamps[1].emissiveIntensity = active && on === 1 ? 1.6 : 0;
  });
  return (
    <group>
      <ShadowBlob width={6} depth={14} offset={[-0.35, 0.3]} opacity={0.2} />
      <mesh position={[0, 0.7, 0]} material={materials.machineDark}><cylinderGeometry args={[0.45, 0.45, 1.4, 20]} /></mesh>
      <mesh position={[0, 6, 0]} material={materials.machine}><cylinderGeometry args={[0.15, 0.15, 11, 12]} /></mesh>
      {[1, -1].map((dir) => (
        <mesh key={dir} position={[0, 9.8, 0.2]} rotation={[0, 0, (dir * Math.PI) / 4]} material={materials.machine}>
          <boxGeometry args={[4.2, 0.7, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 7.2, 0.1]} material={materials.machine}><boxGeometry args={[3.2, 0.15, 0.15]} /></mesh>
      {[-1.4, 1.4].map((x, i) => (
        <group key={x} position={[x, 7.2, 0.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.machine}><cylinderGeometry args={[0.85, 0.85, 0.12, 28]} /></mesh>
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={lamps[i]}><cylinderGeometry args={[0.42, 0.42, 0.1, 24]} /></mesh>
          <mesh position={[0, 0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={materials.machine}>
            <cylinderGeometry args={[0.5, 0.5, 0.6, 20, 1, true, -Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
