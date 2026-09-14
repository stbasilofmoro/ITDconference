import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { appStore } from '../../state/store';
import { fonts } from '../../brand';
import { FORMSPREE_ENDPOINT, submitClaim, validEndpoint, type PrizeClaim } from './claims';
import './prize.css';
import { saveScore, validName, type Result } from '../../leaderboard/scores';

function PrizeForm({ onExit, result }: { onExit(): void; result: Result }) {
  const [status, setStatus] = useState<'editing' | 'sending' | 'sent'>('editing');
  const [error, setError] = useState('');
  const [claim, setClaim] = useState<PrizeClaim>({ name: '', company: '', phone: '', address: '' });
  const [firstName, setFirstName] = useState(''), [lastName, setLastName] = useState('');
  const [scoreWarning, setScoreWarning] = useState('');
  const claimId = useRef(crypto.randomUUID());
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => { request.current?.abort(); previous?.focus(); };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    if (!validName(firstName) || !validName(lastName)) { setError('Please enter your first and last name.'); return; }
    busy.current = true; setError(''); setStatus('sending');
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      await submitClaim(FORMSPREE_ENDPOINT, { ...claim, name: `${firstName.trim()} ${lastName.trim()}` }, claimId.current, controller.signal, fetch, { runId: result.id, score: result.score, firstName: firstName.trim(), lastName: lastName.trim() });
      try { saveScore({ ...result, firstName, lastName, date: new Date().toISOString() }); } catch { setScoreWarning('Your claim and score reached ITD, but this browser could not save the local leaderboard.'); }
      setFirstName(''); setLastName('');
      setClaim({ name: '', company: '', phone: '', address: '' }); setStatus('sent');
    } catch (err) {
      setStatus('editing');
      setError(controller.signal.aborted ? 'No confirmation arrived. Ask the ITD team to check before retrying.' : err instanceof TypeError ? 'No connection. Your claim has not been confirmed. Reconnect and try again, or ask the ITD team.' : (err as Error).message);
    } finally { clearTimeout(timer); busy.current = false; }
  }
  return <div className="beaver-prize-shade" data-kiosk-form onPointerDown={() => appStore.getState().markInput(performance.now())}>
    <style>{`@font-face{font-family:BeaverBarlow;src:url('${fonts.regular}')}@font-face{font-family:BeaverBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    <div className="beaver-prize" role="dialog" aria-modal="true" aria-labelledby="prize-title" ref={dialog}
      onKeyDown={(e) => {
        appStore.getState().markInput(performance.now());
        if (e.key === 'Escape') { e.stopPropagation(); onExit(); }
        if (e.key === 'Tab') {
          const nodes = [...dialog.current!.querySelectorAll<HTMLElement>('input:not(:disabled), textarea:not(:disabled), button:not(:disabled)')];
          const first = nodes[0], last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="beaver-prize-story">
        <span className="beaver-eyebrow">ITD / ALL FIVE LEVELS COMPLETE</span>
        <h1 id="prize-title">Sweet<br />success.</h1>
        <div className="beaver-bottle" aria-hidden="true"><span>PURE<br /><b>MAPLE</b><br />SYRUP</span></div>
        <p>You crossed the whole journey.<br />ITD will send you delicious maple syrup for your success.</p>
        <span className="beaver-prize-foot">FROM OLD TIES TO NEW POSSIBILITIES.</span>
      </div>
      <div className="beaver-prize-details">
        {status === 'sent' ? <div className="beaver-sent" role="status">
          <span className="beaver-check">✓</span><h2>Claim received.</h2><p>Thank you! Your details have been sent to ITD to arrange your maple syrup.</p>
          <p>{scoreWarning || 'Your first and last name and winning score are on this booth leaderboard.'}</p>
          <button autoFocus onClick={onExit}>Back to the launchboard ↗</button>
        </div> : <>
          <h2>Where should we send it?</h2>
          <p>Enter your details so the ITD team can arrange delivery.</p>
          <form onSubmit={submit} autoComplete="off">
            <fieldset disabled={status === 'sending'}>
              <label>First name<input name="firstName" required maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
              <label>Last name<input name="lastName" required maxLength={60} value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
              <label>Company<input name="company" required maxLength={160} value={claim.company} onChange={(e) => setClaim({ ...claim, company: e.target.value })} /></label>
              <label>Phone number<input name="phone" type="tel" inputMode="tel" required maxLength={40} value={claim.phone} onChange={(e) => setClaim({ ...claim, phone: e.target.value })} /></label>
              <label>Full mailing address<textarea name="address" required maxLength={600} rows={3} placeholder="Street, city, state / province, postal code, country" value={claim.address} onChange={(e) => setClaim({ ...claim, address: e.target.value })} /></label>
            </fieldset>
            <p className="beaver-privacy">These details go to ITD through Formspree to fulfill your prize. Only your first and last name and game score appear on this booth leaderboard. Your company, phone, and mailing address are not saved on this kiosk.</p>
            {!validEndpoint(FORMSPREE_ENDPOINT) && <p className="beaver-error" role="status">Prize claims are not connected yet. Please ask the ITD booth team to arrange your syrup.</p>}
            {error && <p className="beaver-error" role="alert">{error}</p>}
            <button type="submit" disabled={status === 'sending' || !validEndpoint(FORMSPREE_ENDPOINT)}>{status === 'sending' ? 'Sending your claim…' : 'Claim my maple syrup ↗'}</button>
            <button className="beaver-secondary" type="button" onClick={onExit}>Finish without submitting</button>
          </form>
        </>}
      </div>
    </div>
  </div>;
}

// A separate DOM root keeps native, accessible form controls outside the WebGL reconciler.
// It exists only for the winning player and is destroyed (including all field values) on exit.
export function PrizePortal({ onExit, result }: { onExit(): void; result: Result }) {
  const initialResult = useRef(result).current;
  useEffect(() => {
    const host = document.createElement('div'); host.dataset.kioskForm = '';
    document.body.append(host);
    const root = createRoot(host); root.render(<PrizeForm onExit={onExit} result={initialResult} />);
    return () => { host.remove(); queueMicrotask(() => root.unmount()); };
  }, [onExit, initialResult]);
  return null;
}
