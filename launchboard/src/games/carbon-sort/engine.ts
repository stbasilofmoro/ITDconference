export const WIDTH = 8;
export const HEIGHT = 14;
export const ROUND_TARGETS = [9, 12, 18];
export const FALL_SECONDS = [0.85, 0.68, 0.52];
export const CLEAR_SECONDS = 0.36;
export const SETTLE_SECONDS = 0.085;
export type Material = 'ties' | 'carbon' | 'metal';
export const MATERIALS: Material[] = ['ties', 'carbon', 'metal'];
export type Cell = { id: number; material: Material; target: boolean; bond: number | null };
export type Board = (Cell | null)[][];
export type Pair = { x: number; y: number; direction: number; materials: [Material, Material] };
export type Phase = 'intro' | 'playing' | 'clearing' | 'settling' | 'round-won' | 'won' | 'lost';
export type Command = 'left' | 'right' | 'down' | 'rotate' | 'drop' | 'pause' | 'continue';
export type Run = {
  board: Board; active: Pair | null; next: [Material, Material]; phase: Phase; paused: boolean;
  round: number; score: number; recovered: number; targetsCleared: number; combo: number; bestCombo: number;
  marked: [number, number][]; timer: number; fallTimer: number; lockTimer: number; lockResets: number;
  seed: number; nextId: number; revision: number; dealt: number;
};
const DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
export const emptyBoard = (): Board => Array.from({ length: HEIGHT }, () => Array<Cell | null>(WIDTH).fill(null));
export function pairCells(pair: Pair): { x: number; y: number; material: Material }[] {
  const [dx, dy] = DIRECTIONS[pair.direction];
  return [{ x: pair.x, y: pair.y, material: pair.materials[0] }, { x: pair.x + dx, y: pair.y + dy, material: pair.materials[1] }];
}
export function canPlace(board: Board, pair: Pair): boolean {
  return pairCells(pair).every(({ x, y }) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !board[y][x]);
}
export function matches(board: Board): [number, number][] {
  const found = new Set<string>();
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const cell = board[y][x]; if (!cell) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (board[y - dy]?.[x - dx]?.material === cell.material) continue;
      let length = 1;
      while (board[y + dy * length]?.[x + dx * length]?.material === cell.material) length++;
      if (length >= 4) for (let i = 0; i < length; i++) found.add(`${x + dx * i},${y + dy * i}`);
    }
  }
  return [...found].map((key) => key.split(',').map(Number) as [number, number]);
}
export function targetCount(board: Board): number { return board.flat().filter((cell) => cell?.target).length; }
function random(run: Run): number {
  run.seed = (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}
function deal(run: Run): [Material, Material] {
  run.dealt++;
  // The opening teaches a clear with a useful first pair; later draws favor remaining stock.
  if (run.round === 0 && run.dealt === 1) return ['ties', 'carbon'];
  const remaining = [...new Set(run.board.flat().filter((c) => c?.target).map((c) => c!.material))];
  const pool = remaining.length ? remaining : MATERIALS;
  return [pool[Math.floor(random(run) * pool.length)], MATERIALS[Math.floor(random(run) * 3)]];
}
function putTarget(run: Run, x: number, y: number, material: Material) {
  run.board[y][x] = { id: run.nextId++, material, target: true, bond: null };
}
export function prepareRound(run: Run) {
  run.board = emptyBoard(); run.active = null; run.marked = []; run.timer = 0;
  run.fallTimer = 0; run.lockTimer = 0; run.lockResets = 0; run.combo = 0; run.dealt = 0; run.paused = false;
  if (run.round === 0) {
    for (let x = 0; x < 3; x++) putTarget(run, x, 13, 'ties');
    for (let x = 5; x < 8; x++) putTarget(run, x, 11, 'carbon');
    for (let x = 0; x < 3; x++) putTarget(run, x, 9, 'metal');
  } else {
    const depth = run.round === 1 ? 5 : 7;
    const slots: [number, number][] = [];
    for (let y = HEIGHT - depth; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) slots.push([x, y]);
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(random(run) * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    for (let i = 0; i < ROUND_TARGETS[run.round]; i++) {
      const [x, y] = slots[i];
      const first = Math.floor(random(run) * 3);
      for (let j = 0; j < 3; j++) {
        putTarget(run, x, y, MATERIALS[(first + j) % 3]);
        if (!matches(run.board).length) break;
      }
    }
  }
  run.next = deal(run); run.phase = 'intro'; run.revision++;
}
export function newRun(seed = Date.now()): Run {
  const run: Run = {
    board: emptyBoard(), active: null, next: ['ties', 'carbon'], phase: 'intro', paused: false,
    round: 0, score: 0, recovered: 0, targetsCleared: 0, combo: 0, bestCombo: 0, marked: [],
    timer: 0, fallTimer: 0, lockTimer: 0, lockResets: 0, seed: seed >>> 0, nextId: 1, revision: 0, dealt: 0,
  };
  prepareRound(run); return run;
}
function spawn(run: Run) {
  const pair: Pair = { x: 3, y: 0, direction: 0, materials: run.next };
  if (!canPlace(run.board, pair)) { run.active = null; run.phase = 'lost'; run.revision++; return; }
  run.active = pair; run.next = deal(run); run.phase = 'playing';
  run.fallTimer = 0; run.lockTimer = 0; run.lockResets = 0; run.combo = 0; run.revision++;
}
export function continueRun(run: Run) {
  if (run.phase === 'intro') spawn(run);
  else if (run.phase === 'round-won') { run.round++; prepareRound(run); }
  else if (run.phase === 'lost' || run.phase === 'won') {
    const fresh = newRun(run.seed); fresh.revision = run.revision + 1; Object.assign(run, fresh);
  }
}
export function landingPair(run: Run): Pair | null {
  if (!run.active) return null;
  const pair = { ...run.active };
  while (canPlace(run.board, { ...pair, y: pair.y + 1 })) pair.y++;
  return pair;
}
function beginResolution(run: Run) {
  run.marked = matches(run.board); run.timer = 0;
  if (run.marked.length) { run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo); run.phase = 'clearing'; }
  else if (targetCount(run.board) === 0) run.phase = run.round === ROUND_TARGETS.length - 1 ? 'won' : 'round-won';
  else spawn(run);
  run.revision++;
}
export function lockPair(run: Run) {
  if (!run.active) return;
  const bond = run.nextId++;
  for (const { x, y, material } of pairCells(run.active)) run.board[y][x] = { id: run.nextId++, material, target: false, bond };
  run.active = null; run.combo = 0; beginResolution(run);
}
export function removeMatches(run: Run) {
  let targets = 0;
  for (const [x, y] of run.marked) {
    if (run.board[y][x]?.target) targets++;
    run.board[y][x] = null;
  }
  run.targetsCleared += targets; run.recovered += run.marked.length;
  run.score += (run.marked.length * 10 + targets * 100) * run.combo;
  // When one half is recycled, its surviving partner becomes a free material block.
  const bonds = new Map<number, Cell[]>();
  for (const cell of run.board.flat()) if (cell?.bond != null) bonds.set(cell.bond, [...(bonds.get(cell.bond) ?? []), cell]);
  for (const cells of bonds.values()) if (cells.length === 1) cells[0].bond = null;
  run.marked = []; run.phase = 'settling'; run.timer = 0; run.revision++;
}
export function gravityStep(board: Board): boolean {
  const groups = new Map<string, { x: number; y: number; cell: Cell }[]>();
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const cell = board[y][x]; if (!cell || cell.target) continue;
    const key = cell.bond === null ? `cell-${cell.id}` : `bond-${cell.bond}`;
    groups.set(key, [...(groups.get(key) ?? []), { x, y, cell }]);
  }
  const units = [...groups.values()].sort((a, b) => Math.max(...b.map((p) => p.y)) - Math.max(...a.map((p) => p.y)));
  let moved = false;
  for (const unit of units) {
    const ownIds = new Set(unit.map(({ cell }) => cell.id));
    if (!unit.every(({ x, y }) => y + 1 < HEIGHT && (!board[y + 1][x] || ownIds.has(board[y + 1][x]!.id)))) continue;
    for (const { x, y } of unit) board[y][x] = null;
    for (const { x, y, cell } of unit) board[y + 1][x] = cell;
    moved = true;
  }
  return moved;
}
function reposition(run: Run, candidate: Pair): boolean {
  if (!canPlace(run.board, candidate)) return false;
  run.active = candidate;
  if (run.lockResets < 8) { run.lockTimer = 0; run.lockResets++; }
  run.revision++; return true;
}
export function command(run: Run, action: Command) {
  if (action === 'pause') {
    if (['playing', 'clearing', 'settling'].includes(run.phase)) { run.paused = !run.paused; run.revision++; }
    return;
  }
  if (run.paused) { if (action === 'continue' || action === 'rotate') { run.paused = false; run.revision++; } return; }
  if (['intro', 'round-won', 'won', 'lost'].includes(run.phase)) { if (action === 'continue' || action === 'rotate') continueRun(run); return; }
  if (run.phase !== 'playing' || !run.active) return;
  const pair = run.active;
  if (action === 'left' || action === 'right') reposition(run, { ...pair, x: pair.x + (action === 'left' ? -1 : 1) });
  else if (action === 'rotate') {
    const direction = (pair.direction + 1) % 4;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1]]) if (reposition(run, { ...pair, direction, x: pair.x + dx, y: pair.y + dy })) break;
  } else if (action === 'down') {
    if (reposition(run, { ...pair, y: pair.y + 1 })) { run.fallTimer = 0; run.lockTimer = 0; run.lockResets = 0; }
  } else if (action === 'drop') { run.active = landingPair(run); lockPair(run); }
}
export function tick(run: Run, delta: number) {
  if (run.paused) return;
  const dt = Math.min(Math.max(delta, 0), 0.1);
  if (run.phase === 'clearing') {
    run.timer += dt; if (run.timer >= CLEAR_SECONDS) removeMatches(run);
  } else if (run.phase === 'settling') {
    run.timer += dt;
    if (run.timer >= SETTLE_SECONDS) {
      run.timer = 0;
      if (gravityStep(run.board)) run.revision++;
      else beginResolution(run);
    }
  } else if (run.phase === 'playing' && run.active) {
    run.fallTimer += dt;
    if (canPlace(run.board, { ...run.active, y: run.active.y + 1 })) {
      run.lockTimer = 0;
      if (run.fallTimer >= FALL_SECONDS[run.round]) { run.active.y++; run.fallTimer = 0; run.lockResets = 0; run.revision++; }
    } else {
      run.lockTimer += dt;
      if (run.lockTimer >= 0.45) lockPair(run);
    }
  }
}
