import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { appStore } from '../state/store';
import { pickInGamePreset, pickPreset } from './presets';
import { initPerfSampler, recordFrame, samplerDone } from './perfSampler';

/**
 * Picks a preset from the first few seconds after boot, then keeps watching while games run:
 * games can be much heavier than the launchboard, so a machine that coped with the board can
 * still step pro -> standard once a game proves too slow.
 */
export function PerfAutoSelect() {
  const sampler = useRef(initPerfSampler());
  const stage = useRef<'initial' | 'in-game' | 'done'>('initial');
  useFrame((_, dt) => {
    if (stage.current === 'done') return;
    const s = appStore.getState();
    if (s.qualityOverride !== null || s.screen === 'boot') return;
    if (stage.current === 'in-game' && (s.screen !== 'game' || s.quality !== 'pro')) {
      sampler.current = initPerfSampler();
      return;
    }
    recordFrame(sampler.current, dt);
    if (!samplerDone(sampler.current)) return;
    const samples = sampler.current.samples;
    sampler.current = initPerfSampler();
    if (stage.current === 'initial') {
      stage.current = 'in-game';
      s.setQuality(pickPreset(samples, s.quality));
    } else {
      const next = pickInGamePreset(samples, s.quality);
      if (next !== s.quality) { stage.current = 'done'; s.setQuality(next); }
    }
  });
  return null;
}
