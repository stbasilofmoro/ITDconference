import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { BufferGeometry, Float32BufferAttribute, Group, Material, Matrix4, Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type MeshToonMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Bucket = { material: Material; renderOrder: number; parts: BufferGeometry[] };
type Colored = MeshBasicMaterial | MeshStandardMaterial | MeshToonMaterial;

function signature(g: BufferGeometry) {
  return `${g.index ? 'i' : 'n'}:${Object.keys(g.attributes).sort().join(',')}`;
}

/** Plain-coloured materials differing only in `color` can share one vertex-coloured material. */
function colorKey(m: Material): string | null {
  const c = m as Colored & { map?: unknown; emissiveMap?: unknown; alphaMap?: unknown; roughness?: number; metalness?: number; emissive?: { getHex(): number }; emissiveIntensity?: number; gradientMap?: { uuid: string } | null };
  const plain = c.type === 'MeshBasicMaterial' || c.type === 'MeshStandardMaterial' || c.type === 'MeshToonMaterial';
  if (!plain || c.map || c.emissiveMap || c.alphaMap || c.vertexColors) return null;
  return [c.type, c.transparent, c.opacity, c.side, c.depthWrite, c.depthTest, c.toneMapped, c.blending, c.roughness, c.metalness, c.emissive?.getHex(), c.emissiveIntensity, c.gradientMap?.uuid].join('|');
}

const sharedMaterials = new Map<string, Material>();
function sharedMaterial(key: string, from: Material): Material {
  let m = sharedMaterials.get(key);
  if (!m) { m = from.clone(); (m as Colored).color.set(0xffffff); m.vertexColors = true; sharedMaterials.set(key, m); }
  return m;
}

function withColor(g: BufferGeometry, m: Material): BufferGeometry {
  const { r, g: gg, b } = (m as Colored).color;
  const n = g.attributes.position.count, colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { colors[i * 3] = r; colors[i * 3 + 1] = gg; colors[i * 3 + 2] = b; }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return g;
}

/**
 * Collapses the static meshes below it into as few draw calls as possible. Scenery built from
 * dozens of small <Box>/<Cylinder> primitives otherwise costs a draw call each, and that CPU
 * overhead (not fill rate) is what caps frame rate on kiosk-class hardware. Parts whose
 * materials differ only in colour are merged into one vertex-coloured mesh.
 *
 * Only for subtrees whose transforms and materials never change after mount: the merge is done
 * once, with the original meshes hidden but left in place. Remount (give it a `key`) to re-bake.
 * Text, fat lines and instanced meshes are left as they are.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const [source] = useState(() => new Group());
  const [batched, setBatched] = useState<Mesh[]>([]);
  useLayoutEffect(() => {
    source.updateWorldMatrix(true, true);
    const toLocal = source.matrixWorld.clone().invert();
    const buckets = new Map<string, Bucket>();
    const hidden: Mesh[] = [];
    source.traverse((o) => {
      const m = o as Mesh & { isInstancedMesh?: boolean; isLineSegments2?: boolean };
      if (!m.isMesh || m.isInstancedMesh || m.isLineSegments2 || Array.isArray(m.material) || (m.material as { isTroikaTextMaterial?: boolean }).isTroikaTextMaterial) return;
      if (!m.geometry.attributes.position || !m.visible) return;
      let part = m.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(toLocal, m.matrixWorld));
      const ck = colorKey(m.material);
      const material = ck ? sharedMaterial(ck, m.material) : m.material;
      if (ck) part = withColor(part, m.material);
      const key = `${ck ?? m.material.uuid}/${m.renderOrder}/${signature(part)}`;
      let b = buckets.get(key);
      if (!b) { b = { material, renderOrder: m.renderOrder, parts: [] }; buckets.set(key, b); }
      b.parts.push(part);
      hidden.push(m);
    });
    const meshes: Mesh[] = [];
    for (const b of buckets.values()) {
      const merged = mergeGeometries(b.parts);
      b.parts.forEach((p) => p.dispose());
      if (!merged) continue;
      const mesh = new Mesh(merged, b.material);
      mesh.renderOrder = b.renderOrder;
      meshes.push(mesh);
    }
    if (meshes.length === 0) return;
    hidden.forEach((m) => { m.visible = false; });
    setBatched(meshes);
    return () => { hidden.forEach((m) => { m.visible = true; }); setBatched([]); };
  }, [source]);
  useEffect(() => () => batched.forEach((m) => m.geometry.dispose()), [batched]);
  return <>
    <primitive object={source}>{children}</primitive>
    {batched.map((m) => <primitive key={m.uuid} object={m} />)}
  </>;
}
