import { expect, test, describe } from "bun:test";
import { addChicken, createHen, removeChicken } from "./ring";

describe("Ring", () => {
  test("createHen and addChicken", () => {
    let hen = createHen(0);

    addChicken(hen, 1);
    addChicken(hen, 2);
    addChicken(hen, 3);

    let chicken = hen.next;
    expect(chicken.self).toBe(1);

    chicken = chicken.next;
    expect(chicken.self).toBe(2);

    chicken = chicken.next;
    expect(chicken.self).toBe(3);

    let next = chicken.next;
    expect(next).toBe(hen);
  });

  test("removeChicken", () => {
    let hen = createHen(0);

    addChicken(hen, 1);
    let child2 = addChicken(hen, 2);
    addChicken(hen, 3);

    removeChicken(child2);

    let chicken = hen.next;
    expect(chicken.self).toBe(1);

    chicken = chicken.next;
    expect(chicken.self).toBe(3);

    let next = chicken.next;
    expect(next).toBe(hen);
  });

  test("remove only child", () => {
    let hen = createHen(0);
    let child = addChicken(hen, 1);
    removeChicken(child);

    expect(hen.next).toBe(hen);
    expect(hen.prev).toBe(hen);
  });

  test("can't use removee child", () => {
    let hen = createHen(0);
    let child = addChicken(hen, 1);
    removeChicken(child);

    expect(() => child.next).toThrow();
    expect(() => child.prev).toThrow();
    expect(() => child.self).toThrow();
  });
});
