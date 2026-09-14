// Original eight-bar loop: extended chords, a sparse melody, and swung eighths.
export const BPM = 76;
export const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [50, 57, 60, 64], [43, 53, 57, 59], [48, 55, 59, 62], [45, 52, 55, 59], [50, 53, 57, 64], [43, 53, 57, 62]];
const MELODY = [76, 79, 74, 72, 71, 76, 74, 71];
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export function musicStep(step: number) {
  const bar = Math.floor(step / 8) % CHORDS.length, eighth = step % 8;
  return { chord: eighth === 0 ? CHORDS[bar] : [], bass: eighth === 0 || eighth === 4 ? CHORDS[bar][0] - 12 : null,
    melody: eighth === 3 || eighth === 7 && bar % 2 === 0 ? MELODY[(bar + (eighth === 7 ? 1 : 0)) % 8] : null,
    kick: eighth === 0 || eighth === 4, brush: eighth === 2 || eighth === 6, hat: eighth % 2 === 1,
    duration: 60 / BPM / 2 * (eighth % 2 === 0 ? 1.12 : 0.88) };
}
