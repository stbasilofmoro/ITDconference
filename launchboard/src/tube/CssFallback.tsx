import { useEffect, useLayoutEffect, useState } from 'react';
import { asset } from '../asset';
import { colors } from '../brand';
import { config, tickerItems } from '../config';
import type { GameDefinition } from '../games/types';
import { fallbackEntryAction } from '../state/fallback';
import { appStore, useApp } from '../state/store';
import { moveFocus } from '../ui/focus';
import { inputBus } from '../ui/inputBus';
import { accentColor } from '../ui/layout';

const css = `
@font-face { font-family: 'Barlow'; font-weight: 400; src: url('${asset('fonts/Barlow-Regular.ttf')}'); }
@font-face { font-family: 'Barlow'; font-weight: 500; src: url('${asset('fonts/Barlow-Medium.ttf')}'); }
@font-face { font-family: 'Barlow'; font-weight: 600; src: url('${asset('fonts/Barlow-SemiBold.ttf')}'); }
.fb { position: fixed; inset: 0; display: grid; place-items: center; background: #0b0b0c; z-index: 10; }
.fb-tube { position: relative; width: min(94vw, calc(94vh * 16 / 9)); aspect-ratio: 16 / 9; overflow: hidden;
  background: ${colors.studioGrey}; color: ${colors.ink}; font-family: 'Barlow', sans-serif;
  border-radius: 3.2% / 5.6%; box-shadow: 0 0 0 1.4vw #161618, 0 0 0 3vw #2b2b2e; }
.fb-inner { position: absolute; inset: 0; display: grid; grid-template-columns: 38% 62%; padding: 4.2% 4.2% 9%; box-sizing: border-box; }
.fb-h { font-weight: 600; font-size: 6.2vmin; line-height: 1.05; margin: 0; }
.fb-sub { color: ${colors.slate}; font-size: 2vmin; margin-top: 3vmin; }
.fb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6vmin; }
.fb-tile { background: ${colors.lightGrey}; border: 0; font: 500 1.8vmin 'Barlow', sans-serif; color: ${colors.ink};
  display: grid; align-content: end; justify-items: center; padding-bottom: 2vmin; gap: 1vmin; cursor: pointer;
  box-shadow: -0.5vmin 0.7vmin 0 rgba(0,0,0,.12); transition: transform .15s, box-shadow .15s; }
.fb-tile[data-soon="true"] { color: ${colors.muted}; }
.fb-tile[data-focus="true"] { transform: translateY(-0.6vmin); box-shadow: -1vmin 1.4vmin 0 rgba(0,0,0,.2); }
.fb-bar { width: 4.5vmin; height: 0.35vmin; }
.fb-ticker { position: absolute; left: 0; right: 0; bottom: 2.5%; border-top: 0.25vmin solid #EE6BD2; white-space: nowrap;
  overflow: hidden; color: ${colors.slate}; font: 500 1.6vmin 'Barlow', sans-serif; padding-top: 1vmin; }
.fb-ticker span { display: inline-block; padding-left: 100%; animation: fb-scroll 40s linear infinite; }
@keyframes fb-scroll { to { transform: translateX(-100%); } }
.fb-note { position: absolute; inset: 0; display: grid; place-items: center; background: ${colors.graphite}; color: ${colors.lightGrey};
  font: 600 5vmin 'Barlow', sans-serif; }
.fb-mask { position: absolute; inset: 0; pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(255,0,0,.06) 0 1px, rgba(0,255,0,.06) 1px 2px, rgba(0,0,255,.06) 2px 3px);
  box-shadow: inset 0 0 12vmin rgba(0,0,0,.5); }
`;

export function CssFallback({ games }: { games: GameDefinition[] }) {
  const focusIndex = useApp((s) => s.focusIndex);
  const [note, setNote] = useState(false);

  // A layout effect (not a passive one) so this runs synchronously in the commit that
  // makes the fallback visible. This one must stay synchronous: it corrects `screen` in
  // the store directly (not via inputBus), and useGlobalInput's wakeOrRoute branches on
  // `screen` before anything ever reaches inputBus — so a stale 'boot' here would swallow
  // input outright rather than something inputBus's pending-action buffer could recover.
  //
  // The fallback has no boot/attract/game UI of its own, so force the store onto the board
  // the moment it mounts. Covers starting directly in Safe mode (Boot.tsx never mounts,
  // since it lives inside the Canvas the fallback replaces) and staff cycling into Safe —
  // or a lost WebGL context — mid-session.
  useLayoutEffect(() => {
    const s = appStore.getState();
    const action = fallbackEntryAction(s.screen);
    if (action === 'toBoard') s.toBoard();
    else if (action === 'exitGame') s.exitGame();
  }, []);

  const select = (i: number) => {
    appStore.getState().setFocus(i);
    if (games[i].status !== 'playable') return;
    setNote(true);
    setTimeout(() => setNote(false), 3000);
  };

  // A plain (passive) effect: inputBus buffers the most recent action for PENDING_TTL_MS
  // when it has no subscriber yet, so this doesn't need to race to subscribe synchronously.
  useEffect(() => inputBus.subscribe((a) => {
    const s = appStore.getState();
    if (a === 'select') select(s.focusIndex);
    else if (a !== 'back') s.setFocus(moveFocus(s.focusIndex, a, 3, games.length));
  }));

  return (
    <div className="fb" data-testid="css-fallback">
      <style>{css}</style>
      <div className="fb-tube">
        <div className="fb-inner">
          <div>
            <h1 className="fb-h">{config.headlineLines.map((l) => <div key={l}>{l}</div>)}</h1>
            <p className="fb-sub">{config.subcopy}</p>
          </div>
          <div className="fb-grid">
            {games.map((g, i) => (
              <button key={g.id} className="fb-tile" data-focus={focusIndex === i} data-soon={g.status === 'coming-soon'}
                onPointerEnter={() => appStore.getState().setFocus(i)} onClick={() => select(i)}>
                {g.title}
                <span className="fb-bar" style={{ background: focusIndex === i ? accentColor(g.accent) : 'transparent' }} />
              </button>
            ))}
          </div>
        </div>
        <div className="fb-ticker"><span>{tickerItems().join('     ·     ')}</span></div>
        {note && <div className="fb-note">This game needs the full tube</div>}
        <div className="fb-mask" />
      </div>
    </div>
  );
}
