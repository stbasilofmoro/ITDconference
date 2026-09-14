export type Hooks = {
  getState(): { screen: string; focusIndex: number; activeGameId: string | null; quality: string; contextLost: boolean; lastInputAt: number; markInput(now: number): void; toBoard(): void; toAttract(): void; setFocus(i: number): void };
  contentToScreen(x: number, y: number): { px: number; py: number };
  tubeOverrides(): Record<string, number>;
};

declare global {
  interface Window { __launchboard?: Hooks }
}
