import { Text } from '@react-three/drei';
import { fonts } from '../../brand';
import { Box, Cylinder, CarbonBag, Ties } from '../beaver-crossing/Models';
import { AtomBeaver } from '../../illustrations/Atom';
import { LEVELS, type Enemy, type PickupKind } from './levels';
import { enemyHeight, ventOn, VIEW_SCALE, VIEW_WIDTH, type Run } from './engine';

function Hood({ e, time }: { e: Enemy; time: number }) {
  const h = enemyHeight(e), color = { acolyte: '#544B66', hopper: '#857056', wraith: '#737785', caster: '#754F68', warden: '#3E394E' }[e.kind];
  const glow = 0.78 + Math.sin(time * 5 + e.id) * 0.2;
  return <group position={[e.x, e.y, 0.15]} scale={e.immune > 0 && Math.floor(time * 18) % 2 ? 0.95 : 1}>
    <mesh position={[0, h * 0.34, 0]}><coneGeometry args={[h * 0.38, h * 0.7, 6]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
    <mesh position={[0, h * 0.77, 0]}><coneGeometry args={[h * 0.31, h * 0.66, 5]} /><meshStandardMaterial color={color} /></mesh>
    <Box at={[0, h * 0.73, h * 0.2]} size={[h * 0.39, h * 0.25, 0.07]} color="#211C2B" round />
    {[-1, 1].map((s) => <group key={s}><mesh position={[s * h * 0.1, h * 0.76, h * 0.25]}><sphereGeometry args={[h * 0.04, 8, 6]} /><meshBasicMaterial color="#FF3654" toneMapped={false} /></mesh><mesh position={[s * h * 0.1, h * 0.76, h * 0.25 + 0.025]}><circleGeometry args={[h * 0.085, 12]} /><meshBasicMaterial color="#FF3654" transparent opacity={glow * 0.2} depthWrite={false} /></mesh></group>)}
    <Box at={[0, h * 0.39, h * 0.29]} size={[0.18, 0.18, 0.025]} color="#C3817F" rotation={[0, 0, Math.PI / 4]} />
    {(e.kind === 'caster' || e.kind === 'warden') && <group position={[h * 0.45, 0.8, 0]}><Cylinder radius={0.055} length={1.6} color="#675369" /><mesh position={[0, 0.9, 0]}><octahedronGeometry args={[0.17]} /><meshBasicMaterial color="#D8667B" /></mesh></group>}
    {e.kind === 'hopper' && [-1, 1].map((s) => <Box key={s} at={[s * 0.24, 0.11, 0.1]} size={[0.3, 0.21, 0.4]} color="#A1927D" />)}
    {e.kind === 'wraith' && <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.45, 0.05, 4, 20]} /><meshBasicMaterial color="#AA92C6" transparent opacity={0.6} /></mesh>}
    {e.kind === 'warden' && <><Box at={[-0.53, 1.1, 0]} size={[0.45, 0.28, 0.5]} color="#89818D" /><Box at={[0.53, 1.1, 0]} size={[0.45, 0.28, 0.5]} color="#89818D" />{Array.from({ length: e.maxHp }, (_, i) => <Box key={i} at={[(i - (e.maxHp - 1) / 2) * 0.3, h + 0.35, 0]} size={[0.22, 0.12, 0.06]} color={i < e.hp ? '#EE6D80' : '#5A5264'} />)}</>}
  </group>;
}
function PickupModel({ kind, time }: { kind: PickupKind; time: number }) {
  if (kind === 'credit') return <group rotation={[0, time * 2, 0]}><Cylinder radius={0.22} length={0.07} color="#D9A650" rotation={[Math.PI / 2, 0, 0]} /><Box at={[0, 0, 0.049]} size={[0.07, 0.22, 0.02]} color="#F5DF9C" /></group>;
  if (kind === 'helmet') return <group><Cylinder radius={0.39} length={0.08} color="#E89A45" /><mesh position={[0, 0.09, 0]} scale={[0.3, 0.21, 0.28]}><sphereGeometry args={[1, 10, 6]} /><meshStandardMaterial color="#F2AF59" /></mesh></group>;
  if (kind === 'spark') return <group rotation={[0, 0, 0.2]}><Box size={[0.26, 0.55, 0.22]} color="#739885" />{[-0.18, 0, 0.18].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.23, 0.045, 5, 12]} /><meshBasicMaterial color="#86F3AE" /></mesh>)}</group>;
  if (kind === 'life') return <group><Box size={[0.43, 0.49, 0.24]} color="#CE9059" round /><Box at={[0, 0.3, 0]} size={[0.22, 0.1, 0.2]} color="#EBDFBB" /><Box at={[0, 0, 0.14]} size={[0.26, 0.25, 0.02]} color="#F3E7C9" /></group>;
  return <group rotation={[0, time, 0]}><mesh><octahedronGeometry args={[0.28]} /><meshBasicMaterial color="#A2FFD1" /></mesh>{[0, 1, 2].map((i) => <mesh key={i} rotation={[i, i * 0.6, i]}><torusGeometry args={[0.48, 0.035, 4, 20]} /><meshBasicMaterial color={i % 2 ? '#EE91CA' : '#8EEDD0'} /></mesh>)}</group>;
}
function Factory({ stage, x }: { stage: number; x: number }) {
  return <group position={[x, 0, -3]}>
    <Box at={[0, 2.5, 0]} size={[12, 5, 1.3]} color={stage === 2 ? '#827586' : '#8F9392'} />
    {[0, 1, 2, 3].map((i) => <Box key={i} at={[-4.5 + i * 3, 3, 0.68]} size={[1.1, 1.5, 0.1]} color="#BBC7B9" />)}
    <Box at={[0, 5.2, 0]} size={[13, 0.45, 1.7]} color="#767781" />
    {stage === 0 && <group position={[7, 0, -1]}>
      {[-3, 3].map((v) => <Box key={v} at={[v, 5.5, 0]} size={[0.28, 11, 0.35]} color="#8B8987" />)}
      <Box at={[0, 10.5, 0]} size={[9, 0.5, 0.5]} color="#989085" />
      <Box at={[0, 8.8, 0.3]} size={[0.055, 3, 0.055]} color="#77757B" />
      <Box at={[0, 7.2, 0.3]} size={[1.2, 0.3, 0.5]} color="#9F9382" />
      {[-1, 1].map((v) => <Box key={v} at={[v * 0.5, 6.8, 0.3]} size={[0.15, 0.8, 0.2]} rotation={[0, 0, v * 0.35]} color="#77757B" />)}
    </group>}
    {stage > 0 && [-3, 3].map((v) => <group key={v}><Cylinder at={[v, 7, 0]} radius={0.38} length={4} color="#92919A" /><Cylinder at={[v, 1.4, 1]} radius={0.9} length={10} color="#B4A398" rotation={[0, 0, Math.PI / 2]} /></group>)}
    {stage === 0 && <group position={[0, 0.8, 1.2]}><Box size={[10, 1.4, 1.4]} color="#9B8169" />{[-4, -2, 2, 4].map((i) => <Cylinder key={i} at={[i, -0.7, 0.65]} radius={0.3} length={0.2} color="#4D4954" rotation={[Math.PI / 2, 0, 0]} />)}</group>}
  </group>;
}
export function JumperScene({ run: r }: { run: Run }) {
  const l = LEVELS[r.stage], camera = r.camera, t = r.totalTime, elevation = Math.max(0, r.y - 4);
  return <>
    <mesh position={[0, 0, -550]}><planeGeometry args={[1920, 1080]} /><meshBasicMaterial color={l.color} toneMapped={false} /></mesh>
    <group position={[-960 - camera * 18, -270, -300]} scale={52}>{Array.from({ length: 8 }, (_, i) => <Factory key={i} stage={r.stage} x={i * 20 - 5} />)}</group>
    <group position={[-960 - camera * VIEW_SCALE, -210 - elevation * VIEW_SCALE, 20]} scale={VIEW_SCALE}>
      {r.solids.filter((s) => s.x + s.w > camera - 3 && s.x < camera + VIEW_WIDTH + 4).map((s) => <group key={s.id} position={[s.x + s.w / 2, s.y + s.h / 2, 0]}>
        <Box size={[s.w, s.h, s.kind === 'ground' ? 2.5 : 1.3]} color={s.kind === 'ground' ? '#686475' : s.kind === 'crate' ? s.used ? '#8E8582' : '#DDA152' : '#977758'} />
        {s.kind === 'ground' ? <><Box at={[0, s.h / 2 - 0.09, 1.27]} size={[s.w, 0.18, 0.16]} color="#BBB8B2" />{Array.from({ length: Math.floor(s.w / 1.3) }, (_, i) => <Box key={i} at={[-s.w / 2 + 0.6 + i * 1.3, s.h / 2 + 0.055, 0]} size={[0.17, 0.12, 2.2]} color="#9A795B" />)}</> : s.kind === 'crate' ? <Text position={[0, 0, 0.67]} font={fonts.semibold} fontSize={0.6} color={s.used ? '#6B616C' : '#FFF0C5'}>{s.used ? '-' : 'C'}</Text> : <Box at={[0, s.h / 2, 0.66]} size={[s.w, 0.12, 0.14]} color={s.kind === 'lift' ? '#8EDBA8' : '#C1BCAD'} />}
      </group>)}
      {l.ground.map(([a, b], i) => i % 2 === 0 && <group key={i} position={[a + 4, 0, -1.9]}>{r.stage === 0 ? <Ties count={9} /> : <CarbonBag />}</group>)}
      {l.hazards.map((h, i) => <group key={i} position={[h.x, h.y, 0]}>{h.kind === 'scrap' ? Array.from({ length: 4 }, (_, n) => <mesh key={n} position={[h.w * (n + 0.5) / 4, 0.27, 0]}><coneGeometry args={[0.24, 0.55, 4]} /><meshStandardMaterial color="#A58C8E" /></mesh>) : <>
        <Box at={[h.w / 2, 0.1, 0]} size={[h.w, 0.2, 1]} color="#756E73" />
        {ventOn(r.elapsed, h.offset) && Array.from({ length: 5 }, (_, n) => <mesh key={n} position={[h.w / 2 + Math.sin(t * 7 + n) * 0.2, 0.3 + ((t * 2 + n * 0.4) % 2), 0]} scale={[h.w * 0.3, 0.4, 0.3]}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#F1AD70" transparent opacity={0.65} depthWrite={false} /></mesh>)}
        <Text font={fonts.semibold} fontSize={0.24} color="#F4D0AD" position={[h.w / 2, 0.5, 0.65]}>HOT</Text>
      </>}</group>)}
      {r.pickups.filter((p) => !p.taken && p.x > camera - 2 && p.x < camera + VIEW_WIDTH + 3).map((p) => <group key={p.id} position={[p.x, p.y + (p.loose ? 0 : Math.sin(t * 3 + p.id) * 0.09), 0.6]}><PickupModel kind={p.kind} time={t} /></group>)}
      {r.enemies.filter((e) => !e.dead && e.x > camera - 3 && e.x < camera + VIEW_WIDTH + 4).map((e) => <Hood key={e.id} e={e} time={t} />)}
      {[l.checkpoint, l.length - 2].map((x, i) => <group key={x} position={[x, 0, -0.7]}><Cylinder at={[0, 1.9, 0]} radius={0.07} length={3.8} color="#DDD4C6" /><Box at={[0.65, 3.25, 0]} size={[1.2, 0.7, 0.12]} color={(i === 0 ? r.checkpoint > 2 : !r.enemies.some((e) => e.kind === 'warden' && !e.dead)) ? '#42C78C' : '#9A637A'} /><Text position={[0.65, 3.25, 0.1]} font={fonts.semibold} fontSize={0.23} color="#FFF3DE">{i === 0 ? 'SAVE' : 'SEAL'}</Text></group>)}
      {r.shots.map((s) => <mesh key={s.id} position={[s.x, s.y, 0.6]}><sphereGeometry args={[s.evil ? 0.2 : 0.15, 8, 6]} /><meshBasicMaterial color={s.evil ? '#EF6582' : '#75FFB2'} toneMapped={false} /></mesh>)}
      {r.particles.map((p) => <mesh key={p.id} position={[p.x, p.y, 0.7]}><boxGeometry args={[0.09, 0.09, 0.09]} /><meshBasicMaterial color={p.color} transparent opacity={p.time / 0.6} /></mesh>)}
      <group position={[r.x, r.y, 0.55]} visible={r.immune <= 0 || Math.floor(t * 16) % 2 === 0} rotation={[0, r.facing * 0.7, 0]} scale={r.power === 'small' ? 0.88 : 1}><AtomBeaver power={r.power} stride={r.grounded ? t * Math.abs(r.vx) * 2 : 0} core={r.core > 0} /></group>
    </group>
  </>;
}
