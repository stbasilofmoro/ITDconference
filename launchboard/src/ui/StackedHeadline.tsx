import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';

export function StackedHeadline({ lines, position, fontSize, lineHeight, color = colors.ink }: {
  lines: string[]; position: [number, number]; fontSize: number; lineHeight: number; color?: string;
}) {
  return (
    <group position={[position[0], position[1], 50]}>
      {lines.map((line, i) => (
        <Text key={i} font={fonts.semibold} fontSize={fontSize} color={color} anchorX="left" anchorY="top"
          position={[0, -i * lineHeight, 0]} letterSpacing={-0.01}>
          {line}
        </Text>
      ))}
    </group>
  );
}
