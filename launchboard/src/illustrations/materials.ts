import * as THREE from 'three';
import { colors, tubeColors } from '../brand';

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });

export const materials = {
  machine: std(colors.machineGrey),
  machineDark: std('#7C7C7E'),
  machineLight: std('#B8B8B8'),
  tie: std(tubeColors.tieOrange, { roughness: 0.85 }),
  tieEnd: std('#C97A2E', { roughness: 0.9 }),
  rail: std('#8E8E90', { roughness: 0.45, metalness: 0.35 }),
  glass: std('#E6E6E6', { roughness: 0.15, transparent: true, opacity: 0.38, depthWrite: false }),
  kilnCharge: std(tubeColors.kilnPink, { emissive: new THREE.Color(tubeColors.kilnPink), emissiveIntensity: 0.6 }),
  biochar: std(colors.biochar, { roughness: 0.95 }),
  land: std(tubeColors.carbonGreen, { roughness: 0.7 }),
  ocean: std('#8A8A8C', { roughness: 0.3, transparent: true, opacity: 0.85 }),
  signalLamp: std('#3A3A3C', { emissive: new THREE.Color(tubeColors.kilnPink), emissiveIntensity: 0 }),
};
