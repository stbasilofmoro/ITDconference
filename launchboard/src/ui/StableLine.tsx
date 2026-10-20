import { useEffect, useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

type Point = Vector3 | [number, number, number];

/**
 * Drop-in for drei's <Line> in components that re-render every frame. drei disposes its material
 * whenever `points` changes identity, so each re-render forced a fresh shader compile. This keeps
 * one material for the component's lifetime and rebuilds only the geometry, and only when the
 * coordinates actually change (a fresh geometry also resets three's cached instance count).
 */
export function StableLine({ points, color, lineWidth = 1 }: { points: Point[]; color: string; lineWidth?: number }) {
  const size = useThree((s) => s.size);
  const [line] = useState(() => new Line2(new LineGeometry(), new LineMaterial()));
  const flat = points.flatMap((p) => p instanceof Vector3 ? [p.x, p.y, p.z] : p);
  const key = flat.join(',');
  useLayoutEffect(() => {
    const previous = line.geometry;
    line.geometry = new LineGeometry().setPositions(flat);
    line.computeLineDistances();
    previous.dispose();
  }, [line, key]); // `key` fully describes `flat`
  useLayoutEffect(() => {
    line.material.color.set(color);
    line.material.linewidth = lineWidth;
    line.material.resolution.set(size.width, size.height);
  }, [line, color, lineWidth, size.width, size.height]);
  useEffect(() => () => { line.geometry.dispose(); line.material.dispose(); }, [line]);
  return <primitive object={line} />;
}
