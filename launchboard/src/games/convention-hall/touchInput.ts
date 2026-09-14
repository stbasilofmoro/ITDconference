// Each thumb owns its gesture until release/cancel. Other fingers cannot steal
// the joystick or reset the look anchor, even when they cross a control.
export class HallTouchInput {
  move: { id: number; x: number; y: number; radius: number } | null = null;
  look: { id: number; x: number; y: number } | null = null;
  forward = 0;
  strafe = 0;
  knobX = 0;
  knobY = 0;

  beginMove(id: number, x: number, y: number, radius: number) {
    if (this.move || this.look?.id === id) return false;
    this.move = { id, x, y, radius }; return true;
  }
  beginLook(id: number, x: number, y: number) {
    if (this.look || this.move?.id === id) return false;
    this.look = { id, x, y }; return true;
  }
  update(id: number, x: number, y: number): { yaw: number; pitch: number } {
    if (this.move?.id === id) {
      const dx = (x - this.move.x) / this.move.radius, dy = (y - this.move.y) / this.move.radius;
      const length = Math.hypot(dx, dy), divisor = Math.max(1, length);
      this.knobX = dx / divisor; this.knobY = dy / divisor;
      const speed = Math.max(0, (Math.min(1, length) - 0.12) / 0.88);
      this.strafe = length ? dx / length * speed : 0;
      this.forward = length ? -dy / length * speed : 0;
    }
    if (this.look?.id === id) {
      const yaw = (x - this.look.x) * 0.006, pitch = (this.look.y - y) * 0.005;
      this.look.x = x; this.look.y = y; return { yaw, pitch };
    }
    return { yaw: 0, pitch: 0 };
  }
  end(id: number) {
    if (this.move?.id === id) { this.move = null; this.forward = this.strafe = this.knobX = this.knobY = 0; }
    if (this.look?.id === id) this.look = null;
  }
  reset() { this.move = this.look = null; this.forward = this.strafe = this.knobX = this.knobY = 0; }
}
