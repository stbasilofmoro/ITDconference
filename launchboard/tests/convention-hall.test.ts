import { describe, expect, it } from 'vitest';
import { aim, aimedPerson, blocked, BOOTHS, currentTarget, newRun, scan, SHIFT_SECONDS, start, STILL, tick, togglePause, type Run, type Controls } from '../src/games/convention-hall/engine';
import { COMPANIES } from '../src/games/convention-hall/companies';

function advance(r: Run, seconds: number, controls: Controls = STILL) { for (let i = 0; i < seconds * 60; i++) tick(r, 1 / 60, controls); }
function playing() { const r = newRun(42); start(r); return r; }
function isolate(r: Run, id: number, distance = 6) {
  r.people.forEach((p) => { p.x = p.homeX = 16; p.z = p.homeZ = -22; });
  const p = r.people[id]; p.x = p.homeX = r.x; p.z = p.homeZ = r.z - distance;
  r.scanCooldown = 0; r.yaw = 0; r.pitch = -0.035; return p;
}
describe('Convention Hall', () => {
  it('shuffles 20 distinct original exhibitors, five contacts and six non-target vendors', () => {
    expect(COMPANIES).toHaveLength(20);
    for (const key of ['name', 'shape', 'clue', 'short'] as const) expect(new Set(COMPANIES.map((c) => c[key])).size).toBe(20);
    const r = newRun(42); expect(new Set(r.boothCompanies).size).toBe(20);
    expect(r.targets).toHaveLength(5); expect(new Set(r.targets).size).toBe(5);
    expect(r.people.filter((p) => p.rude)).toHaveLength(6);
    expect(r.people.filter((p) => p.rude).every((p) => !r.targets.includes(p.company))).toBe(true);
    expect(r.targets.map((c) => Math.floor(r.boothCompanies.indexOf(c) / 4))).toEqual([0, 1, 2, 3, 4]);
    expect(newRun(43).boothCompanies).not.toEqual(r.boothCompanies);
    expect(newRun(42)).toEqual(r);
  });
  it('starts with a readable, scannable first clue and advances on the first badge', () => {
    const r = newRun(42); expect(scan(r)).toBe(false); start(r);
    const company = currentTarget(r); expect(aimedPerson(r)?.company).toBe(company);
    expect(scan(r)).toBe(true); expect(r).toMatchObject({ found: 1, score: 500, scanCount: 1 });
    expect(r.people.find((p) => p.company === company)?.scanned).toBe(true);
    expect(currentTarget(r)).toBe(r.targets[1]); expect(r.message).toContain(COMPANIES[company!].name);
    expect(scan(r)).toBe(false); advance(r, 0.5); expect(scan(r)).toBe(false); expect(r.score).toBe(500);
  });
  it('reveals any employer, rewards incidental scans once, and stops a vendor’s clouds', () => {
    const r = playing(); const neutral = r.people.find((p) => !p.rude && !r.targets.includes(p.company))!;
    isolate(r, neutral.id); expect(scan(r)).toBe(true); expect(r.score).toBe(25); expect(r.found).toBe(0);
    const rude = r.people.find((p) => p.rude)!; isolate(r, rude.id); rude.windup = 0.5;
    r.breath.push({ id: 0, owner: rude.id, x: 0, z: 22, dx: 0, dz: 1, age: 0 });
    expect(scan(r)).toBe(true); expect(r.score).toBe(125); expect(rude.scanned).toBe(true); expect(rude.windup).toBe(0); expect(r.breath).toHaveLength(0);
    advance(r, 5); expect(r.breath).toHaveLength(0); expect(r.health).toBe(100);
  });
  it('requires aim and range, respects booth occlusion, and selects the nearest badge', () => {
    const r = playing(); const p = isolate(r, 0, 14); expect(aimedPerson(r)).toBeNull();
    p.z = 18; expect(aimedPerson(r)?.id).toBe(0);
    aim(r, 0.5, 0); expect(aimedPerson(r)).toBeNull(); aim(r, -0.5, 0.5); expect(aimedPerson(r)).toBeNull();
    r.pitch = -0.035; Object.assign(r.people[1], { x: 0, z: 21 }); expect(aimedPerson(r)?.id).toBe(1);
    r.x = -5.5; r.z = 22; p.x = -5.5; p.z = 13; expect(aimedPerson(r)).toBeNull();
  });
  it('normalizes diagonal walking and blocks equipment and hall walls', () => {
    const a = playing(), b = playing(); advance(a, 0.5, { ...STILL, forward: 1 }); advance(b, 0.5, { ...STILL, forward: 1, strafe: 1 });
    expect(Math.hypot(b.x, b.z - 24)).toBeCloseTo(24 - a.z);
    a.x = -5.5; a.z = 22; advance(a, 3, { ...STILL, forward: 1 }); expect(a.z).toBeGreaterThanOrEqual(19.2);
    a.x = 17.6; a.z = 25; advance(a, 2, { ...STILL, strafe: 1 }); expect(a.x).toBeLessThanOrEqual(17.68);
  });
  it('provides a walkable route from the entrance to every booth contact', () => {
    const seen = new Set<string>(['0,24']), queue = [[0, 24]];
    for (let i = 0; i < queue.length; i++) { const [x, z] = queue[i]; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, key = `${nx},${nz}`; if (!seen.has(key) && !blocked(nx, nz)) { seen.add(key); queue.push([nx, nz]); } } }
    for (const booth of BOOTHS) expect(queue.some(([x, z]) => Math.hypot(x - booth.x, z - (booth.z + 3.4)) < 1)).toBe(true);
  });
  it('telegraphs breath attacks, deals one bar of damage, and grants brief immunity', () => {
    const r = playing(), vendor = r.people.find((p) => p.rude)!; isolate(r, vendor.id, 3); r.elapsed = 5; vendor.cooldown = 0;
    advance(r, 0.5); expect(vendor.windup).toBeGreaterThan(0); expect(r.breath).toHaveLength(0);
    advance(r, 0.5); expect(r.breath).toHaveLength(1); advance(r, 1); expect(r.health).toBe(75);
    r.breath.push({ id: 55, owner: vendor.id, x: r.x, z: r.z, dx: 0, dz: 0, age: 0 });
    advance(r, 0.25); expect(r.health).toBe(75);
  });
  it('accepts contacts out of order and wins with time and fresh-air bonuses', () => {
    const r = playing(); r.elapsed = 30; r.health = 75;
    for (const c of [...r.targets].reverse()) { isolate(r, r.people.find((p) => p.company === c)!.id); expect(scan(r)).toBe(true); }
    expect(r).toMatchObject({ phase: 'won', found: 5, scanCount: 5, score: 4375 }); expect(currentTarget(r)).toBeUndefined();
    advance(r, 5); expect(r.elapsed).toBe(30); expect(scan(r)).toBe(false);
  });
  it('freezes while paused, fails on time or breath, and restarts cleanly', () => {
    const r = playing(); togglePause(r); const frozen = structuredClone(r); advance(r, 10, { ...STILL, forward: 1 }); scan(r); aim(r, 1, 1); expect(r).toEqual(frozen);
    togglePause(r); r.elapsed = SHIFT_SECONDS - 0.1; advance(r, 1); expect(r.phase).toBe('lost');
    const fresh = playing(); fresh.health = 25; fresh.breath.push({ id: 0, owner: 0, x: fresh.x, z: fresh.z, dx: 0, dz: 0, age: 0 }); advance(fresh, 0.1);
    expect(fresh).toMatchObject({ phase: 'lost', health: 0 }); expect(newRun(42)).toMatchObject({ phase: 'intro', health: 100, found: 0, score: 0, elapsed: 0 });
  });
});
