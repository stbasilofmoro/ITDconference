import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { earthTexture } from '../geography/earth';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

export function Globe({ active = false }: IllustrationProps) {
  const map = useMemo(earthTexture, []);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { ref.current.rotation.y += dt * (active ? 1.6 : 0.25); });
  return (
    <group>
      <ShadowBlob width={12} depth={7} offset={[-0.45, 0.2]} opacity={0.22} />
      <mesh ref={ref} position={[0, 4.2, 0]} rotation={[0.35, 0, 0.2]}>
        <sphereGeometry args={[3, 64, 32]} />
        <meshStandardMaterial map={map} roughness={0.45} />
      </mesh>
    </group>
  );
}
