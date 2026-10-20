import { createContext, memo, useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide, BoxGeometry, CylinderGeometry, DataTexture, DoubleSide, MeshBasicMaterial, MeshToonMaterial, NearestFilter, PlaneGeometry, RedFormat, RepeatWrapping, type Group } from 'three';
import { CarbonBag } from '../beaver-crossing/Models';
import { COMPANIES } from './companies';
import { boothAtlas, companyTexture, CREAM, INK, type AtlasRegion, type BoothAtlas } from './logos';
import { StaticBatch } from '../../ui/StaticBatch';

type V3 = [number, number, number];

// Three-step toon ramp shared by every hall material.
const RAMP = (() => { const t = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat); t.minFilter = t.magFilter = NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const toonCache = new Map<string, MeshToonMaterial>();
export function toon(color: string) {
  let m = toonCache.get(color);
  if (!m) { m = new MeshToonMaterial({ color, gradientMap: RAMP }); toonCache.set(color, m); }
  return m;
}
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16), target = amount < 0 ? 0 : 255, k = Math.abs(amount);
  const mix = (v: number) => Math.round(v + (target - v) * k);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => mix(v).toString(16).padStart(2, '0')).join('')}`;
}
const UNIT_BOX = new BoxGeometry(1, 1, 1);
const UNIT_CYL = new CylinderGeometry(1, 1, 1, 20);
const OUTLINE = new MeshBasicMaterial({ color: INK, side: BackSide });
const OL = 0.07;
/** Ink outline shells are the costliest part of the look, so phones can switch them off. */
export const Outlines = createContext(true);

export function TBox({ at = [0, 0, 0], size, color, outline = false, rotation }: { at?: V3; size: V3; color: string; outline?: boolean; rotation?: V3 }) {
  const lines = useContext(Outlines) && outline;
  return <group position={at} rotation={rotation}>
    <mesh geometry={UNIT_BOX} material={toon(color)} scale={size} />
    {lines && <mesh geometry={UNIT_BOX} material={OUTLINE} scale={[size[0] + OL, size[1] + OL, size[2] + OL]} />}
  </group>;
}
export function TCyl({ at = [0, 0, 0], radius, length, color, outline = false, rotation }: { at?: V3; radius: number; length: number; color: string; outline?: boolean; rotation?: V3 }) {
  const lines = useContext(Outlines) && outline;
  return <group position={at} rotation={rotation}>
    <mesh geometry={UNIT_CYL} material={toon(color)} scale={[radius, length, radius]} />
    {lines && <mesh geometry={UNIT_CYL} material={OUTLINE} scale={[radius + OL / 2, length + OL, radius + OL / 2]} />}
  </group>;
}
/** A plane showing one region of the booth's texture atlas. */
function Panel({ atlas, region, at, size, rotation }: { atlas: BoothAtlas; region: AtlasRegion; at: V3; size: [number, number]; rotation?: V3 }) {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(size[0], size[1]), [u0, v0, u1, v1] = atlas.uv(region), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    return g;
  }, [atlas, region, size[0], size[1]]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} rotation={rotation} geometry={geometry} material={atlas.material} />;
}

function Equipment({ company }: { company: number }) {
  const kind = company % 4, color = COMPANIES[company].color;
  if (kind === 0) return <group>{[0, 1, 2].flatMap((l) => [0, 1, 2, 3].map((i) => <TBox key={`${l}-${i}`} at={[-0.75 + i * 0.5, 0.12 + l * 0.24, 0]} size={[0.38, 0.2, 1.6 - l * 0.15]} color="#ED9833" outline />))}</group>;
  if (kind === 1) return <group position={[0, 0.6, 0]}>
    <TCyl radius={0.55} length={1.9} color="#4A4752" rotation={[0, 0, Math.PI / 2]} outline />
    {[-0.93, 0.93].map((x) => <TCyl key={x} at={[x, 0, 0]} radius={0.65} length={0.15} color={color} rotation={[0, 0, Math.PI / 2]} outline />)}
  </group>;
  if (kind === 2) return <><group position={[-0.5, 0, 0]} scale={1.3}><CarbonBag /></group><group position={[0.6, 0, 0]}><CarbonBag /></group></>;
  return <group>
    <TBox at={[0, 0.4, 0]} size={[1.9, 0.8, 1.1]} color="#55515C" outline />
    <TBox at={[0, 1.05, 0]} size={[1.3, 0.5, 0.9]} color={color} outline />
    <TCyl at={[0.7, 0.75, 0.6]} radius={0.26} length={0.2} color="#49434D" rotation={[Math.PI / 2, 0, 0]} />
  </group>;
}

function Tower({ company }: { company: number }) {
  const cube = useRef<Group>(null!);
  useFrame((_, dt) => { cube.current.rotation.y += dt * 0.5; });
  const color = COMPANIES[company].color, map = companyTexture(company, 'cube'), lines = useContext(Outlines);
  return <group position={[-2.15, 0, -1.35]}>
    <TBox at={[0, 2.75, 0]} size={[0.8, 5.5, 0.8]} color={color} outline />
    <TBox at={[0, 5.55, 0]} size={[0.95, 0.12, 0.95]} color={INK} outline />
    <group ref={cube} position={[0, 6.35, 0]}>
      <mesh><boxGeometry args={[1.3, 1.3, 1.3]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>
      {lines && <mesh geometry={UNIT_BOX} material={OUTLINE} scale={1.36} />}
    </group>
  </group>;
}
function HangingSign({ company, number }: { company: number; number: number }) {
  const ring = useRef<Group>(null!);
  useFrame(({ clock }) => { ring.current.rotation.y = Math.sin(clock.elapsedTime * 0.35 + number) * 0.6; });
  const color = COMPANIES[company].color, atlas = boothAtlas(company, number), W = 3.4;
  return <>
    <group ref={ring} position={[0, 5.6, 0]}><StaticBatch key={`${company}/${number}`}>
      {([[0, 0, W / 2], [Math.PI, 0, -W / 2], [Math.PI / 2, W / 2, 0], [-Math.PI / 2, -W / 2, 0]] as const).map(([ry, x, z]) =>
        <Panel key={ry} atlas={atlas} region="fascia" at={[x, 0, z]} size={[W, 0.62]} rotation={[0, ry, 0]} />)}
      {[-0.36, 0.36].map((y) => <TBox key={y} at={[0, y, 0]} size={[W + 0.1, 0.1, W + 0.1]} color={color} outline />)}
    </StaticBatch></group>
    {[[-1.6, -1.6], [1.6, 1.6], [-1.6, 1.6], [1.6, -1.6]].map(([x, z]) => <TCyl key={`${x}${z}`} at={[x, 7.3, z]} radius={0.015} length={3} color={INK} />)}
  </>;
}
function Canopy({ color }: { color: string }) {
  const n = 7, w = 5.2 / n, rise = 3.2 - 2.45, run = 3.3, len = Math.hypot(rise, run), angle = Math.atan2(rise, run);
  return <>
    {Array.from({ length: n }, (_, i) => <TBox key={i} at={[-2.6 + w / 2 + i * w, (3.2 + 2.45) / 2, -1.85 + run / 2]} size={[w, 0.06, len]} rotation={[angle, 0, 0]} color={i % 2 ? CREAM : color} />)}
    <TBox at={[0, 2.32, 1.45]} size={[5.2, 0.28, 0.05]} color={color} outline />
    {[-2.55, 2.55].map((x) => <TCyl key={x} at={[x, 1.2, 1.4]} radius={0.05} length={2.4} color={INK} />)}
  </>;
}
function CurvedWall({ company }: { company: number }) {
  const map = useMemo(() => { const t = companyTexture(company, 'backwall').clone(); t.wrapS = RepeatWrapping; t.repeat.x = -1; t.needsUpdate = true; return t; }, [company]);
  return <>
    <mesh position={[0, 1.6, 2.1]}><cylinderGeometry args={[4, 4, 3.2, 28, 1, true, Math.PI - 0.72, 1.44]} /><meshToonMaterial map={map} gradientMap={RAMP} side={DoubleSide} /></mesh>
    <mesh position={[0, 3.25, 2.1]}><cylinderGeometry args={[4.04, 4.04, 0.14, 28, 1, true, Math.PI - 0.74, 1.48]} /><meshBasicMaterial color={INK} side={DoubleSide} /></mesh>
  </>;
}

/** One exhibitor booth, 5.2 × 3.8 m, back wall toward -z. Its shape comes from the company's `booth` kind.
 * Memoized: the hall re-renders 30×/s but a booth only changes with its props. */
export const Booth = memo(function Booth({ company, number }: { company: number; number: number }) {
  const c = COMPANIES[company], color = c.color, kind = c.booth;
  const atlas = boothAtlas(company, number);
  return <group>
    <StaticBatch key={`${company}/${number}`}>
    <TBox at={[0, 0.04, 0]} size={[5.2, 0.08, 3.8]} color={shade(color, -0.45)} />
    <TBox at={[0, 0.05, 0.1]} size={[4.6, 0.09, 3.2]} color={shade(color, -0.2)} />
    {kind === 'curved' ? <CurvedWall company={company} /> : <>
      <TBox at={[0, 1.6, -1.95]} size={[5.2, 3.2, 0.16]} color={CREAM} outline />
      <Panel atlas={atlas} region="backwall" at={[0, 1.6, -1.865]} size={[5, 3.03]} />
    </>}
    <TBox at={[0, 3.5, -1.85]} size={[5.6, 0.6, 0.3]} color={INK} outline />
    <Panel atlas={atlas} region="fascia" at={[0, 3.5, -1.695]} size={[5.5, 0.59]} />
    <TBox at={[1.75, 0.55, 1.15]} size={[1.1, 1.1, 0.7]} color={color} outline />
    <TBox at={[1.75, 1.14, 1.15]} size={[1.25, 0.08, 0.82]} color={CREAM} outline />
    <Panel atlas={atlas} region="logo" at={[1.75, 0.58, 1.505]} size={[0.7, 0.7]} />
    {kind === 'plinth' ? <group position={[-0.4, 0, -0.1]}>
      <TCyl at={[0, 0.27, 0]} radius={1.15} length={0.45} color={CREAM} outline />
      <TCyl at={[0, 0.06, 0]} radius={1.25} length={0.06} color={color} />
      <group position={[0, 0.5, 0]} scale={0.85}><Equipment company={company} /></group>
      <mesh position={[0, 2.8, 0]}><coneGeometry args={[1.35, 4.6, 28, 1, true]} /><meshBasicMaterial color="#FFF3C4" transparent opacity={0.13} depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false} /></mesh>
      <TCyl at={[0, 5.15, 0]} radius={0.22} length={0.35} color={INK} outline />
    </group> : <group position={[-0.4, 0, -0.1]}>
      <TBox at={[0, 0.17, 0]} size={[2.8, 0.25, 2]} color={shade(color, 0.55)} outline />
      <group position={[0, 0.3, 0]}><Equipment company={company} /></group>
    </group>}
    {kind === 'arch' && <>
      {[-2.45, 2.45].map((x) => <TBox key={x} at={[x, 1.85, 1.6]} size={[0.35, 3.7, 0.35]} color={color} outline />)}
      <TBox at={[0, 3.95, 1.6]} size={[5.3, 0.55, 0.4]} color={INK} outline />
      <Panel atlas={atlas} region="fascia" at={[0, 3.95, 1.805]} size={[5.2, 0.54]} />
    </>}
    {kind === 'canopy' && <Canopy color={color} />}
    </StaticBatch>
    {kind === 'tower' && <Tower company={company} />}
    {kind === 'ring' && <HangingSign company={company} number={number} />}
  </group>;
});
