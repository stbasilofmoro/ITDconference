import { useEffect, useRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStore } from 'zustand';
import { appStore } from '../state/store';
import { scoreStore, showScores, type Result } from '../leaderboard/scores';
import { usePhone } from './viewport';

export const phoneInput = () => appStore.getState().markInput(performance.now());

export function PhoneButton({ children, onPress, disabled = false }: { children: ReactNode; onPress(): void; disabled?: boolean }) {
  // Let the browser distinguish a tap from a swipe through a scrollable menu.
  return <button disabled={disabled} onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }}
    onClick={() => { phoneInput(); onPress(); }}>{children}</button>;
}

export function PhonePanel({ title, status, modal = false, result, exit, children }: { title: string; status?: string; modal?: boolean; result?: Result; exit(): void; children: ReactNode }) {
  const scores = useStore(scoreStore, (s) => s.open);
  if (scores) return null;
  return <div className={`phone-controls${modal ? ' phone-modal' : ''}`} onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyUp={(e) => e.stopPropagation()} onScrollCapture={phoneInput}>
    <section aria-label={`${title} phone controls`}>
      <header><small>ITD / PLAY</small><h1>{title}</h1>{status && <p role="status">{status}</p>}</header>
      {children}
      <footer>{result && <PhoneButton onPress={() => showScores(result.game, result)}>Save score / Leaderboard</PhoneButton>}<PhoneButton onPress={exit}>Exit to games</PhoneButton></footer>
    </section>
  </div>;
}

export function PhonePortal({ children }: { children: ReactNode }) {
  const enabled = usePhone(), root = useRef<Root | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const host = document.createElement('div'); host.dataset.phoneHud = ''; document.body.append(host);
    const mounted = createRoot(host); root.current = mounted;
    return () => { root.current = null; host.remove(); queueMicrotask(() => mounted.unmount()); };
  }, [enabled]);
  useEffect(() => { root.current?.render(children); });
  return null;
}
