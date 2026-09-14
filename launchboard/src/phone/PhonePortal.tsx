import { preventClickThrough } from '../ui/touchNavigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStore } from 'zustand';
import { appStore } from '../state/store';
import { scoreStore, showScores, type Result } from '../leaderboard/scores';
import { phoneStore, usePhone } from './viewport';
import { PhoneGestures, type Gestures } from './PhoneGestures';

export const phoneInput = () => appStore.getState().markInput(performance.now());

export function PhoneButton({ children, onPress, disabled = false }: { children: ReactNode; onPress(): void; disabled?: boolean }) {
  // Let the browser distinguish a tap from a swipe through a scrollable menu.
  return <button disabled={disabled} onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }}
    onClick={() => { phoneInput(); onPress(); }}>{children}</button>;
}

export function PhonePanel({ title, status, modal = false, result, exit, children, gestures, summary }: { title: string; status?: string; modal?: boolean; result?: Result; exit(): void; children: ReactNode; gestures?: Gestures; summary?: ReactNode }) {
  const scores = useStore(scoreStore, (s) => s.open);
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [modal]);
  useEffect(() => {
    phoneStore.setState({ menuOpen: open && !modal });
    return () => { phoneStore.setState({ menuOpen: false }); };
  }, [open, modal]);
  if (scores) return null;
  if (!modal && !open) return <>
    {gestures && <PhoneGestures {...gestures} />}
    <div className="phone-game-status"><strong>{title}</strong><span>{status}</span>{summary}<small>{gestures?.hint ?? 'Drag the globe. Open Routes & cards to plan your turn.'}</small></div>
    <button className="phone-menu-toggle" onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); preventClickThrough(); phoneInput(); setOpen(true); }} onClick={(e) => { if (e.detail === 0) { phoneInput(); setOpen(true); } }}>{gestures ? 'Menu' : 'Routes & cards'}</button>
  </>;
  return <div className={`phone-controls${modal ? ' phone-modal' : ''}`} onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyUp={(e) => e.stopPropagation()} onScrollCapture={phoneInput}>
    <section aria-label={`${title} phone controls`}>
      {!modal && <PhoneButton onPress={() => setOpen(false)}>Back to game</PhoneButton>}
      <header><small>ITD / PLAY</small><h1>{title}</h1>{status && <p role="status">{status}</p>}</header>
      {gestures && <p>{gestures.hint}</p>}
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
