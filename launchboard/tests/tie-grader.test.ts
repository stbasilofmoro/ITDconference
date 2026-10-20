import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_SECONDS, DESTINATIONS, GRADES, PLAYER_SPEED, QUOTA, REACH, SHIFT_SECONDS, STATIONS,
  interact, move, nearestStation, newRun, remaining, start, tick, togglePause, visit,
  type Run, type StationId,
} from '../src/games/tie-grader/engine';

const playing = (seed = 7) => { const run = newRun(seed); start(run); return run; };

function walkTo(run: Run, station: StationId) {
  expect(visit(run, station)).toBe(true);
  for (let step = 0; step < 300 && run.target; step++) tick(run, 0.05);
  expect(run.target, `Arrive at ${station}`).toBeNull();
}

function assertConserved(run: Run) {
  const ids = [
    ...run.queue, ...run.incoming, ...Object.values(run.piles).flat(),
    ...(run.held ? [run.held.tie] : []),
  ].map((tie) => tie.id).concat(run.deliveredIds);
  expect(ids).toHaveLength(QUOTA);
  expect(new Set(ids).size).toBe(QUOTA);
  expect(ids.sort((a, b) => a - b)).toEqual(Array.from({ length: QUOTA }, (_, i) => i + 1));
  expect(Object.values(run.delivered).reduce((sum, count) => sum + count, 0)).toBe(run.handled);
  expect(run.deliveredIds).toHaveLength(run.handled);
}

function finishShift(run: Run) {
  for (let count = 0; count < QUOTA; count++) {
    while (!run.incoming.length && run.phase === 'playing') tick(run, 0.05);
    walkTo(run, 'incoming');
    const grade = run.held!.tie.grade;
    walkTo(run, grade);
    expect(run.held).toBeNull();
    assertConserved(run);
    walkTo(run, grade);
    expect(run.held?.graded).toBe(grade);
    walkTo(run, DESTINATIONS[grade]);
    assertConserved(run);
  }
}

