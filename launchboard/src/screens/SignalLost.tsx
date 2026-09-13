import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';

export function SignalLost() {
  return (
    <group position={[0, 0, 800]}>
      <mesh>
        <planeGeometry args={[1920, 1080]} />
        <meshBasicMaterial color={colors.graphite} toneMapped={false} />
      </mesh>
      <Text font={fonts.semibold} fontSize={140} color={colors.lightGrey} anchorX="center" anchorY="middle" position={[0, 40, 10]} letterSpacing={0.06}>
        SIGNAL LOST
      </Text>
      <Text font={fonts.regular} fontSize={38} color={colors.muted} anchorX="center" anchorY="middle" position={[0, -80, 10]}>
        Returning to the board...
      </Text>
    </group>
  );
}
