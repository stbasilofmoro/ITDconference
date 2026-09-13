import { describe, it, expect } from 'vitest';
import { BASE_GAMES, buildRegistry, validateRegistry, TEST_PATTERN_ID, type GameDefinition } from '../src/games/registry';

describe('registry', () => {
  it('ships six coming-soon slots with distinct illustrations', () => {
    expect(BASE_GAMES).toHaveLength(6);
    expect(BASE_GAMES.every((g) => g.status === 'coming-soon')).toBe(true);
    expect(new Set(BASE_GAMES.map((g) => g.illustration)).size).toBe(6);
    expect(BASE_GAMES.every((g) => g.title === 'Coming soon...')).toBe(true);
  });

  it('is valid with and without the test pattern', () => {
    expect(validateRegistry(buildRegistry({ includeTestPattern: false }))).toEqual([]);
    expect(validateRegistry(buildRegistry({ includeTestPattern: true }))).toEqual([]);
  });

  it('puts the test pattern in slot 0 only when requested', () => {
    expect(buildRegistry({ includeTestPattern: false })[0].id).not.toBe(TEST_PATTERN_ID);
    const withTest = buildRegistry({ includeTestPattern: true });
    expect(withTest).toHaveLength(6);
    expect(withTest[0]).toMatchObject({ id: TEST_PATTERN_ID, status: 'playable' });
    expect(typeof withTest[0].load).toBe('function');
  });

  it('reports wrong length, duplicate ids and missing loaders', () => {
    const bad: GameDefinition[] = [
      { id: 'a', title: 'A', accent: 'orange', illustration: 'tieStack', status: 'playable' },
      { id: 'a', title: 'B', accent: 'pink', illustration: 'kiln', status: 'coming-soon' },
    ];
    expect(validateRegistry(bad)).toEqual([
      'expected 6 games, got 2',
      'duplicate id "a"',
      'playable game "a" has no load()',
    ]);
  });
});
