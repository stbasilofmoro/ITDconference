import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { TubeRenderer } from './tube/TubeRenderer';
import { installE2eHooks } from './e2eHooks';
import { colors } from './brand';

let clicks = 0;
installE2eHooks({ clicks: () => clicks });

function SpinningTie() {
  const ref = useRef<Mesh>(null!);
  const [hot, setHot] = useState(false);
  useFrame((_, dt) => { ref.current.rotation.y += dt; });
  return (
    <mesh ref={ref} position={[-55, 270, 0]} rotation={[0.6, 0, 0]}
      onClick={() => { clicks += 1; setHot((h) => !h); }}>
      <boxGeometry args={[300, 60, 80]} />
      <meshStandardMaterial color={hot ? colors.kilnPink : colors.tieOrange} roughness={0.8} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <TubeRenderer>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-400, 800, 600]} intensity={1.6} />
        <SpinningTie />
      </TubeRenderer>
    </Canvas>
  );
}
