import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { colors, fonts } from '../brand';
import { config } from '../config';
import { Iso } from '../illustrations/Iso';
import { CrossingSignal } from '../illustrations/CrossingSignal';
import { Kiln } from '../illustrations/Kiln';
import { Shredder } from '../illustrations/Shredder';
import { TieStack } from '../illustrations/TieStack';
import { Track, Train } from '../illustrations/Train';
import { Monogram } from '../ui/Monogram';
import { StackedHeadline } from '../ui/StackedHeadline';
import { LEFT_X } from '../ui/layout';

function Yard() {
  const drift = useRef<Group>(null!);
  const train = useRef<Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    drift.current.position.set(260 + Math.sin(t * 0.05) * 60, -40 + Math.cos(t * 0.04) * 30, 0);
    train.current.position.x = ((t * 3) % 80) - 40;
  });
  return (
    <group ref={drift}>
      <Iso scale={17}>
        <Track length={70} />
        <group ref={train} position={[0, 0.3, 0]}><Train active /></group>
        <group position={[-10, 0, -15]}><Shredder active /></group>
        <group position={[12, 0, -15]}><Kiln active /></group>
        <group position={[-3, 0, 5]}><CrossingSignal active /></group>
        <group position={[18, 0, 9]}><TieStack /></group>
      </Iso>
    </group>
  );
}

function BlinkingPrompt() {
  const ref = useRef<Group>(null!);
  useFrame(({ clock }) => { ref.current.visible = Math.floor(clock.elapsedTime * 1.2) % 2 === 0; });
  return (
    <group ref={ref}>
      <Text font={fonts.semibold} fontSize={46} color={colors.ink} anchorX="left" anchorY="middle"
        position={[LEFT_X, -250, 200]} letterSpacing={0.14}>
        TOUCH TO PLAY
      </Text>
    </group>
  );
}

export function Attract() {
  return (
    <>
      <Yard />
      <StackedHeadline lines={config.headlineLines} position={[LEFT_X, 420]} fontSize={140} lineHeight={150} />
      <BlinkingPrompt />
      <Monogram height={56} color={colors.ink} position={[LEFT_X + 33, -430, 200]} />
      <Text font={fonts.medium} fontSize={28} color={colors.slate} anchorX="left" anchorY="middle" position={[LEFT_X + 90, -430, 200]}>
        International Tie Disposal
      </Text>
    </>
  );
}
