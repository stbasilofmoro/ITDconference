import { useRef, type PointerEvent } from 'react';
import { phoneInput } from './PhonePortal';

export type Swipe = 'left' | 'right' | 'up' | 'down';
export type Gestures = { hint: string; tap?(): void; swipe?(direction: Swipe): void; drag?(fraction: number): void };

// A gesture ends on release; browser cancellation never becomes a tap or swipe.
export function PhoneGestures({ hint, tap, swipe, drag }: Gestures) {
  const active = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const update = (e: PointerEvent<HTMLDivElement>) => {
    const p = active.current;
    if (!p || p.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 18) p.moved = true;
    if (p.moved && drag) { phoneInput(); drag(Math.max(0, Math.min(1, e.clientX / innerWidth))); }
  };
  return <div className="phone-gesture-surface" role="region" aria-label={hint}
    onPointerDown={(e) => { e.preventDefault(); phoneInput(); if (active.current) return; active.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={update} onPointerCancel={() => { active.current = null; }} onLostPointerCapture={() => { active.current = null; }}
    onPointerUp={(e) => {
      const p = active.current; if (!p || p.id !== e.pointerId) return;
      update(e); active.current = null; phoneInput();
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (!p.moved) tap?.();
      else if (!drag) swipe?.(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
    }} />;
}
