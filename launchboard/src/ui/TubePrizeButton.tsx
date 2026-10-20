import { useState } from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import { colors, fonts } from '../brand';
import { appStore } from '../state/store';
import { PRIZE_CLAIM_LABEL } from './PrizeButton';

// Artwork belongs in the tube's content scene so all CRT passes affect it.
// The matching native button in App supplies keyboard access and dialog focus return.
export function TubePrizeButton({ onClick, focused }: { onClick(): void; focused: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <group position={[-600, -370, 50]}
    onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
    onPointerOut={() => setHovered(false)}
    onClick={e => { e.stopPropagation(); appStore.getState().markInput(performance.now()); onClick(); }}>
    <RoundedBox args={[573, 108, 4]} radius={12} smoothness={2} position={[0, 0, -5]} visible={focused}>
      <meshBasicMaterial color={colors.ink} toneMapped={false} />
    </RoundedBox>
    <RoundedBox args={[557, 92, 4]} radius={8} smoothness={2}>
      <meshBasicMaterial color={hovered ? '#9d682e' : '#b37a39'} toneMapped={false} />
    </RoundedBox>
    <Text font={fonts.semibold} fontSize={24} lineHeight={1.3} maxWidth={510}
      color="#fff8e8" anchorX="left" anchorY="middle" position={[-257, 0, 5]}>
      {PRIZE_CLAIM_LABEL.replace('? ', '?\n')}
    </Text>
  </group>;
}
