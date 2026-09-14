export type QualitySetting = 'auto' | 'pro' | 'standard' | 'safe';

export const ATTRACT_PRIZE = {
  headline: 'Place in the top 3 in any game.',
  reward: 'Win a bottle of maple syrup,\nshipped right to your door.',
};

export type AppConfig = {
  title: string;
  headlineLines: string[];
  subcopy: string;
  boothNumber: string;
  tickerLines: string[];
  idleToAttractMs: number;
  gameIdleExitMs: number;
  defaultQuality: QualitySetting;
};

export const config: AppConfig = {
  title: 'Have Some Fun At AREMA',
  headlineLines: ['Have', 'Some Fun', 'At AREMA'],
  subcopy: 'Pick a game. Beat the yard.',
  boothNumber: '',
  tickerLines: ['Hamlet, NC', '2 million ties per year', 'Rail access: 50,000 ties per week', 'tiedisposal.com'],
  idleToAttractMs: 5 * 60 * 1000,
  gameIdleExitMs: 5 * 60 * 1000,
  defaultQuality: 'auto',
};

export function tickerItems(c: AppConfig = config): string[] {
  return c.boothNumber ? [...c.tickerLines, `Booth #${c.boothNumber}`] : [...c.tickerLines];
}

export type UrlOverrides = { e2e: boolean; debug: boolean; idleToAttractMs?: number; gameIdleExitMs?: number };

function positiveInt(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function readUrlOverrides(search: string): UrlOverrides {
  const p = new URLSearchParams(search);
  const out: UrlOverrides = { e2e: p.has('e2e'), debug: p.has('debug') };
  const idle = positiveInt(p.get('idle'));
  const gameIdle = positiveInt(p.get('gameidle'));
  if (idle !== undefined) out.idleToAttractMs = idle;
  if (gameIdle !== undefined) out.gameIdleExitMs = gameIdle;
  return out;
}

export function effectiveConfig(search: string): AppConfig {
  const o = readUrlOverrides(search);
  return {
    ...config,
    idleToAttractMs: o.idleToAttractMs ?? config.idleToAttractMs,
    gameIdleExitMs: o.gameIdleExitMs ?? config.gameIdleExitMs,
  };
}
