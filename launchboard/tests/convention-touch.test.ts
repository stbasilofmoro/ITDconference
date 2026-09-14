import { describe, expect, it } from 'vitest';
import { HallTouchInput } from '../src/games/convention-hall/touchInput';

describe('independent tablet thumbs', () => {
  it('has a dead zone, proportional speed and a bounded diagonal joystick', () => {
    const input = new HallTouchInput(); input.beginMove(1, 100, 100, 60);
    input.update(1, 103, 97); expect(input.forward).toBe(0); expect(input.strafe).toBe(0);
    input.update(1, 100, 70); expect(input.forward).toBeCloseTo((0.5 - 0.12) / 0.88); expect(input.strafe).toBe(0);
    input.update(1, 300, -100); expect(Math.hypot(input.forward, input.strafe)).toBeCloseTo(1); expect(Math.hypot(input.knobX, input.knobY)).toBeCloseTo(1);
  });
  it('lets movement and look happen together without stealing pointer ownership', () => {
    const input = new HallTouchInput(); input.beginMove(8, 0, 0, 60); input.beginLook(9, 400, 300);
    expect(input.beginMove(10, 0, 0, 60)).toBe(false); expect(input.beginLook(10, 0, 0)).toBe(false);
    input.update(8, 0, -60); expect(input.forward).toBe(1);
    expect(input.update(9, 420, 290)).toEqual({ yaw: 0.12, pitch: 0.05 }); expect(input.forward).toBe(1);
    expect(input.update(10, 100, 100)).toEqual({ yaw: 0, pitch: 0 }); expect(input.look?.x).toBe(420);
  });
  it('ends only the released finger, including after it crosses another control', () => {
    const input = new HallTouchInput(); input.beginMove(1, 0, 0, 60); input.beginLook(2, 500, 200);
    input.update(1, 0, -60); input.end(2); expect(input.forward).toBe(1); expect(input.look).toBeNull();
    input.beginLook(3, 500, 200); input.end(1); expect(input.forward).toBe(0); expect(input.strafe).toBe(0);
    expect(input.update(3, 490, 220)).toEqual({ yaw: -0.06, pitch: -0.1 });
    input.end(2); expect(input.look?.id).toBe(3);
  });
  it('drops all gesture state on pause, blur, resize, or leaving the game', () => {
    const input = new HallTouchInput(); input.beginMove(5, 10, 10, 60); input.update(5, 10, -50); input.beginLook(6, 200, 200); input.reset();
    expect(input).toMatchObject({ move: null, look: null, forward: 0, strafe: 0, knobX: 0, knobY: 0 });
    expect(input.update(5, 30, -60)).toEqual({ yaw: 0, pitch: 0 }); expect(input.forward).toBe(0);
    expect(input.beginMove(7, 0, 0, 60)).toBe(true);
  });
});
