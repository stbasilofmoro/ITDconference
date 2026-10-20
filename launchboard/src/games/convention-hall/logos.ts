import { CanvasTexture, SRGBColorSpace } from 'three';
import { fonts } from '../../brand';
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
export const INK = '#1C1B1F', CREAM = '#F1EBE0';
const FAMILY = 'HallBarlow';
const font = (weight: 500 | 600, px: number) => `${weight} ${px}px ${FAMILY}, Arial, sans-serif`;
const SIZES = { logo: [256, 256], badge: [256, 360], backwall: [1024, 620], fascia: [1024, 110], cube: [256, 256] } as const;
export type TextureKind = keyof typeof SIZES;

// Canvas text can't wait for Barlow, so every texture is drawn once with the Arial
// fallback and redrawn in place when the font arrives.
const redraws: (() => void)[] = [];
let fontState: 'idle' | 'loading' | 'ready' = 'idle';
function loadFont() {
  if (fontState !== 'idle' || typeof FontFace === 'undefined') return;
  fontState = 'loading';
  Promise.all([new FontFace(FAMILY, `url(${fonts.medium})`, { weight: '500' }).load(), new FontFace(FAMILY, `url(${fonts.semibold})`, { weight: '600' }).load()])
    .then((faces) => { faces.forEach((f) => document.fonts.add(f)); fontState = 'ready'; redraws.forEach((r) => r()); })
    .catch(() => { fontState = 'ready'; });
}
function twoLines(text: string) { const w = text.split(' '); if (w.length < 3) return [text]; const mid = Math.ceil(w.length / 2); return [w.slice(0, mid).join(' '), w.slice(mid).join(' ')]; }

function draw(g: CanvasRenderingContext2D, company: number, kind: TextureKind, booth: number) {
  const c = COMPANIES[company], [w, h] = SIZES[kind];
  const mark = (x: number, y: number, scale: number, color: string) => { g.save(); g.translate(x, y); g.scale(scale, scale); g.strokeStyle = g.fillStyle = color; emblem(g, c.shape); g.restore(); };
  g.clearRect(0, 0, w, h); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  if (kind === 'backwall') {
    g.fillStyle = c.color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(560, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(300, h); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 540, w, 80);
    mark(250, 290, 2.1, CREAM);
    const lines = twoLines(c.name); g.fillStyle = CREAM; g.font = font(600, 72); lines.forEach((l, i) => g.fillText(l, 470, 230 + i * 78, 520));
    g.font = font(500, 32); g.fillText(c.specialty, 472, 234 + lines.length * 78, 520);
    g.font = font(600, 26); g.fillText(`EXHIBITOR / ${c.short}`, 40, 590);
  } else if (kind === 'fascia') {
    g.fillStyle = INK; g.fillRect(0, 0, w, h); mark(64, 55, 0.5, c.color);
    g.fillStyle = CREAM; g.font = font(600, 54); g.textBaseline = 'middle'; g.fillText(c.name.toUpperCase(), 124, 58, 700);
    g.fillStyle = c.color; g.font = font(600, 34); g.textAlign = 'right'; g.fillText(`${booth}`, 996, 58); g.fillRect(0, 100, w, 10);
  } else if (kind === 'cube') {
    g.fillStyle = c.color; g.fillRect(0, 0, w, h); mark(128, 112, 1, CREAM);
    g.fillStyle = CREAM; g.textAlign = 'center'; g.font = font(600, 38); g.fillText(c.short, 128, 232);
  } else {
    g.fillStyle = CREAM; g.fillRect(0, 0, w, h);
    if (kind === 'badge') { g.fillStyle = '#342F39'; g.fillRect(0, 0, 256, 53); g.fillStyle = CREAM; g.font = font(600, 30); g.textAlign = 'center'; g.fillText('RTA', 128, 38); }
    mark(128, kind === 'badge' ? 165 : 120, kind === 'badge' ? 0.8 : 1, c.color);
    g.fillStyle = INK; g.textAlign = 'center'; g.font = font(600, 34); g.fillText(c.short, 128, kind === 'badge' ? 274 : 236);
    if (kind === 'badge') { g.fillStyle = '#48414B'; g.font = font(500, 17); g.fillText('EXHIBITOR', 128, 310); for (let x = 35; x < 222; x += 7) g.fillRect(x, 325, x % 3 + 2, 17); }
  }
}

export function companyTexture(company: number, kind: TextureKind = 'logo', booth = 0) {
  const key = `${company}-${kind}-${booth}`; if (textures.has(key)) return textures.get(key)!;
  loadFont();
  const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = SIZES[kind];
  const g = canvas.getContext('2d')!, t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { draw(g, company, kind, booth); t.needsUpdate = true; };
  paint(); if (fontState !== 'ready') redraws.push(paint);
  textures.set(key, t); return t;
}

// Hall decor that isn't tied to a company: aisle banners and the end-wall sign.
export function decorTexture(kind: 'banner' | 'endwall', color = INK) {
  const key = `decor-${kind}-${color}`; if (textures.has(key)) return textures.get(key)!;
  loadFont();
  const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = kind === 'banner' ? [256, 560] : [2048, 512];
  const g = canvas.getContext('2d')!, t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  const paint = () => {
    g.clearRect(0, 0, canvas.width, canvas.height); g.textAlign = 'center';
    if (kind === 'banner') {
      g.fillStyle = color; g.fillRect(0, 0, 256, 560); g.fillStyle = INK; g.fillRect(0, 0, 256, 26); g.fillRect(0, 534, 256, 26);
      g.font = font(600, 128); g.fillText('RTA', 128, 250); g.font = font(600, 30); g.fillText('EXHIBIT', 128, 330); g.fillText('HALL', 128, 368);
    } else {
      ['#ED9833', '#EE6BD2', '#18BE78'].forEach((c, i) => { g.fillStyle = c; g.fillRect(724 + i * 210, 60, 180, 22); });
      g.fillStyle = CREAM; g.font = font(600, 190); g.fillText('RTA / EXHIBIT HALL', 1024, 290, 1980);
      g.fillStyle = '#C9C0D0'; g.font = font(500, 56); g.fillText('GOOD CONNECTIONS START HERE.', 1024, 400);
    }
    t.needsUpdate = true;
  };
  paint(); if (fontState !== 'ready') redraws.push(paint);
  textures.set(key, t); return t;
}
