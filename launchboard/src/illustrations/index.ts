import type { ComponentType } from 'react';
import type { IllustrationId } from '../games/types';
import type { IllustrationProps } from './Iso';
import { TieStack } from './TieStack';
import { Train } from './Train';
import { Shredder } from './Shredder';
import { Kiln } from './Kiln';
import { CrossingSignal } from './CrossingSignal';
import { Globe } from './Globe';

export const ILLUSTRATIONS: Record<IllustrationId, { C: ComponentType<IllustrationProps>; scale: number; lift: number }> = {
  tieStack: { C: TieStack, scale: 17, lift: -20 },
  train: { C: Train, scale: 9, lift: -20 },
  shredder: { C: Shredder, scale: 15, lift: -80 },
  kiln: { C: Kiln, scale: 13, lift: -85 },
  crossing: { C: CrossingSignal, scale: 15, lift: -80 },
  globe: { C: Globe, scale: 22, lift: -60 },
};
