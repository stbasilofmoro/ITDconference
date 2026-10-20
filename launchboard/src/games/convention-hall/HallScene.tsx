import { usePhone, usePortraitPhone } from '../../phone/viewport';
import { useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Line, Text, useFBO } from '@react-three/drei';
import { BoxGeometry, Color, DoubleSide, Fog, MeshBasicMaterial, PerspectiveCamera, Scene, Vector3, type Group } from 'three';
import { ScannerModel } from '../../illustrations/BadgeScanner';
import { fonts } from '../../brand';
import { BOOTHS, type Person, type Run } from './engine';
import { ATTENDEE_NAMES, COMPANIES } from './companies';
import { Booth, Outlines, TBox, TCyl } from './Booth';
import { companyTexture, decorTexture, INK } from './logos';

const BRAND_STRIPES = ['#ED9833', '#EE6BD2', '#18BE78'];
const BANNERS = [[21.5, '#ED9833'], [12.5, '#EE6BD2'], [3.5, '#18BE78'], [-5.5, '#ED9833'], [-14.5, '#EE6BD2']] as const;
const LAMP = new BoxGeometry(1.6, 0.06, 0.4);
const LAMP_MAT = new MeshBasicMaterial({ color: '#FFE7BF', toneMapped: false });

function Attendee({ person: p, time }: { person: Person; time: number }) {
  const body = p.scanned ? '#18BE78' : ['#3E4C6E', '#7A5E4F', '#55705C', '#6B4D63', '#5A6170', '#8A7A5A'][p.id % 6];
  const skin = p.scanned ? '#61D398' : ['#D1AB8A', '#AA7D5C', '#835B48', '#E0BEA2'][p.id % 4];
  return <group position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}>
    <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.48, 16]} /><meshBasicMaterial color="#423947" transparent opacity={0.18} depthWrite={false} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <group position={[side * 0.16, 0.75, 0]} rotation={[Math.sin(p.step) * 0.12 * side, 0, 0]}><TBox at={[0, -0.3, 0]} size={[0.22, 0.65, 0.25]} color={p.scanned ? '#18965D' : '#3A3640'} /><TBox at={[0, -0.69, 0.055]} size={[0.23, 0.13, 0.35]} color={p.scanned ? '#1D8157' : '#26232B'} /></group>
      <group position={[side * 0.4, 1.26, 0]} rotation={[p.windup > 0 ? -0.9 : Math.sin(p.step) * -0.18 * side, 0, side * 0.06]}><TBox at={[0, -0.23, 0]} size={[0.18, 0.58, 0.22]} color={body} /><TBox at={[0, -0.54, 0]} size={[0.17, 0.17, 0.19]} color={skin} /></group>
    </group>)}
    <TBox at={[0, 1.12, 0]} size={[0.7, 0.8, 0.38]} color={body} outline />
    <TBox at={[0, 1.82, 0]} size={[0.46, 0.5, 0.4]} color={skin} outline />
    <TBox at={[0, 2.08, -0.02]} size={[0.5, 0.14, 0.44]} outline color={p.scanned ? '#238451' : ['#584436', '#514345', '#B8A393'][p.id % 3]} />
    {[-0.1, 0.1].map((x) => <TBox key={x} at={[x, 1.86, 0.207]} size={[0.035, 0.043, 0.022]} color="#322C35" />)}
    <TBox at={[0, 1.7, 0.207]} size={[p.windup > 0 ? 0.18 : 0.1, p.windup > 0 ? 0.13 : 0.028, 0.02]} color={p.windup > 0 ? '#756A35' : '#6F4F49'} />
    <Line points={[[-0.18, 1.5, 0.23], [0, 1.16, 0.25], [0.18, 1.5, 0.23]]} color="#EEE4D2" lineWidth={2} />
    <mesh position={[0, 1.15, 0.255]}><planeGeometry args={[0.34, 0.46]} /><meshBasicMaterial map={companyTexture(p.company, 'badge')} toneMapped={false} /></mesh>
    <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.52, 0.58, 20]} /><meshBasicMaterial color={p.scanned ? '#18BE78' : p.windup > 0 ? '#C7B746' : '#9A919D'} /></mesh>
    {p.windup > 0 && <Billboard position={[0, 2.6 + Math.sin(time * 8) * 0.03, 0]}><Text font={fonts.semibold} fontSize={0.25} color="#F3E86D" outlineColor="#494132" outlineWidth={0.012}>BAD BREATH!</Text></Billboard>}
    {p.scanned && <Billboard position={[0, 2.65, 0]}><Text font={fonts.semibold} fontSize={0.2} color="#D8FFDE" outlineColor="#285139" outlineWidth={0.01} maxWidth={3} textAlign="center">{`${ATTENDEE_NAMES[p.id]} / ${COMPANIES[p.company].name}`}</Text></Billboard>}
  </group>;
}
function World({ run, camera, portrait }: { run: Run; camera: PerspectiveCamera; portrait: boolean }) {
  const gun = useRef<Group>(null!);
  useFrame(() => { if (gun.current) gun.current.position.y = -0.36 + (run.phase === 'playing' && !run.paused ? Math.sin(run.elapsed * 3) * 0.004 : 0) - run.beamTime * 0.08; });
  const beamStart = camera.localToWorld(new Vector3(0.34, -0.25, -0.9));
  return <>
    <hemisphereLight args={['#FFF4E6', '#5A5266', 2.4]} /><directionalLight position={[8, 16, 10]} intensity={1.5} color="#FFE9CC" />
    <TBox at={[0, -0.15, 1.5]} size={[38, 0.3, 55]} color="#CBC2B6" />
    <TBox at={[0, 0.015, 1.5]} size={[3.8, 0.03, 51]} color="#3B3942" />
    {[-1.96, 1.96].map((x) => <TBox key={x} at={[x, 0.02, 1.5]} size={[0.14, 0.04, 51]} color="#ED9833" />)}
    {[-18.2, 18.2].map((x) => <group key={x}>
      <TBox at={[x, 4.5, 1.5]} size={[0.4, 9, 54]} color="#4A4453" />
      {BRAND_STRIPES.map((c, i) => <TBox key={c} at={[x * 0.988, 0.35 + i * 0.22, 1.5]} size={[0.06, 0.14, 54]} color={c} />)}
    </group>)}
    {[-24.2, 27.2].map((z) => <TBox key={z} at={[0, 4.5, z]} size={[36, 9, 0.4]} color="#3A3542" />)}
    <TBox at={[0, 8.8, 1.5]} size={[36, 0.2, 54]} color="#2B2833" />
    {[-21, -12, -3, 6, 15, 24].map((z) => <group key={z}>
      <TBox at={[0, 7.9, z]} size={[36, 0.3, 0.3]} color="#1F1C24" />
      {[-12, -6, 0, 6, 12].map((x) => <mesh key={x} position={[x, 7.7, z]} geometry={LAMP} material={LAMP_MAT} />)}
    </group>)}
    <mesh position={[0, 5.4, -23.95]}><planeGeometry args={[18, 4.5]} /><meshBasicMaterial map={decorTexture('endwall')} transparent toneMapped={false} /></mesh>
    {BANNERS.map(([z, color]) => <group key={z} position={[0, 0, z]}>
      <mesh position={[0, 6.1, 0]}><planeGeometry args={[1.3, 2.85]} /><meshBasicMaterial map={decorTexture('banner', color)} side={DoubleSide} toneMapped={false} /></mesh>
      <TCyl at={[0, 7.6, 0]} radius={0.04} length={1.6} color={INK} rotation={[0, 0, Math.PI / 2]} />
    </group>)}
    {BOOTHS.map((b) => <group key={b.id} position={[b.x, 0, b.z]}><Booth company={run.boothCompanies[b.id]} number={101 + b.id} /></group>)}
    {run.people.map((person) => <Attendee key={person.id} person={person} time={run.elapsed} />)}
    {run.breath.map((b) => <group key={b.id} position={[b.x, 1.6, b.z]}>{[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 2.4) * b.age * 0.35, Math.cos(i * 2.4) * b.age * 0.3, 0]} scale={0.18 + b.age * 0.28}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={i % 2 ? '#C9C272' : '#A4AA55'} transparent opacity={0.52} depthWrite={false} /></mesh>)}</group>)}
    {run.beamTime > 0 && <Line points={[beamStart, new Vector3(...run.beamEnd)]} color="#67FFBC" lineWidth={3} />}
    <primitive object={camera}><group ref={gun} position={[portrait ? 0.16 : 0.36, -0.36, -0.64]} rotation={[0.04, -0.15, -0.08]} scale={0.75}><ScannerModel scanning={run.beamTime > 0} /><TBox at={[0, -0.27, 0.25]} size={[0.19, 0.19, 0.28]} color="#BA9377" /></group></primitive>
  </>;
}
export function HallScene({ run, touch = false }: { run: Run; touch?: boolean }) {
  const gl = useThree((s) => s.gl);
  const portrait = usePortraitPhone(), phone = usePhone();
  const scene = useMemo(() => { const s = new Scene(); s.background = new Color('#2B2833'); s.fog = new Fog('#2B2833', 26, 70); return s; }, []);
  const camera = useMemo(() => Object.assign(new PerspectiveCamera(68, portrait ? 720 / 1080 : 1920 / 1080, 0.06, 85), { manual: true }), [portrait]);
  const target = useFBO(portrait ? 720 : touch ? 1280 : 1536, portrait ? 1080 : touch ? 720 : 864, { samples: touch ? 0 : 2, depthBuffer: true });
  useFrame(() => {
    camera.position.set(run.x, 1.65, run.z); camera.rotation.order = 'YXZ'; camera.rotation.set(run.pitch, -run.yaw, 0); camera.updateMatrixWorld();
    const previous = gl.getRenderTarget(); gl.setRenderTarget(target); gl.clear(); gl.render(scene, camera); gl.setRenderTarget(previous);
  }, -1);
  return <>
    {createPortal(<Outlines.Provider value={!phone}><World run={run} camera={camera} portrait={portrait} /></Outlines.Provider>, scene, { camera })}
    <mesh position={[0, 0, 0]}><planeGeometry args={[portrait ? 720 : 1920, 1080]} /><meshBasicMaterial map={target.texture} toneMapped={false} /></mesh>
  </>;
}
