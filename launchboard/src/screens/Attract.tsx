import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { colors, fonts } from '../brand';
import { ATTRACT_PRIZE, config } from '../config';
import { SyrupBottle } from '../games/beaver-crossing/Models';
import { Iso } from '../illustrations/Iso';
import { CrossingSignal } from '../illustrations/CrossingSignal';
import { RotaryKilnDisplay } from '../illustrations/RotaryKilnDisplay';
import { Shredder } from '../illustrations/Shredder';
import { TieStack } from '../illustrations/TieStack';
import { Track, Train } from '../illustrations/Train';
import { Monogram } from '../ui/Monogram';
import { StackedHeadline } from '../ui/StackedHeadline';
import { LEFT_X } from '../ui/layout';

function Yard() {
  const drift = useRef<Group>(null!);
  const train = useRef<Group>(null!);
  const travel = useRef(0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    drift.current.position.set(260 + Math.sin(t * 0.05) * 60, -40 + Math.cos(t * 0.04) * 30, 0);
    travel.current = (travel.current + Math.min(dt, 0.1) * 7.5) % 180;
    train.current.position.x = travel.current - 90;
  });
  return (
    <group ref={drift}>
      <Iso scale={17}>
        {/* Steeper rails cross both vertical edges, keeping the prize copy clear.
            The whole train clears the screen before wrapping to the top. */}
        <group rotation={[0, -Math.PI / 6, 0]}>
          <Track length={210} />
          <group ref={train} position={[-90, 0.3, 0]}><Train /></group>
        </group>
        <group position={[-10, 0, -15]}><Shredder active /></group>
        <group position={[4, 0, -20]} rotation={[0, Math.PI / 2, 0]} scale={2.5}><RotaryKilnDisplay /></group>
        <group position={[-3, 0, 5]}><CrossingSignal active /></group>
        <group position={[30, 0, 9]}><TieStack /></group>
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
        position={[LEFT_X, -295, 200]} letterSpacing={0.14}>
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
      <group position={[LEFT_X + 38, -221, 260]} rotation={[0.08, -0.2, -0.1]} scale={85}>
        <SyrupBottle />
      </group>
      <Text font={fonts.semibold} fontSize={37} color={colors.ink} anchorX="left" anchorY="top" maxWidth={660} position={[LEFT_X + 110, -85, 200]}>
        {ATTRACT_PRIZE.headline}
      </Text>
      <Text font={fonts.medium} fontSize={35} lineHeight={1.15} color={colors.slate} anchorX="left" anchorY="top" maxWidth={660} position={[LEFT_X + 110, -140, 200]}>
        {ATTRACT_PRIZE.reward}
      </Text>
      <BlinkingPrompt />
      <Monogram height={56} color={colors.ink} position={[LEFT_X + 33, -430, 200]} />
      <Text font={fonts.medium} fontSize={28} color={colors.slate} anchorX="left" anchorY="middle" position={[LEFT_X + 90, -430, 200]}>
        International Tie Disposal
      </Text>
    </>
  );
}
