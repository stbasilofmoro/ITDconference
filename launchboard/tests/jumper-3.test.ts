import { describe, it, expect } from 'vitest';
import { advance, award, enemyHeight, hurt, loseLife, newRun, pause, STEP, STILL, tick, type Input, type Run } from '../src/games/jumper-3/engine';
import { LEVELS, makeStage } from '../src/games/jumper-3/levels';
import { JumperControls } from '../src/games/jumper-3/controls';

function play(stage = 0) { const r = newRun(); Object.assign(r, makeStage(stage), { stage }); advance(r); tick(r, STEP); return r; }
function frames(r: Run, n: number, input: Partial<Input> = {}) { for (let i = 0; i < n; i++) tick(r, STEP, { ...STILL, ...input }); }
function empty(r: Run) { r.enemies = []; r.pickups = []; r.solids = r.solids.filter((s) => s.kind === 'ground'); return r; }

describe('Atom platforming', () => {
  it('waits at the story and freezes the shift and physics while paused', () => {
    const r = newRun(); frames(r, 100, { move: 1 }); expect(r.x).toBe(2); expect(r.elapsed).toBe(0);
    advance(r); frames(r, 10, { move: 1 }); pause(r); const saved = structuredClone(r);
    frames(r, 100, { move: 1, jump: true }); expect(r).toEqual(saved);
    advance(r); frames(r, 10, { move: 1 }); expect(r.x).toBeGreaterThan(saved.x);
  });
  it('holding jump produces a higher arc than a tap and does not auto-hop on landing', () => {
    const held = empty(play()), tap = empty(play()); let high = 0, low = 0;
    for (let i = 0; i < 90; i++) { frames(held, 1, { jump: true }); frames(tap, 1, { jump: i < 3 }); high = Math.max(high, held.y); low = Math.max(low, tap.y); }
    expect(high).toBeGreaterThan(3.5); expect(low).toBeLessThan(1.7); expect(held.grounded).toBe(true); expect(held.y).toBe(0);
  });
  it('allows a coyote jump and buffers a jump just before landing', () => {
    const r = empty(play()); Object.assign(r, { grounded: false, y: 0.1, coyote: 0.08 }); frames(r, 1, { jump: true }); expect(r.vy).toBeGreaterThan(10);
    Object.assign(r, { grounded: false, y: 0.04, vy: -5, coyote: 0, wasJump: false }); frames(r, 1, { jump: true }); expect(r.grounded).toBe(true);
    frames(r, 1, { jump: true }); expect(r.vy).toBeGreaterThan(10);
  });
  it('every mandatory gap can be crossed with a running held jump', () => {
    LEVELS.forEach((level, stage) => level.ground.slice(0, -1).forEach(([, edge], i) => {
      const r = empty(play(stage)); Object.assign(r, { x: edge - 0.75, vx: 8.6, immune: 10 });
      let landed = false;
      for (let n = 0; n < 80; n++) { frames(r, 1, { move: 1, run: true, jump: true }); if (r.grounded && r.x > level.ground[i + 1][0]) { landed = true; break; } }
      expect(landed, `${level.title}: gap after ${edge}`).toBe(true); expect(r.phase).toBe('playing');
    }));
  });
  it('bumps a supply crate from underneath only once', () => {
    const r = play(); r.enemies = []; r.pickups = []; r.x = 6.5;
    frames(r, 30, { jump: true }); const crate = r.solids.find((s) => s.contents === 'helmet')!;
    expect(crate.used).toBe(true); expect(r.pickups.filter((p) => p.kind === 'helmet')).toHaveLength(1);
    frames(r, 90); r.x = 6.5; frames(r, 30, { jump: true }); expect(r.pickups.filter((p) => p.kind === 'helmet')).toHaveLength(1);
  });
  it('collects power-ups, absorbs successive hits and respects immunity', () => {
    const r = play(); award(r, 'spark'); expect(r.power).toBe('spark'); hurt(r, 3); expect(r.power).toBe('helmet'); hurt(r, 3); expect(r.power).toBe('helmet');
    r.immune = 0; hurt(r, 3); expect(r.power).toBe('small'); r.immune = 0; hurt(r, 3); expect(r.phase).toBe('hit'); expect(r.lives).toBe(2);
  });
  it('stomps a hood and bounces safely; a side collision costs a life', () => {
    const r = play(), e = r.enemies[0]; e.vx = 0; r.x = e.x; r.y = enemyHeight(e) + 0.05; r.vy = -8; r.grounded = false;
    frames(r, 1); expect(e.dead).toBe(true); expect(r.vy).toBeGreaterThan(0); expect(r.lives).toBe(3); expect(r.score).toBeGreaterThanOrEqual(150);
    const next = r.enemies[1]; Object.assign(r, { x: next.x, y: next.y, vy: 0 }); frames(r, 1); expect(r.phase).toBe('hit');
  });
  it('fires bouncing sparks that can defeat hoods', () => {
    const r = empty(play()); r.power = 'spark'; frames(r, 20, { fire: true }); expect(r.shots.length).toBeGreaterThan(0);
    let bounced = false;
    for (let i = 0; i < 50; i++) { frames(r, 1); if (r.shots.some((s) => s.vy > 4)) bounced = true; } expect(bounced).toBe(true);
    const e = makeStage(0).enemies[0]; e.x = e.min = e.max = 6; e.vx = 0; r.enemies = [e]; frames(r, 35, { fire: true }); expect(e.dead).toBe(true);
  });
  it('Atom Core stops enemy damage but cannot rescue a fall', () => {
    const r = play(); award(r, 'core'); hurt(r, 3); expect(r.lives).toBe(3);
    r.y = -6; r.grounded = false; frames(r, 1); expect(r.phase).toBe('hit'); expect(r.lives).toBe(2);
  });
  it('saves safe checkpoints and retains used crates and collected credits on retry', () => {
    for (let stage = 0; stage < 3; stage++) {
      const r = play(stage); r.enemies = []; r.x = LEVELS[stage].checkpoint; frames(r, 1); expect(r.checkpoint).toBe(LEVELS[stage].checkpoint);
      award(r, 'credit'); const credits = r.credits; r.solids.find((s) => s.kind === 'crate')!.used = true;
      loseLife(r, 'fall'); advance(r); frames(r, 60); expect(r.phase).toBe('playing'); expect(r.y).toBe(0); expect(r.credits).toBe(credits); expect(r.solids.find((s) => s.kind === 'crate')!.used).toBe(true);
    }
  });
  it('awards an extra life at 100 credits, capped at five lives', () => {
    const r = play(); r.credits = 99; award(r, 'credit'); expect(r.lives).toBe(4); expect(r.score).toBe(50); award(r, 'life'); award(r, 'life'); expect(r.lives).toBe(5);
  });
  it('requires each guardian to fall, advances three chapters, and resets a finished run', () => {
    const r = play();
    for (let stage = 0; stage < 3; stage++) {
      expect(r.stage).toBe(stage); r.x = LEVELS[stage].length - 2.5; frames(r, 1); expect(r.phase).toBe('playing');
      const e = r.enemies.find((e) => e.kind === 'warden')!; e.vx = 0;
      for (let hit = 0; hit < e.maxHp; hit++) { e.immune = 0; Object.assign(r, { x: e.x, y: e.y + enemyHeight(e) + 0.05, vy: -8, grounded: false }); frames(r, 1); }
      expect(e.dead).toBe(true); Object.assign(r, { x: LEVELS[stage].length - 2.5, y: 0, vy: 0, grounded: true }); frames(r, 1);
      expect(r.phase).toBe(stage === 2 ? 'won' : 'cleared');
      if (stage < 2) { advance(r); expect(r.phase).toBe('intro'); advance(r); }
    }
    expect(r.score).toBeGreaterThan(14000); advance(r); expect(r).toMatchObject({ phase: 'intro', stage: 0, lives: 3, score: 0, credits: 0 });
  });
  it('ends after the final life and bounds long frame delays', () => {
    const r = play(); tick(r, 30); expect(r.elapsed).toBeLessThan(0.2); r.elapsed = 179.99; r.lives = 1; frames(r, 1); expect(r.phase).toBe('lost');
  });
});

describe('independent touch holds', () => {
  it('releases only the ending finger while preserving movement and other actions', () => {
    const c = new JumperControls(); c.press(1, 'right'); c.press(2, 'jump'); c.press(3, 'fire'); c.release(2);
    expect(c.held('right')).toBe(true); expect(c.held('jump')).toBe(false); expect(c.held('fire')).toBe(true); c.release(99); expect(c.held('right')).toBe(true);
    c.keys.add('KeyD'); c.clear(); expect(c.pointers.size).toBe(0); expect(c.keys.size).toBe(0); expect(c.jumpQueued).toBe(false);
  });
});
