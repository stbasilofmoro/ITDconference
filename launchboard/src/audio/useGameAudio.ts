import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { scoreStore, type GameId } from '../leaderboard/scores';
import { boothAudio } from './engine';
import { changes, type Snapshot } from './events';
export { snapshot } from './events';

export function useGameAudio(game: GameId, read: () => Snapshot) {
  const previous = useRef<Snapshot | null>(null);
  useFrame(() => {
    const next = read(), formOpen = scoreStore.getState().open;
    boothAudio.duck(next.paused || formOpen || !['playing', 'running', 'clearing', 'settling'].includes(next.phase));
    if (!document.hidden && !formOpen) for (const cue of changes(previous.current, next)) boothAudio.play(cue, game);
    previous.current = next;
  });
}
