import { Text } from '@react-three/drei';
import { fonts } from '../brand';
import { appStore } from '../state/store';
import { showScores, type Result } from './scores';
export function ScoreButton({ result, x, y, z = 2200 }: { result: Result; x: number; y: number; z?: number }) {
  return <group position={[x, y, z]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); showScores(result.game, result); }}>
    <mesh><planeGeometry args={[460, 57]} /><meshBasicMaterial color="#315C46" toneMapped={false} /></mesh>
    <Text position={[0, 0, 3]} font={fonts.semibold} fontSize={26} color="#F2EFE6">Save score / Leaderboard</Text>
  </group>;
}
