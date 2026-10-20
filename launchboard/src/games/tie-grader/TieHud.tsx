import { useEffect, useRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStore } from 'zustand';
import { fonts } from '../../brand';
import { appStore } from '../../state/store';
import { scoreStore, showScores, type Result } from '../../leaderboard/scores';
import { usePhone } from '../../phone/viewport';
import { preventClickThrough } from '../../ui/touchNavigation';
import { QUOTA, SHIFT_SECONDS, nearestStation, type Run, type StationId } from './engine';
import './tie-grader.css';

type Props = { run: Run; result: Result; select(): void; pause(): void; go(id: StationId): void; exit(): void };
const names: Record<StationId, string> = { incoming: 'Incoming ties', grade1: 'Grade 1 pile', grade2: 'Grade 2 pile', junk: 'Junk pile', truck1: 'Grade 1 truck', truck2: 'Grade 2 truck', shredder: 'Shredder' };
function Action({ children, onPress, className = '', label, active = false }: { children: ReactNode; onPress(): void; className?: string; label?: string; active?: boolean }) {
  return <button className={className} aria-label={label} aria-pressed={active} onPointerUp={e => { e.preventDefault(); e.stopPropagation(); preventClickThrough(); appStore.getState().markInput(performance.now()); onPress(); }} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); }} onClick={e => { if (e.detail === 0) { appStore.getState().markInput(performance.now()); onPress(); } }}>{children}</button>;
}
function Guide() {
  return <div className="tie-guide">
    <div className="tie-grade1"><b>01 / GRADE 1</b><strong>Sound & straight</strong><span>Solid wood, intact ends, no rot or splits.</span></div>
    <div className="tie-grade2"><b>02 / GRADE 2</b><strong>Worn, still solid</strong><span>Weathered wood or shallow surface cracks.</span></div>
    <div className="tie-junk"><b>03 / JUNK</b><strong>Beyond reuse</strong><span>Rotten wood, deep splits, or broken ends.</span></div>
  </div>;
}
function Hud({ run: r, result, select, pause, go, exit }: Props) {
  const phone = usePhone(), scores = useStore(scoreStore, s => s.open);
  if (scores) return null;
  const modal = r.phase !== 'playing' || r.paused, finished = r.phase === 'won' || r.phase === 'lost';
  const inspected = r.held?.tie ?? r.incoming[0], near = nearestStation(r);
  const seconds = Math.max(0, Math.ceil(SHIFT_SECONDS - r.elapsed));
  const station = (id: StationId, caption: string, count: string, shortcut: string, color = '') => <Action key={id} label={names[id]} className={`tie-station ${color}`} active={r.target === id} onPress={() => go(id)}><span>{caption}<kbd>{shortcut}</kbd></span><small>{count}</small></Action>;
  return <div className={`tie-hud${modal ? ' tie-modal' : ''}`} onPointerDownCapture={() => appStore.getState().markInput(performance.now())}>
    <style>{`@font-face{font-family:TieBarlow;src:url('${fonts.medium}')}@font-face{font-family:TieBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    {modal ? <section className="tie-card" aria-label="Tie Grader menu">
      <div className="tie-eyebrow">ITD / BIOCARBON WORKS <span>YARD 04</span></div>
      <h1>{r.paused ? 'Take a breather.' : r.phase === 'won' ? 'A job well sorted.' : r.phase === 'lost' ? 'Shift complete.' : 'Tie Grader'}</h1>
      <p className="tie-lead">{r.paused ? 'The yard is paused. Your ties and remaining time are saved.' : finished ? `${r.handled} of ${QUOTA} ties dispatched. ${r.mistakes === 0 ? 'No grading or loading mistakes.' : `${r.mistakes} mistakes this shift.`}` : 'Small beaver. Big responsibility.'}</p>
      {finished ? <><div className="tie-result"><b>{r.score.toLocaleString()}</b><span>YARD POINTS</span></div><div className="tie-totals"><span>Grade 1 shipped <b>{r.delivered.grade1}</b></span><span>Grade 2 shipped <b>{r.delivered.grade2}</b></span><span>Junk shredded <b>{r.delivered.junk}</b></span></div><p>{r.phase === 'won' ? 'Reusable ties are on the trucks. Junk is headed to biocarbon production.' : 'Every tie dispatched counts. Start another shift to clear the whole batch.'}</p></> : <>
        <p>Help Atom grade {QUOTA} railroad ties in a busy biocarbon plant. Clear the batch in three minutes.</p>
        <Guide />
        <ol className="tie-instructions"><li><b>Pick up & inspect.</b> Go to Incoming ties and read the wood’s condition.</li><li><b>Make your grade.</b> Carry the tie to the correct pile and place it.</li><li><b>Pick up again & dispatch.</b> Load Grade 1 and 2 onto their trucks. Feed Junk into the shredder.</li></ol>
        <p className="tie-controls-help">Tap a station or a destination button: Atom walks there and picks up or places one tie. {phone ? '' : 'Or move with WASD / arrows and use E / Space to handle a tie. Controller: stick + A. P pauses.'}</p>
        <small className="tie-rule-note">Simplified grading rules for this arcade game.</small>
      </>}
      <div className="tie-menu-actions"><Action onPress={select}>{r.paused ? 'Resume shift' : finished ? 'New shift' : 'Start shift'}</Action>{finished && <Action onPress={() => showScores('tie-grader', result)}>Save score / Leaderboard</Action>}<Action className="tie-secondary" onPress={exit}>Exit to games</Action></div>
    </section> : <>
      <header className="tie-top"><div className="tie-title"><small>ITD / BIOCARBON WORKS</small><strong>Tie Grader<span>GRADE · STACK · DISPATCH</span></strong></div><div className="tie-meters"><span><b>{r.handled}<i>/{QUOTA}</i></b>DISPATCHED</span><span><b>{r.score}</b>POINTS</span><span className={seconds < 30 ? 'tie-urgent' : ''}><b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</b>SHIFT LEFT</span></div><Action className="tie-secondary tie-pause" onPress={pause}>{phone ? 'Menu' : 'Pause shift'}</Action></header>
      <aside className="tie-inspection" aria-label="Tie inspection"><div className="tie-eyebrow">{r.held ? 'IN YOUR PAWS' : 'NEXT AT INCOMING'}<span>{inspected ? `TIE #${String(inspected.id).padStart(2, '0')}` : 'WAITING'}</span></div><strong>{inspected?.condition ?? 'Next delivery on its way.'}</strong><p>{r.held?.graded ? `Graded ${r.held.graded === 'junk' ? 'Junk — carry to the shredder.' : r.held.graded === 'grade1' ? 'Grade 1 — carry to its truck.' : 'Grade 2 — carry to its truck.'}` : r.held ? 'Choose a pile. Place this tie before picking up another.' : 'Your paws are empty. Pick up an incoming tie or collect one from a pile.'}</p><div className="tie-pocket-guide"><span>1 · Sound</span><span>2 · Weathered</span><span>J · Rotten / split</span></div></aside>
      <div className="tie-bottom">
        <div className="tie-message" role="status">{r.messageTime > 0 ? r.message : r.target ? `Walking to ${names[r.target].toLowerCase()}…` : 'Tap a station to walk over and handle one tie.'}</div>
        <nav className="tie-stations" aria-label="Yard destinations"><div><label>01 / PICK UP</label>{station('incoming', 'Incoming', `${r.incoming.length} waiting`, 'I')}</div><div><label>02 / GRADE INTO PILES</label><div className="tie-three">{station('grade1', 'Grade 1', `${r.piles.grade1.length} stacked`, '1', 'tie-grade1')}{station('grade2', 'Grade 2', `${r.piles.grade2.length} stacked`, '2', 'tie-grade2')}{station('junk', 'Junk', `${r.piles.junk.length} stacked`, '3', 'tie-junk')}</div></div><div><label>03 / PICK UP FROM PILE, THEN DISPATCH</label><div className="tie-three">{station('truck1', 'Truck 1', `${r.delivered.grade1} loaded`, '4', 'tie-grade1')}{station('truck2', 'Truck 2', `${r.delivered.grade2} loaded`, '5', 'tie-grade2')}{station('shredder', 'Shredder', `${r.delivered.junk} shredded`, '6', 'tie-junk')}</div></div></nav>
        <div className="tie-bottom-line"><span>{phone ? 'Tap destinations to walk, pick up, and place.' : 'WASD / arrows: walk · E / Space: pick up or place · Click stations or use I, 1–6'}</span>{!phone && <Action className="tie-near" onPress={select}>{near ? `Handle at ${names[near.id]}` : 'Pick up / Place'}</Action>}<span>{r.mistakes} mistakes</span></div>
      </div>
    </>}
  </div>;
}
export function TieHud(props: Props) {
  const root = useRef<Root | null>(null);
  useEffect(() => {
    const host = document.createElement('div'); host.dataset.tieHud = ''; document.body.append(host);
    const mounted = createRoot(host); root.current = mounted;
    return () => { root.current = null; host.remove(); queueMicrotask(() => mounted.unmount()); };
  }, []);
  useEffect(() => { root.current?.render(<Hud {...props} />); });
  return null;
}
