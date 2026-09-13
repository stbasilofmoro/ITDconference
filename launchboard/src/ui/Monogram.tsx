import { useMemo } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MONOGRAM_PATHS, MONOGRAM_STROKE, MONOGRAM_VIEWBOX } from '../brand';

let cached: THREE.BufferGeometry | null = null;

function monogramGeometry(): THREE.BufferGeometry {
  if (cached) return cached;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MONOGRAM_VIEWBOX.w} ${MONOGRAM_VIEWBOX.h}">${MONOGRAM_PATHS.map(
    (d) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${MONOGRAM_STROKE}"/>`,
  ).join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const style = SVGLoader.getStrokeStyle(MONOGRAM_STROKE, '#000', 'miter', 'butt', 4);
  const parts: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    for (const sub of path.subPaths) {
      const g = SVGLoader.pointsToStroke(sub.getPoints(24), style);
      if (g) parts.push(g);
    }
  }
  const merged = mergeGeometries(parts)!;
  // SVG is y-down: flip and center on the origin
  merged.translate(-MONOGRAM_VIEWBOX.w / 2, -MONOGRAM_VIEWBOX.h / 2, 0);
  merged.scale(1, -1, 1);
  cached = merged;
  return merged;
}

export function Monogram({ height, color, position = [0, 0, 0] }: { height: number; color: string; position?: [number, number, number] }) {
  const geometry = useMemo(monogramGeometry, []);
  const s = height / MONOGRAM_VIEWBOX.h;
  return (
    <mesh geometry={geometry} position={position} scale={[s, s, s]}>
      <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
