// Arcade tuning, not a kiln operating or engineering model.
export const SAFE_MIN = 700;
export const SAFE_MAX = 850;
export const RUN_SECONDS = 90;
export const GRACE_SECONDS = 5;
export const STEP = 1 / 60;
export const BELT_END = 1.5;
export type Phase = 'intro' | 'running' | 'cold' | 'exploded' | 'won';
export type Condition = { at: number; title: string; hint: string; gain: number; demand: number };
export const CONDITIONS: Condition[] = [
  { at: 0, title: 'A steady start', hint: 'Find the balance. Watch what the line does.', gain: 1, demand: 0.5 },
  { at: 12, title: 'A wetter wood load', hint: 'This load gives off less heat.', gain: 0.62, demand: 0.53 },
  { at: 26, title: 'Dry pieces arrive', hint: 'The new wood burns much hotter.', gain: 1.5, demand: 0.43 },
  { at: 40, title: 'The draft picks up', hint: 'The kiln is losing heat faster.', gain: 1, demand: 0.78 },
  { at: 54, title: 'A dense wood load', hint: 'More heat is coming from each piece.', gain: 1.35, demand: 0.5 },
  { at: 68, title: 'Another wet load', hint: 'Watch for a falling temperature.', gain: 0.67, demand: 0.57 },
  { at: 80, title: 'The final hot load', hint: 'Keep an eye on the rising line.', gain: 1.4, demand: 0.44 },
];
export type Piece = { id: number; progress: number; size: number };
export type Sample = { time: number; temperature: number; feed: number };
export type Run = {
  phase: Phase; paused: boolean; elapsed: number; temperature: number; trend: number;
  feed: number; motor: number; fuel: number; hotTime: number; coldTime: number; inBand: number;
  pieces: Piece[]; nextId: number; fed: number; beltDistance: number; spawnDistance: number;
  history: Sample[]; sampleClock: number; accumulator: number; manualCooldown: number;
  condition: number; animationTime: number; revision: number;
};
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export function newRun(): Run {
  return { phase: 'intro', paused: false, elapsed: 0, temperature: (SAFE_MIN + SAFE_MAX) / 2, trend: 0,
    feed: 0.5, motor: 0.5, fuel: 0.9, hotTime: 0, coldTime: 0, inBand: 0,
    pieces: Array.from({ length: 6 }, (_, i) => ({ id: i, progress: i * 0.25, size: 0.9 + i % 3 * 0.1 })),
    nextId: 6, fed: 0, beltDistance: 0, spawnDistance: 0, history: [{ time: 0, temperature: (SAFE_MIN + SAFE_MAX) / 2, feed: 0.5 }], sampleClock: 0, accumulator: 0, manualCooldown: 0,
    condition: 0, animationTime: 0, revision: 0 };
}
export function conditionAt(time: number): number {
  for (let i = CONDITIONS.length - 1; i >= 0; i--) if (time >= CONDITIONS[i].at) return i;
  return 0;
}
export function setFeed(run: Run, value: number) {
  if (run.phase !== 'running' || run.paused) return;
  run.feed = clamp(value, 0, 1); run.revision++;
}
export function addPiece(run: Run): boolean {
  if (run.phase !== 'running' || run.paused || run.manualCooldown > 0) return false;
  run.pieces.push({ id: run.nextId++, progress: BELT_END, size: 1 });
  run.manualCooldown = 0.5; run.revision++; return true;
}
export function togglePause(run: Run) {
  if (run.phase === 'running') { run.paused = !run.paused; run.revision++; }
}
export function start(run: Run) {
  const revision = run.revision + 1;
  Object.assign(run, newRun(), { phase: 'running', revision });
}
export function warning(run: Run): 'hot' | 'cold' | null {
  return run.temperature > SAFE_MAX ? 'hot' : run.temperature < SAFE_MIN ? 'cold' : null;
}
function simulate(run: Run, dt: number) {
  run.elapsed += dt; run.manualCooldown = Math.max(0, run.manualCooldown - dt);
  run.condition = conditionAt(run.elapsed);
  const condition = CONDITIONS[run.condition];
  run.motor += (run.feed - run.motor) * (1 - Math.exp(-dt / 0.65));
  const travel = run.motor * dt;
  run.beltDistance += travel; run.spawnDistance += travel;
  for (const piece of run.pieces) piece.progress += piece.progress >= BELT_END ? dt : travel;
  while (run.spawnDistance >= 0.25) {
    run.spawnDistance -= 0.25;
    run.pieces.push({ id: run.nextId++, progress: 0, size: 0.9 + run.nextId % 3 * 0.1 });
  }
  run.pieces = run.pieces.filter((piece) => {
    if (piece.progress < BELT_END + 0.2) return true;
    run.fuel += 0.25; run.fed++; return false;
  });
  const burn = run.fuel / 1.8;
  run.fuel = Math.max(0, run.fuel - burn * dt);
  const span = SAFE_MAX - SAFE_MIN;
  const normalized = (run.temperature - SAFE_MIN) / span;
  const change = 0.28 * (burn * condition.gain - condition.demand) - 0.025 * (normalized - 0.5);
  const next = Math.max(20, run.temperature + change * span * dt);
  run.trend += ((next - run.temperature) / dt - run.trend) * Math.min(1, dt * 2);
  run.temperature = next;
  const outside = warning(run);
  run.hotTime = outside === 'hot' ? run.hotTime + dt : Math.max(0, run.hotTime - dt * 2);
  run.coldTime = outside === 'cold' ? run.coldTime + dt : Math.max(0, run.coldTime - dt * 2);
  if (!outside) run.inBand += dt;
  run.sampleClock += dt;
  if (run.sampleClock >= 0.25) {
    run.sampleClock -= 0.25;
    run.history.push({ time: run.elapsed, temperature: run.temperature, feed: run.feed });
    run.history = run.history.filter((point) => point.time >= run.elapsed - 31);
    run.revision++;
  }
  if (run.hotTime >= GRACE_SECONDS) run.phase = 'exploded';
  else if (run.coldTime >= GRACE_SECONDS) run.phase = 'cold';
  else if (run.elapsed >= RUN_SECONDS) { run.elapsed = RUN_SECONDS; run.phase = 'won'; }
}
export function tick(run: Run, delta: number) {
  if (run.paused || run.phase === 'intro') return;
  const dt = clamp(delta, 0, 0.25);
  if (run.phase !== 'running') { run.animationTime = Math.min(5, run.animationTime + dt); return; }
  run.accumulator += dt;
  while (run.accumulator >= STEP && run.phase === 'running') {
    run.accumulator -= STEP; simulate(run, STEP);
  }
}
