import { COMPANIES } from './companies';
export const SHIFT_SECONDS = 180, CONTACT_GOAL = 5, SCAN_RANGE = 13, STEP = 1 / 60;
export const HALL = { minX: -18, maxX: 18, minZ: -24, maxZ: 27 };
export type Rect = { x: number; z: number; w: number; d: number };
export const BOOTHS: (Rect & { id: number })[] = Array.from({ length: 20 }, (_, i) => ({ id: i, x: [-13.5, -5.5, 5.5, 13.5][i % 4], z: 17 - Math.floor(i / 4) * 9, w: 5.2, d: 3.8 }));
export type Person = { id: number; company: number; x: number; z: number; homeX: number; homeZ: number; yaw: number; scanned: boolean; rude: boolean; windup: number; cooldown: number; step: number };
export type Breath = { id: number; owner: number; x: number; z: number; dx: number; dz: number; age: number };
export type Controls = { forward: number; strafe: number; turn: number; look: number };
export const STILL: Controls = { forward: 0, strafe: 0, turn: 0, look: 0 };
export type Run = { phase: 'intro' | 'playing' | 'won' | 'lost'; paused: boolean; seed: number; elapsed: number; x: number; z: number; yaw: number; pitch: number; health: number; immunity: number; people: Person[]; targets: number[]; boothCompanies: number[]; breath: Breath[]; nextBreath: number; scanCooldown: number; beamTime: number; beamEnd: [number, number, number]; lastScan: number | null; scanCount: number; found: number; score: number; message: string; messageTime: number; hitTime: number; accumulator: number; revision: number };
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
function random(r: Run) { r.seed = (Math.imul(r.seed, 1664525) + 1013904223) >>> 0; return r.seed / 4294967296; }
function shuffle<T>(r: Run, values: T[]) { for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random(r) * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; } return values; }
export function newRun(seed = Math.floor(Math.random() * 0xFFFFFFFF)): Run {
  const r: Run = { phase: 'intro', paused: false, seed, elapsed: 0, x: 0, z: 24, yaw: 0, pitch: -0.035, health: 100, immunity: 0, people: [], targets: [], boothCompanies: [], breath: [], nextBreath: 0, scanCooldown: 0, beamTime: 0, beamEnd: [0, 1.3, 15], lastScan: null, scanCount: 0, found: 0, score: 0, message: '', messageTime: 0, hitTime: 0, accumulator: 0, revision: 0 };
  r.boothCompanies = shuffle(r, COMPANIES.map((_, i) => i));
  // One reachable contact per aisle row, in randomized companies and booth positions.
  const targetPeople = Array.from({ length: 5 }, (_, row) => row * 4 + Math.floor(random(r) * 4));
  r.targets = targetPeople.map((id) => r.boothCompanies[id]);
  const rudeIds = shuffle(r, Array.from({ length: 20 }, (_, i) => i).filter((i) => !targetPeople.includes(i))).slice(0, 6);
  r.people = BOOTHS.map((b) => ({ id: b.id, company: r.boothCompanies[b.id], x: b.x, z: b.z + 3.4, homeX: b.x, homeZ: b.z + 3.4, yaw: 0, scanned: false, rude: rudeIds.includes(b.id), windup: 0, cooldown: 4 + random(r) * 4, step: 0 }));
  // The first clue's contact greets the player in the open entrance aisle.
  const first = r.people[targetPeople[0]]; first.x = first.homeX = 0; first.z = first.homeZ = 17;
  return r;
}
export function start(r: Run) { if (r.phase === 'intro') { r.phase = 'playing'; r.message = 'Find the company in your clue. Scan a badge to meet the team.'; r.messageTime = 5; r.revision++; } }
export function currentTarget(r: Run) { return r.targets.find((company) => !r.people.some((p) => p.company === company && p.scanned)); }
export function blocked(x: number, z: number, radius = 0.32) {
  return x < HALL.minX + radius || x > HALL.maxX - radius || z < HALL.minZ + radius || z > HALL.maxZ - radius || BOOTHS.some((b) => Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius);
}
export function segmentBlocked(ax: number, az: number, bx: number, bz: number) {
  const count = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.15);
  for (let i = 1; i < count; i++) if (blocked(ax + (bx - ax) * i / count, az + (bz - az) * i / count, 0)) return true;
  return false;
}
function walk(body: { x: number; z: number }, dx: number, dz: number) { if (!blocked(body.x + dx, body.z)) body.x += dx; if (!blocked(body.x, body.z + dz)) body.z += dz; }
export function aim(r: Run, yaw: number, pitch: number) { if (r.phase !== 'playing' || r.paused) return; r.yaw += yaw; r.pitch = clamp(r.pitch + pitch, -0.65, 0.55); }
export function aimedPerson(r: Run): Person | null {
  const dx = Math.sin(r.yaw) * Math.cos(r.pitch), dy = Math.sin(r.pitch), dz = -Math.cos(r.yaw) * Math.cos(r.pitch);
  let best: Person | null = null, nearest = SCAN_RANGE;
  for (const p of r.people) {
    const x = p.x - r.x, y = 1.32 - 1.65, z = p.z - r.z, along = x * dx + y * dy + z * dz;
    const off = Math.hypot(x - along * dx, (y - along * dy) * 0.75, z - along * dz);
    if (along > 0 && along < nearest && off < 0.48 && !segmentBlocked(r.x, r.z, p.x, p.z)) { best = p; nearest = along; }
  }
  return best;
}
export function scan(r: Run) {
  if (r.phase !== 'playing' || r.paused || r.scanCooldown > 0) return false;
  r.scanCooldown = 0.45; r.beamTime = 0.22;
  const target = aimedPerson(r);
  r.beamEnd = target ? [target.x, 1.32, target.z] : [r.x + Math.sin(r.yaw) * SCAN_RANGE, 1.65 + Math.sin(r.pitch) * SCAN_RANGE, r.z - Math.cos(r.yaw) * SCAN_RANGE];
  if (!target) { r.message = 'No badge in range. Aim at a lanyard and get a little closer.'; r.messageTime = 2; r.revision++; return false; }
  r.lastScan = target.id;
  if (target.scanned) { r.message = 'Already scanned. Look for the next company in your clue.'; r.messageTime = 2; r.revision++; return false; }
  target.scanned = true; target.windup = 0;
  // Scanning a pushy vendor neutralizes both the vendor and their active breath clouds.
  r.breath = r.breath.filter((b) => b.owner !== target.id);
  r.scanCount++; const wanted = r.targets.includes(target.company); r.score += wanted ? 500 : target.rude ? 100 : 25;
  r.found = r.targets.filter((c) => r.people.some((p) => p.company === c && p.scanned)).length;
  r.message = `${COMPANIES[target.company].name} / ${wanted ? 'CONTACT FOUND!' : target.rude ? 'Bad breath stopped. Thanks for the introduction!' : 'Nice to meet you. Keep looking.'}`;
  r.messageTime = 4;
  if (r.found === CONTACT_GOAL) { r.phase = 'won'; r.score += Math.floor((SHIFT_SECONDS - r.elapsed) * 10) + r.health * 5; }
  r.revision++; return true;
}
export function togglePause(r: Run) { if (r.phase === 'playing') { r.paused = !r.paused; r.revision++; } }
function simulate(r: Run, dt: number, controls: Controls) {
  r.elapsed += dt; r.scanCooldown = Math.max(0, r.scanCooldown - dt); r.beamTime = Math.max(0, r.beamTime - dt); r.hitTime = Math.max(0, r.hitTime - dt); r.immunity = Math.max(0, r.immunity - dt); r.messageTime = Math.max(0, r.messageTime - dt);
  aim(r, controls.turn * dt * 1.8, controls.look * dt * 1.1);
  const mag = Math.max(1, Math.hypot(controls.forward, controls.strafe)), f = controls.forward / mag * dt * 4.2, s = controls.strafe / mag * dt * 4.2;
  walk(r, Math.sin(r.yaw) * f + Math.cos(r.yaw) * s, -Math.cos(r.yaw) * f + Math.sin(r.yaw) * s);
  for (const p of r.people) {
    const distance = Math.hypot(r.x - p.x, r.z - p.z); p.yaw = Math.atan2(r.x - p.x, r.z - p.z);
    if (p.scanned) continue;
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (p.rude && r.elapsed > 4 && distance < 12 && !segmentBlocked(p.x, p.z, r.x, r.z)) {
      if (distance > 3.2 && p.windup === 0) { const pace = dt * 1.4 / distance; walk(p, (r.x - p.x) * pace, (r.z - p.z) * pace); p.step += dt * 5; }
      if (distance < 4.6 && p.cooldown === 0) {
        p.windup += dt;
        if (p.windup > 0.95) { r.breath.push({ id: r.nextBreath++, owner: p.id, x: p.x, z: p.z, dx: (r.x - p.x) / Math.max(0.01, distance), dz: (r.z - p.z) / Math.max(0.01, distance), age: 0 }); p.windup = 0; p.cooldown = 3.2; }
      } else p.windup = 0;
    } else {
      p.windup = 0;
      const tx = p.homeX + Math.sin(r.elapsed * 0.32 + p.id) * 0.6, tz = p.homeZ + Math.cos(r.elapsed * 0.23 + p.id) * 0.25;
      walk(p, (tx - p.x) * dt * 0.65, (tz - p.z) * dt * 0.65); p.step += dt * 0.7;
    }
  }
  r.breath = r.breath.filter((b) => {
    b.age += dt; const x = b.x + b.dx * dt * 3.3, z = b.z + b.dz * dt * 3.3;
    if (blocked(x, z, 0) || b.age > 2.5) return false; b.x = x; b.z = z;
    if (r.immunity === 0 && Math.hypot(r.x - x, r.z - z) < 0.55 + b.age * 0.22) { r.health = Math.max(0, r.health - 25); r.immunity = 1.6; r.hitTime = 0.7; r.message = 'WHOA. Bad breath! Scan that vendor before the next cloud.'; r.messageTime = 3; r.revision++; return false; }
    return true;
  });
  if (r.health === 0 || r.elapsed >= SHIFT_SECONDS) { r.phase = 'lost'; r.elapsed = Math.min(r.elapsed, SHIFT_SECONDS); r.revision++; }
}
export function tick(r: Run, delta: number, controls: Controls = STILL) {
  if (r.phase !== 'playing' || r.paused) return;
  r.accumulator += clamp(delta, 0, 0.15);
  while (r.accumulator >= STEP && r.phase === 'playing') { r.accumulator -= STEP; simulate(r, STEP, controls); }
}
