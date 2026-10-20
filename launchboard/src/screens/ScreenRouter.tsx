import type { ReactNode } from 'react';
import type { GameDefinition } from '../games/types';
import { useApp } from '../state/store';
import { Attract } from './Attract';
import { Board } from './Board';
import { Boot } from './Boot';

export function ScreenRouter({ games, gameHost = null, onClaim, claimFocused }: {
  games: GameDefinition[]; gameHost?: ReactNode; onClaim(): void; claimFocused: boolean;
}) {
  const screen = useApp((s) => s.screen);
  switch (screen) {
    case 'boot': return <Boot />;
    case 'attract': return <Attract />;
    case 'board': return <Board games={games} onClaim={onClaim} claimFocused={claimFocused} />;
    case 'game': return <>{gameHost}</>;
  }
}
