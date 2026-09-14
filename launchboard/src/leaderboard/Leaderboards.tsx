import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { fonts } from '../brand';
import { appStore, useApp } from '../state/store';
import { closeScores, GAME_NAMES, loadScores, ranked, saveScore, scoreStore, showScores, submitScore, validName, type GameId, type Score } from './scores';
import './leaderboard.css';

export function Leaderboards() {
  const screen = useApp((s) => s.screen);
  const state = useStore(scoreStore);
  const [firstName, setFirst] = useState(''), [lastName, setLast] = useState('');
  const [status, setStatus] = useState<'editing' | 'sending' | 'sent' | 'local'>('editing');
  const [error, setError] = useState('');
  const busy = useRef(false), confirmed = useRef(false), request = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const saved = useRef<Score | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    closeScores();
  }, [screen]);
  useEffect(() => {
    generation.current++; busy.current = false;
    setFirst(''); setLast(''); setError(''); setStatus('editing'); confirmed.current = false; saved.current = null;
    if (!state.open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => { generation.current++; request.current?.abort(); previous?.focus(); };
  }, [state.open, state.result?.id]);
  if (!state.open) return screen === 'board' ? <button className="score-launch" onClick={() => showScores('beaver-crossing')}>High scores</button> : null;
  const rows = ranked(loadScores(), state.game);
  const alreadySaved = !!state.result && loadScores().some((s) => s.id === state.result!.id && s.score >= state.result!.score);
  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (busy.current || !state.result) return;
    if (!saved.current && (!validName(firstName) || !validName(lastName))) { setError('Enter your first and last name.'); return; }
    busy.current = true; setStatus('sending'); setError('');
    const controller = new AbortController(); request.current = controller;
    const currentGeneration = generation.current;
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      if (!saved.current) { const entry = { ...state.result, firstName, lastName, date: new Date().toISOString() }; saveScore(entry); saved.current = entry; }
      if (!confirmed.current) { await submitScore(state.result, saved.current.firstName, saved.current.lastName, controller.signal); if (generation.current !== currentGeneration) return; confirmed.current = true; }
      setStatus('sent'); setFirst(''); setLast('');
    } catch (err) {
      if (generation.current !== currentGeneration) return;
      setStatus(saved.current ? 'local' : 'editing');
      setError(!saved.current ? 'This browser could not save your score. Enable local storage and retry.' : controller.signal.aborted ? 'Saved here. No confirmation from ITD arrived; ask the booth team to check before retrying.' : err instanceof TypeError ? 'Saved here. Reconnect to send a copy to ITD.' : `Saved here. ${(err as Error).message}`);
    } finally { clearTimeout(timer); if (generation.current === currentGeneration) busy.current = false; }
  }
  return <div className="score-shade" data-kiosk-form onPointerDown={() => appStore.getState().markInput(performance.now())}>
    <style>{`@font-face{font-family:ScoreBarlow;src:url('${fonts.regular}')}@font-face{font-family:ScoreBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    <div className="score-dialog" role="dialog" aria-modal="true" aria-labelledby="score-title" ref={dialog} onKeyDown={(e) => {
      appStore.getState().markInput(performance.now());
      if (e.key === 'Escape') { e.stopPropagation(); closeScores(); }
      if (e.key === 'Tab') {
        const nodes = [...dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')], first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <header><div><small>ITD / THIS BOOTH COMPUTER</small><h1 id="score-title">High scores.</h1></div><button onClick={closeScores} aria-label="Close leaderboard">Close</button></header>
      <nav aria-label="Game leaderboards">{Object.entries(GAME_NAMES).map(([id, title]) => <button key={id} aria-pressed={state.game === id} onClick={() => scoreStore.setState({ game: id as GameId })}>{title}</button>)}</nav>
      <div className="score-columns"><section><h2>{GAME_NAMES[state.game]}</h2><p className="score-muted">{state.game === 'beaver-crossing' ? 'Crossings and progress, with a retry penalty.' : state.game === 'carbon-sort' ? 'Total recycling points.' : state.game === 'kiln-keeper' ? '100 points per second in range + 10,000 for a completed batch.' : 'Biocarbon plants connected to their regional depot.'}</p>
        {rows.length ? <ol className="score-list">{rows.map((row, i) => <li key={row.id}><span className="score-rank">{i + 1}</span><span>{row.firstName} {row.lastName}</span><strong>{row.score.toLocaleString()}</strong></li>)}</ol> : <p className="score-empty">The board is yours to start.<br />Finish a game and add your name.</p>}
        <p className="score-muted">Top 10 submitted runs on this browser. Names and scores remain here until browser data is cleared.</p>
      </section><section className="score-entry">{state.result ? <>
        <small>{GAME_NAMES[state.result.game]}</small><h2>{state.result.score.toLocaleString()} points</h2><p>{state.result.detail}</p>
        {alreadySaved || saved.current ? <div role="status"><h3>Score saved.</h3><p>{status === 'sent' ? 'Saved on this booth computer. A copy was also sent to ITD.' : status === 'sending' ? 'Saved on this booth computer. Sending a copy to ITD...' : 'Your name and score are saved on this booth computer.'}</p>{error && <p role="alert">{error}</p>}{status === 'local' && <button onClick={() => void submit()}>Retry sending to ITD</button>}<button onClick={closeScores}>Back to the game</button></div> : <form onSubmit={submit} autoComplete="off"><fieldset disabled={status === 'sending'}>
          <label>First name<input name="firstName" required maxLength={60} value={firstName} onChange={(e) => setFirst(e.target.value)} /></label>
          <label>Last name<input name="lastName" required maxLength={60} value={lastName} onChange={(e) => setLast(e.target.value)} /></label>
          <p className="score-muted">Your first and last name and score will appear on this booth leaderboard and be sent to ITD through Formspree.</p>
          {error && <p role="alert">{error}</p>}<button type="submit">{status === 'sending' ? 'Submitting...' : 'Submit my score'}</button>
        </fieldset></form>}
      </> : <><small>MAKE YOUR MARK</small><h2>Four games.<br />A little friendly competition.</h2><p>Play a game, then use “Save score / Leaderboard” on the result screen. Your form connects your first and last name to that run.</p><p>Beaver Crossing prize claims also save your winning score.</p></>}</section></div>
    </div>
  </div>;
}
