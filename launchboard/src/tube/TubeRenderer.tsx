import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { createPortal, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { colors } from '../brand';
import { appStore, useApp } from '../state/store';
import { displayLayout, phoneScene, phoneStore, usePhone } from '../phone/viewport';
import { CONTENT_H, CONTENT_W, barrel, insideTube, screenToTubeUv } from './geometry';
import { FullscreenPass, makePassMaterial } from './passes';
import { paramsFor, scanlineCount } from './presets';
import { evaluateFx, pruneEvents } from './timeline';
import { tubeBus } from './tubeBus';
import tubeVert from './shaders/tube.vert?raw';
import crtFrag from './shaders/crt.frag?raw';
import persistFrag from './shaders/persist.frag?raw';
import brightFrag from './shaders/bright.frag?raw';
import blurFrag from './shaders/blur.frag?raw';

const BLOOM_W = 480;
const BLOOM_H = 270;

function crtUniforms(): Record<string, THREE.IUniform> {
  const names = [
    'uTime', 'uCurvature', 'uCornerRadius', 'uChroma', 'uBloomAmt', 'uMaskStrength', 'uMaskType', 'uMaskPx',
    'uScanStrength', 'uScanBeamMin', 'uScanBeamMax', 'uScanlines', 'uRollBand', 'uFlicker', 'uVignette',
    'uGlass', 'uGrain', 'uWarmup', 'uDegauss', 'uStatic', 'uRoll', 'uFlash',
  ];
  const u: Record<string, THREE.IUniform> = { uImage: { value: null }, uBloom: { value: null } };
  for (const n of names) u[n] = { value: 0 };
  return u;
}

export function TubeRenderer({ children, bezel }: { children: ReactNode; bezel?: ReactNode }) {
  const size = useThree((s) => s.size);
  const phone = usePhone();
  const game = useApp((s) => s.activeGameId);
  const bounds = phone ? phoneScene(game) : { x: 0, y: 0, w: CONTENT_W, h: CONTENT_H };

  const contentScene = useMemo(() => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(colors.studioGrey);
    return s;
  }, []);
  const contentCamera = useMemo(() => {
    const c = new THREE.OrthographicCamera(bounds.x - bounds.w / 2, bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, bounds.y - bounds.h / 2, 1, 6000);
    // R3F must retain these cropped bounds instead of fitting the kiosk portal's size.
    (c as THREE.OrthographicCamera & { manual: boolean }).manual = true;
    c.position.set(0, 0, 3000);
    c.lookAt(0, 0, 0);
    c.updateProjectionMatrix();
    return c;
  }, [bounds.x, bounds.y, bounds.w, bounds.h]);

  const renderW = phone ? Math.min(1280, bounds.w) : CONTENT_W;
  const renderH = Math.round(renderW * bounds.h / bounds.w);
  const contentRT = useFBO(renderW, renderH, { samples: phone ? 0 : 4, depthBuffer: true });
  const persistA = useFBO(phone ? 1 : CONTENT_W, phone ? 1 : CONTENT_H, { depthBuffer: false });
  const persistB = useFBO(phone ? 1 : CONTENT_W, phone ? 1 : CONTENT_H, { depthBuffer: false });
  const bloomA = useFBO(BLOOM_W, BLOOM_H, { depthBuffer: false });
  const bloomB = useFBO(BLOOM_W, BLOOM_H, { depthBuffer: false });

  const pass = useMemo(() => new FullscreenPass(), []);
  const mats = useMemo(() => ({
    persist: makePassMaterial(persistFrag, { uCurrent: { value: null }, uPrev: { value: null }, uDecay: { value: 0 } }),
    bright: makePassMaterial(brightFrag, { uImage: { value: null }, uThreshold: { value: 0.6 } }),
    blur: makePassMaterial(blurFrag, { uImage: { value: null }, uDirection: { value: new THREE.Vector2() } }),
    crt: new THREE.ShaderMaterial({ vertexShader: tubeVert, fragmentShader: crtFrag, uniforms: crtUniforms() }),
    phone: new THREE.MeshBasicMaterial({ map: contentRT.texture, toneMapped: false }),
  }), []);

  useEffect(() => () => {
    pass.dispose();
    Object.values(mats).forEach((m) => m.dispose());
  }, [pass, mats]);

  const swap = useRef(false);

  useFrame((state, delta) => {
    const gl = state.gl;
    const now = performance.now();
    tubeBus.events = pruneEvents(tubeBus.events, now);
    const fx = evaluateFx(tubeBus.events, now);
    const p = paramsFor(appStore.getState().quality, phone ? { curvature: 0, cornerRadius: 0, chroma: 0, bloom: 0, persistence: 0, maskStrength: 0, scanStrength: 0, grain: 0, rollBand: 0, flicker: 0, glass: 0, vignette: 0 } : tubeBus.overrides);

    gl.setRenderTarget(contentRT);
    gl.clear();
    gl.render(contentScene, contentCamera);

    let image: THREE.Texture = contentRT.texture;
    if (p.persistence > 0) {
      const read = swap.current ? persistB : persistA;
      const write = swap.current ? persistA : persistB;
      mats.persist.uniforms.uCurrent.value = contentRT.texture;
      mats.persist.uniforms.uPrev.value = read.texture;
      mats.persist.uniforms.uDecay.value = p.persistence;
      pass.render(gl, mats.persist, write);
      image = write.texture;
      swap.current = !swap.current;
    }

    if (p.bloom > 0) {
      mats.bright.uniforms.uImage.value = image;
      mats.bright.uniforms.uThreshold.value = p.bloomThreshold;
      pass.render(gl, mats.bright, bloomA);
      mats.blur.uniforms.uImage.value = bloomA.texture;
      (mats.blur.uniforms.uDirection.value as THREE.Vector2).set(1 / BLOOM_W, 0);
      pass.render(gl, mats.blur, bloomB);
      mats.blur.uniforms.uImage.value = bloomB.texture;
      (mats.blur.uniforms.uDirection.value as THREE.Vector2).set(0, 1 / BLOOM_H);
      pass.render(gl, mats.blur, bloomA);
    }

    const layout = displayLayout(state.size.width, state.size.height);
    const u = mats.crt.uniforms;
    u.uImage.value = image;
    u.uBloom.value = bloomA.texture;
    u.uTime.value = state.clock.elapsedTime;
    u.uCurvature.value = p.curvature;
    u.uCornerRadius.value = p.cornerRadius;
    u.uChroma.value = p.chroma;
    u.uBloomAmt.value = p.bloom;
    u.uMaskStrength.value = p.maskStrength;
    u.uMaskType.value = p.maskType;
    u.uMaskPx.value = p.maskPx;
    u.uScanStrength.value = p.scanStrength;
    u.uScanBeamMin.value = p.scanBeamMin;
    u.uScanBeamMax.value = p.scanBeamMax;
    u.uScanlines.value = scanlineCount(layout.tubeH * state.viewport.dpr);
    u.uRollBand.value = p.rollBand;
    u.uFlicker.value = p.flicker;
    u.uVignette.value = p.vignette;
    u.uGlass.value = p.glass;
    u.uGrain.value = p.grain;
    u.uWarmup.value = fx.warmup;
    u.uDegauss.value = fx.degauss;
    u.uStatic.value = fx.staticAmt;
    u.uRoll.value = fx.roll;
    u.uFlash.value = fx.flash;

    gl.setRenderTarget(null);
    gl.render(state.scene, state.camera);

    if (delta > 0) tubeBus.fps = tubeBus.fps * 0.9 + (1 / delta) * 0.1;
  }, 1);

  const compute = useCallback((event: { offsetX: number; offsetY: number }, state: RootState, previous?: RootState) => {
    const root = previous ?? state;
    const layout = displayLayout(root.size.width, root.size.height);
    const p = paramsFor(appStore.getState().quality, phoneStore.getState().enabled ? { curvature: 0, cornerRadius: 0 } : tubeBus.overrides);
    const tubeUv = screenToTubeUv(event.offsetX, event.offsetY, layout);
    if (insideTube(tubeUv, p.cornerRadius)) {
      const c = barrel(tubeUv, p.curvature);
      state.pointer.set(c.u * 2 - 1, c.v * 2 - 1);
    } else {
      state.pointer.set(99, 99);
    }
    state.raycaster.setFromCamera(state.pointer, state.camera);
  }, []);

  const layout = displayLayout(size.width, size.height);
  const cx = layout.tubeX + layout.tubeW / 2 - size.width / 2;
  const cy = size.height / 2 - (layout.tubeY + layout.tubeH / 2);

  return (
    <>
      {createPortal(children, contentScene, {
        camera: contentCamera,
        size: { width: CONTENT_W, height: CONTENT_H, top: 0, left: 0 },
        events: { compute, priority: 1 },
      })}
      <mesh position={[cx, cy, 0]} material={phone ? mats.phone : mats.crt}>
        <planeGeometry args={[layout.tubeW, layout.tubeH]} />
      </mesh>
      {bezel}
    </>
  );
}
