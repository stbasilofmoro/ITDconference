import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { colors, fonts, tubeColors } from '../brand';

const SPEED = 90; // px per second
const SEP = '     ·     ';

export function Ticker({ items, y }: { items: string[]; y: number }) {
  const strip = useRef<Group>(null!);
  const dash = useRef<Mesh>(null!);
  const [width, setWidth] = useState(1600);
  const label = items.join(SEP) + SEP;

  useFrame((_, dt) => {
    strip.current.position.x -= SPEED * dt;
    if (strip.current.position.x < -960 - width) strip.current.position.x += width;
    dash.current.position.x = ((performance.now() / 1000) * 420) % 2200 - 1100;
  });

  // troika reports the laid-out text bounds once the glyphs are ready
  const onSync = (t: { textRenderInfo?: { blockBounds: number[] } }) => {
    const b = t.textRenderInfo?.blockBounds;
    if (b && Math.abs(b[2] - b[0] - width) > 1) setWidth(b[2] - b[0]);
  };

  return (
    <group position={[0, y, 60]}>
      <mesh position={[0, 34, 0]}>
        <planeGeometry args={[1920, 4]} />
        <meshBasicMaterial color={tubeColors.kilnPink} toneMapped={false} />
      </mesh>
      <mesh ref={dash} position={[0, 34, 1]}>
        <planeGeometry args={[140, 10]} />
        <meshBasicMaterial color={colors.white} toneMapped={false} />
      </mesh>
      <group ref={strip} position={[-880, 0, 0]}>
        {[0, 1, 2].map((copy) => (
          <Text key={copy} font={fonts.medium} fontSize={30} color={colors.slate} anchorX="left" anchorY="middle"
            position={[copy * width, 0, 0]} onSync={copy === 0 ? onSync : undefined}>
            {label}
          </Text>
        ))}
      </group>
    </group>
  );
}
