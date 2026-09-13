import { useState, type ComponentType } from 'react';
import { Text } from '@react-three/drei';
import { fonts, colors } from '../brand';
import { Iso, type IllustrationProps } from '../illustrations/Iso';
import { StudioRig } from '../illustrations/StudioRig';
import { TieStack } from '../illustrations/TieStack';
import { Train } from '../illustrations/Train';

const ITEMS: { name: string; C: ComponentType<IllustrationProps>; scale: number }[] = [
  { name: 'TieStack', C: TieStack, scale: 22 },
  { name: 'Train', C: Train, scale: 9 },
];

export function Gallery() {
  const [active, setActive] = useState(-1);
  return (
    <>
      <StudioRig />
      {ITEMS.map(({ name, C, scale }, i) => {
        const x = -640 + (i % 3) * 640;
        const y = 270 - Math.floor(i / 3) * 540;
        return (
          <group key={name} position={[x, y, 0]} onPointerOver={() => setActive(i)} onPointerOut={() => setActive(-1)}>
            <mesh visible={false}><planeGeometry args={[600, 500]} /></mesh>
            <Iso scale={scale} position={[0, 0, 0]}><C active={active === i} /></Iso>
            <Text font={fonts.medium} fontSize={34} color={colors.ink} position={[0, -200, 100]}>{name}</Text>
          </group>
        );
      })}
    </>
  );
}
