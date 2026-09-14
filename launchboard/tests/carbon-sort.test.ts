import { describe, expect, it } from 'vitest';
import { canPlace, command, continueRun, emptyBoard, gravityStep, HEIGHT, landingPair, lockPair, matches, newRun, prepareRound, removeMatches, ROUND_TARGETS, targetCount, tick, WIDTH, type Board, type Cell, type Material, type Run } from '../src/games/carbon-sort/engine';

let id = 1000;
const cell = (material: Material, target = false, bond: number | null = null): Cell => ({ id: id++, material, target, bond });
function settle(run: Run) { for (let i = 0; i < 300 && ['clearing', 'settling'].includes(run.phase); i++) tick(run, 0.1); }

describe('Carbon Sort match rules', () => {
  it('clears horizontal and vertical runs of four, including intersecting lines only once', () => {
    const board = emptyBoard();
    for (let x = 1; x <= 4; x++) board[5][x] = cell('ties');
    for (let y = 3; y <= 6; y++) board[y][2] = cell('ties');
    expect(matches(board)).toHaveLength(7);
    board[5][4] = cell('metal');
    expect(matches(board)).toHaveLength(4);
  });
  it('does not match diagonals, mixed materials, or runs shorter than four', () => {
    const board = emptyBoard();
    for (let i = 0; i < 4; i++) board[i][i] = cell('carbon');
    for (let i = 0; i < 3; i++) board[10][i] = cell('metal');
    expect(matches(board)).toEqual([]);
  });
  it('generates all three rounds without automatic matches or blocked entrances', () => {
    for (let seed = 1; seed <= 40; seed++) for (let round = 0; round < 3; round++) {
      const run = newRun(seed); run.round = round; prepareRound(run);
      expect(targetCount(run.board)).toBe(ROUND_TARGETS[round]);
      expect(matches(run.board)).toEqual([]);
      continueRun(run); expect(run.phase).toBe('playing');
      expect(canPlace(run.board, run.active!)).toBe(true);
    }
  });
});

describe('paired material controls and collisions', () => {
  it('moves, rotates at walls and the floor, and rejects obstructed rotations', () => {
    const run = newRun(1); continueRun(run); run.board = emptyBoard();
    run.active = { x: 7, y: 5, direction: 3, materials: ['ties', 'metal'] };
    command(run, 'rotate'); expect(run.active).toMatchObject({ x: 6, direction: 0 });
    run.active = { x: 3, y: HEIGHT - 1, direction: 0, materials: ['ties', 'metal'] };
    command(run, 'rotate'); expect(run.active).toMatchObject({ y: HEIGHT - 2, direction: 1 });
    run.active = { x: 3, y: 5, direction: 0, materials: ['ties', 'metal'] };
    for (let y = 3; y <= 7; y++) for (let x = 1; x <= 6; x++) if (!(y === 5 && (x === 3 || x === 4))) run.board[y][x] = cell('carbon', true);
    command(run, 'rotate'); expect(run.active.direction).toBe(0);
    command(run, 'left'); expect(run.active.x).toBe(3);
  });
  it('shows the true landing position and lets the opening pair clear three stock targets', () => {
    const run = newRun(10); continueRun(run);
    expect(landingPair(run)).toMatchObject({ x: 3, y: 13 });
    command(run, 'drop'); expect(run.phase).toBe('clearing');
    settle(run);
    expect(targetCount(run.board)).toBe(6); expect(run.targetsCleared).toBe(3);
    expect(run.score).toBe(340); expect(run.recovered).toBe(4);
    expect(run.board[13][4]).toMatchObject({ material: 'carbon', target: false, bond: null });
  });
  it('locks after the grounded delay and cannot be stalled by unlimited side-to-side moves', () => {
    const run = newRun(2); continueRun(run); run.board = emptyBoard(); run.board[5][7] = cell('metal', true);
    run.active = { x: 2, y: 13, direction: 0, materials: ['ties', 'carbon'] };
    for (let i = 0; i < 8; i++) command(run, i % 2 ? 'left' : 'right');
    for (let i = 0; i < 5; i++) { tick(run, 0.1); command(run, i % 2 ? 'left' : 'right'); }
    expect(run.board[13].filter(Boolean)).toHaveLength(2);
  });
  it('pauses falling and resolution, then resumes through the same control', () => {
    const run = newRun(1); continueRun(run); command(run, 'pause');
    const before = JSON.stringify(run);
    tick(run, 10); command(run, 'left'); expect(JSON.stringify(run)).toBe(before);
    command(run, 'pause'); for (let i = 0; i < 10; i++) tick(run, 0.1);
    expect(run.active!.y).toBe(1);
  });
});

