import { AudioControls } from './audio/AudioControls';
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { fonts } from './brand';
import { PhoneHome } from './phone/PhoneHome';
import { usePhoneViewport } from './phone/viewport';
import './phone/phone.css';
import { Canvas } from '@react-three/fiber';
import { effectiveConfig, config } from './config';
import { DebugPanel } from './debug/DebugPanel';
import { Gallery } from './dev/Gallery';
import { installE2eHooks } from './e2eHooks';
import { buildRegistry } from './games/registry';
import { StudioRig } from './illustrations/StudioRig';
import { GameHost } from './screens/GameHost';
import { ScreenRouter } from './screens/ScreenRouter';
import { loadStoredOverride, resolveInitialQuality } from './state/quality';
import { appStore, useApp } from './state/store';
import { useIdle } from './state/useIdle';
import { CssFallback } from './tube/CssFallback';
import { PerfAutoSelect } from './tube/PerfAutoSelect';
import { TubeRenderer } from './tube/TubeRenderer';
import { useGlobalInput } from './ui/useGlobalInput';
import { useKiosk } from './ui/useKiosk';
import { Leaderboards } from './leaderboard/Leaderboards';
import { closeScores } from './leaderboard/scores';
import { PrizePortal } from './games/beaver-crossing/PrizeForm';
import { PrizeButton } from './ui/PrizeButton';

const params = new URLSearchParams(window.location.search);
const cfg = effectiveConfig(window.location.search);
const isE2e = params.has('e2e');
const games = buildRegistry({ includeTestPattern: isE2e && !params.has('beaver'), includeBrokenGame: params.has('brokengame') });

const hasWebGL2 = (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
})();
const initial = resolveInitialQuality(config.defaultQuality, loadStoredOverride(), hasWebGL2);
appStore.setState({ quality: initial.quality, qualityOverride: initial.qualityOverride, debug: params.has('debug') });
installE2eHooks();

function Monitor({ children }: { children: ReactNode }) {
  return <TubeRenderer>{children}</TubeRenderer>;
}

export default function App() {
  const phone = usePhoneViewport();
  const screen = useApp((s) => s.screen);
  const [prizeOpen, setPrizeOpen] = useState(false);
  const [claimFocused, setClaimFocused] = useState(false);
  const claimButton = useRef<HTMLButtonElement>(null);
  const openPrize = useCallback(() => {
    closeScores();
    claimButton.current?.focus({ preventScroll: true });
    setPrizeOpen(true);
  }, []);
  const closePrize = useCallback(() => setPrizeOpen(false), []);
  useEffect(() => {
    if (screen !== 'board') { setPrizeOpen(false); setClaimFocused(false); }
  }, [screen]);
  useEffect(() => {
    document.body.dataset.phone = String(phone.enabled);
    document.body.dataset.phoneGame = String(screen === 'game');
  }, [phone.enabled, screen]);
  useGlobalInput();
  useKiosk(!isE2e);
  const quality = useApp((s) => s.quality);
  const contextLost = useApp((s) => s.contextLost);
  const debug = useApp((s) => s.debug);
  const fallback = !hasWebGL2 || quality === 'safe';
  useIdle(cfg, !phone.enabled && (fallback || contextLost));

  return (
    <>
      {phone.enabled && <style>{`@font-face{font-family:PhoneBarlow;src:url('${fonts.medium}')}@font-face{font-family:PhoneBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>}
      {phone.enabled && screen !== 'game' && <PhoneHome games={games} onClaim={openPrize} />}
      {!fallback && (
        // Reuse the mobile context across games: disposing a Canvas fires a delayed
        // context-lost event that otherwise sends the next game back to the picker.
        // The hidden picker canvas has no scene and no running render loop.
        <Canvas orthographic flat dpr={phone.enabled || quality !== 'pro' ? 1 : [1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
          frameloop={phone.enabled && screen !== 'game' ? 'never' : 'always'}
          style={phone.enabled && screen !== 'game' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
          // The default framebuffer only ever draws the full-screen tube quad; scenes are
          // antialiased in TubeRenderer's multisampled target, so MSAA here is pure fill cost.
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            // A freshly created context is by definition not lost — clear any stale flag left
            // by a previous canvas's context-lost event that fired after that canvas was
            // already unmounted (observed under software WebGL when quality cycles Safe→Pro
            // in quick succession). Without this reset, `contextLost` can stay stuck `true`
            // forever — there is no live canvas left to fire `webglcontextrestored` on — and
            // the CSS fallback would then never clear even once a healthy Canvas is showing.
            appStore.getState().setContextLost(false);
            canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); appStore.getState().setContextLost(true); });
            canvas.addEventListener('webglcontextrestored', () => appStore.getState().setContextLost(false));
          }}>
          <Monitor>
            {/* Unmount screens while the context is lost so only the CSS fallback handles input.
                StudioRig stays out of the gallery path — Gallery renders its own StudioRig (Task 13). */}
            {!contextLost && (!phone.enabled || screen === 'game') && (params.has('gallery') ? <Gallery /> : (
              <>
                <StudioRig />
                {/* A suspended <Text> (e.g. a cold font load) only unmounts this boundary,
                    never the whole scene, so the TubeRenderer frame loop keeps running. */}
                <Suspense fallback={null}>
                  <ScreenRouter games={games} gameHost={<GameHost games={games} />} onClaim={openPrize} claimFocused={claimFocused} />
                </Suspense>
              </>
            ))}
          </Monitor>
          {initial.autoSelect && !phone.enabled && <PerfAutoSelect />}
        </Canvas>
      )}
      {(fallback || contextLost) && (!phone.enabled || screen === 'game') && <CssFallback games={games} onClaim={openPrize} />}
      {debug && <DebugPanel />}
      <Leaderboards />
      {screen === 'board' && !phone.enabled && !fallback && !contextLost &&
        <PrizeButton visuallyHidden buttonRef={claimButton} onFocusChange={setClaimFocused} onClick={openPrize} />}
      {screen === 'board' && prizeOpen && <PrizePortal onExit={closePrize} />}
      <AudioControls />
    </>
  );
}
