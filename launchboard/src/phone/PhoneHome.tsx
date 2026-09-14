import { useEffect } from 'react';
import { ATTRACT_PRIZE } from '../config';
import { MONOGRAM_PATHS, MONOGRAM_VIEWBOX, MONOGRAM_STROKE } from '../brand';
import { appStore, useApp } from '../state/store';
import type { GameDefinition } from '../games/types';
import { phoneInput } from './PhonePortal';

const descriptions = ['Hop through five stages of the carbon journey.', 'Match four. Give every material a second life.', 'Keep a rotary kiln between 700 and 850°C.', 'Connect a cleaner world, one railway at a time.', 'Follow company clues. Scan badges. Dodge bad breath.', 'A beaver, three lost seals, and an industrial adventure.'];
function Bottle() { return <div className="phone-syrup" aria-hidden="true"><span>PURE<br /><b>MAPLE</b><br />SYRUP</span></div>; }
export function PhoneHome({ games }: { games: GameDefinition[] }) {
  const screen = useApp((s) => s.screen);
  useEffect(() => { appStore.getState().bootDone(); }, []);
  return <main className="phone-home" onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyDown={(e) => { e.stopPropagation(); phoneInput(); }} onScrollCapture={phoneInput}>
    <header><svg viewBox={`0 0 ${MONOGRAM_VIEWBOX.w} ${MONOGRAM_VIEWBOX.h}`} width="42" height="36" aria-hidden="true">{MONOGRAM_PATHS.map((d, i) => <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={MONOGRAM_STROKE} />)}</svg><span>INTERNATIONAL<br />TIE DISPOSAL</span><small>AREMA / ARCADE</small></header>
    <div className="phone-home-body">
      <p className="phone-eyebrow">OLD TIES. NEW POSSIBILITIES.</p>
      <h1>{screen === 'board' ? 'Pick your\nnext adventure.' : 'Have Some\nFun At AREMA'}</h1>
      <div className="phone-prize"><Bottle /><p><strong>{ATTRACT_PRIZE.headline}</strong><span>{ATTRACT_PRIZE.reward.replace('\n', ' ')}</span></p></div>
      {screen !== 'board' ? <><button className="phone-play" onClick={() => appStore.getState().toBoard()}>TOUCH TO PLAY <span>↗</span></button><p className="phone-home-help">Six games. A little friendly competition.<br />Turn your phone sideways to play.</p><div className="phone-track" aria-hidden="true"><span /></div></> : <>
        <p className="phone-home-help">Choose a game, then turn your phone sideways.</p>
        <div className="phone-game-grid">{games.map((game, i) => <button key={game.id} className={`phone-game phone-${game.accent}`} onClick={() => { phoneInput(); appStore.getState().launch(game.id); }}><span className="phone-game-number">0{i + 1}</span><div><h2>{game.title}</h2><p>{descriptions[i]}</p></div><span aria-hidden="true">↗</span></button>)}</div>
      </>}
    </div>
  </main>;
}
export function PhoneRotate() {
  return <div className="phone-rotate" role="dialog" aria-label="Turn your phone sideways" onPointerDown={(e) => { e.stopPropagation(); phoneInput(); }} onKeyDown={(e) => { e.stopPropagation(); phoneInput(); }}>
    <span className="phone-rotate-icon" aria-hidden="true">↻</span><h1>A little more room<br />to play.</h1><p>Turn your phone sideways.<br />Your game will wait right here.</p><button onClick={() => appStore.getState().exitGame()}>Back to games</button>
  </div>;
}
