import type { Action } from './input';

export type InputBus = { emit(a: Action): void; subscribe(fn: (a: Action) => void): () => void };

/**
 * How long a buffered action stays deliverable to the next subscriber. Covers the gap
 * between a screen transition (which updates the store synchronously) and that screen's
 * component actually committing its inputBus subscription — see Board.tsx/CssFallback.tsx.
 */
export const PENDING_TTL_MS = 750;

export function createInputBus(now: () => number = () => performance.now()): InputBus {
  const subs = new Set<(a: Action) => void>();
  let pending: { action: Action; at: number } | null = null;

  return {
    emit: (a) => {
      if (subs.size === 0) {
        // Nobody's listening yet — keep only the most recent action so it can still reach
        // whichever subscriber shows up next, as long as that happens within the TTL.
        pending = { action: a, at: now() };
        return;
      }
      for (const fn of [...subs]) fn(a);
    },
    subscribe: (fn) => {
      subs.add(fn);
      if (pending) {
        const { action, at } = pending;
        pending = null;
        // Delivered synchronously, inside this subscribe() call, before any other code
        // runs — the new subscriber sees it exactly as if it had been listening in time.
        if (now() - at < PENDING_TTL_MS) fn(action);
      }
      return () => { subs.delete(fn); };
    },
  };
}

export const inputBus = createInputBus();
