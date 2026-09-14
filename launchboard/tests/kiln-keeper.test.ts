import { describe, expect, it } from 'vitest';
import { addPiece, CONDITIONS, GRACE_SECONDS, newRun, RUN_SECONDS, SAFE_MAX, SAFE_MIN, setFeed, start, tick, togglePause, warning, type Run } from '../src/games/kiln-keeper/engine';

function runFor(run: Run, seconds: number, control?: (r: Run, dt: number) => void) {
  for (let i = 0; i < seconds * 60 && run.phase === 'running'; i++) { control?.(run, 1 / 60); tick(run, 1 / 60); }
}
describe('Kiln Keeper', () => {
  it('starts inside the requested band and clamps conveyor controls', () => {
    const run = newRun(); expect(warning(run)).toBeNull();
    expect(run.temperature).toBe((SAFE_MIN + SAFE_MAX) / 2);
    setFeed(run, 1); expect(run.feed).toBe(0.5);
    start(run); setFeed(run, 2); expect(run.feed).toBe(1); setFeed(run, -1); expect(run.feed).toBe(0);
  });
  it('ends in a cold failure without enough wood and an explosion with too much', () => {
    const cold = newRun(); start(cold); setFeed(cold, 0); runFor(cold, 90);
    expect(cold.phase).toBe('cold'); expect(cold.coldTime).toBeGreaterThanOrEqual(GRACE_SECONDS);
    const hot = newRun(); start(hot); setFeed(hot, 1); runFor(hot, 90);
    expect(hot.phase).toBe('exploded'); expect(hot.hotTime).toBeGreaterThanOrEqual(GRACE_SECONDS);
  });
  it('requires adjustments: no fixed whole-percent conveyor speed completes the run', () => {
    for (let percent = 0; percent <= 100; percent++) {
      const feed = percent / 100;
      const run = newRun(); start(run); setFeed(run, feed); runFor(run, 90);
      expect(run.phase, `constant feed ${feed}`).not.toBe('won');
    }
  });
  it('can be won by responding only to the temperature and its trend', () => {
    const run = newRun(); start(run); let estimate = 0.5;
    runFor(run, 91, (r, dt) => {
      const q = (r.temperature - SAFE_MIN) / (SAFE_MAX - SAFE_MIN);
      const trend = r.trend / (SAFE_MAX - SAFE_MIN);
      estimate = Math.min(1, Math.max(0, estimate + (0.5 - q) * dt * 0.8));
      setFeed(r, estimate + 2 * (0.5 - q) - 3 * trend);
    });
    expect(run.phase, `ended at ${run.elapsed.toFixed(1)}s, ${run.temperature.toFixed(0)}C`).toBe('won');
    expect(run.elapsed).toBe(RUN_SECONDS); expect(run.inBand).toBeGreaterThan(75);
    expect(run.condition).toBe(CONDITIONS.length - 1);
  });
  it('models a delayed motor and stored heat after stopping', () => {
    const run = newRun(); start(run); run.fuel = 4;
    setFeed(run, 0); tick(run, 1 / 60);
    expect(run.motor).toBeGreaterThan(0); expect(run.motor).toBeLessThan(0.5);
    expect(run.temperature).toBeGreaterThan((SAFE_MIN + SAFE_MAX) / 2);
  });
  it('drops extra wood with a cooldown and heats the kiln after it lands', () => {
    const run = newRun(); start(run); setFeed(run, 0);
    expect(addPiece(run)).toBe(true); expect(addPiece(run)).toBe(false);
    const fuel = run.fuel;
    runFor(run, 0.25); expect(run.fed).toBe(1); expect(run.fuel).toBeGreaterThan(fuel);
    runFor(run, 0.4); expect(addPiece(run)).toBe(true);
  });
  it('allows recovery and clears the accumulated warning gradually', () => {
    const run = newRun(); start(run); run.hotTime = 2; run.temperature = (SAFE_MIN + SAFE_MAX) / 2;
    runFor(run, 0.5); expect(run.phase).toBe('running'); expect(run.hotTime).toBeCloseTo(1, 5);
    expect(warning({ ...run, temperature: SAFE_MIN })).toBeNull(); expect(warning({ ...run, temperature: SAFE_MAX })).toBeNull();
  });
  it('pauses everything and fully resets after a failure', () => {
    const run = newRun(); start(run); togglePause(run); const before = structuredClone(run);
    tick(run, 1); setFeed(run, 0); expect(addPiece(run)).toBe(false); expect(run).toEqual(before);
    togglePause(run); run.phase = 'exploded'; run.fuel = 6; run.hotTime = 5; tick(run, 0.1); expect(run.animationTime).toBeGreaterThan(0);
    start(run); expect(run).toMatchObject({ phase: 'running', paused: false, elapsed: 0, hotTime: 0, fed: 0, animationTime: 0, fuel: 0.9 });
  });
  it('has consistent fixed-step behavior at different rendering rates', () => {
    const a = newRun(), b = newRun(); start(a); start(b);
    for (let i = 0; i < 600; i++) tick(a, 1 / 60);
    for (let i = 0; i < 100; i++) tick(b, 0.1);
    expect(a.temperature).toBeCloseTo(b.temperature, 8); expect(a.fed).toBe(b.fed);
    expect(a.history.length).toBeLessThan(126);
  });
});
