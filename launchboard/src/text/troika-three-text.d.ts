// troika-three-text ships no "types" field pointing at its dist/types declarations, so
// TypeScript can't resolve them through the package's declared "main"/"module" entries.
// Ambient-declare just the bit we use (drei's own Text component imports the same function
// internally, so this mirrors an already-trusted runtime dependency).
declare module 'troika-three-text' {
  export function preloadFont(
    options: { font: string; characters?: string | string[]; sdfGlyphSize?: number },
    callback: () => void,
  ): void;
}
