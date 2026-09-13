import { createStore, useStore, type StoreApi } from 'zustand';
import type { Screen } from './idle';

export type { Screen } from './idle';
export type QualityPreset = 'pro' | 'standard' | 'safe';
export const QUALITY_STORAGE_KEY = 'arema.qualityOverride';

export type AppData = {
  screen: Screen;
  focusIndex: number;
  activeGameId: string | null;
  quality: QualityPreset;
  qualityOverride: QualityPreset | null;
  debug: boolean;
  lastInputAt: number;
  contextLost: boolean;
};

export type AppActions = {
  bootDone(): void;
  toAttract(): void;
  toBoard(): void;
  launch(id: string): void;
  exitGame(): void;
  setFocus(i: number): void;
  markInput(now: number): void;
  setQuality(q: QualityPreset): void;
  cycleQualityOverride(): void;
  toggleDebug(): void;
  setContextLost(v: boolean): void;
};

export type AppState = AppData & AppActions;

const OVERRIDE_CYCLE: (QualityPreset | null)[] = [null, 'pro', 'standard', 'safe'];

export function createAppStore(initial: Partial<AppData> = {}): StoreApi<AppState> {
  return createStore<AppState>()((set, get) => ({
    screen: 'boot',
    focusIndex: 0,
    activeGameId: null,
    quality: 'pro',
    qualityOverride: null,
    debug: false,
    lastInputAt: 0,
    contextLost: false,
    ...initial,
    bootDone: () => { if (get().screen === 'boot') set({ screen: 'attract' }); },
    toAttract: () => set({ screen: 'attract', activeGameId: null }),
    toBoard: () => set({ screen: 'board', activeGameId: null }),
    launch: (id) => { if (get().screen === 'board') set({ screen: 'game', activeGameId: id }); },
    exitGame: () => { if (get().screen === 'game') set({ screen: 'board', activeGameId: null }); },
    setFocus: (i) => set({ focusIndex: i }),
    markInput: (now) => set({ lastInputAt: now }),
    setQuality: (q) => { if (get().qualityOverride === null) set({ quality: q }); },
    cycleQualityOverride: () => {
      const i = OVERRIDE_CYCLE.indexOf(get().qualityOverride);
      const next = OVERRIDE_CYCLE[(i + 1) % OVERRIDE_CYCLE.length];
      set(next === null ? { qualityOverride: null, quality: 'pro' } : { qualityOverride: next, quality: next });
    },
    toggleDebug: () => set({ debug: !get().debug }),
    setContextLost: (v) => set({ contextLost: v }),
  }));
}

export const appStore = createAppStore();

export function useApp<T>(selector: (s: AppState) => T): T {
  return useStore(appStore, selector);
}
