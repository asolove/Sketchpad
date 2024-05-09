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

describe("DisplayTransform", () => {
  test("transform works with different origin and zoom", () => {
    let d = new DisplayFile();
    d.cx = 0;
    d.cy = 0;
    d.zoom = 1;

    let dt = d.displayTransform();
    expect(dt([0, 0])).toMatchObject([512, 512]);
    expect(dt([512, 512])).toMatchObject([1024, 0]);
    expect(dt([-512, -512])).toMatchObject([0, 1024]);

    d.zoom = 2;
    dt = d.displayTransform();
    expect(dt([0, 0])).toMatchObject([512, 512]);
    expect(dt([256, 256])).toMatchObject([1024, 0]);
    expect(dt([-256, -256])).toMatchObject([0, 1024]);

    d.cx = 512;
    d.cy = 512;
    dt = d.displayTransform();
    expect(dt([512, 512])).toMatchObject([512, 512]);
    expect(dt([256, 256])).toMatchObject([0, 1024]);
  });
});
