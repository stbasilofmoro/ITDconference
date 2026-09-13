export const CONTENT_W = 1920;
export const CONTENT_H = 1080;
export const BEZEL = { side: 120, top: 110, bottom: 220 } as const;
export const MONITOR_W = CONTENT_W + BEZEL.side * 2;
export const MONITOR_H = CONTENT_H + BEZEL.top + BEZEL.bottom;

export type Layout = {
  scale: number;
  monitorX: number; monitorY: number; monitorW: number; monitorH: number;
  tubeX: number; tubeY: number; tubeW: number; tubeH: number;
};

export type UV = { u: number; v: number };

export function computeLayout(viewW: number, viewH: number): Layout {
  const scale = Math.min(viewW / MONITOR_W, viewH / MONITOR_H);
  const monitorW = MONITOR_W * scale;
  const monitorH = MONITOR_H * scale;
  const monitorX = (viewW - monitorW) / 2;
  const monitorY = (viewH - monitorH) / 2;
  return {
    scale, monitorX, monitorY, monitorW, monitorH,
    tubeX: monitorX + BEZEL.side * scale,
    tubeY: monitorY + BEZEL.top * scale,
    tubeW: CONTENT_W * scale,
    tubeH: CONTENT_H * scale,
  };
}

export function screenToTubeUv(px: number, py: number, l: Layout): UV {
  return { u: (px - l.tubeX) / l.tubeW, v: 1 - (py - l.tubeY) / l.tubeH };
}

export function barrel(uv: UV, k: number): UV {
  if (k === 0) return { u: uv.u, v: uv.v };
  const x = uv.u * 2 - 1;
  const y = uv.v * 2 - 1;
  const s = (1 + k * (x * x + y * y)) / (1 + 2 * k);
  return { u: (x * s + 1) / 2, v: (y * s + 1) / 2 };
}

export function inverseBarrel(uv: UV, k: number): UV {
  const qx = uv.u * 2 - 1;
  const qy = uv.v * 2 - 1;
  let x = qx;
  let y = qy;
  for (let i = 0; i < 50; i++) {
    const s = (1 + k * (x * x + y * y)) / (1 + 2 * k);
    x = qx / s;
    y = qy / s;
  }
  return { u: (x + 1) / 2, v: (y + 1) / 2 };
}

export function insideTube(uv: UV, cornerRadiusPx: number): boolean {
  if (uv.u < 0 || uv.u > 1 || uv.v < 0 || uv.v > 1) return false;
  const px = Math.abs((uv.u - 0.5) * CONTENT_W);
  const py = Math.abs((uv.v - 0.5) * CONTENT_H);
  const dx = Math.max(px - (CONTENT_W / 2 - cornerRadiusPx), 0);
  const dy = Math.max(py - (CONTENT_H / 2 - cornerRadiusPx), 0);
  return dx * dx + dy * dy <= cornerRadiusPx * cornerRadiusPx;
}

export function contentToWorld(uv: UV): { x: number; y: number } {
  return { x: (uv.u - 0.5) * CONTENT_W, y: (uv.v - 0.5) * CONTENT_H };
}

export function worldToContent(x: number, y: number): UV {
  return { u: x / CONTENT_W + 0.5, v: y / CONTENT_H + 0.5 };
}

export function contentToScreen(x: number, y: number, l: Layout, k: number): { px: number; py: number } {
  const t = inverseBarrel(worldToContent(x, y), k);
  return { px: l.tubeX + t.u * l.tubeW, py: l.tubeY + (1 - t.v) * l.tubeH };
}
