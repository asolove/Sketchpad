import { expect, test, describe } from "bun:test";
import { collectChickens } from "./ring";
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

    let partsHen = u.currentPicture.parts;
    let parts = collectChickens(partsHen);
    expect(parts.length).toBe(3);
  });

  test("create second segment", () => {
    let u = new Universe();
    let p1 = u.addPointInLineSegment([10, 20]);
    let p2 = u.addPointInLineSegment([20, 30]);

    let partsHen = u.currentPicture.parts;
    let parts = collectChickens(partsHen);
    expect(parts.length).toBe(5);
  });
});
