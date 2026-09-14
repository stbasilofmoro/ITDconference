import { createStore } from 'zustand';
import { FORMSPREE_ENDPOINT, validEndpoint } from '../games/beaver-crossing/claims';
export const GAME_NAMES = { 'beaver-crossing': 'Beaver Crossing', 'carbon-sort': 'Carbon Sort', 'kiln-keeper': 'Kiln Keeper', 'carbon-rails': 'Carbon Rails', 'convention-hall': 'Convention Hall' } as const;
export type GameId = keyof typeof GAME_NAMES;
export type Result = { id: string; game: GameId; score: number; detail: string };
export type Score = Result & { firstName: string; lastName: string; date: string };
export const STORAGE_KEY = 'itd.leaderboard.v1';
export function validName(value: string) { return value.trim().length > 0 && value.trim().length <= 60 && !/[\u0000-\u001F\u007F]/.test(value); }
export function loadScores(storage: Pick<Storage, 'getItem'> = localStorage): Score[] {
  try {
    const rows: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((s): s is Score => !!s && typeof s === 'object' && typeof s.id === 'string' && Object.hasOwn(GAME_NAMES, s.game) && Number.isSafeInteger(s.score) && s.score >= 0 && typeof s.firstName === 'string' && validName(s.firstName) && typeof s.lastName === 'string' && validName(s.lastName) && typeof s.date === 'string' && typeof s.detail === 'string').map(({ id, game, score, detail, firstName, lastName, date }) => ({ id, game, score, detail, firstName, lastName, date }));
  } catch { return []; }
}
export function ranked(rows: Score[], game: GameId) { return rows.filter((s) => s.game === game).sort((a, b) => b.score - a.score || a.date.localeCompare(b.date)).slice(0, 10); }
export function saveScore(score: Score, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const rows = loadScores(storage).filter((s) => s.id !== score.id);
  // Persist only public scoreboard fields, never the prize claim's phone or address.
  rows.push({ id: score.id, game: score.game, score: score.score, detail: score.detail, firstName: score.firstName.trim(), lastName: score.lastName.trim(), date: score.date });
  storage.setItem(STORAGE_KEY, JSON.stringify(Object.keys(GAME_NAMES).flatMap((game) => ranked(rows, game as GameId))));
  scoreStore.setState({ revision: scoreStore.getState().revision + 1 });
}
export async function submitScore(result: Result, firstName: string, lastName: string, signal: AbortSignal, send: typeof fetch = fetch) {
  if (!validName(firstName) || !validName(lastName)) throw new Error('Enter your first and last name (up to 60 characters each).');
  if (!validEndpoint(FORMSPREE_ENDPOINT)) throw new Error('Score submissions are not connected. Please ask the booth team.');
  const response = await send(FORMSPREE_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ _subject: `AREMA score / ${GAME_NAMES[result.game]}`, submissionType: 'leaderboard', runId: result.id, gameId: result.game, game: GAME_NAMES[result.game], score: result.score, detail: result.detail, firstName: firstName.trim(), lastName: lastName.trim(), name: `${firstName.trim()} ${lastName.trim()}` }) });
  if (!response.ok) throw new Error(response.status === 429 ? 'The submission service is busy. Please try again shortly.' : 'Your score was not accepted. Please try again.');
}
export const scoreStore = createStore<{ open: boolean; game: GameId; result: Result | null; revision: number }>(() => ({ open: false, game: 'beaver-crossing', result: null, revision: 0 }));
export function showScores(game: GameId, result: Result | null = null) { scoreStore.setState({ open: true, game, result }); }
export function closeScores() { scoreStore.setState({ open: false, result: null }); }
