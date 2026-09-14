import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three';
import land from './land.json';

// Natural Earth 1:110m land, public domain. Longitude/latitude mapped to a sphere,
// without Mercator scaling or enlarged/stylized continent silhouettes.
export const landPolygons: number[][][][] = land.features.flatMap((f): number[][][][] => f.geometry.type === 'Polygon' ? [f.geometry.coordinates as number[][][]] : f.geometry.coordinates as unknown as number[][][][]);
export function onLand(lon: number, lat: number) {
  const inside = (ring: number[][]) => {
    let yes = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i], [a, b] = ring[j];
      if ((y > lat) !== (b > lat) && lon < (a - x) * (lat - y) / (b - y) + x) yes = !yes;
    }
    return yes;
  };
  return landPolygons.some((polygon) => inside(polygon[0]) && !polygon.slice(1).some(inside));
}
export function spherePoint(lon: number, lat: number, radius = 1): Vector3 {
  const a = lon * Math.PI / 180, b = lat * Math.PI / 180;
  return new Vector3(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a)).multiplyScalar(radius);
}
let texture: CanvasTexture | undefined;
export function earthTexture() {
  if (texture) return texture;
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#929EA1'; g.fillRect(0, 0, 2048, 1024);
  g.fillStyle = '#BCD0B7'; g.strokeStyle = '#7C9480'; g.lineWidth = 0.8;
  for (const polygon of landPolygons) {
    g.beginPath();
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => { const x = (lon + 180) / 360 * 2048, y = (90 - lat) / 180 * 1024; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.closePath();
    }
    g.fill('evenodd'); g.stroke();
  }
  g.strokeStyle = '#FFFFFF22'; g.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { const x = (lon + 180) / 360 * 2048; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const y = (90 - lat) / 180 * 1024; g.beginPath(); g.moveTo(0, y); g.lineTo(2048, y); g.stroke(); }
  texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
}
