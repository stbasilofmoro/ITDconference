import { describe, it, expect } from 'vitest';
import { BASE_GAMES, buildRegistry, validateRegistry, TEST_PATTERN_ID, BROKEN_GAME_ID, type GameDefinition } from '../src/games/registry';

describe('registry', () => {
  it('ships six playable games', () => {
    expect(BASE_GAMES).toHaveLength(6);
    expect(BASE_GAMES[0]).toMatchObject({ id: 'beaver-crossing', title: 'Beaver Crossing', status: 'playable' });
    expect(typeof BASE_GAMES[0].load).toBe('function');
    expect(BASE_GAMES[1]).toMatchObject({ id: 'carbon-sort', title: 'Carbon Sort', status: 'playable', illustration: 'materials' });
    expect(typeof BASE_GAMES[1].load).toBe('function');
    expect(BASE_GAMES[2]).toMatchObject({ id: 'kiln-keeper', title: 'Kiln Keeper', status: 'playable', illustration: 'rotaryKiln' });
    expect(typeof BASE_GAMES[2].load).toBe('function');
    expect(BASE_GAMES[3]).toMatchObject({ id: 'carbon-rails', title: 'Carbon Rails', status: 'playable', illustration: 'globe' });
    expect(typeof BASE_GAMES[3].load).toBe('function');
    expect(BASE_GAMES[4]).toMatchObject({ id: 'convention-hall', title: 'Convention Hall', status: 'playable', illustration: 'badgeScanner' });
    expect(typeof BASE_GAMES[4].load).toBe('function');
    expect(BASE_GAMES[5]).toMatchObject({ id: 'jumper-3', title: 'Jumper 3: The Legend of Atom', status: 'playable', illustration: 'atom' });
    expect(BASE_GAMES.every((g) => typeof g.load === 'function')).toBe(true);
    expect(new Set(BASE_GAMES.map((g) => g.illustration)).size).toBe(6);

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

describe('broken game option', () => {
  it('puts a failing playable game in slot 1 only when requested', async () => {
    expect(buildRegistry({ includeTestPattern: true })[1].id).not.toBe(BROKEN_GAME_ID);
    const games = buildRegistry({ includeTestPattern: true, includeBrokenGame: true });
    expect(games[1]).toMatchObject({ id: BROKEN_GAME_ID, status: 'playable' });
    await expect(games[1].load!()).rejects.toThrow('intentional');
    expect(validateRegistry(games)).toEqual([]);
  });
});
