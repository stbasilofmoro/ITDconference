import { describe, expect, it } from 'vitest';
import { DEFAULTS, readSettings } from '../src/audio/engine';
import { changes, snapshot } from '../src/audio/events';
import { BPM, musicStep } from '../src/audio/score';
import * as beaver from '../src/games/beaver-crossing/engine';
import * as sort from '../src/games/carbon-sort/engine';
import * as kiln from '../src/games/kiln-keeper/engine';
import * as rails from '../src/games/carbon-rails/engine';
import * as hall from '../src/games/convention-hall/engine';
import * as jumper from '../src/games/jumper-3/engine';

describe('saved booth audio preferences', () => {
  it('defaults softly and handles denied or corrupt storage', () => {
    expect(readSettings({ getItem: () => null })).toEqual(DEFAULTS);
    expect(readSettings({ getItem: () => '{broken' })).toEqual(DEFAULTS);
    expect(readSettings({ getItem: () => { throw Error('denied'); } })).toEqual(DEFAULTS);
  });
  it('keeps mute and zero volumes, clamps numbers, and rejects invalid values', () => {
    expect(readSettings({ getItem: () => '{"muted":true,"music":0,"effects":0}' })).toEqual({ muted: true, music: 0, effects: 0 });
    expect(readSettings({ getItem: () => '{"music":9,"effects":-2}' })).toEqual({ muted: false, music: 1, effects: 0 });
    expect(readSettings({ getItem: () => '{"music":"loud","effects":null,"muted":"yes"}' })).toEqual(DEFAULTS);
  });
});
describe('original lo-fi arrangement', () => {
  it('swings eighths without changing the bar length and loops eight bars', () => {
    const bar = Array.from({ length: 8 }, (_, i) => musicStep(i));
    expect(bar.reduce((sum, part) => sum + part.duration, 0)).toBeCloseTo(4 * 60 / BPM);
    expect(bar[0].duration).toBeGreaterThan(bar[1].duration);
    expect(musicStep(64)).toEqual(musicStep(0));
    expect(bar.filter((p) => p.kick)).toHaveLength(2); expect(bar.filter((p) => p.brush)).toHaveLength(2);
  });
});
describe('cues follow real game events', () => {
  it('plays a hop for a crossing move, including a sideways move', () => {
    const r = beaver.newRun(); beaver.advance(r); const before = snapshot.beaver(r); beaver.move(r, 'left'); expect(changes(before, snapshot.beaver(r))).toContain('hop');
  });
  it('plays rotation and placement cues for the recycling puzzle', () => {
    const r = sort.newRun(); sort.command(r, 'continue'); let before = snapshot.sort(r); sort.command(r, 'rotate'); expect(changes(before, snapshot.sort(r))).toContain('rotate');
    before = snapshot.sort(r); sort.command(r, 'drop'); expect(changes(before, snapshot.sort(r))).toContain('drop');
  });
  it('plays a conveyor adjustment and warns once when leaving the safe temperature band', () => {
    const r = kiln.newRun(); kiln.start(r); let before = snapshot.kiln(r); kiln.setFeed(r, 0.9); expect(changes(before, snapshot.kiln(r))).toContain('feed');
    before = snapshot.kiln(r); r.temperature = 851; expect(changes(before, snapshot.kiln(r))).toContain('warning'); before = snapshot.kiln(r); r.temperature = 855; expect(changes(before, snapshot.kiln(r))).not.toContain('warning');
  });
  it('plays a card sound after a legal draw', () => {
    const r = rails.newRun(20); rails.start(r); rails.keepTickets(r, r.ticketOffer.map((t) => t.id)); const before = snapshot.rails(r, false); rails.drawCard(r, -1); expect(changes(before, snapshot.rails(r, false))).toContain('card');
  });
  it('plays a scanner chirp and a successful contact chime', () => {
    const r = hall.newRun(20); hall.start(r); const before = snapshot.hall(r); hall.scan(r); const cues = changes(before, snapshot.hall(r)); expect(cues).toContain('scan'); expect(cues).toContain('contact');
  });
  it('plays a jump when Atom takes off', () => {
    const r = jumper.newRun(); jumper.advance(r); jumper.tick(r, jumper.STEP); const before = snapshot.jumper(r); jumper.tick(r, jumper.STEP, { ...jumper.STILL, jump: true }); expect(changes(before, snapshot.jumper(r))).toContain('jump');
  });
  it('does not play stale cues on mount, restart, pause or resume', () => {
    const r = jumper.newRun(), before = snapshot.jumper(r); expect(changes(null, before)).toEqual([]);
    jumper.advance(r); expect(changes(before, snapshot.jumper(r))).toEqual(['start']);
    const playing = snapshot.jumper(r); jumper.pause(r); r.credits += 5; expect(changes(playing, snapshot.jumper(r))).toEqual([]);
    const paused = snapshot.jumper(r); jumper.pause(r); expect(changes(paused, snapshot.jumper(r))).toEqual([]);
    const nextStage = { ...playing, stage: playing.stage + 1, values: { recycle: 100 } }; expect(changes(playing, nextStage)).toEqual([]);
  });
  it('prioritizes gentle result cues over simultaneous pickups or damage', () => {
    const r = jumper.newRun(); jumper.advance(r); const before = snapshot.jumper(r); r.phase = 'won'; r.credits += 10; expect(changes(before, snapshot.jumper(r))).toEqual(['win']);
    r.phase = 'lost'; expect(changes(before, snapshot.jumper(r))).toEqual(['hit']);
  });
});
