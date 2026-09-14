import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Beaver as BeaverModel } from '../games/beaver-crossing/Models';
import type { IllustrationProps } from './Iso';

export function Beaver({ active }: IllustrationProps) {
  const group = useRef<Group>(null!);
  useFrame(({ clock }) => { group.current.position.y = active ? Math.abs(Math.sin(clock.elapsedTime * 2.5)) * 0.12 : 0; });
  return <group ref={group}><BeaverModel celebrate={active} /></group>;
}
