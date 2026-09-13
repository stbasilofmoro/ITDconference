import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GameComponent, GameContext, GameDefinition } from '../games/types';
import { appStore, useApp } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { inputBus } from '../ui/inputBus';
import { SignalLost } from './SignalLost';

export const SIGNAL_LOST_MS = 3000;

class GameBoundary extends Component<{ onError(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.warn('Game crashed:', error);
    this.props.onError();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function GameHost({ games }: { games: GameDefinition[] }) {
  const activeId = useApp((s) => s.activeGameId);
  const quality = useApp((s) => s.quality);
  const game = games.find((g) => g.id === activeId);
  const [Game, setGame] = useState<GameComponent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setGame(null);
    setFailed(false);
    if (!game?.load) { setFailed(true); return; }
    game.load()
      .then((m) => { if (alive) setGame(() => m.default); })
      .catch((err) => { console.warn('Game failed to load:', err); if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [game]);

  useEffect(() => {
    if (!failed) return;
    tubeBus.pulse('static');
    const t = setTimeout(() => appStore.getState().exitGame(), SIGNAL_LOST_MS);
    return () => clearTimeout(t);
  }, [failed]);

  const ctx = useMemo<GameContext>(() => ({
    exit: () => { tubeBus.pulse('channel'); appStore.getState().exitGame(); },
    input: inputBus,
    tube: { pulse: (kind) => tubeBus.pulse(kind) },
    quality,
  }), [quality]);

  if (failed) return <SignalLost />;
  if (!Game) return null;
  return <GameBoundary onError={() => setFailed(true)}><Game ctx={ctx} /></GameBoundary>;
}
