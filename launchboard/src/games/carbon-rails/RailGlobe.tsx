import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Quaternion, Vector3, type Group } from 'three';
import { earthTexture, spherePoint } from '../../geography/earth';
import { Box, Cylinder } from '../beaver-crossing/Models';
import { INK, REGIONS, ROUTES, STATIONS } from './map';
import { connected, type Run } from './engine';

function Plant({ id, time }: { id: number; time: number }) {
  const s = STATIONS[id], dirty = s.kind === 'cogen';
  return <group scale={dirty ? 9 : 8}>
    <Box at={[0, 0.35, 0]} size={[1.4, 0.7, 1.1]} color={dirty ? '#55505A' : '#407B54'} />
    {dirty ? <>{[-0.45, 0.4].map((x, i) => <group key={i}>
      <Cylinder at={[x, 1.8, -0.25]} radius={0.2} length={3} color="#4F4955" />
      <Cylinder at={[x, 2.8, -0.25]} radius={0.22} length={0.3} color="#AF766F" />
      {Array.from({ length: 4 }, (_, p) => { const phase = (time * 0.26 + p / 4 + i * 0.1) % 1; return <mesh key={p} position={[x + phase, 3.35 + phase * 3, -0.25]} scale={0.28 + phase * 0.9}><sphereGeometry args={[1, 7, 5]} /><meshBasicMaterial color="#302E36" transparent opacity={0.85 * (1 - phase)} depthWrite={false} /></mesh>; })}
    </group>)}</> : <>
      <Cylinder at={[0.42, 0.8, 0]} radius={0.36} length={1.2} color="#BCD0B7" />
      <Box at={[-0.5, 0.83, 0]} size={[0.5, 0.5, 0.65]} color="#18BE78" />
    </>}
  </group>;
}
export function RailGlobe({ run, region, selected, select, zoom }: { run: Run; region: number; selected: number; select(id: number): void; zoom: number }) {
  const globe = useRef<Group>(null!);
  const orientation = useRef(new Quaternion()), drag = useRef<{ x: number; y: number } | null>(null);
  const regionKey = useRef(-1), time = useRef(0);
  const map = useMemo(earthTexture, []);
  const routes = useMemo(() => ROUTES.map((route) => {
    const a = STATIONS[route.a], b = STATIONS[route.b];
    return Array.from({ length: 25 }, (_, i) => spherePoint(a.lon + (b.lon - a.lon) * i / 24, a.lat + (b.lat - a.lat) * i / 24, 403));
  }), []);
  useFrame((_, dt) => {
    time.current += dt;
    if (regionKey.current !== region) { regionKey.current = region; orientation.current.setFromUnitVectors(spherePoint(REGIONS[region].lon, REGIONS[region].lat), new Vector3(0, 0, 1)); }
    globe.current.quaternion.slerp(orientation.current, Math.min(1, dt * 8));
  });
  const pointer = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return; e.stopPropagation();
    const dx = e.nativeEvent.clientX - drag.current.x, dy = e.nativeEvent.clientY - drag.current.y;
    orientation.current.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx * 0.007));
    orientation.current.premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy * 0.007));
    drag.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  };
  return <group position={[-390, 90, 0]} scale={zoom}>
    <group ref={globe}>
      <mesh onPointerDown={(e) => { e.stopPropagation(); drag.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; (e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId); }} onPointerMove={pointer} onPointerUp={(e) => { drag.current = null; (e.target as unknown as { releasePointerCapture(id: number): void }).releasePointerCapture(e.pointerId); }} onPointerCancel={() => { drag.current = null; }}>
        <sphereGeometry args={[400, 96, 64]} /><meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {ROUTES.map((route) => <group key={route.id}>
        <Line points={routes[route.id]} color={run.owners[route.id] === 0 ? '#117849' : run.owners[route.id] === 1 ? '#3A303C' : route.id === selected ? '#FFF8EB' : INK[route.color]} lineWidth={route.id === selected ? 5 : run.owners[route.id] === null ? 2 : 4} onClick={(e) => { e.stopPropagation(); select(route.id); }} />
        {route.region === region && Array.from({ length: route.length }, (_, i) => {
          const p = routes[route.id][Math.round((i + 0.5) / route.length * 24)];
          return <mesh key={i} position={p} onClick={(e) => { e.stopPropagation(); select(route.id); }}><sphereGeometry args={[route.id === selected ? 4 : 2.6, 6, 4]} /><meshBasicMaterial color={run.owners[route.id] === 0 ? '#18BE78' : run.owners[route.id] === 1 ? '#332B39' : INK[route.color]} /></mesh>;
        })}
      </group>)}
      {STATIONS.map((s) => {
        const position = spherePoint(s.lon, s.lat, 405), up = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), position.clone().normalize());
        const linked = s.kind === 'bio' || s.kind === 'cogen' ? connected(run, s.kind === 'bio' ? 0 : 1, s.region * 8, s.id) : false;
        return <group key={s.id} position={position} quaternion={up}>
          <Cylinder radius={linked ? 7 : 4} length={2} color={s.kind === 'bio' ? '#18BE78' : s.kind === 'cogen' ? '#413544' : '#F5E9CE'} />
          {s.region === region && (s.kind === 'bio' || s.kind === 'cogen') ? <Plant id={s.id} time={time.current} /> : s.kind === 'depot' ? <Box at={[0, 5, 0]} size={[10, 10, 10]} color="#E89A45" /> : null}
        </group>;
      })}
    </group>
  </group>;
}
