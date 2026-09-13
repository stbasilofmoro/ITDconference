import type { Screen } from './idle';

export type FallbackEntryAction = 'toBoard' | 'exitGame' | null;

/**
 * The CSS fallback (used in Safe mode, without WebGL2, or on a lost WebGL context) has no
 * boot/attract/game screen of its own — it only ever renders the board. Given the screen the
 * store was on when the fallback mounted, this returns which store action (if any) moves
 * `screen` onto ground the fallback can actually render.
 */
export function fallbackEntryAction(screen: Screen): FallbackEntryAction {
  if (screen === 'board') return null;
  return screen === 'game' ? 'exitGame' : 'toBoard';
}
