import type { GameDefinition } from './types';

export type { GameDefinition, GameContext, GameComponent, Accent, IllustrationId, PulseKind } from './types';

export const TEST_PATTERN_ID = 'test-pattern';
export const GRID_COUNT = 6;

const soon = (id: string, illustration: GameDefinition['illustration'], accent: GameDefinition['accent']): GameDefinition => ({
  id, title: 'Coming soon...', accent, illustration, status: 'coming-soon',
});

export const BASE_GAMES: GameDefinition[] = [
  soon('slot-1', 'tieStack', 'orange'),
  soon('slot-2', 'train', 'orange'),
  soon('slot-3', 'shredder', 'orange'),
  soon('slot-4', 'kiln', 'pink'),
  soon('slot-5', 'crossing', 'pink'),
  soon('slot-6', 'globe', 'green'),
];

const TEST_PATTERN: GameDefinition = {
  id: TEST_PATTERN_ID,
  title: 'Test Pattern',
  accent: 'pink',
  illustration: 'tieStack',
  status: 'playable',
  load: () => import('./test-pattern/TestPattern'),
};

export function buildRegistry(opts: { includeTestPattern: boolean }): GameDefinition[] {
  const games = [...BASE_GAMES];
  if (opts.includeTestPattern) games[0] = TEST_PATTERN;
  return games;
}

export function validateRegistry(games: GameDefinition[]): string[] {
  const errors: string[] = [];
  if (games.length !== GRID_COUNT) errors.push(`expected ${GRID_COUNT} games, got ${games.length}`);
  const seen = new Set<string>();
  for (const g of games) {
    if (seen.has(g.id)) errors.push(`duplicate id "${g.id}"`);
    seen.add(g.id);
  }
  for (const g of games) {
    if (g.status === 'playable' && !g.load) errors.push(`playable game "${g.id}" has no load()`);
  }
  return errors;
}
