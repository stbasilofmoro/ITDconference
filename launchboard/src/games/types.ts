import type { ComponentType } from 'react';
import type { InputBus } from '../ui/inputBus';
import type { QualityPreset } from '../state/store';

export type Accent = 'orange' | 'pink' | 'green';
export type IllustrationId = 'tieStack' | 'train' | 'shredder' | 'kiln' | 'crossing' | 'globe' | 'beaver' | 'materials' | 'rotaryKiln' | 'badgeScanner';
export type PulseKind = 'boot' | 'channel' | 'static' | 'flash' | 'roll';

export type GameContext = {
  exit(): void;
  input: InputBus;
  tube: { pulse(kind: PulseKind): void };
  quality: QualityPreset;
};

export type GameComponent = ComponentType<{ ctx: GameContext }>;

export type GameDefinition = {
  id: string;
  title: string;
  accent: Accent;
  illustration: IllustrationId;
  status: 'playable' | 'coming-soon';
  load?: () => Promise<{ default: GameComponent }>;
};
