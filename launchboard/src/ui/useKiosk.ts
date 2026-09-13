import { useEffect } from 'react';

const CURSOR_HIDE_MS = 3000;

export function useKiosk(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let wakeLock: { release(): Promise<void> } | null = null;
    let cursorTimer: ReturnType<typeof setTimeout> | undefined;

    const requestWakeLock = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
        wakeLock = (await nav.wakeLock?.request('screen')) ?? null;
      } catch { /* not supported or denied */ }
    };
    const onFirstInteraction = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
      void requestWakeLock();
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') void requestWakeLock(); };
    const onMouseMove = () => {
      document.body.classList.remove('cursor-hidden');
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), CURSOR_HIDE_MS);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('mousemove', onMouseMove);
    onMouseMove();
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(cursorTimer);
      void wakeLock?.release().catch(() => {});
    };
  }, [enabled]);
}
