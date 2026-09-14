import type { Run as Beaver } from '../games/beaver-crossing/engine';
import type { Run as Sort } from '../games/carbon-sort/engine';
import type { Run as Kiln } from '../games/kiln-keeper/engine';
import type { Run as Rails } from '../games/carbon-rails/engine';
import type { Run as Hall } from '../games/convention-hall/engine';
import type { Run as Jumper } from '../games/jumper-3/engine';
export type Cue = 'ui' | 'start' | 'win' | 'hit' | 'hop' | 'move' | 'rotate' | 'drop' | 'recycle' | 'feed' | 'warning' | 'card' | 'route' | 'scan' | 'contact' | 'jump' | 'land' | 'spark' | 'power' | 'stomp';
export type Snapshot = { phase: string; stage: number; paused: boolean; values: Partial<Record<Cue, number>> };
export const snapshot = {
  beaver: (r: Beaver): Snapshot => ({ phase: r.phase, stage: r.level, paused: false, values: { hop: r.x + r.row * 10 } }),
  sort: (r: Sort): Snapshot => ({ phase: r.phase, stage: r.round, paused: r.paused, values: { move: r.active?.x ?? -1, rotate: r.active?.direction ?? -1, drop: r.nextId, recycle: r.recovered } }),
  kiln: (r: Kiln): Snapshot => ({ phase: r.phase, stage: 0, paused: r.paused, values: { feed: Math.round(r.feed * 20), drop: r.fed, warning: Number(r.temperature < 700 || r.temperature > 850) } }),
  rails: (r: Rails, paused: boolean): Snapshot => ({ phase: r.phase, stage: 0, paused, values: { card: r.players[0].hand.length, route: r.owners.filter((owner) => owner !== null).length } }),
  hall: (r: Hall): Snapshot => ({ phase: r.phase, stage: 0, paused: r.paused, values: { scan: r.beamTime, contact: r.found, hit: r.health } }),
  jumper: (r: Jumper): Snapshot => ({ phase: r.phase, stage: r.stage, paused: r.paused, values: { jump: Number(r.vy > 1), land: Number(r.grounded), recycle: r.credits, power: (r.power === 'spark' ? 2 : r.power === 'helmet' ? 1 : 0) + (r.core > 0 ? 3 : 0), hit: r.lives * 10 + (r.power === 'spark' ? 2 : r.power === 'helmet' ? 1 : 0), stomp: r.enemies.filter((e) => e.dead).length, spark: r.shots.reduce((max, s) => s.evil ? max : Math.max(max, s.id), 0) } }),
};
const active = (phase: string) => ['playing', 'running', 'clearing', 'settling', 'tickets'].includes(phase);
export function changes(before: Snapshot | null, after: Snapshot): Cue[] {
  if (!before || before.stage !== after.stage || after.paused || before.paused) return [];
  if (before.phase !== after.phase) {
    if (['won', 'cleared', 'round-won'].includes(after.phase)) return ['win'];
    if (['hit', 'lost', 'cold', 'exploded'].includes(after.phase)) return ['hit'];
    if (!active(before.phase) && active(after.phase)) return ['start'];
  }
  if (!active(before.phase) || !active(after.phase)) return [];
  return (Object.keys(after.values) as Cue[]).filter((cue) => {
    const old = before.values[cue], next = after.values[cue];
    if (old === undefined || next === undefined || old < 0 || next < 0) return false;
    if (cue === 'hit') return next < old;
    if (['hop', 'move', 'rotate', 'feed'].includes(cue)) return next !== old;
    return next > old;
  }).slice(0, 3);
}
