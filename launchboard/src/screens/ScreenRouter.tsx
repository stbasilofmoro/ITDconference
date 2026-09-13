import type { ReactNode } from 'react';
import type { GameDefinition } from '../games/types';
import { useApp } from '../state/store';
import { Attract } from './Attract';
import { Board } from './Board';
import { Boot } from './Boot';

export function ScreenRouter({ games, gameHost = null }: { games: GameDefinition[]; gameHost?: ReactNode }) {
  const screen = useApp((s) => s.screen);
  switch (screen) {
    case 'boot': return <Boot />;
    case 'attract': return <Attract />;
    case 'board': return <Board games={games} />;
    case 'game': return <>{gameHost}</>;
  }
}
