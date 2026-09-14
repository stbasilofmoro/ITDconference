import type { Action } from '../../ui/input';

export const COLS = 9;
export const FINISH_ROW = 12;
export const HOP_SECONDS = 0.18;
export type HazardKind = 'train' | 'crew' | 'loader' | 'forklift' | 'truck' | 'person' | 'heat' | 'throw' | 'grapple';
export type Lane = { row: number; kind: HazardKind; speed: number; spacing: number; offset: number };
export type Level = { title: string; subtitle: string; story: string; tips: string[]; accent: string; lanes: Lane[] };
const lane = (row: number, kind: HazardKind, speed: number, spacing = 9, offset = 0): Lane => ({ row, kind, speed, spacing, offset });

export const LEVELS: Level[] = [
  {
    title: 'The tie gang', subtitle: '01 / RAILROAD YARD', accent: '#E89A45',
    story: 'Old ties. A new journey. Help our beaver cross the working railroad yard.',
    tips: ['Let the train cars pass.', 'Crews pull ties, then toss them aside.', 'Striped landing spots warn of flying ties.'],
    lanes: [lane(2, 'train', 1.8, 12, 4), lane(4, 'crew', -0.65, 7, 2), lane(5, 'throw', 0, 8, 0), lane(7, 'train', -2.1, 12, 0), lane(9, 'crew', 0.8, 8, 5), lane(10, 'throw', 0, 8, 3)],
  },
  {
    title: 'Lift. Swing. Stack.', subtitle: '02 / UNLOADING YARD', accent: '#E89A45',
    story: 'Grapple trucks unload tie-filled gondolas. The yard keeps moving.',
    tips: ['Watch for loaded yard trucks.', 'Grapples swing ties across the path.', 'Use the clear rows between working lanes.'],
    lanes: [lane(2, 'train', 1.7, 13, 1), lane(4, 'grapple', 0, 8, 0), lane(5, 'loader', -1.3, 8, 5), lane(7, 'truck', 1.8, 10, 2), lane(9, 'grapple', 0, 8, 3), lane(10, 'loader', -1.6, 9, 0)],
  },
  {
    title: 'Into the heat', subtitle: '03 / CARBON PRODUCTION', accent: '#EE6BD2',
    story: 'Ties enter the shredder. Chips feed two long rotary kilns and become carbon.',
    tips: ['Give the shredder loaders room.', 'Pink stripes warn before exhaust vents.', 'Cross the vents when the pink glow fades.'],
    lanes: [lane(2, 'loader', 1.6, 9, 2), lane(4, 'person', -1, 5, 0), lane(5, 'heat', 0, 8, 0), lane(7, 'loader', -1.8, 10, 4), lane(9, 'heat', 0, 8, 2.8), lane(10, 'person', 1.2, 5, 2)],
  },
  {
    title: 'Carbon on the move', subtitle: '04 / SHIPPING YARD', accent: '#18BE78',
    story: 'Bags of carbon leave the yard by rail and road. Find a gap in the dispatch rush.',
    tips: ['Forklifts carry big bags of carbon.', 'Look both ways for trucks and trains.', 'Wait on the pale refuge rows.'],
    lanes: [lane(2, 'forklift', -1.6, 7, 3), lane(4, 'truck', 2.1, 11, 0), lane(5, 'person', 1.3, 5, 2), lane(7, 'train', -2.4, 13, 6), lane(9, 'forklift', 1.9, 8, 1), lane(10, 'truck', -2.3, 11, 5)],
  },
  {
    title: 'A new kind of fuel', subtitle: '05 / STEEL PLANT', accent: '#EE6BD2',
    story: 'Carbon joins the coke blend, then travels into the refractory-lined furnace.',
    tips: ['Dodge the carbon and coke carriers.', 'Watch the furnace exhaust warnings.', 'One last crossing. Maple syrup awaits.'],
    lanes: [lane(2, 'forklift', 1.9, 8, 2), lane(4, 'loader', -2, 9, 4), lane(5, 'heat', 0, 8, 1), lane(7, 'truck', 2.5, 11, 1), lane(9, 'person', -1.5, 5, 0), lane(10, 'heat', 0, 8, 4)],
  },
];

