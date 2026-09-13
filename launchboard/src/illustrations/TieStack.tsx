import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

const W = 0.75; // tie width
const H = 0.6;  // tie height

function Tie({ length, position, rotationY = 0 }: { length: number; position: [number, number, number]; rotationY?: number }) {
  return (
    <mesh position={[position[0], H / 2 + position[1], position[2]]} rotation={[0, rotationY, 0]} material={materials.tie}>
      <boxGeometry args={[length, H, W]} />
    </mesh>
  );
}

export function TieStack({ active = false }: IllustrationProps) {
  const junk = useRef<Group>(null!);
  useFrame(({ clock }) => {
    junk.current.position.y = active ? Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.4 : 0;
  });
  return (
    <group>
      <ShadowBlob width={12} depth={9} />
      {/* Reusable */}
      <Tie length={8.5} position={[0, 0, -3]} />
      <Tie length={8.5} position={[0, 0, -2]} />
      {/* Landscape: cut with a notch */}
      <Tie length={4.1} position={[-2.2, 0, -0.25]} />
      <Tie length={4.2} position={[2.15, 0, -0.25]} />
      <Tie length={3.0} position={[-2.75, 0, 0.75]} />
      <Tie length={5.3} position={[1.6, 0, 0.75]} />
      {/* Junk: split pieces */}
      <group ref={junk}>
        <Tie length={3.4} position={[-2.4, 0, 2.3]} rotationY={0.1} />
        <Tie length={2.6} position={[1.2, 0, 2.5]} rotationY={-0.18} />
        <Tie length={1.4} position={[3.4, 0, 3.4]} rotationY={0.5} />
      </group>
    </group>
  );
}
