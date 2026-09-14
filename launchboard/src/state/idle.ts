export type Screen = 'boot' | 'attract' | 'board' | 'game';

export function nextScreenForIdle(
  screen: Screen,
  lastInputAt: number,
  now: number,
  cfg: { idleToAttractMs: number; gameIdleExitMs: number },
): Screen | null {
  const idle = now - lastInputAt;
  if (screen === 'board' && idle >= cfg.idleToAttractMs) return 'attract';
  if (screen === 'game' && idle >= cfg.gameIdleExitMs) return 'attract';
  return null;
}
