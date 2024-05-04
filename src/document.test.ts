import { expect, test, describe } from "bun:test";
import { addChicken, createHen, removeChicken } from "./ring";
import { Universe } from "./document";

describe("Document", () => {
  test("create point", () => {
    let u = new Universe();
    let p = u.addPoint([10, 20]);

    expect(u.currentPicture.parts.next.self).toBe(p);
    expect(p.picture.prev.self).toBe(u.currentPicture);
  });

  test("create line segment", () => {
    let u = new Universe();
    let p = u.addPointInLineSegment([10, 20]);
  });
});
