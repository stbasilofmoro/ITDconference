import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tubeColors } from '../brand';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

type LonLat = [number, number];

const CONTINENTS: LonLat[][] = [
  [[-165, 65], [-140, 70], [-95, 72], [-60, 60], [-55, 50], [-80, 25], [-97, 18], [-105, 22], [-125, 40], [-150, 58]],
  [[-80, 10], [-60, 8], [-35, -7], [-40, -22], [-58, -38], [-70, -55], [-75, -20], [-81, -5]],
  [[-10, 36], [-9, 44], [0, 50], [10, 58], [30, 70], [90, 76], [140, 72], [170, 66], [140, 50], [122, 30], [105, 10], [80, 8], [60, 25], [35, 30], [25, 40], [10, 38]],
  [[-17, 15], [-5, 36], [10, 37], [33, 31], [51, 12], [40, -15], [20, -35], [12, -18], [8, 4], [-8, 5]],
  [[113, -22], [130, -12], [145, -12], [153, -28], [145, -38], [116, -35]],
  [[-50, 60], [-20, 70], [-30, 83], [-60, 80]],
];

let texture: THREE.CanvasTexture | null = null;

// A module-level singleton (like ShadowBlob.tsx's `blobTexture`), not a per-mount `useMemo`:
// the underlying <canvas> and CanvasTexture (and its uploaded GPU texture) would otherwise be
// recreated — and the old one only GC'd, never explicitly disposed — every time Board mounts
// a fresh Globe (e.g. attract → board → attract cycling), leaking one canvas + GPU texture
// per mount for the life of the tab.
function globeTexture(): THREE.CanvasTexture {
  if (texture) return texture;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8A8A8C';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = tubeColors.carbonGreen;
  g.lineJoin = 'round';
  g.lineWidth = 18;
  g.strokeStyle = tubeColors.carbonGreen;
  for (const poly of CONTINENTS) {
    g.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * c.width;
      const y = ((90 - lat) / 180) * c.height;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    });
    g.closePath();
    g.fill();
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texture = t;
  return t;
}

export function Globe({ active = false }: IllustrationProps) {
  const map = useMemo(globeTexture, []);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { ref.current.rotation.y += dt * (active ? 1.6 : 0.25); });
  return (
    <group>
      <ShadowBlob width={12} depth={7} offset={[-0.45, 0.2]} opacity={0.22} />
      <mesh ref={ref} position={[0, 4.2, 0]} rotation={[0.35, 0, 0.2]}>
        <sphereGeometry args={[3, 64, 32]} />
        <meshStandardMaterial map={map} roughness={0.45} />
      </mesh>
    </group>
  );
}
