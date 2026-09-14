import { CanvasTexture, SRGBColorSpace } from 'three';
import { COMPANIES } from './companies';

const textures = new Map<string, CanvasTexture>();
function emblem(g: CanvasRenderingContext2D, shape: number) {
  g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (...points: number[][]) => { g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  const circle = (x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
  switch (shape) {
    case 0: line([-70, 40], [-47, -35], [-23, 20], [0, -50], [23, 20], [47, -35], [70, 40]); break;
    case 1: for (let i = -1; i <= 1; i++) { g.save(); g.translate(0, i * 35); g.rotate(-0.18); g.strokeRect(-63, -9, 126, 18); g.restore(); } break;
    case 2: line([0, 66], [0, -60]); [-40, 0, 40].forEach((y) => circle(0, y, 15)); break;
    case 3: circle(0, 0, 47); circle(0, 0, 18); line([-66, 0], [66, 0]); line([0, -66], [0, 66]); break;
    case 4: circle(0, 0, 65); g.beginPath(); g.ellipse(0, 0, 19, 42, 0.7, 0, Math.PI * 2); g.stroke(); line([-22, 29], [24, -31]); break;
    case 5: circle(-43, 0, 28); circle(43, 0, 28); line([-43, 0], [43, 0]); break;
    case 6: line([-68, 32], [-68, -20], [0, -53], [68, -20], [68, 32], [-68, 32]); line([-68, -20], [0, 32], [0, -53], [68, 32]); break;
    case 7: [[0, -27], [-37, 34], [37, 34]].forEach(([x, y]) => { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; const px = x + Math.cos(a) * 26, py = y + Math.sin(a) * 26; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); }); break;
    case 8: line([-13, 65], [-13, -65]); line([13, 65], [13, 5], [62, -60]); line([-13, -7], [35, -65]); break;
    case 9: line([20, -65], [-43, 8], [3, 8], [-18, 65], [47, -12], [4, -12], [20, -65]); break;
    case 10: for (let j = 0; j < 2; j++) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2, r = j ? 22 : 62; if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); } break;
    case 11: g.strokeRect(-65, -44, 130, 66); circle(-40, 44, 15); circle(40, 44, 15); line([-22, -44], [-22, 22]); line([22, -44], [22, 22]); break;
    case 12: circle(-15, -15, 40); line([15, 15], [65, 65]); break;
    case 13: for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI * 2 / 3); g.beginPath(); g.arc(0, 0, 50, -1.2, 0.3); g.stroke(); line([49, 15], [62, -7]); line([49, 15], [26, 9]); g.restore(); } break;
    case 14: line([-66, 58], [-66, 20], [-20, 20], [-20, -20], [25, -20], [25, -58], [65, -58]); break;
    case 15: line([-65, 0], [-25, 0], [-25, -35], [10, -35], [10, 15]); line([65, 0], [25, 0], [25, 35], [-10, 35], [-10, -15]); break;
    case 16: for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-50, 0, 33 + i * 28, -0.9, 0.9); g.stroke(); } break;
    case 17: line([-50, -50], [0, -68], [50, -50], [45, 12], [0, 65], [-45, 12], [-50, -50]); line([-22, -3], [-4, 19], [28, -23]); break;
    case 18: line([-60, 65], [-60, -60], [60, -60], [60, 65]); line([-60, -20], [0, 12], [60, -20]); line([0, -60], [0, 12]); break;
    case 19: line([-60, -55], [60, -55], [60, -30], [18, -30], [18, 30], [60, 30], [60, 55], [-60, 55], [-60, 30], [-18, 30], [-18, -30], [-60, -30], [-60, -55]); break;
  }
}
export function companyTexture(company: number, kind: 'logo' | 'badge' | 'sign' = 'logo') {
  const key = `${company}-${kind}`; if (textures.has(key)) return textures.get(key)!;
  const c = COMPANIES[company], canvas = document.createElement('canvas');
  canvas.width = kind === 'sign' ? 1024 : 256; canvas.height = kind === 'badge' ? 360 : kind === 'sign' ? 280 : 256;
  const g = canvas.getContext('2d')!; g.fillStyle = '#F1EBE0'; g.fillRect(0, 0, canvas.width, canvas.height);
  if (kind === 'badge') { g.fillStyle = '#342F39'; g.fillRect(0, 0, 256, 53); g.fillStyle = '#F1EBE0'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText('AREMA', 128, 38); }
  g.save(); g.translate(kind === 'sign' ? 135 : 128, kind === 'badge' ? 165 : 125); g.fillStyle = g.strokeStyle = c.color; if (kind === 'badge') g.scale(0.8, 0.8); emblem(g, c.shape); g.restore();
  g.fillStyle = c.color;
  if (kind === 'sign') {
    g.fillRect(275, 32, 5, 206); g.textAlign = 'left'; g.font = 'bold 40px Arial'; g.fillText(c.name, 310, 94, 684);
    g.font = '28px Arial'; g.fillText(c.specialty, 310, 150, 680); g.font = 'bold 27px Arial'; g.fillText(`EXHIBITOR / ${c.short}`, 310, 222);
  } else {
    g.textAlign = 'center'; g.font = 'bold 33px Arial'; g.fillText(c.short, 128, kind === 'badge' ? 274 : 236);
    if (kind === 'badge') { g.fillStyle = '#48414B'; g.font = '17px Arial'; g.fillText('EXHIBITOR', 128, 310); for (let x = 35; x < 222; x += 7) g.fillRect(x, 325, x % 3 + 2, 17); }
  }
  const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; textures.set(key, t); return t;
}
