import { useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Line, Text, useFBO } from '@react-three/drei';
import { Color, Fog, PerspectiveCamera, Scene, Vector3, type Group } from 'three';
import { Box, Cylinder, Ties, CarbonBag } from '../beaver-crossing/Models';
import { ScannerModel } from '../../illustrations/BadgeScanner';
import { fonts } from '../../brand';
import { BOOTHS, type Person, type Run } from './engine';
import { ATTENDEE_NAMES, COMPANIES } from './companies';
import { companyTexture } from './logos';

function Attendee({ person: p, time }: { person: Person; time: number }) {
  const body = p.scanned ? '#18BE78' : ['#78798B', '#B68C70', '#9D7987', '#626D7A', '#A69E8C'][p.id % 5];
  const skin = p.scanned ? '#61D398' : ['#D1AB8A', '#AA7D5C', '#835B48', '#E0BEA2'][p.id % 4];
  return <group position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}>
    <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.48, 16]} /><meshBasicMaterial color="#423947" transparent opacity={0.18} depthWrite={false} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <group position={[side * 0.16, 0.75, 0]} rotation={[Math.sin(p.step) * 0.12 * side, 0, 0]}><Box at={[0, -0.3, 0]} size={[0.22, 0.65, 0.25]} color={p.scanned ? '#18965D' : '#555460'} /><Box at={[0, -0.69, 0.055]} size={[0.23, 0.13, 0.35]} color={p.scanned ? '#1D8157' : '#39353E'} /></group>
      <group position={[side * 0.4, 1.26, 0]} rotation={[p.windup > 0 ? -0.9 : Math.sin(p.step) * -0.18 * side, 0, side * 0.06]}><Box at={[0, -0.23, 0]} size={[0.18, 0.58, 0.22]} color={body} /><Box at={[0, -0.54, 0]} size={[0.17, 0.17, 0.19]} color={skin} /></group>
    </group>)}
    <Box at={[0, 1.12, 0]} size={[0.64, 0.8, 0.36]} color={body} round />
    <Box at={[0, 1.81, 0]} size={[0.4, 0.47, 0.38]} color={skin} round />
    <Box at={[0, 2.04, -0.025]} size={[0.43, 0.14, 0.4]} color={p.scanned ? '#238451' : ['#584436', '#514345', '#B8A393'][p.id % 3]} />
    {[-0.1, 0.1].map((x) => <Box key={x} at={[x, 1.84, 0.197]} size={[0.035, 0.043, 0.022]} color="#322C35" />)}
    <Box at={[0, 1.68, 0.204]} size={[p.windup > 0 ? 0.18 : 0.1, p.windup > 0 ? 0.13 : 0.028, 0.02]} color={p.windup > 0 ? '#756A35' : '#6F4F49'} />
    <Line points={[[-0.18, 1.5, 0.21], [0, 1.16, 0.23], [0.18, 1.5, 0.21]]} color="#EEE4D2" lineWidth={2} />
    <mesh position={[0, 1.15, 0.235]}><planeGeometry args={[0.34, 0.46]} /><meshBasicMaterial map={companyTexture(p.company, 'badge')} toneMapped={false} /></mesh>
    <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.52, 0.58, 20]} /><meshBasicMaterial color={p.scanned ? '#18BE78' : p.windup > 0 ? '#C7B746' : '#9A919D'} /></mesh>
    {p.windup > 0 && <Billboard position={[0, 2.6 + Math.sin(time * 8) * 0.03, 0]}><Text font={fonts.semibold} fontSize={0.25} color="#F3E86D" outlineColor="#494132" outlineWidth={0.012}>BAD BREATH!</Text></Billboard>}
    {p.scanned && <Billboard position={[0, 2.65, 0]}><Text font={fonts.semibold} fontSize={0.2} color="#D8FFDE" outlineColor="#285139" outlineWidth={0.01} maxWidth={3} textAlign="center">{`${ATTENDEE_NAMES[p.id]} / ${COMPANIES[p.company].name}`}</Text></Billboard>}
  </group>;
}
function Equipment({ kind }: { kind: number }) {
  return <group>
    <Box at={[0, 0.13, 0]} size={[2.8, 0.25, 2]} color="#BBB9B5" />
    {kind % 4 === 0 ? <group position={[0, 0.3, 0]} scale={1.5}><Ties count={8} /></group> : kind % 4 === 1 ? <group position={[0, 0.65, 0]}>
      <Cylinder radius={0.55} length={1.9} color="#7B7980" rotation={[0, 0, Math.PI / 2]} />
      {[-0.93, 0.93].map((x) => <Cylinder key={x} at={[x, 0, 0]} radius={0.65} length={0.15} color="#54535B" rotation={[0, 0, Math.PI / 2]} />)}
    </group> : kind % 4 === 2 ? <><group position={[-0.5, 0.26, 0]} scale={1.3}><CarbonBag /></group><group position={[0.6, 0.26, 0]}><CarbonBag /></group></> : <>
      <Box at={[0, 0.65, 0]} size={[1.9, 0.8, 1.1]} color="#99969C" /><Box at={[0, 1.3, 0]} size={[1.3, 0.5, 0.9]} color="#CC9555" />
      <Cylinder at={[0.7, 1, 0.7]} radius={0.26} length={0.2} color="#49434D" rotation={[Math.PI / 2, 0, 0]} />
    </>}
  </group>;
}
function World({ run, camera }: { run: Run; camera: PerspectiveCamera }) {
  const gun = useRef<Group>(null!);
  useFrame(() => { if (gun.current) gun.current.position.y = -0.36 + (run.phase === 'playing' && !run.paused ? Math.sin(run.elapsed * 3) * 0.004 : 0) - run.beamTime * 0.08; });
  const beamStart = camera.localToWorld(new Vector3(0.34, -0.25, -0.9));
  return <>
    <ambientLight intensity={1.5} /><directionalLight position={[12, 16, 8]} intensity={2.2} color="#FFF1DB" />
    <Box at={[0, -0.15, 1.5]} size={[38, 0.3, 55]} color="#AAA7A7" />
    <Box at={[0, 0.012, 1.5]} size={[3.8, 0.025, 51]} color="#686472" />
    {[-18.2, 18.2].map((x) => <Box key={x} at={[x, 4.5, 1.5]} size={[0.4, 9, 54]} color="#C3C1BA" />)}
    {[-24.2, 27.2].map((z) => <Box key={z} at={[0, 4.5, z]} size={[36, 9, 0.4]} color="#B8B7B6" />)}
    <Box at={[0, 8.8, 1.5]} size={[36, 0.2, 54]} color="#A7A5A6" />
    {[-21, -12, -3, 6, 15, 24].map((z) => <group key={z}><Box at={[0, 7.3, z]} size={[36, 0.23, 0.3]} color="#77717D" /><Box at={[0, 7.13, z]} size={[22, 0.08, 0.55]} color="#F0ECDC" /></group>)}
    <Text font={fonts.semibold} fontSize={1.2} position={[0, 5.7, -23.9]} color="#4B414F">AREMA / EXHIBIT HALL</Text>
    <Text font={fonts.medium} fontSize={0.4} position={[0, 4.4, -23.85]} color="#695A69">GOOD CONNECTIONS START HERE.</Text>
    {BOOTHS.map((b) => <group key={b.id} position={[b.x, 0, b.z]}>
      <Box at={[0, 0.025, 0]} size={[b.w, 0.05, b.d]} color={b.id % 2 ? '#968B99' : '#A1988C'} />
      <Box at={[0, 1.6, -b.d / 2]} size={[b.w, 3.2, 0.12]} color="#D5D0C7" />
      {[-b.w / 2, b.w / 2].map((x) => <Box key={x} at={[x, 1.6, -b.d / 2]} size={[0.12, 3.2, 0.16]} color="#7E7884" />)}
      <mesh position={[0, 2.65, -b.d / 2 + 0.07]}><planeGeometry args={[5, 1.36]} /><meshBasicMaterial map={companyTexture(run.boothCompanies[b.id], 'sign')} toneMapped={false} /></mesh>
      <Text font={fonts.semibold} fontSize={0.23} position={[0, 1.7, -b.d / 2 + 0.09]} color="#524958">{`BOOTH ${101 + b.id}`}</Text>
      <Equipment kind={run.boothCompanies[b.id]} />
      <Box at={[1.9, 0.65, 1.12]} size={[0.8, 1.3, 0.65]} color="#C4BEB8" />
      <mesh position={[1.9, 0.8, 1.453]}><planeGeometry args={[0.62, 0.62]} /><meshBasicMaterial map={companyTexture(run.boothCompanies[b.id])} toneMapped={false} /></mesh>
    </group>)}
    {run.people.map((person) => <Attendee key={person.id} person={person} time={run.elapsed} />)}
    {run.breath.map((b) => <group key={b.id} position={[b.x, 1.6, b.z]}>{[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 2.4) * b.age * 0.35, Math.cos(i * 2.4) * b.age * 0.3, 0]} scale={0.18 + b.age * 0.28}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={i % 2 ? '#C9C272' : '#A4AA55'} transparent opacity={0.52} depthWrite={false} /></mesh>)}</group>)}
    {run.beamTime > 0 && <Line points={[beamStart, new Vector3(...run.beamEnd)]} color="#67FFBC" lineWidth={3} />}
    <primitive object={camera}><group ref={gun} position={[0.36, -0.36, -0.64]} rotation={[0.04, -0.15, -0.08]} scale={0.75}><ScannerModel scanning={run.beamTime > 0} /><Box at={[0, -0.27, 0.25]} size={[0.19, 0.19, 0.28]} color="#BA9377" round /></group></primitive>
  </>;
}
export function HallScene({ run }: { run: Run }) {
  const gl = useThree((s) => s.gl);
  const scene = useMemo(() => { const s = new Scene(); s.background = new Color('#BEBBB4'); s.fog = new Fog('#BEBBB4', 25, 68); return s; }, []);
  const camera = useMemo(() => new PerspectiveCamera(68, 1920 / 1080, 0.06, 85), []);
  const target = useFBO(1536, 864, { samples: 2, depthBuffer: true });
  useFrame(() => {
    camera.position.set(run.x, 1.65, run.z); camera.rotation.order = 'YXZ'; camera.rotation.set(run.pitch, -run.yaw, 0); camera.updateMatrixWorld();
    const previous = gl.getRenderTarget(); gl.setRenderTarget(target); gl.clear(); gl.render(scene, camera); gl.setRenderTarget(previous);
  }, -1);
  return <>
    {createPortal(<World run={run} camera={camera} />, scene, { camera })}
    <mesh position={[0, 0, 0]}><planeGeometry args={[1920, 1080]} /><meshBasicMaterial map={target.texture} toneMapped={false} /></mesh>
  </>;
}
