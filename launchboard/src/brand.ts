import { asset } from './asset';

export const colors = {
  studioGrey: '#C4C4C4',
  lightGrey: '#D9D9D9',
  ink: '#1C1B1F',
  graphite: '#333333',
  slate: '#3B3942',
  muted: '#787582',
  machineGrey: '#9A9A9A',
  tieOrange: '#ED9833',
  kilnPink: '#F861D6',
  kilnPinkHover: '#EB5FCB',
  carbonGreen: '#00C472',
  biochar: '#2E2A36',
  white: '#FFFFFF',
} as const;

/** Phosphor-safe accents for use inside the tube (brand guide, CRT section). */
export const tubeColors = {
  tieOrange: '#E89A45',
  kilnPink: '#EE6BD2',
  carbonGreen: '#18BE78',
} as const;

export const fonts = {
  regular: asset('fonts/Barlow-Regular.ttf'),
  medium: asset('fonts/Barlow-Medium.ttf'),
  semibold: asset('fonts/Barlow-SemiBold.ttf'),
} as const;

export const MONOGRAM_VIEWBOX = { w: 287, h: 246 } as const;
export const MONOGRAM_STROKE = 10;

/** Stroke centerlines in SVG coordinates (y down). Measured from the tiedisposal.com logo. */
export const MONOGRAM_PATHS: string[] = [
  'M5 78V246M25 78V246M45 78V246',
  'M0 5H225A57 57 0 0 1 282 62V184A57 57 0 0 1 225 241H164V78',
  'M0 25H225A38 38 0 0 1 263 63V183A38 38 0 0 1 225 221H183V78',
  'M0 45H84V246',
  'M104 25V246',
  'M124 246V45H225A18 18 0 0 1 243 63V183A18 18 0 0 1 225 201H203V78',
];
