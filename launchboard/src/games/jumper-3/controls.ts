export type Button = 'left' | 'right' | 'jump' | 'fire';
export class JumperControls {
  pointers = new Map<number, Button>();
  keys = new Set<string>();
  sprint = false;
  jumpQueued = false;
  press(id: number, button: Button) { this.pointers.set(id, button); if (button === 'jump') this.jumpQueued = true; }
  release(id: number) { this.pointers.delete(id); }
  held(button: Button) { return [...this.pointers.values()].includes(button); }
  clear() { this.pointers.clear(); this.keys.clear(); this.jumpQueued = false; }
}
