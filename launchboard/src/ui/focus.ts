export type Direction = 'up' | 'down' | 'left' | 'right';

export function moveFocus(index: number, dir: Direction, cols = 3, count = 6): number {
  switch (dir) {
    case 'right': return (index + 1) % count;
    case 'left': return (index - 1 + count) % count;
    case 'down': return index + cols < count ? index + cols : index;
    case 'up': return index - cols >= 0 ? index - cols : index;
  }
}
