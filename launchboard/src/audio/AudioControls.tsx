import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { fonts } from '../brand';
import { appStore } from '../state/store';
import { audioStore, boothAudio } from './engine';
import './audio.css';

export function AudioControls() {
  const settings = useStore(audioStore), [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    boothAudio.load(); let focused = document.hasFocus();
    const activity = () => boothAudio.setActive(focused && !document.hidden && ['board', 'game'].includes(appStore.getState().screen));
    const focus = () => { focused = true; activity(); }, blur = () => { focused = false; activity(); };
    const unlock = () => boothAudio.unlock();
    const unsubscribe = appStore.subscribe((next, previous) => {
      activity();
      if (next.activeGameId !== previous.activeGameId || next.screen !== previous.screen) { boothAudio.duck(false); setOpen(false); boothAudio.play('ui'); }
      else if (next.screen === 'board' && next.focusIndex !== previous.focusIndex) boothAudio.play('ui');
    });
    activity();
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    window.addEventListener('focus', focus); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', activity);
    const w = window as unknown as { __boothAudio?: unknown };
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('e2e')) w.__boothAudio = { getState: () => boothAudio.inspect() };
    return () => { unsubscribe(); window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); window.removeEventListener('focus', focus); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', activity); delete w.__boothAudio; boothAudio.dispose(); };
  }, []);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  const dismiss = () => { setOpen(false); toggle.current?.focus(); };
  return <div className="booth-audio" onPointerDown={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); }} onKeyDown={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); if (e.key === 'Escape') { e.preventDefault(); dismiss(); } }}>
    <style>{`@font-face{font-family:AudioBarlow;src:url('${fonts.medium}')}@font-face{font-family:AudioBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    {open && <section className="booth-audio-panel" id="booth-audio-panel" role="dialog" aria-label="Sound settings">
      <header><h2>Set the mood.</h2><button ref={close} onClick={dismiss} aria-label="Close sound settings">Close</button></header>
      <p>Gentle lo-fi and soft game sounds.</p>
      <label htmlFor="music-volume">Music <output>{Math.round(settings.music * 100)}%</output></label>
      <input id="music-volume" type="range" min="0" max="100" value={Math.round(settings.music * 100)} onChange={(e) => boothAudio.configure({ music: Number(e.target.value) / 100 })} />
      <label htmlFor="effects-volume">Sound effects <output>{Math.round(settings.effects * 100)}%</output></label>
      <input id="effects-volume" type="range" min="0" max="100" value={Math.round(settings.effects * 100)} onChange={(e) => boothAudio.configure({ effects: Number(e.target.value) / 100 })} />
      <button className="booth-audio-mute" aria-pressed={settings.muted} onClick={() => { boothAudio.configure({ muted: !settings.muted }); boothAudio.unlock(); }}>{settings.muted ? 'Turn sound on' : 'Mute all sound'}</button>
      <small>{settings.status === 'unavailable' ? 'Audio is unavailable in this browser.' : 'Your settings stay on this device. Sound rests while the booth is idle.'}</small>
    </section>}
    <button ref={toggle} className="booth-audio-toggle" aria-label="Sound settings" aria-expanded={open} aria-controls="booth-audio-panel" onClick={() => setOpen((value) => !value)}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 9h4l5-4v14l-5-4H4Z" />{settings.muted ? <path d="m17 9 5 6m0-6-5 6" /> : <path d="M16 8q4 4 0 8m3-11q7 7 0 14" />}</svg>
      {settings.muted ? 'Muted' : 'Sound'}
    </button>
  </div>;
}
