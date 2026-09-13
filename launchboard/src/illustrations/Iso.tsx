import type { ReactNode } from 'react';

/** Classic isometric view: yaw −45°, then pitch 35.26° toward the camera. */
export const ISO_ROTATION: [number, number, number] = [Math.atan(1 / Math.SQRT2), -Math.PI / 4, 0];

export type IllustrationProps = { active?: boolean };

export function Iso({ scale, position = [0, 0, 0], children }: { scale: number; position?: [number, number, number]; children: ReactNode }) {
  return (
    <group position={position} rotation={ISO_ROTATION} scale={[scale, scale, scale]}>
      {children}
    </group>
  );
}
