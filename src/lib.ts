export const clamp = (min: number, val: number, max: number): number => {
  return Math.max(min, Math.min(val, max));
};

export const sum = (a: number, b: number): number => a + b;

export type Position = [number, number];

// Find the angle between two coordinates.
// Throughout this program, 0 is pointing right and positive numbers proceed counter-clockwise.
export function angle([x1, y1]: Position, [x2, y2]: Position): number {
  let dx = x2 - x1;
  let dy = y2 - y1;

  // atan only gives values in the range (-PI/2, PI/2)
  // but we want directionality, so let's promote those
  // to the range [0, 2*PI]
  let collapsedAngle = Math.atan(dy / dx);
  let directionalAngle = collapsedAngle + (dx < 0 ? Math.PI : 0);
  return directionalAngle + (directionalAngle < 0 ? Math.PI * 2 : 0);
}

export function distance([x1, y1]: Position, [x2, y2]: Position): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
