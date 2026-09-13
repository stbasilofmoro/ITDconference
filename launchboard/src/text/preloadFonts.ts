import { preloadFont } from 'troika-three-text';
import { fonts } from '../brand';

/** Printable characters used across the board, attract screen, ticker and game UIs. */
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?'\"()-–—/%$#&+•·…";

function preload(font: string): Promise<void> {
  return new Promise((resolve) => {
    preloadFont({ font, characters: CHARSET, sdfGlyphSize: 64 }, () => resolve());
  });
}

/**
 * Resolves once all three Barlow weights have been fetched and parsed into troika's font
 * cache, so the first drei <Text> that uses them doesn't suspend on a cold font load —
 * which otherwise delays the effects (like inputBus subscriptions) of whatever screen
 * mounts that <Text> first.
 */
export const fontsReady: Promise<void> = Promise.all(Object.values(fonts).map(preload)).then(() => undefined);
