import { tubeColors } from '../brand';
import type { Accent } from '../games/types';

export const TILE_W = 350;
export const TILE_H = 380;
export const LEFT_X = -880;
export const TICKER_Y = -470;

const COLS = [-55, 325, 705];
const ROWS = [270, -140];

export function tilePosition(index: number): [number, number] {
  return [COLS[index % 3], ROWS[Math.floor(index / 3)]];
}

export function accentColor(a: Accent): string {
  return a === 'orange' ? tubeColors.tieOrange : a === 'pink' ? tubeColors.kilnPink : tubeColors.carbonGreen;
}

export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
