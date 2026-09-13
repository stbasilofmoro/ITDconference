import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import { seeded } from './Shredder';
import type { IllustrationProps } from './Iso';

const CHARGE = 40;

function Charge({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const base = useRef<THREE.Vector3[]>([]);
  useLayoutEffect(() => {
    const rnd = seeded(11);
    base.current = Array.from({ length: CHARGE }, () => {
      const r = Math.sqrt(rnd()) * 1.6;
      const a = rnd() * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * r, 2.9 + rnd() * 0.9, Math.sin(a) * r);
    });
  }, []);
  const m = new THREE.Object3D();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    materials.kilnCharge.emissiveIntensity = active ? 1.1 + 0.4 * Math.sin(t * 9) : 0.45 + 0.2 * Math.sin(t * 2);
    base.current.forEach((p, i) => {
      const jitter = active ? Math.sin(t * 7 + i) * 0.12 : 0;
      m.position.set(p.x, p.y + jitter, p.z);
      m.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CHARGE]} material={materials.kilnCharge}>
      <boxGeometry args={[0.55, 0.55, 0.55]} />
    </instancedMesh>
  );
}

function Ring({ y, radius, tube = 0.09 }: { y: number; radius: number; tube?: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.machine}>
      <torusGeometry args={[radius, tube, 12, 64]} />
    </mesh>
  );
}

export function Kiln({ active = false }: IllustrationProps) {
  return (
    <group>
      <ShadowBlob width={11} depth={11} offset={[-0.2, 0.15]} />
      <Ring y={0.2} radius={2.6} />
      <Ring y={2.2} radius={2.6} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6]} material={materials.machine}>
            <cylinderGeometry args={[0.1, 0.1, 2.4, 10]} />
          </mesh>
        );
      })}
      <Charge active={active} />
      <mesh position={[0, 4.3, 0]} material={materials.glass}><cylinderGeometry args={[2.4, 2.4, 4.2, 48, 1, true]} /></mesh>
      <mesh position={[0, 6.4, 0]} scale={[1, 0.45, 1]} material={materials.glass}>
        <sphereGeometry args={[2.4, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 7.45, 0]} material={materials.machineLight}><cylinderGeometry args={[1.4, 1.4, 0.3, 32]} /></mesh>
      <mesh position={[0, 8.1, 0]} material={materials.machine}><cylinderGeometry args={[0.65, 0.65, 1.0, 24]} /></mesh>
      <mesh position={[0, 9.2, 0]} material={materials.machine}><cylinderGeometry args={[0.3, 0.3, 1.2, 16]} /></mesh>
      <mesh position={[0, 10.9, 0]} material={materials.machine}><cylinderGeometry args={[0.75, 0.75, 2.2, 24]} /></mesh>
      <mesh position={[0, 12.8, 0]} material={materials.machine}><cylinderGeometry args={[0.6, 0.6, 1.7, 24, 1, true]} /></mesh>
      <Ring y={8.7} radius={2.7} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        const x = Math.cos(a) * 1.7;
        const z = Math.sin(a) * 1.7;
        return (
          <mesh key={i} position={[x, 10, z]} rotation={[Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]} material={materials.machine}>
            <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}
