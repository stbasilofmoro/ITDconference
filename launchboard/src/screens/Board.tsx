import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';
import { config, tickerItems } from '../config';
import type { GameDefinition } from '../games/types';
import { appStore, useApp } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { moveFocus } from '../ui/focus';
import { inputBus } from '../ui/inputBus';
import { LEFT_X, TICKER_Y } from '../ui/layout';
import { Monogram } from '../ui/Monogram';
import { StackedHeadline } from '../ui/StackedHeadline';
import { Ticker } from '../ui/Ticker';
import { Tile } from '../ui/Tile';

const LAUNCH_DELAY_MS = 350;

export function Board({ games }: { games: GameDefinition[] }) {
  const focusIndex = useApp((s) => s.focusIndex);
  const [launching, setLaunching] = useState<number | null>(null);
  const [shakes, setShakes] = useState<Record<number, number>>({});
  const launchingRef = useRef<number | null>(null);

  // Deliberately no unmount cleanup for this timer: `appStore.launch()` already guards on
  // `screen === 'board'`, so a stale timer firing after Board goes away is a no-op, and
  // React 19 doesn't warn on a state update from an unmounted component either. (A bare
  // `useEffect(() => () => clearTimeout(timer), [])` here would be a real bug now that
  // inputBus can deliver a buffered action — and so call select(), which schedules this
  // timer — during React StrictMode's synthetic double-invoke of effects: that pass mounts
  // every effect before cleaning any of them up, so an unrelated "cleanup on unmount"
  // effect's simulated cleanup would read the timer ref *after* it was set and cancel a
  // perfectly live launch.)
  const select = useCallback((i: number) => {
    const game = games[i];
    appStore.getState().setFocus(i);
    if (launchingRef.current !== null) return;
    if (game.status !== 'playable') {
      setShakes((s) => ({ ...s, [i]: performance.now() }));
      return;
    }
    launchingRef.current = i;
    setLaunching(i);
    tubeBus.pulse('channel');
    setTimeout(() => {
      appStore.getState().launch(game.id);
      launchingRef.current = null;
      setLaunching(null);
    }, LAUNCH_DELAY_MS);
  }, [games]);

  // Keep a ref to the latest `select` so the inputBus subscription below can stay
  // mounted for the lifetime of the screen instead of resubscribing on every launch.
  const selectRef = useRef(select);
  useEffect(() => { selectRef.current = select; }, [select]);

  // A plain (passive) effect is fine here: inputBus buffers the most recent action for
  // PENDING_TTL_MS when it has no subscriber, so a keypress that lands in the gap before
  // this subscription commits is still delivered once it does — no matter how that gap
  // is caused (a slow frame, StrictMode's effect double-invoke, or anything else).
  useEffect(() => inputBus.subscribe((action) => {
    const s = appStore.getState();
    if (s.screen !== 'board') return;
    if (action === 'select') selectRef.current(s.focusIndex);
    else if (action !== 'back') s.setFocus(moveFocus(s.focusIndex, action, 3, games.length));
  }), [games.length]);

  return (
    <>
      <StackedHeadline lines={config.headlineLines} position={[LEFT_X, 460]} fontSize={120} lineHeight={128} />
      <Monogram height={150} color={colors.ink} position={[LEFT_X + 88, -110, 50]} />
      <Text font={fonts.regular} fontSize={38} color={colors.slate} anchorX="left" anchorY="middle" position={[LEFT_X, -270, 50]}>
        {config.subcopy}
      </Text>
      {games.map((g, i) => (
        <Tile key={g.id} game={g} index={i} focused={focusIndex === i} launching={launching === i}
          shakeAt={shakes[i] ?? -Infinity}
          onHover={(n) => appStore.getState().setFocus(n)} onSelect={select} />
      ))}
      <Ticker items={tickerItems()} y={TICKER_Y} />
    </>
  );
}
