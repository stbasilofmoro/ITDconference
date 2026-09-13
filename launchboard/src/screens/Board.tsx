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
  const launchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(launchTimer.current), []);

  const select = useCallback((i: number) => {
    const game = games[i];
    appStore.getState().setFocus(i);
    if (launching !== null) return;
    if (game.status !== 'playable') {
      setShakes((s) => ({ ...s, [i]: performance.now() }));
      return;
    }
    setLaunching(i);
    tubeBus.pulse('channel');
    launchTimer.current = setTimeout(() => {
      appStore.getState().launch(game.id);
      setLaunching(null);
    }, LAUNCH_DELAY_MS);
  }, [games, launching]);

  useEffect(() => inputBus.subscribe((action) => {
    const s = appStore.getState();
    if (s.screen !== 'board') return;
    if (action === 'select') select(s.focusIndex);
    else if (action !== 'back') s.setFocus(moveFocus(s.focusIndex, action, 3, games.length));
  }), [select, games.length]);

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
