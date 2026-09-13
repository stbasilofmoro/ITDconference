import { RoundedBox, Text } from '@react-three/drei';
import { colors, fonts } from '../brand';
import { Monogram } from '../ui/Monogram';
import type { Layout } from './geometry';

const CHASSIS = '#2B2B2E';
const SURROUND = '#161618';
const KNOB = '#5A5A5E';

export function Bezel({ layout, viewW, viewH }: { layout: Layout; viewW: number; viewH: number }) {
  const s = layout.scale;
  // Convert top-left CSS px to centered outer-scene coordinates
  const X = (px: number) => px - viewW / 2;
  const Y = (py: number) => viewH / 2 - py;

  const mx = X(layout.monitorX + layout.monitorW / 2);
  const my = Y(layout.monitorY + layout.monitorH / 2);
  const tubeCx = X(layout.tubeX + layout.tubeW / 2);
  const tubeCy = Y(layout.tubeY + layout.tubeH / 2);
  const stripY = Y(layout.tubeY + layout.tubeH + 110 * s);
  const left = X(layout.tubeX);
  const right = X(layout.tubeX + layout.tubeW);

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[-600, 900, 1200]} intensity={1.2} />

      <RoundedBox args={[layout.monitorW, layout.monitorH, 60 * s]} radius={28 * s} smoothness={4} position={[mx, my, -80 * s]}>
        <meshStandardMaterial color={CHASSIS} roughness={0.55} metalness={0.1} />
      </RoundedBox>

      <RoundedBox args={[layout.tubeW + 44 * s, layout.tubeH + 44 * s, 20 * s]} radius={30 * s} smoothness={4} position={[tubeCx, tubeCy, -30 * s]}>
        <meshStandardMaterial color={SURROUND} roughness={0.35} />
      </RoundedBox>

      <Monogram height={58 * s} color={colors.lightGrey} position={[left + 40 * s, stripY, 1]} />
      <Text font={fonts.medium} fontSize={26 * s} color={colors.lightGrey} anchorX="left" anchorY="middle"
        position={[left + 90 * s, stripY, 1]} letterSpacing={0.08}>
        INTERNATIONAL TIE DISPOSAL
      </Text>

      <mesh position={[right - 470 * s, stripY, 1]}>
        <circleGeometry args={[9 * s, 24]} />
        <meshBasicMaterial color={colors.carbonGreen} toneMapped={false} />
      </mesh>
      <Text font={fonts.medium} fontSize={18 * s} color={colors.muted} anchorX="left" anchorY="middle"
        position={[right - 450 * s, stripY, 1]} letterSpacing={0.1}>
        TALLY
      </Text>

      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[right - 300 * s + i * 56 * s, stripY, 10 * s]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[18 * s, 20 * s, 20 * s, 32]} />
          <meshStandardMaterial color={KNOB} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
