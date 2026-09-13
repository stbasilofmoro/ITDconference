import { useEffect, useState } from 'react';
import { Text } from '@react-three/drei';
import { colors, fonts, tubeColors } from '../../brand';
import type { GameContext } from '../types';

const BARS = [colors.lightGrey, tubeColors.tieOrange, tubeColors.carbonGreen, tubeColors.kilnPink, colors.machineGrey, colors.slate, colors.biochar];
const BAR_W = 1920 / BARS.length;

export default function TestPattern({ ctx }: { ctx: GameContext }) {
  const [flashes, setFlashes] = useState(0);

  useEffect(() => ctx.input.subscribe((a) => {
    if (a === 'select') {
      ctx.tube.pulse('flash');
      setFlashes((n) => n + 1);
    }
  }), [ctx]);

  return (
    <group position={[0, 0, 500]}>
      {BARS.map((c, i) => (
        <mesh key={c} position={[-960 + BAR_W * (i + 0.5), 140, 0]}>
          <planeGeometry args={[BAR_W, 800]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -400, 0]}>
        <planeGeometry args={[1920, 280]} />
        <meshBasicMaterial color={colors.graphite} toneMapped={false} />
      </mesh>
      <Text font={fonts.semibold} fontSize={72} color={colors.lightGrey} position={[0, -350, 10]} letterSpacing={0.1}>
        TEST PATTERN
      </Text>
      <Text font={fonts.medium} fontSize={34} color={colors.muted} position={[0, -440, 10]}>
        {`Enter: flash (${flashes})     ·     Esc: back to the board`}
      </Text>
    </group>
  );
}
