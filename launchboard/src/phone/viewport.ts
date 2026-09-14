import { useEffect } from 'react';
import { createStore, useStore } from 'zustand';
import { appStore } from '../state/store';
import { computeLayout, type Layout } from '../tube/geometry';

function read() {
  const enabled = typeof window !== 'undefined' && matchMedia('(any-pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 500;
  return { enabled, portrait: typeof window !== 'undefined' && innerHeight > innerWidth };
}
export const phoneStore = createStore(read);
export const phoneGameBlocked = () => { const s = phoneStore.getState(); return s.enabled && s.portrait; };
export const usePhone = () => useStore(phoneStore, (s) => s.enabled);
export function usePhoneViewport() {
  const state = useStore(phoneStore);
  useEffect(() => {
    const update = () => phoneStore.setState(read());
    const query = matchMedia('(any-pointer: coarse)');
    update(); window.addEventListener('resize', update); query.addEventListener('change', update);
    return () => { window.removeEventListener('resize', update); query.removeEventListener('change', update); };
  }, []);
  return state;
}

// Logical scene bounds retain the existing artwork while removing tiny kiosk sidebars.
export function phoneScene(game: string | null) {
  if (game === 'beaver-crossing') return { x: 245, y: 0, w: 1340, h: 1040, panel: true };
  if (game === 'carbon-sort') return { x: 25, y: -22, w: 560, h: 950, panel: true };
  if (game === 'kiln-keeper') return { x: 285, y: 0, w: 1240, h: 1040, panel: true };
  if (game === 'carbon-rails') return { x: -390, y: 90, w: 930, h: 880, panel: true };
  return { x: 0, y: 0, w: 1920, h: 1080, panel: false };
}

export function displayLayout(w: number, h: number): Layout {
  if (!phoneStore.getState().enabled) return computeLayout(w, h);
  const scene = phoneScene(appStore.getState().activeGameId);
  const inset = w > h ? 48 : 12;
  const left = scene.panel ? Math.min(w * 0.38, 300) + 8 : inset;
  const availableW = Math.max(1, w - left - inset), availableH = Math.max(1, h - (scene.panel ? 64 : 0));
  const scale = Math.min(availableW / scene.w, availableH / scene.h);
  const tubeW = scene.w * scale, tubeH = scene.h * scale;
  const tubeX = left + (availableW - tubeW) / 2, tubeY = (availableH - tubeH) / 2;
  return { scale, tubeX, tubeY, tubeW, tubeH, monitorX: tubeX, monitorY: tubeY, monitorW: tubeW, monitorH: tubeH };
}
