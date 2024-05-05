import { expect, test, describe } from "bun:test";
import { Universe } from "./document";
import { DisplayFile } from "./display";

describe("DisplayFile", () => {
  test("several points and segments", () => {
    let u = new Universe();
    u.addPointInLineSegment([10, 20]);
    u.addPointInLineSegment([20, 30]);

    let d = new DisplayFile();
    expect(() => {
      u.display(d, d.displayTransform());
    }).not.toThrow();
  });
});