describe('Tie Grader shift rules', () => {
  it('creates a deterministic finite shift with a balanced opening and visible condition clues', () => {
    const run = newRun(7);
    expect(run).toEqual(newRun(7));
    expect(run.incoming).toHaveLength(3);
    expect(run.queue).toHaveLength(9);
    expect(new Set(run.incoming.map((tie) => tie.grade))).toEqual(new Set(GRADES));
    const all = [...run.incoming, ...run.queue];
    for (const grade of GRADES) expect(all.filter((tie) => tie.grade === grade)).toHaveLength(4);
    for (const tie of all) {
      expect(tie.condition.length).toBeGreaterThan(12);
      expect(tie.condition).not.toMatch(/grade|junk/i);
    }
    expect(newRun(22).queue).not.toEqual(run.queue);
    assertConserved(run);
  });

  it('releases only the remaining nine ties over time and preserves stock while paused', () => {
    const run = playing();
    tick(run, ARRIVAL_SECONDS - 0.01);
    expect(run.incoming).toHaveLength(3);
    togglePause(run);
    const paused = structuredClone(run);
    tick(run, 30);
    expect(run).toEqual(paused);
    togglePause(run);
    tick(run, 0.02);
    expect(run.incoming).toHaveLength(4);
    tick(run, 80);
    expect(run.incoming).toHaveLength(QUOTA);
    expect(run.queue).toEqual([]);
    tick(run, 5);
    expect(run.incoming).toHaveLength(QUOTA);
    assertConserved(run);
  });

  it('walks to a station before picking up and performs each requested interaction only once', () => {
    const run = playing();
    expect(interact(run, 'incoming')).toBe(false);
    expect(run.held).toBeNull();
    const startX = run.player.x;
    visit(run, 'incoming');
    tick(run, 0.01);
    expect(run.player.x).not.toBe(startX);
    expect(run.held).toBeNull();
    tick(run, 3);
    expect(run.held).not.toBeNull();
    expect(run.incoming).toHaveLength(2);
    expect(run.target).toBeNull();
    const id = run.held!.tie.id;
    tick(run, 3);
    expect(run.held!.tie.id).toBe(id);
    expect(run.incoming).toHaveLength(2);
    expect(nearestStation(run)?.id).toBe('incoming');
    assertConserved(run);
  });

  it('requires every tie to pass through its grade pile before the right truck or shredder', () => {
    const run = playing();
    for (let count = 0; count < 3; count++) {
      walkTo(run, 'incoming');
      const held = run.held!;
      walkTo(run, DESTINATIONS[held.tie.grade]);
      expect(run.held).toEqual(held);
      expect(run.handled).toBe(count);
      expect(run.message).toMatch(/pile first/);
      walkTo(run, held.tie.grade);
      expect(run.held).toBeNull();
      expect(run.piles[held.tie.grade]).toContainEqual(held.tie);
      expect(run.graded).toBe(count + 1);
      walkTo(run, held.tie.grade);
      expect(run.held?.graded).toBe(held.tie.grade);
      walkTo(run, DESTINATIONS[held.tie.grade]);
      expect(run.held).toBeNull();
      expect(run.handled).toBe(count + 1);
      assertConserved(run);
    }
    expect(run.delivered).toEqual({ grade1: 1, grade2: 1, junk: 1 });
    expect(run.score).toBe(300);
    expect(run.mistakes).toBe(0);
  });

  it('retains misgraded ties with a condition explanation and subtracts points without losing stock', () => {
    const run = playing();
    walkTo(run, 'incoming');
    const held = structuredClone(run.held!);
    const wrong = GRADES.find((grade) => grade !== held.tie.grade)!;
    walkTo(run, wrong);
    expect(run.held).toEqual(held);
    expect(run.piles[wrong]).toEqual([]);
    expect(run.mistakes).toBe(1);
    expect(run.score).toBe(0);
    expect(run.message).toMatch(/Take another look/);
    walkTo(run, held.tie.grade);
    expect(run.score).toBe(25);
    walkTo(run, held.tie.grade);
    walkTo(run, DESTINATIONS[wrong]);
    expect(run.held?.tie.id).toBe(held.tie.id);
    expect(run.score).toBe(15);
    expect(run.mistakes).toBe(2);
    expect(run.handled).toBe(0);
    walkTo(run, DESTINATIONS[held.tie.grade]);
    expect(run.score).toBe(90);
    expect(run.handled).toBe(1);
    assertConserved(run);
  });

  it('cannot farm grading points by picking up and replacing an already graded tie', () => {
    const run = playing();
    walkTo(run, 'incoming');
    const grade = run.held!.tie.grade;
    walkTo(run, grade);
    for (let cycle = 0; cycle < 4; cycle++) {
      walkTo(run, grade);
      expect(run.held?.graded).toBe(grade);
      walkTo(run, grade);
    }
    expect(run.graded).toBe(1);
    expect(run.score).toBe(25);
    expect(run.piles[grade]).toHaveLength(1);
    walkTo(run, grade);
    const wrong = GRADES.find((other) => other !== grade)!;
    walkTo(run, wrong);
    expect(run.held?.graded).toBe(grade);
    expect(run.piles[wrong]).toEqual([]);
    expect(run.graded).toBe(1);
    assertConserved(run);
  });

  it('keeps empty-hand actions and full-paw pickups safe', () => {
    const run = playing();
    walkTo(run, 'truck1');
    expect(run.message).toMatch(/Pick up a graded tie/);
    walkTo(run, 'junk');
    expect(run.message).toMatch(/empty/);
    walkTo(run, 'incoming');
    const held = structuredClone(run.held);
    const incomingCount = run.incoming.length;
    expect(interact(run, 'incoming')).toBe(false);
    expect(run.message).toMatch(/paws are full/);
    expect(run.held).toEqual(held);
    expect(run.incoming).toHaveLength(incomingCount);
    expect(run.mistakes).toBe(0);
    assertConserved(run);
  });

  it('supports manual walking, normalized diagonal speed, nearby interaction, and yard boundaries', () => {
    const run = playing();
    run.player = { x: 0, z: 0, facing: 0 };
    visit(run, 'incoming');
    move(run, 0, 0, 0.1);
    expect(run.target).toBe('incoming');
    move(run, 1, 1, 0.1);
    expect(run.target).toBeNull();
    expect(Math.hypot(run.player.x, run.player.z)).toBeCloseTo(PLAYER_SPEED * 0.1);
    expect(run.player.facing).toBeCloseTo(Math.PI / 4);
    move(run, 1, 1, 20);
    expect(run.player.x).toBe(8.5);
    expect(run.player.z).toBe(5.5);
    move(run, -1, -1, 20);
    expect(run.player.x).toBe(-8.5);
    expect(run.player.z).toBe(-4.5);
    const incoming = STATIONS.find((station) => station.id === 'incoming')!;
    run.player.x = incoming.x + REACH;
    run.player.z = incoming.z;
    expect(interact(run)).toBe(true);
    expect(run.held).not.toBeNull();
  });

  it('wins after twelve complete deliveries, with four ties in each destination', () => {
    for (const seed of [1, 7, 22]) {
      const run = playing(seed);
      finishShift(run);
      expect(run.phase).toBe('won');
      expect(run.elapsed).toBeLessThan(SHIFT_SECONDS);
      expect(run.graded).toBe(QUOTA);
      expect(run.handled).toBe(QUOTA);
      expect(run.score).toBe(1200);
      expect(run.delivered).toEqual({ grade1: 4, grade2: 4, junk: 4 });
      expect(run.held).toBeNull();
      expect(run.incoming).toEqual([]);
      expect(Object.values(run.piles).flat()).toEqual([]);
    }
  });

  it('ends an unfinished shift at the deadline without deleting a carried tie', () => {
    const run = playing();
    walkTo(run, 'incoming');
    const held = structuredClone(run.held);
    tick(run, SHIFT_SECONDS + 20);
    expect(run.phase).toBe('lost');
    expect(run.elapsed).toBe(SHIFT_SECONDS);
    expect(remaining(run)).toBe(0);
    expect(run.held).toEqual(held);
    expect(run.message).toMatch(/0\/12/);
    assertConserved(run);
  });

  it('freezes time and all gameplay actions before a shift, while paused, and after either result', () => {
    const intro = newRun(7);
    const paused = playing();
    visit(paused, 'incoming');
    togglePause(paused);
    const lost = playing();
    tick(lost, SHIFT_SECONDS);
    const won = playing();
    finishShift(won);
    for (const run of [intro, paused, lost, won]) {
      const before = structuredClone(run);
      tick(run, 40);
      move(run, 1, 1, 2);
      visit(run, 'incoming');
      interact(run, 'incoming');
      expect(run).toEqual(before);
    }
    togglePause(paused);
    tick(paused, 2);
    expect(paused.elapsed).toBe(2);
    expect(paused.held).not.toBeNull();
  });

  it('replays the same shift and result when given the same seed and inputs', () => {
    const run = playing(101);
    finishShift(run);
    const replay = playing(run.initialSeed);
    finishShift(replay);
    expect(replay).toEqual(run);
  });

  it('ignores invalid clock and movement values', () => {
    const run = playing();
    const before = structuredClone(run);
    for (const dt of [0, -1, NaN, Infinity]) { tick(run, dt); move(run, 1, 1, dt); }
    move(run, NaN, 1, 0.1);
    move(run, 1, Infinity, 0.1);
    expect(run).toEqual(before);
  });
});
