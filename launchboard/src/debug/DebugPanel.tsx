import { useEffect, useState, type CSSProperties } from 'react';
import type { PulseKind } from '../games/types';
import { saveStoredOverride } from '../state/quality';
import { appStore, useApp } from '../state/store';
import { PARAM_RANGES, paramsFor, type TubeParams } from '../tube/presets';
import { tubeBus } from '../tube/tubeBus';

const PULSES: PulseKind[] = ['boot', 'channel', 'static', 'flash', 'roll'];
const KEYS = Object.keys(PARAM_RANGES) as (keyof TubeParams)[];

const panel: CSSProperties = {
  position: 'fixed', top: 12, right: 12, width: 300, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
  background: 'rgba(20,20,22,.92)', color: '#D9D9D9', font: '12px/1.4 Barlow, system-ui, sans-serif',
  padding: 12, borderRadius: 8, zIndex: 20,
};

export function DebugPanel() {
  const quality = useApp((s) => s.quality);
  const override = useApp((s) => s.qualityOverride);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const values = paramsFor(quality, tubeBus.overrides);

  return (
    <div style={panel} data-testid="debug-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Tube</strong>
        <span>{tubeBus.fps.toFixed(0)} fps · {quality}{override ? ' (forced)' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {PULSES.map((p) => <button key={p} onClick={() => tubeBus.pulse(p)}>{p}</button>)}
        <button onClick={() => { appStore.getState().cycleQualityOverride(); saveStoredOverride(appStore.getState().qualityOverride); }}>Preset</button>
        <button onClick={() => { tubeBus.overrides = {}; tick((n) => n + 1); }}>Reset</button>
      </div>
      {KEYS.map((key) => {
        const r = PARAM_RANGES[key];
        return (
          <label key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 44px', alignItems: 'center', gap: 6 }}>
            <span>{key}</span>
            <input type="range" data-param={key} min={r.min} max={r.max} step={r.step} value={values[key]}
              onChange={(e) => { tubeBus.overrides = { ...tubeBus.overrides, [key]: Number(e.target.value) }; tick((n) => n + 1); }} />
            <span style={{ textAlign: 'right' }}>{values[key]}</span>
          </label>
        );
      })}
    </div>
  );
}
