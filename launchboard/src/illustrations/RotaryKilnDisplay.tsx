import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Object3D, type Group, type InstancedMesh, type MeshStandardMaterial } from 'three';
import { tubeColors } from '../brand';
import { Box, Cylinder } from '../games/beaver-crossing/Models';
import { ShadowBlob } from './ShadowBlob';

const STEEL = '#9A9A9A', EDGE = '#BABABA', DARK = '#77777A';
const AXLE: [number, number, number] = [0, 0, Math.PI / 2];

function Band({ x, radius = 1.5, width = 0.22 }: { x: number; radius?: number; width?: number }) {
  return <mesh position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
    <torusGeometry args={[radius, width, 8, 40]} /><meshStandardMaterial color={EDGE} roughness={0.65} />
  </mesh>;
}

function Cyclone({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <Cylinder at={[0, 3.1, 0]} radius={0.36} length={1.15} color={STEEL} />
    <mesh position={[0, 2.15, 0]}><cylinderGeometry args={[0.36, 0.09, 0.8, 16]} /><meshStandardMaterial color={STEEL} /></mesh>
    <Cylinder at={[0, 3.85, 0]} radius={0.14} length={0.55} color={DARK} />
    <Cylinder at={[0, 1.25, 0]} radius={0.12} length={1.1} color={STEEL} />
    <Cylinder at={[0, 0.67, 0]} radius={0.26} length={0.1} color={EDGE} />
    {[-0.44, 0.44].map((side) => <Box key={side} at={[side, 1.6, 0]} size={[0.07, 2.9, 0.07]} color={DARK} />)}
  </group>;
}

/** Attract-screen model: fixed plant infrastructure around a rotating, cutaway drum. */
export function RotaryKilnDisplay() {
  const drum = useRef<Group>(null!), rollers = useRef<Group>(null!);
  const charge = useRef<InstancedMesh>(null!), glow = useRef<MeshStandardMaterial>(null!);
  const transform = useMemo(() => new Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    drum.current.rotation.x = t * 0.3;
    rollers.current.children.forEach((roller) => { roller.rotation.x = -t * 0.9; });
    glow.current.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.12;
    for (let i = 0; i < 32; i++) {
      const angle = t * (0.7 + (i % 4) * 0.06) + i * 2.4;
      const radius = 0.22 + (i % 5) * 0.11;
      transform.position.set(Math.sin(i * 13.7) * 0.85, 2.22 + Math.cos(angle) * radius, Math.sin(angle) * radius);
      transform.rotation.set(angle + i, i * 0.8 + t * 0.2, angle * 0.6);
      transform.updateMatrix(); charge.current.setMatrixAt(i, transform.matrix);
    }
    charge.current.instanceMatrix.needsUpdate = true;
  });
  return <group name="attract-rotary-kiln">
    <ShadowBlob width={16} depth={5.5} offset={[0, 0]} />
    <Box at={[0.8, 0.2, 0]} size={[13.6, 0.4, 3.7]} color={DARK} />
    {[-1.8, 1.8].map((z) => <Box key={z} at={[0.8, 0.48, z]} size={[13.7, 0.14, 0.14]} color={EDGE} />)}
    {[-5, -3, -1, 1, 3, 5, 7].map((x) => <Box key={x} at={[x, 0.32, 0]} size={[0.12, 0.55, 3.8]} color={EDGE} />)}
    {[-2.7, 2.7].map((x) => <Box key={x} at={[x, 0.65, 0]} size={[1.3, 0.5, 3.4]} color={STEEL} />)}
    <group ref={rollers}>{[-2.7, 2.7].flatMap((x) => [-1.12, 1.12].map((z) => <group key={`${x}/${z}`} position={[x, 1, z]}>
      <Cylinder radius={0.43} length={0.85} rotation={AXLE} color={DARK} />
      {Array.from({ length: 12 }, (_, i) => <Box key={i} at={[0, Math.cos(i * Math.PI / 6) * 0.43, Math.sin(i * Math.PI / 6) * 0.43]} rotation={[i * Math.PI / 6, 0, 0]} size={[0.9, 0.08, 0.08]} color={EDGE} />)}
    </group>))}</group>
    <group position={[0, 2.3, 0]} ref={drum}>
      <mesh rotation={AXLE}><cylinderGeometry args={[1.43, 1.43, 7.6, 48, 1, true]} /><meshStandardMaterial color={STEEL} transparent opacity={0.48} side={DoubleSide} depthWrite={false} roughness={0.55} /></mesh>
      {[-3.85, -2.7, 2.7, 3.85].map((x) => <Band key={x} x={x} width={Math.abs(x) > 3 ? 0.25 : 0.13} />)}
      {[-2.7, 2.7].flatMap((x) => Array.from({ length: 16 }, (_, i) => <Box key={`${x}/${i}`} at={[x, Math.cos(i * Math.PI / 8) * 1.52, Math.sin(i * Math.PI / 8) * 1.52]} size={[0.11, 0.1, 0.1]} color={DARK} />))}
      {[0, 1, 2, 3].map((i) => <Box key={i} at={[0, Math.cos(i * Math.PI / 2) * 1.44, Math.sin(i * Math.PI / 2) * 1.44]} size={[7.45, 0.025, 0.025]} color={EDGE} />)}
    </group>
    <instancedMesh ref={charge} args={[undefined, undefined, 32]} frustumCulled={false}>
      <boxGeometry args={[0.38, 0.38, 0.38]} /><meshStandardMaterial ref={glow} color={tubeColors.kilnPink} emissive={tubeColors.kilnPink} emissiveIntensity={0.5} />
    </instancedMesh>
    {[-4.05, 4.05].map((x) => <Cylinder key={x} at={[x, 2.3, 0]} radius={1.12} length={0.48} rotation={AXLE} color={STEEL} />)}
    <Cylinder at={[-4.65, 2.3, 0]} radius={0.57} length={1.05} rotation={AXLE} color={DARK} />
    <Box at={[-5.2, 1.1, 0]} size={[1.45, 1.25, 1.5]} color={STEEL} />
    <Box at={[-5.2, 2.6, 0]} size={[1.1, 0.09, 1.1]} color={DARK} />
    {[-0.6, 0.6].map((v) => <group key={v}><Box at={[-5.2 + v, 2.9, 0]} size={[0.1, 0.65, 1.3]} color={EDGE} /><Box at={[-5.2, 2.9, v]} size={[1.3, 0.65, 0.1]} color={EDGE} /></group>)}
    <Cylinder at={[-5.8, 1.65, 0]} radius={0.45} length={0.22} rotation={AXLE} color={DARK} />
    <Cylinder at={[4.45, 2.3, 0]} radius={0.57} length={0.6} rotation={AXLE} color={DARK} />
    <Cylinder at={[4.6, 3, 0]} radius={0.55} length={1.6} color={STEEL} />
    <Cylinder at={[4.6, 5.45, 0]} radius={0.23} length={4} color={STEEL} />
    <Cylinder at={[4.6, 7.46, 0]} radius={0.2} length={0.03} color={DARK} />
    {[5.3, 6.3, 7.3].flatMap((x) => [-0.95, 0.95].map((z) => <Cyclone key={`${x}/${z}`} x={x} z={z} />))}
    {[-1.45, 1.45].map((z) => <group key={z}><Box at={[6.3, 2.1, z]} size={[3.1, 0.1, 0.1]} color={EDGE} /><Box at={[6.3, 0.6, z]} size={[3.1, 0.1, 0.1]} color={EDGE} /></group>)}
  </group>;
}
