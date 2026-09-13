import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} material={materials.machineDark}>
      <cylinderGeometry args={[0.45, 0.45, 0.2, 20]} />
    </mesh>
  );
}

function Truck({ x, axles }: { x: number; axles: number }) {
  const spacing = 1.2;
  const start = -((axles - 1) * spacing) / 2;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.75, 0]} material={materials.machineDark}>
        <boxGeometry args={[axles * spacing + 0.4, 0.4, 2.4]} />
      </mesh>
      {Array.from({ length: axles }, (_, i) => (
        <group key={i}>
          <Wheel position={[start + i * spacing, 0.45, 1.3]} />
          <Wheel position={[start + i * spacing, 0.45, -1.3]} />
        </group>
      ))}
    </group>
  );
}

export function Gondola() {
  return (
    <group>
      <Truck x={-4.6} axles={2} />
      <Truck x={4.6} axles={2} />
      <mesh position={[0, 1.2, 0]} material={materials.machine}><boxGeometry args={[14, 0.3, 3.2]} /></mesh>
      <mesh position={[0, 2.1, 1.5]} material={materials.machine}><boxGeometry args={[14, 1.8, 0.2]} /></mesh>
      <mesh position={[0, 2.1, -1.5]} material={materials.machine}><boxGeometry args={[14, 1.8, 0.2]} /></mesh>
      <mesh position={[6.9, 2.1, 0]} material={materials.machine}><boxGeometry args={[0.2, 1.8, 3.2]} /></mesh>
      <mesh position={[-6.9, 2.1, 0]} material={materials.machine}><boxGeometry args={[0.2, 1.8, 3.2]} /></mesh>
      {[0, 1].map((layer) =>
        [-0.9, 0, 0.9].map((z) => (
          <mesh key={`${layer}-${z}`} position={[-1 + layer * 0.3, 1.55 + layer * 0.42, z]} material={materials.tie}>
            <boxGeometry args={[5.2, 0.4, 0.8]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Locomotive() {
  return (
    <group>
      <Truck x={-3} axles={3} />
      <Truck x={3} axles={3} />
      <mesh position={[0, 1.2, 0]} material={materials.machine}><boxGeometry args={[10.5, 0.5, 3.1]} /></mesh>
      <RoundedBox args={[3, 3, 2.8]} radius={0.3} smoothness={3} position={[-3.2, 2.95, 0]} material={materials.machine} />
      <mesh position={[-3.2, 3.5, 1.41]} material={materials.machineLight}><boxGeometry args={[2.2, 0.9, 0.02]} /></mesh>
      <mesh position={[-1.69, 3.5, 0]} material={materials.machineLight}><boxGeometry args={[0.02, 0.9, 2.2]} /></mesh>
      <RoundedBox args={[6.2, 2.1, 2.2]} radius={0.45} smoothness={3} position={[1.7, 2.5, 0]} material={materials.machine} />
      <mesh position={[4.81, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machineLight}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 20]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[1.7, 2.1, side * 1.5]} material={materials.machineDark}>
          <boxGeometry args={[6, 0.08, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

export function Track({ length }: { length: number }) {
  const count = Math.floor(length / 1.1);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[-length / 2 + i * 1.1 + 0.55, 0.15, 0]} material={materials.tie}>
          <boxGeometry args={[0.7, 0.3, 4.4]} />
        </mesh>
      ))}
      {[-1.3, 1.3].map((z) => (
        <mesh key={z} position={[0, 0.4, z]} material={materials.rail}>
          <boxGeometry args={[length, 0.2, 0.15]} />
        </mesh>
      ))}
    </group>
  );
}

export function Train({ active = false }: IllustrationProps) {
  const ref = useRef<Group>(null!);
  useFrame(({ clock }) => {
    ref.current.position.x = active ? Math.sin(clock.elapsedTime * 1.5) * 1.2 : 0;
  });
  return (
    <group>
      <ShadowBlob width={30} depth={8} />
      <group ref={ref} position={[0, 0.2, 0]}>
        <group position={[-6, 0, 0]}><Gondola /></group>
        <group position={[7.2, 0, 0]}><Locomotive /></group>
      </group>
    </group>
  );
}
