export const clamp = (min: number, val: number, max: number): number => {
  return Math.max(min, Math.min(val, max));
};

export const sum = (a: number, b: number): number => a + b;