export type Hazard = { id: string; kind: HazardKind; x: number; row: number; width: number; depth: number; dangerous: boolean; warning: boolean; phase: number; direction: number };
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export function hazardsAt(levelIndex: number, time: number): Hazard[] {
  return LEVELS[levelIndex].lanes.flatMap((l): Hazard[] => {
    const base = { kind: l.kind, row: l.row, direction: Math.sign(l.speed) || 1 };
    if (l.kind === 'heat') {
      const cycle = mod(time + l.offset, 6.5);
      return [{ ...base, id: `${l.row}-heat`, x: 4, width: 9, depth: 0.65, dangerous: cycle >= 3.8 && cycle < 5.2, warning: cycle >= 2.5 && cycle < 3.8, phase: cycle / 6.5 }];
    }
    if (l.kind === 'throw') {
      const cycle = mod(time + l.offset, 5);
      const turn = Math.floor((time + l.offset) / 5);
      const x = mod(turn * 3 + l.row, COLS);
      return [
        { ...base, id: `${l.row}-tie`, x, width: 1.3, depth: 0.8, dangerous: cycle >= 2.4 && cycle < 3.1, warning: cycle >= 1 && cycle < 2.4, phase: cycle / 5 },
        // The two workers pulling this tie also occupy the preceding row.
        { ...base, kind: 'crew', id: `${l.row}-throwers`, x, row: l.row - 1, width: 1.5, depth: 0.65, dangerous: true, warning: false, phase: cycle / 5 },
      ];
    }
    if (l.kind === 'grapple') {
      const phase = mod(time + l.offset, 7) / 7;
      return [{ ...base, id: `${l.row}-grapple`, x: 4 + Math.sin(phase * Math.PI * 2) * 5.7, width: 1.8, depth: 0.8, dangerous: phase > 0.15 && phase < 0.85, warning: phase <= 0.15, phase }];
    }
    const width = l.kind === 'train' ? 4.4 : l.kind === 'truck' ? 3.1 : l.kind === 'person' ? 0.5 : l.kind === 'crew' ? 1.3 : 1.8;
    const period = l.spacing * 3;
    return [0, 1, 2].map((i) => ({ ...base, id: `${l.row}-${i}`, x: mod(time * l.speed + l.offset + i * l.spacing + 8, period) - 8, width, depth: l.kind === 'person' ? 0.45 : 0.7, dangerous: true, warning: false, phase: mod(time * 0.7 + i, 1) })).filter((h) => h.x > -4 && h.x < 13);
  });
}

export type Phase = 'intro' | 'playing' | 'hit' | 'cleared' | 'won';
export type Run = { level: number; phase: Phase; time: number; x: number; row: number; fromX: number; fromRow: number; hop: number; attempts: number; bestRow: number; hitKind: HazardKind | null };
export function newRun(): Run { return { level: 0, phase: 'intro', time: 0, x: 4, row: 0, fromX: 4, fromRow: 0, hop: 1, attempts: 0, bestRow: 0, hitKind: null }; }
export function startLevel(run: Run) {
  Object.assign(run, { phase: 'playing', time: 0, x: 4, row: 0, fromX: 4, fromRow: 0, hop: 1, bestRow: 0, hitKind: null });
}
export function advance(run: Run) {
  if (run.phase === 'intro' || run.phase === 'hit') startLevel(run);
  else if (run.phase === 'cleared' && run.level < LEVELS.length - 1) { run.level++; run.phase = 'intro'; }
}
export function move(run: Run, action: Action): boolean {
  if (run.phase !== 'playing' || run.hop < 1) return false;
  let x = run.x, row = run.row;
  if (action === 'up') row++;
  else if (action === 'down') row--;
  else if (action === 'left') x--;
  else if (action === 'right') x++;
  else return false;
  if (x < 0 || x >= COLS || row < 0 || row > FINISH_ROW) return false;
  run.fromX = run.x; run.fromRow = run.row; run.x = x; run.row = row; run.hop = 0;
  return true;
}
export function playerPosition(run: Run) {
  const p = Math.min(1, run.hop);
  return { x: run.fromX + (run.x - run.fromX) * p, row: run.fromRow + (run.row - run.fromRow) * p, height: Math.sin(p * Math.PI) * 0.3 };
}
export function collides(player: { x: number; row: number }, h: Hazard): boolean {
  return h.dangerous && Math.abs(player.x - h.x) < h.width / 2 + 0.22 && Math.abs(player.row - h.row) < h.depth / 2 + 0.2;
}
export function tick(run: Run, delta: number) {
  if (run.phase !== 'playing') return;
  // Fixed substeps keep fast cars and in-flight hops from tunnelling through each other.
  let remaining = Math.min(Math.max(delta, 0), 0.1);
  while (remaining > 0 && run.phase === 'playing') {
    const dt = Math.min(remaining, 1 / 120); remaining -= dt;
    run.time += dt; run.hop = Math.min(1, run.hop + dt / HOP_SECONDS);
    const hit = hazardsAt(run.level, run.time).find((h) => collides(playerPosition(run), h));
    if (hit) { run.phase = 'hit'; run.attempts++; run.hitKind = hit.kind; return; }
    if (run.hop >= 1) {
      run.bestRow = Math.max(run.bestRow, run.row);
      if (run.row === FINISH_ROW) run.phase = run.level === LEVELS.length - 1 ? 'won' : 'cleared';
    }
  }
}
