import { expect, test, describe } from "bun:test";
import { angle } from "./lib";

describe("angle", () => {
  test("works for trig identities", () => {
    expect(angle([0, 0], [100, 0])).toBe(0);
    expect(angle([0, 0], [0, 10])).toBe(Math.PI / 2);
    expect(angle([0, 0], [-10, 0])).toBe(Math.PI);
    expect(angle([0, 0], [0, -10])).toBe((3 * Math.PI) / 2);

    expect(angle([0, 0], [1, 1])).toBe(Math.PI / 4);
    expect(angle([1, 1], [0, 0])).toBe((5 * Math.PI) / 4);
  });
});
