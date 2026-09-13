import { useMemo } from 'react';
import * as THREE from 'three';

let texture: THREE.CanvasTexture | null = null;

function blobTexture(): THREE.CanvasTexture {
  if (texture) return texture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  texture = new THREE.CanvasTexture(c);
  return texture;
}

export function ShadowBlob({ width, depth, offset = [-0.18, 0.08], opacity = 0.25 }: {
  width: number; depth: number; offset?: [number, number]; opacity?: number;
}) {
  const map = useMemo(blobTexture, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset[0] * width, 0.01, offset[1] * depth]} renderOrder={-1}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
