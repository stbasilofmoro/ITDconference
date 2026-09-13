import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHIP = 0.38;
const PILE = 70;
const FALLING = 6;

function ChipPile() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const rnd = seeded(7);
    const m = new THREE.Object3D();
    for (let i = 0; i < PILE; i++) {
      const r = Math.sqrt(rnd()) * 2.0;
      const a = rnd() * Math.PI * 2;
      m.position.set(Math.cos(a) * r, CHIP / 2 + Math.max(0, 1.1 - r * 0.55) * rnd(), Math.sin(a) * r * 0.8);
      m.rotation.set(rnd() * 0.6, rnd() * Math.PI, rnd() * 0.6);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PILE]} material={materials.tie}>
      <boxGeometry args={[CHIP, CHIP, CHIP]} />
    </instancedMesh>
  );
}

function FallingChips({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const m = new THREE.Object3D();
  useFrame(({ clock }) => {
    for (let i = 0; i < FALLING; i++) {
      const t = (clock.elapsedTime * 0.9 + i / FALLING) % 1;
      m.position.set((i % 3 - 1) * 0.5, active ? 4.8 - t * 4.6 : -10, (i % 2) * 0.4 - 0.2);
      m.rotation.set(t * 6, t * 4, 0);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FALLING]} material={materials.tie}>
      <boxGeometry args={[CHIP, CHIP, CHIP]} />
    </instancedMesh>
  );
}

export function Shredder({ active = false }: IllustrationProps) {
  const motors = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (active) motors.current.rotation.x += dt * 8; });
  return (
    <group>
      <ShadowBlob width={14} depth={10} offset={[-0.25, 0.1]} />
      {[[-2.9, -1.9], [2.9, -1.9], [-2.9, 1.9], [2.9, 1.9]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 2.5, z]} material={materials.machine}><boxGeometry args={[0.35, 5, 0.35]} /></mesh>
      ))}
      <mesh position={[0, 5.1, 0]} material={materials.machine}><boxGeometry args={[6.4, 0.3, 4.4]} /></mesh>
      <mesh position={[-0.8, 6.25, 0]} material={materials.machine}><boxGeometry args={[4.4, 2, 3]} /></mesh>
      <mesh position={[2.4, 6.2, 0]} material={materials.machineLight}><boxGeometry args={[2, 1.9, 3]} /></mesh>
      <group ref={motors} position={[4.3, 6.3, 0]}>
        {[-0.75, 0.75].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={materials.machineLight}>
            <cylinderGeometry args={[0.65, 0.65, 2.2, 24]} />
          </mesh>
        ))}
      </group>
      {/* Hopper: open box with a slanted throat */}
      <mesh position={[-0.8, 7.9, 0]} rotation={[0, 0, -0.35]} material={materials.machineDark}><boxGeometry args={[3, 0.2, 3]} /></mesh>
      <mesh position={[-0.8, 9.6, 1.9]} material={materials.machine}><boxGeometry args={[4.6, 3.4, 0.2]} /></mesh>
      <mesh position={[-0.8, 9.6, -1.9]} material={materials.machine}><boxGeometry args={[4.6, 3.4, 0.2]} /></mesh>
      <mesh position={[-3.0, 9.6, 0]} material={materials.machine}><boxGeometry args={[0.2, 3.4, 3.8]} /></mesh>
      <mesh position={[1.4, 9.6, 0]} material={materials.machine}><boxGeometry args={[0.2, 3.4, 3.8]} /></mesh>
      <mesh position={[-1.2, 10.2, 0.3]} rotation={[0, 0, 0.12]} material={materials.tie}><boxGeometry args={[0.6, 5, 0.7]} /></mesh>
      <mesh position={[-0.2, 9.2, -0.6]} rotation={[0.1, 0, -0.08]} material={materials.tie}><boxGeometry args={[0.6, 3.4, 0.7]} /></mesh>
      <group position={[0, 0, 0]}>
        <ChipPile />
        <FallingChips active={active} />
      </group>
    </group>
  );
}