describe('linked gravity and chain reactions', () => {
  it('keeps a horizontal pair together if either half is supported', () => {
    const board = emptyBoard();
    board[8][2] = cell('ties', false, 1); board[8][3] = cell('carbon', false, 1);
    board[9][3] = cell('metal', true);
    expect(gravityStep(board)).toBe(false);
    expect(board[8][2]?.bond).toBe(1);
    board[9][3] = null; expect(gravityStep(board)).toBe(true);
    expect(board[9][2]).toMatchObject({ bond: 1 }); expect(board[9][3]).toMatchObject({ bond: 1 });
  });
  it('moves a vertical pair as a unit while marked stock remains fixed', () => {
    const board = emptyBoard();
    board[5][4] = cell('ties', false, 5); board[6][4] = cell('carbon', false, 5); board[10][4] = cell('metal', true);
    for (let i = 0; i < 10; i++) gravityStep(board);
    expect(board[8][4]?.material).toBe('ties'); expect(board[9][4]?.material).toBe('carbon');
    expect(board[10][4]?.target).toBe(true);
  });
  it('releases a cleared half and scores the resulting second chain', () => {
    const run = newRun(4); run.board = emptyBoard(); run.active = null;
    for (let x = 0; x < 4; x++) run.board[10][x] = cell('ties', x < 3, x === 3 ? 1 : null);
    run.board[10][4] = cell('carbon', false, 1);
    for (let x = 1; x < 4; x++) run.board[13][x] = cell('carbon', true);
    run.board[12][7] = cell('metal', true);
    run.marked = matches(run.board); run.combo = 1; run.phase = 'clearing';
    removeMatches(run); expect(run.board[10][4]?.bond).toBeNull();
    settle(run);
    expect(run.bestCombo).toBe(2); expect(run.targetsCleared).toBe(6);
    expect(run.score).toBe(340 + 680); expect(run.recovered).toBe(8);
    expect(run.phase).toBe('playing'); expect(targetCount(run.board)).toBe(1);
  });
  it('preserves every cell and bonded adjacency during gravity', () => {
    const board: Board = emptyBoard();
    for (let x = 0; x < WIDTH; x++) board[10][x] = cell(x % 2 ? 'ties' : 'carbon', false, Math.floor(x / 2));
    const ids = board.flat().filter(Boolean).map((c) => c!.id).sort();
    for (let i = 0; i < HEIGHT; i++) gravityStep(board);
    expect(board.flat().filter(Boolean).map((c) => c!.id).sort()).toEqual(ids);
    expect(board[13].every(Boolean)).toBe(true);
  });
});

describe('rounds and top out', () => {
  it('wins only after clearing marked stock, then progresses through all three rounds', () => {
    const run = newRun(3);
    for (let round = 0; round < 3; round++) {
      run.round = round; run.board = emptyBoard(); run.phase = 'playing';
      for (let x = 0; x < 3; x++) run.board[13][x] = cell('ties', true);
      run.active = { x: 3, y: 13, direction: 0, materials: ['ties', 'metal'] };
      lockPair(run); settle(run);
      expect(run.phase).toBe(round < 2 ? 'round-won' : 'won');
      if (round < 2) { continueRun(run); expect(run.round).toBe(round + 1); expect(run.phase).toBe('intro'); }
    }
  });
  it('ends a run when a new pair cannot enter and resets the score on replay', () => {
    const run = newRun(1); run.board[0][3] = cell('metal'); run.score = 123;
    continueRun(run); expect(run.phase).toBe('lost'); expect(run.active).toBeNull();
    continueRun(run); expect(run.phase).toBe('intro'); expect(run.score).toBe(0); expect(run.round).toBe(0);
  });
});
