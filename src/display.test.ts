import { expect, test, describe } from "bun:test";
import { Universe } from "./document";
import { Display } from "./display";

describe("Display", () => {
  test("several points and segments", () => {
    let u = new Universe();
    u.addPointInLineSegment([10, 20]);
    u.addPointInLineSegment([20, 30]);

    let d = new Display();
    expect(() => {
      u.display(d, d.displayTransform());
    }).not.toThrow();
  });
});
