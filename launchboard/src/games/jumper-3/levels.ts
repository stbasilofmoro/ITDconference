export type PickupKind = 'credit' | 'helmet' | 'spark' | 'core' | 'life';
export type Solid = { id: number; x: number; y: number; w: number; h: number; kind: 'ground' | 'tie' | 'crate' | 'lift'; contents?: PickupKind; used?: boolean; originY?: number };
export type EnemyKind = 'acolyte' | 'hopper' | 'wraith' | 'caster' | 'warden';
export type Enemy = { id: number; kind: EnemyKind; x: number; y: number; homeX: number; homeY: number; min: number; max: number; vx: number; vy: number; hp: number; maxHp: number; cooldown: number; immune: number; dead: boolean; grounded: boolean };
export type Pickup = { id: number; kind: PickupKind; x: number; y: number; taken: boolean; vx: number; vy: number; loose: boolean };
export type Hazard = { x: number; y: number; w: number; kind: 'scrap' | 'vent'; offset: number };
export type Level = { title: string; subtitle: string; story: string; restored: string; seal: string; length: number; checkpoint: number; ground: [number, number][]; platforms: [number, number, number][]; crates: [number, number, PickupKind][]; enemies: [EnemyKind, number, number, number, number][]; hazards: Hazard[]; color: string };
export const LEVELS: Level[] = [
  { title: 'The Severed Spur', subtitle: 'CHAPTER 1 / THE RAIL YARD', seal: 'Rail Seal', length: 116, checkpoint: 59, color: '#A9B5AC',
    story: 'The Order of the Hollow Ember has torn up the supply line. Beneath their hoods, red eyes watch the silent yard. Atom must reclaim the Rail Seal and get the recovered ties moving again.',
    restored: 'The Rail Seal is restored. Signals turn green, and the tie trains roll again. But the Order has already reached the kilns...',
    ground: [[0, 22], [25.5, 46], [50, 77], [81.5, 116]], platforms: [[10, 2.4, 4], [31, 2.4, 5], [39, 4.7, 4], [65, 2.5, 5], [86, 2.8, 5]],
    crates: [[6, 3.2, 'helmet'], [16, 3.2, 'credit'], [32, 5.5, 'spark'], [55, 3.2, 'helmet'], [68, 5.6, 'core'], [89, 5.8, 'life']],
    enemies: [['acolyte', 15, 0, 12, 20], ['hopper', 34, 0, 28, 43], ['acolyte', 69, 0, 62, 74], ['caster', 91, 0, 86, 97], ['warden', 107, 0, 101, 111]],
    hazards: [{ x: 72, y: 0, w: 1.5, kind: 'scrap', offset: 0 }],
  },
  { title: 'The Silent Kilns', subtitle: 'CHAPTER 2 / THE CARBON WORKS', seal: 'Heat Seal', length: 130, checkpoint: 65, color: '#B7AAA1',
    story: 'The cult has sealed the rotary kilns with cold iron sigils. Hooded ash-callers haunt the catwalks. Carry the Heat Seal past the vents and wake the clean-carbon works.',
    restored: 'The Heat Seal burns bright. The two long kilns turn again, and clean carbon leaves the cooling line. One seal remains beneath the foundry.',
    ground: [[0, 19], [23, 43], [47.5, 70], [75, 95], [100, 130]], platforms: [[8, 2.6, 5], [28, 2.8, 5], [35, 5.2, 4], [54, 2.5, 5], [81, 2.8, 5], [88, 5.3, 4], [104, 2.6, 4]],
    crates: [[5, 3.2, 'spark'], [29, 5.9, 'helmet'], [55, 5.6, 'core'], [66, 3.2, 'helmet'], [88, 8.4, 'life'], [105, 5.7, 'spark']],
    enemies: [['hopper', 12, 0, 7, 17], ['wraith', 33, 2.8, 27, 39], ['caster', 59, 0, 52, 63], ['acolyte', 85, 0, 79, 92], ['wraith', 104, 2.4, 101, 112], ['warden', 120, 0, 115, 125]],
    hazards: [{ x: 37, y: 0, w: 1.6, kind: 'vent', offset: 1.3 }, { x: 83, y: 0, w: 1.8, kind: 'vent', offset: 0 }, { x: 110, y: 0, w: 1.5, kind: 'scrap', offset: 0 }],
  },
  { title: 'The Hollow Foundry', subtitle: 'CHAPTER 3 / THE FINAL IGNITION', seal: 'Atom Seal', length: 144, checkpoint: 70, color: '#A9A1B8',
    story: 'The Null Keeper waits beneath the foundry. The Order dreams of a world without clean carbon, railways, or working industry. Find the Atom Seal, break their last ward, and bring the whole line back to life.',
    restored: 'The Atom Seal is home. The Order of the Hollow Ember dissolves into smoke. Rails hum, kilns glow, and the foundry lights the horizon. Atom hangs up his hardhat: tomorrow, there is more good work to do.',
    ground: [[0, 20], [24.5, 45], [50, 72], [77, 97], [102, 118], [122.5, 144]], platforms: [[9, 2.5, 4], [28, 2.7, 5], [35, 5.2, 4], [55, 2.8, 6], [82, 2.7, 4], [88, 5.3, 4], [107, 2.6, 5]],
    crates: [[5, 3.2, 'helmet'], [10, 5.6, 'spark'], [35, 8.3, 'life'], [56, 5.9, 'core'], [78, 3.2, 'helmet'], [107, 5.7, 'spark']],
    enemies: [['hopper', 14, 0, 10, 18], ['caster', 31, 0, 27, 40], ['wraith', 41, 3.5, 34, 44], ['hopper', 60, 0, 54, 68], ['caster', 87, 0, 81, 93], ['wraith', 109, 3, 104, 115], ['warden', 136, 0, 129, 140]],
    hazards: [{ x: 38, y: 0, w: 1.8, kind: 'scrap', offset: 0 }, { x: 63, y: 0, w: 1.8, kind: 'vent', offset: 0.7 }, { x: 113, y: 0, w: 1.7, kind: 'vent', offset: 2.3 }],
  },
];
export function makeStage(index: number) {
  const l = LEVELS[index]; let id = 0;
  const solids: Solid[] = l.ground.map(([a, b]) => ({ id: id++, x: a, y: -2, w: b - a, h: 2, kind: 'ground' }));
  l.platforms.forEach(([x, y, w], i) => solids.push({ id: id++, x, y, w, h: 0.45, kind: index > 0 && i === 3 ? 'lift' : 'tie', originY: y }));
  l.crates.forEach(([x, y, contents]) => solids.push({ id: id++, x, y, w: 1, h: 1, kind: 'crate', contents, used: false }));
  const pickups: Pickup[] = [];
  for (const [a, b] of l.ground) for (let x = a + 5; x < b - 2; x += 3) pickups.push({ id: id++, kind: 'credit', x, y: 1, taken: false, vx: 0, vy: 0, loose: false });
  for (const [x, y, w] of l.platforms) for (let i = 0; i < 3; i++) pickups.push({ id: id++, kind: 'credit', x: x + 0.6 + i * (w - 1.2) / 2, y: y + 1.4, taken: false, vx: 0, vy: 0, loose: false });
  const enemies: Enemy[] = l.enemies.map(([kind, x, y, min, max]) => ({ id: id++, kind, x, y, homeX: x, homeY: y, min, max, vx: kind === 'warden' ? -1.5 : -1.1, vy: 0, hp: kind === 'warden' ? index + 3 : 1, maxHp: kind === 'warden' ? index + 3 : 1, cooldown: 1.6, immune: 0, dead: false, grounded: y === 0 }));
  return { solids, pickups, enemies, nextId: id };
}
