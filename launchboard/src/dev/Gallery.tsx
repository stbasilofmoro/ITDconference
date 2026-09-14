import { useState } from 'react';
import { Text } from '@react-three/drei';
import { fonts, colors } from '../brand';
import { Iso } from '../illustrations/Iso';
import { StudioRig } from '../illustrations/StudioRig';
import { ILLUSTRATIONS } from '../illustrations/index';

const ITEMS = Object.entries(ILLUSTRATIONS).map(([name, v]) => ({ name, C: v.C, scale: v.scale, lift: v.lift }));

export function Gallery() {
  const [active, setActive] = useState(-1);
  return (
    <>
      <StudioRig />
      {ITEMS.map(({ name, C, scale, lift }, i) => {
        const x = -620 + (i % 3) * 620;
        const y = 350 - Math.floor(i / 3) * 350;
        return (
          <group key={name} position={[x, y, 0]} onPointerOver={() => setActive(i)} onPointerOut={() => setActive(-1)}>
            <mesh visible={false}><planeGeometry args={[590, 330]} /></mesh>
            <Iso scale={scale * 0.65} position={[0, lift * 0.65, 0]}><C active={active === -1 || active === i} /></Iso>
            <Text font={fonts.medium} fontSize={28} color={colors.ink} position={[0, -132, 150]}>{name}</Text>
          </group>
        );
      })}
    </>
  );
}
