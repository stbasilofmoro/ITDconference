import { describe, expect, it } from 'vitest';
import { GAME_NAMES, loadScores, ranked, saveScore, STORAGE_KEY, submitScore, type Score } from '../src/leaderboard/scores';
const memory = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; };
const entry = (id = 'test-run', score = 200): Score => ({ id, game: 'carbon-sort', firstName: 'Test', lastName: 'Player', score, date: '2026-09-14T12:00:00Z', detail: 'Test run' });
describe('local leaderboards and forms', () => {
  it('retains ten scores per game, sorts high to low, and deduplicates a run', () => {
    const storage = memory();
    for (const game of Object.keys(GAME_NAMES) as Score['game'][]) for (let i = 0; i < 14; i++) saveScore({ ...entry(`${game}-${i}`, i), game }, storage);
    expect(loadScores(storage)).toHaveLength(40); expect(ranked(loadScores(storage), 'carbon-sort').map((s) => s.score)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5, 4]);
    saveScore({ ...entry('carbon-sort-13', 200) }, storage); expect(loadScores(storage)).toHaveLength(40); expect(ranked(loadScores(storage), 'carbon-sort')[0].score).toBe(200);
  });
  it('stores only names and score data, even if given a prize claim object', () => {
    const storage = memory(); saveScore({ ...entry(), phone: '5551234567', company: 'Private company', address: 'Private address' } as Score, storage);
    const raw = storage.getItem(STORAGE_KEY)!; expect(raw).not.toContain('Private'); expect(raw).not.toContain('phone'); expect(raw).not.toContain('5551234567');
    expect(loadScores(storage)[0]).toMatchObject({ firstName: 'Test', lastName: 'Player', score: 200 });
  });
  it('recovers from corrupted storage and rejects malformed rows', () => {
    const storage = memory(); storage.setItem(STORAGE_KEY, 'not json'); expect(loadScores(storage)).toEqual([]);
    storage.setItem(STORAGE_KEY, JSON.stringify([entry(), { ...entry(), score: -1 }, { ...entry(), firstName: '' }, { ...entry(), game: 'made-up' }])); expect(loadScores(storage)).toHaveLength(1);
  });
  it('sends first and last names with the actual run score and handles service failures', async () => {
    const result = entry(); const sent: object[] = [];
    const send = (async (_url, init) => { sent.push(JSON.parse(String(init?.body))); return new Response('{}', { status: 200 }); }) as typeof fetch;
    await submitScore(result, ' Test ', ' Player ', new AbortController().signal, send);
    expect(sent[0]).toMatchObject({ firstName: 'Test', lastName: 'Player', score: 200, runId: 'test-run', gameId: 'carbon-sort' });
    await expect(submitScore(result, 'Test', 'Player', new AbortController().signal, (async () => new Response('{}', { status: 429 })) as typeof fetch)).rejects.toThrow('busy');
  });
});
