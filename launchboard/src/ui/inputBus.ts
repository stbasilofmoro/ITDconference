import type { Action } from './input';

export type InputBus = { emit(a: Action): void; subscribe(fn: (a: Action) => void): () => void };

export function createInputBus(): InputBus {
  const subs = new Set<(a: Action) => void>();
  return {
    emit: (a) => { for (const fn of [...subs]) fn(a); },
    subscribe: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}

export const inputBus = createInputBus();
