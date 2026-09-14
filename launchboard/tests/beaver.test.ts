import { describe, expect, it } from 'vitest';
import { advance, collides, FINISH_ROW, hazardsAt, LEVELS, move, newRun, startLevel, tick } from '../src/games/beaver-crossing/engine';
import { submitClaim, validateClaim, validEndpoint } from '../src/games/beaver-crossing/claims';

describe('Beaver Crossing', () => {
  it('moves one grid cell per hop, respects boundaries, and prevents overlapping hops', () => {
    const run = newRun();
    expect(move(run, 'up')).toBe(false);
    startLevel(run); expect(move(run, 'up')).toBe(true); expect(move(run, 'up')).toBe(false);
    tick(run, 0.1); tick(run, 0.1);
    expect(run.row).toBe(1); expect(run.hop).toBe(1);
    run.x = 0; expect(move(run, 'left')).toBe(false);
    run.row = 0; expect(move(run, 'down')).toBe(false);
  });
  it('only unlocks the prize after completing level five', () => {
    const run = newRun();
    for (let i = 0; i < LEVELS.length; i++) {
      startLevel(run);
      run.row = FINISH_ROW; run.fromRow = FINISH_ROW;
      tick(run, 0.01);
      expect(run.phase).toBe(i === 4 ? 'won' : 'cleared');
      if (i < 4) { advance(run); expect(run.level).toBe(i + 1); expect(run.phase).toBe('intro'); }
    }
  });
  it('collides with moving vehicles during a hop and retries the same level', () => {
    const run = newRun(); run.level = 3; startLevel(run);
    const h = hazardsAt(3, 0).find((h) => h.kind === 'forklift' && h.x >= 0 && h.x <= 8)!;
    run.x = h.x; run.fromX = h.x; run.row = 2; run.fromRow = 1; run.hop = 0.8;
    tick(run, 0.02); expect(run.phase).toBe('hit'); expect(run.attempts).toBe(1);
    advance(run); expect(run.level).toBe(3); expect(run.row).toBe(0); expect(run.phase).toBe('playing');
  });
  it('telegraphs heat and thrown ties before activating their collision zones', () => {
    const warning = hazardsAt(2, 3).find((h) => h.row === 5)!;
    expect(warning.warning).toBe(true); expect(warning.dangerous).toBe(false);
    const hot = hazardsAt(2, 4).find((h) => h.row === 5)!;
    expect(collides({ x: 4, row: 5 }, hot)).toBe(true);
    expect(hazardsAt(2, 5.5).find((h) => h.row === 5)!.dangerous).toBe(false);
    expect(hazardsAt(0, 1.5).find((h) => h.kind === 'throw')!.warning).toBe(true);
    expect(hazardsAt(0, 2.6).find((h) => h.kind === 'throw')!.dangerous).toBe(true);
  });
  it('pauses at intro, on collision, and between levels', () => {
    const run = newRun(); tick(run, 5); expect(run.time).toBe(0);
    startLevel(run); tick(run, 10); expect(run.time).toBeCloseTo(0.1);
    run.phase = 'hit'; tick(run, 1); expect(run.time).toBeCloseTo(0.1);
  });
  it('provides a reachable crossing in every level using actual movement and collision rules', () => {
    // Search a time-expanded grid with wait/hop actions. This catches impossible lane timing.
    for (let level = 0; level < LEVELS.length; level++) {
      const initial = newRun(); initial.level = level; startLevel(initial);
      let frontier = [initial]; let won = false;
      for (let step = 0; step < 160 && !won; step++) {
        const next = new Map<string, typeof initial>();
        for (const state of frontier) {
          for (const action of ['up', 'left', 'right', 'down', 'wait'] as const) {
            const copy = { ...state };
            if (action !== 'wait' && !move(copy, action)) continue;
            tick(copy, 0.1); tick(copy, 0.1);
            if (copy.phase === 'hit') continue;
            if (copy.phase === 'cleared' || copy.phase === 'won') { won = true; break; }
            next.set(`${copy.x}:${copy.row}`, copy);
          }
          if (won) break;
        }
        frontier = [...next.values()];
      }
      expect(won, `level ${level + 1} has a safe route`).toBe(true);
    }
  });
});

describe('prize claims', () => {
  const claim = { name: ' Test Beaver ', company: ' Example Rail ', phone: '+1 555 010 2345', address: '123 Example Street, Example, NY 10001, USA' };
  it('requires all four fields and a usable public Formspree endpoint', () => {
    expect(validateClaim(claim)).toBeNull();
    expect(validateClaim({ ...claim, company: ' ' })).not.toBeNull();
    expect(validateClaim({ ...claim, phone: 'abc' })).not.toBeNull();
    expect(validEndpoint('https://formspree.io/f/abcd1234')).toBe(true);
    expect(validEndpoint('https://example.com/f/abcd1234')).toBe(false);
    expect(validEndpoint('')).toBe(false);
  });
  it('reports success only for an accepted submission and includes fulfillment fields', async () => {
    const send = async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(init!.body as string)).toMatchObject({ name: 'Test Beaver', company: 'Example Rail', phone: claim.phone, address: claim.address, levelsCompleted: 5, claimId: 'test-claim' });
      return new Response('{}', { status: 200 });
    };
    await expect(submitClaim('https://formspree.io/f/abcd1234', claim, 'test-claim', new AbortController().signal, send)).resolves.toBeUndefined();
    await expect(submitClaim('https://formspree.io/f/abcd1234', claim, 'test-claim', new AbortController().signal, async () => new Response('', { status: 429 }))).rejects.toThrow('busy');
    await expect(submitClaim('', claim, 'test-claim', new AbortController().signal, send)).rejects.toThrow('not connected');
  });
});
