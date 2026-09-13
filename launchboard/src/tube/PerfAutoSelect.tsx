import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { appStore } from '../state/store';
import { pickPreset } from './presets';
import { initPerfSampler, recordFrame, samplerDone } from './perfSampler';

export function PerfAutoSelect() {
  const sampler = useRef(initPerfSampler());
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current) return;
    const s = appStore.getState();
    if (s.qualityOverride !== null || s.screen === 'boot') return;
    recordFrame(sampler.current, dt);
    if (samplerDone(sampler.current)) {
      done.current = true;
      s.setQuality(pickPreset(sampler.current.samples, s.quality));
    }
  });
  return null;
}
