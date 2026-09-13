import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Gallery } from './dev/Gallery';
import { installE2eHooks } from './e2eHooks';
import { buildRegistry } from './games/registry';
import { StudioRig } from './illustrations/StudioRig';
import { GameHost } from './screens/GameHost';
import { ScreenRouter } from './screens/ScreenRouter';
import { Bezel } from './tube/Bezel';
import { computeLayout } from './tube/geometry';
import { TubeRenderer } from './tube/TubeRenderer';

const params = new URLSearchParams(window.location.search);
const games = buildRegistry({ includeTestPattern: params.has('e2e'), includeBrokenGame: params.has('brokengame') });
installE2eHooks();

function Monitor({ children }: { children: ReactNode }) {
  const size = useThree((s) => s.size);
  const layout = computeLayout(size.width, size.height);
  return <TubeRenderer bezel={<Bezel layout={layout} viewW={size.width} viewH={size.height} />}>{children}</TubeRenderer>;
}

export default function App() {
  return (
    <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Monitor>
        {params.has('gallery') ? <Gallery /> : (
          <>
            <StudioRig />
            <ScreenRouter games={games} gameHost={<GameHost games={games} />} />
          </>
        )}
      </Monitor>
    </Canvas>
  );
}
