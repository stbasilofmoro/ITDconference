import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { appStore } from '../state/store';
import { pickPreset } from './presets';

const SAMPLE_SECONDS = 3;

export function PerfAutoSelect() {
  const samples = useRef<number[]>([]);
  const elapsed = useRef(0);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current) return;
    const s = appStore.getState();
    if (s.qualityOverride !== null || s.screen === 'boot') return;
    samples.current.push(dt * 1000);
    elapsed.current += dt;
    if (elapsed.current >= SAMPLE_SECONDS) {
      done.current = true;
      s.setQuality(pickPreset(samples.current, s.quality));
    }
  });
  return null;
}
