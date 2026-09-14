import { LEVELS, makeStage, type Enemy, type PickupKind } from './levels';
export const VIEW_SCALE = 72, VIEW_WIDTH = 1920 / VIEW_SCALE;
export const STEP = 1 / 60, STAGE_SECONDS = 180, PLAYER_W = 0.72;
export type Power = 'small' | 'helmet' | 'spark';
export type Input = { move: number; jump: boolean; run: boolean; fire: boolean };
export const STILL: Input = { move: 0, jump: false, run: false, fire: false };
export type Shot = { id: number; x: number; y: number; vx: number; vy: number; evil: boolean; age: number };
export type Particle = { id: number; x: number; y: number; vx: number; vy: number; time: number; color: string };
export type Run = ReturnType<typeof makeStage> & { phase: 'intro' | 'playing' | 'hit' | 'cleared' | 'won' | 'lost'; stage: number; paused: boolean; x: number; y: number; vx: number; vy: number; facing: number; grounded: boolean; power: Power; core: number; immune: number; lives: number; credits: number; score: number; elapsed: number; totalTime: number; checkpoint: number; camera: number; shots: Shot[]; particles: Particle[]; accumulator: number; coyote: number; jumpBuffer: number; wasJump: boolean; fireCooldown: number; message: string; messageTime: number; revision: number };
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const height = (r: Run) => r.power === 'small' ? 1.45 : 1.7;
export const enemyHeight = (e: Enemy) => e.kind === 'warden' ? 2.05 : 1.3;
const overlaps = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
export const ventOn = (elapsed: number, offset: number) => (elapsed + offset) % 4.5 > 2.5;
export function newRun(): Run { return { ...makeStage(0), phase: 'intro', stage: 0, paused: false, x: 2, y: 0, vx: 0, vy: 0, facing: 1, grounded: true, power: 'small', core: 0, immune: 0, lives: 3, credits: 0, score: 0, elapsed: 0, totalTime: 0, checkpoint: 2, camera: 0, shots: [], particles: [], accumulator: 0, coyote: 0, jumpBuffer: 0, wasJump: false, fireCooldown: 0, message: '', messageTime: 0, revision: 0 }; }
export function announce(r: Run, message: string) { r.message = message; r.messageTime = 3; r.revision++; }
function burst(r: Run, x: number, y: number, color: string) { for (let i = 0; i < 8; i++) r.particles.push({ id: r.nextId++, x, y, vx: Math.cos(i * Math.PI / 4) * 3, vy: Math.sin(i * Math.PI / 4) * 3 + 2, time: 0.6, color }); }
export function award(r: Run, kind: PickupKind) {
  if (kind === 'credit') { r.credits++; r.score += 50; if (r.credits % 100 === 0) { r.lives = Math.min(5, r.lives + 1); announce(r, '100 carbon credits / Extra life!'); } }
  else if (kind === 'helmet') { if (r.power === 'small') r.power = 'helmet'; r.score += 200; announce(r, 'Rail hardhat / One more hit of protection.'); }
  else if (kind === 'spark') { r.power = 'spark'; r.score += 300; announce(r, 'Spark coil / Hold X or Blaster to fire clean-carbon sparks.'); }
  else if (kind === 'core') { r.core = 12; r.score += 300; announce(r, 'Atom Core / Twelve seconds of invincibility. Watch the gaps!'); }
  else { r.lives = Math.min(5, r.lives + 1); r.score += 200; announce(r, 'Maple reserve / Extra life!'); }
  burst(r, r.x, r.y + 1, '#8FE3AA'); r.revision++;
}
export function loseLife(r: Run, reason: string) {
  if (r.phase !== 'playing') return;
  r.lives--; r.phase = r.lives > 0 ? 'hit' : 'lost'; r.vx = r.vy = 0; r.core = 0; r.shots = []; announce(r, reason);
}
export function hurt(r: Run, sourceX: number) {
  if (r.immune > 0 || r.core > 0 || r.phase !== 'playing') return;
  if (r.power === 'small') { loseLife(r, 'The Order caught Atom. Back to the checkpoint.'); return; }
  r.power = r.power === 'spark' ? 'helmet' : 'small'; r.immune = 1.7; r.vx = r.x < sourceX ? -5 : 5; r.vy = 6; r.grounded = false; announce(r, 'Armor absorbed the hit. Keep moving!');
}
export function advance(r: Run) {
  if (r.paused) { r.paused = false; r.wasJump = true; return; }
  if (r.phase === 'intro') { r.phase = 'playing'; r.wasJump = true; announce(r, 'Find the seal at the far right. Stomp hoods; jump the gaps.'); }
  else if (r.phase === 'hit') { r.phase = 'playing'; r.x = r.checkpoint; r.y = 0; r.power = 'small'; r.immune = 2; r.grounded = true; r.wasJump = true; r.jumpBuffer = 0; r.accumulator = 0; r.elapsed = 0; r.camera = Math.max(0, r.x - 10); r.enemies.forEach((e) => { if (!e.dead) { e.x = e.homeX; e.y = e.homeY; e.vy = 0; e.cooldown = 1.6; } }); }
  else if (r.phase === 'cleared') { const next = r.stage + 1; Object.assign(r, makeStage(next), { stage: next, phase: 'intro', x: 2, y: 0, vx: 0, vy: 0, elapsed: 0, camera: 0, checkpoint: 2, core: 0, immune: 0, shots: [], particles: [], grounded: true, jumpBuffer: 0, accumulator: 0, wasJump: true }); }
  else if (r.phase === 'won' || r.phase === 'lost') Object.assign(r, newRun());
  r.revision++;
}
export function pause(r: Run) { if (r.phase === 'playing') { r.paused = !r.paused; r.wasJump = true; r.jumpBuffer = 0; r.revision++; } }
function damageEnemy(r: Run, e: Enemy) {
  if (e.dead || e.immune > 0) return;
  e.hp--; e.immune = 0.65; burst(r, e.x, e.y + 0.9, '#CF697C');
  if (e.hp <= 0) { e.dead = true; r.score += e.kind === 'warden' ? 1000 : 150; if (e.kind === 'warden') announce(r, 'The ward is broken. Reach the green signal to restore the seal!'); }
  r.revision++;
}
function bump(r: Run, id: number) {
  const block = r.solids.find((s) => s.id === id)!; if (block.kind !== 'crate' || block.used) return;
  block.used = true; const kind = block.contents!;
  if (kind === 'credit') for (let i = 0; i < 5; i++) award(r, 'credit');
  else r.pickups.push({ id: r.nextId++, kind, x: block.x + 0.5, y: block.y + block.h + 0.45, vx: 1.5 * r.facing, vy: 5, loose: true, taken: false });
  burst(r, block.x + 0.5, block.y + 1, '#E8B95C'); r.revision++;
}
function simulate(r: Run, input: Input) {
  const dt = STEP, level = LEVELS[r.stage]; r.elapsed += dt; r.totalTime += dt;
  r.core = Math.max(0, r.core - dt); r.immune = Math.max(0, r.immune - dt); r.fireCooldown = Math.max(0, r.fireCooldown - dt); r.messageTime = Math.max(0, r.messageTime - dt);
  for (const s of r.solids) if (s.kind === 'lift') { const old = s.y; s.y = s.originY! + Math.sin(r.elapsed * 1.1) * 0.8; if (r.grounded && Math.abs(r.y - old - s.h) < 0.08 && r.x + PLAYER_W / 2 > s.x && r.x - PLAYER_W / 2 < s.x + s.w) r.y += s.y - old; }
  if (r.grounded) r.coyote = 0.1; else r.coyote = Math.max(0, r.coyote - dt);
  r.jumpBuffer = Math.max(0, r.jumpBuffer - dt);
  if (input.jump && !r.wasJump) r.jumpBuffer = 0.12;
  if (r.jumpBuffer > 0 && r.coyote > 0) { r.vy = 14; r.grounded = false; r.coyote = r.jumpBuffer = 0; }
  if (!input.jump && r.wasJump && r.vy > 5) r.vy = 5;
  r.wasJump = input.jump;
  const move = clamp(input.move, -1, 1), speed = input.run ? 8.6 : 5.8, target = move * speed;
  r.vx += clamp(target - r.vx, -42 * dt, 42 * dt); if (move !== 0) r.facing = Math.sign(move);
  r.x = clamp(r.x + r.vx * dt, PLAYER_W / 2, level.length - PLAYER_W / 2);
  for (const s of r.solids) if ((s.kind === 'ground' || s.kind === 'crate') && overlaps(r.x - PLAYER_W / 2, r.y + 0.03, PLAYER_W, height(r) - 0.04, s.x, s.y, s.w, s.h)) { r.x = r.vx > 0 ? s.x - PLAYER_W / 2 : s.x + s.w + PLAYER_W / 2; r.vx = 0; }
  const oldY = r.y; r.vy -= (input.jump && r.vy > 0 ? 25 : 34) * dt; r.y += r.vy * dt; r.grounded = false;
  for (const s of r.solids) {
    if (r.x + PLAYER_W / 2 <= s.x || r.x - PLAYER_W / 2 >= s.x + s.w) continue;
    const top = s.y + s.h;
    if (r.vy <= 0 && oldY >= top - 0.06 && r.y <= top) { r.y = top; r.vy = 0; r.grounded = true; }
    else if (s.kind === 'crate' && r.vy > 0 && oldY + height(r) <= s.y + 0.04 && r.y + height(r) >= s.y) { r.y = s.y - height(r); r.vy = 0; bump(r, s.id); }
  }
  if (input.fire && r.power === 'spark' && r.fireCooldown === 0) { r.fireCooldown = 0.28; r.shots.push({ id: r.nextId++, x: r.x + r.facing * 0.65, y: r.y + 0.8, vx: r.facing * 13, vy: 2.5, evil: false, age: 0 }); }
  for (const p of r.pickups) {
    if (p.taken) continue;
    if (p.loose) { const old = p.y; p.vy -= 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; for (const s of r.solids) if (p.x > s.x && p.x < s.x + s.w && old - 0.35 >= s.y + s.h - 0.05 && p.y - 0.35 < s.y + s.h) { p.y = s.y + s.h + 0.35; p.vy = 0; } if (p.y < -5) p.taken = true; }
    if (overlaps(r.x - PLAYER_W / 2, r.y, PLAYER_W, height(r), p.x - 0.35, p.y - 0.35, 0.7, 0.7)) { p.taken = true; award(r, p.kind); }
  }
  for (const e of r.enemies) {
    if (e.dead) continue; e.immune = Math.max(0, e.immune - dt); e.cooldown = Math.max(0, e.cooldown - dt);
    e.x += e.vx * dt; if (e.x < e.min || e.x > e.max) { e.x = clamp(e.x, e.min, e.max); e.vx *= -1; }
    if (e.kind === 'wraith') e.y = e.homeY + Math.sin(r.elapsed * 2.3 + e.id) * 0.8;
    else { if (e.kind === 'hopper' && e.cooldown === 0 && e.grounded) { e.vy = 9; e.cooldown = 1.9; } e.vy -= 25 * dt; e.y += e.vy * dt; e.grounded = false; if (e.y <= e.homeY) { e.y = e.homeY; e.vy = 0; e.grounded = true; } }
    if ((e.kind === 'caster' || e.kind === 'warden') && Math.abs(e.x - r.x) < 16 && e.cooldown === 0) { e.cooldown = e.kind === 'warden' ? 2.2 : 2.8; r.shots.push({ id: r.nextId++, x: e.x, y: e.y + 0.9, vx: Math.sign(r.x - e.x) * 4.3, vy: 0, evil: true, age: 0 }); }
    const ew = e.kind === 'warden' ? 1.2 : 0.8;
    if (overlaps(r.x - PLAYER_W / 2, r.y, PLAYER_W, height(r), e.x - ew / 2, e.y, ew, enemyHeight(e))) {
      if (r.core > 0) damageEnemy(r, e);
      else if (r.vy < 0 && oldY >= e.y + enemyHeight(e) - 0.28) { damageEnemy(r, e); r.y = e.y + enemyHeight(e); r.vy = input.jump ? 13 : 10; r.grounded = false; }
      else hurt(r, e.x);
    }
  }
  r.shots = r.shots.filter((s) => {
    s.age += dt; const old = s.y; s.x += s.vx * dt; s.y += s.vy * dt; if (!s.evil) s.vy -= 18 * dt;
    if (s.age > 4 || s.y < -4) return false;
    for (const b of r.solids) if (s.x > b.x && s.x < b.x + b.w && s.y < b.y + b.h && s.y > b.y) { if (!s.evil && old >= b.y + b.h - 0.08 && s.vy < 0) { s.y = b.y + b.h + 0.08; s.vy = 5; } else return false; }
    if (s.evil) { if (overlaps(r.x - PLAYER_W / 2, r.y, PLAYER_W, height(r), s.x - 0.18, s.y - 0.18, 0.36, 0.36)) { hurt(r, s.x); return false; } }
    else for (const e of r.enemies) if (!e.dead && overlaps(s.x - 0.15, s.y - 0.15, 0.3, 0.3, e.x - 0.6, e.y, 1.2, enemyHeight(e))) { damageEnemy(r, e); return false; }
    return true;
  });
  for (const h of level.hazards) if ((h.kind === 'scrap' || ventOn(r.elapsed, h.offset)) && overlaps(r.x - PLAYER_W / 2, r.y, PLAYER_W, height(r), h.x, h.y, h.w, h.kind === 'scrap' ? 0.6 : 2.3)) hurt(r, h.x + h.w / 2);
  if (r.y < -5) loseLife(r, 'Mind the gap. Return to the last green checkpoint.');
  if (r.elapsed >= STAGE_SECONDS) loseLife(r, 'The shift clock ran out. Try again from the checkpoint.');
  if (r.phase !== 'playing') return;
  if (r.x >= level.checkpoint && r.checkpoint === 2 && r.grounded) { r.checkpoint = level.checkpoint; announce(r, 'Green signal / Checkpoint saved.'); }
  if (r.x >= level.length - 3 && r.grounded) {
    if (r.enemies.some((e) => e.kind === 'warden' && !e.dead)) { r.x = Math.min(r.x, level.length - 3.05); if (r.messageTime <= 0) announce(r, 'The seal is warded. Stomp the guardian or use the spark coil.'); }
    else { r.score += 2000 + Math.floor((STAGE_SECONDS - r.elapsed) * 10); r.phase = r.stage === 2 ? 'won' : 'cleared'; r.vx = 0; burst(r, r.x, r.y + 2, '#8FE3AA'); r.revision++; }
  }
  r.camera += (clamp(r.x - 10, 0, level.length - VIEW_WIDTH) - r.camera) * Math.min(1, dt * 6);
  r.particles = r.particles.filter((p) => { p.time -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 12 * dt; return p.time > 0; });
}
export function tick(r: Run, delta: number, input: Input = STILL) { if (r.phase !== 'playing' || r.paused) return; r.accumulator += clamp(delta, 0, 0.15); while (r.accumulator >= STEP && r.phase === 'playing') { r.accumulator -= STEP; simulate(r, input); } }
