import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { colors, fonts } from '../brand';
import type { GameDefinition } from '../games/types';
import { ILLUSTRATIONS } from '../illustrations/index';
import { Iso } from '../illustrations/Iso';
import { TILE_H, TILE_W, accentColor, easeInOut, tilePosition } from './layout';

const ZOOM_MS = 350;
const ZOOM_SCALE = 5.5;

export function Tile({ game, index, focused, launching, shakeAt, onHover, onSelect }: {
  game: GameDefinition; index: number; focused: boolean; launching: boolean; shakeAt: number;
  onHover(i: number): void; onSelect(i: number): void;
}) {
  const group = useRef<Group>(null!);
  const shadow = useRef<Mesh>(null!);
  const lift = useRef(0);
  const zoom = useRef(0);
  const [px, py] = tilePosition(index);
  const art = ILLUSTRATIONS[game.illustration];
  const soon = game.status === 'coming-soon';

  useFrame((_, dt) => {
    lift.current += ((focused ? 1 : 0) - lift.current) * Math.min(1, dt * 12);
    zoom.current = launching ? Math.min(1, zoom.current + (dt * 1000) / ZOOM_MS) : 0;
    const z = easeInOut(zoom.current);
    const sinceShake = performance.now() - shakeAt;
    const shake = sinceShake < 400 ? Math.sin(sinceShake / 18) * 10 * (1 - sinceShake / 400) : 0;
    group.current.position.set(px * (1 - z) + shake, py * (1 - z) + lift.current * 12, 100 + z * 800);
    group.current.scale.setScalar(1 + (ZOOM_SCALE - 1) * z);
    shadow.current.position.set(-10 - lift.current * 10, -14 - lift.current * 14, -20);
    (shadow.current.material as { opacity: number }).opacity = 0.12 + lift.current * 0.1;
  });

  return (
    <group ref={group}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onClick={(e) => { e.stopPropagation(); onSelect(index); }}>
      <mesh ref={shadow}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>
      <RoundedBox args={[TILE_W, TILE_H, 6]} radius={3} smoothness={2}>
        <meshBasicMaterial color={colors.lightGrey} toneMapped={false} />
      </RoundedBox>
      <group position={[0, 40, 40]}>
        <Iso scale={art.scale} position={[0, art.lift, 0]}>
          <art.C active={focused && !soon} />
        </Iso>
      </group>
      {soon && (
        <mesh position={[0, 40, 300]}>
          <planeGeometry args={[TILE_W - 20, TILE_H - 110]} />
          <meshBasicMaterial color={colors.lightGrey} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <Text font={fonts.medium} fontSize={game.title.length > 24 ? 27 : 34} maxWidth={340} textAlign="center" lineHeight={1.05} color={soon ? colors.muted : colors.ink} anchorX="center" anchorY="middle"
        position={[0, -135, 320]}>
        {game.title.includes(': ') ? game.title.replace(': ', ':\n') : game.title}
      </Text>
      <mesh position={[0, -170, 320]} visible={focused}>
        <planeGeometry args={[90, 6]} />
        <meshBasicMaterial color={accentColor(game.accent)} toneMapped={false} />
      </mesh>
    </group>
  );
}
