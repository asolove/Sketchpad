import { expect, test, describe } from "bun:test";
import {
  addChicken,
  createEmptyChicken,
  createHen,
  isEmptyChicken,
  removeChicken,
} from "./ring";

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

    chicken = hen.prev;
    expect(chicken.self).toBe(3);
    chicken = chicken.prev;
    expect(chicken.self).toBe(2);
    chicken = chicken.prev;
    expect(chicken.self).toBe(1);
    expect(chicken.prev).toBe(hen);
  });

  test("removeChicken", () => {
    let hen = createHen(0);

    let chick1 = addChicken(hen, 1);
    let chick2 = addChicken(hen, 2);
    let chick3 = addChicken(hen, 3);

    removeChicken(chick2);

    let currentChick = hen.next;
    expect(currentChick.self).toBe(1);

    currentChick = currentChick.next;
    expect(currentChick.self).toBe(3);

    let next = currentChick.next;
    expect(next).toBe(hen);
  });

  test("remove only chick", () => {
    let hen = createHen(0);
    let chick = addChicken(hen, 1);
    removeChicken(chick);

    expect(hen.next).toBe(hen);
    expect(hen.prev).toBe(hen);
  });

  test("can't use removed child", () => {
    let hen = createHen(0);
    let chick = addChicken(hen, 1);
    removeChicken(chick);

    expect(() => chick.next).toThrow();
    expect(() => chick.prev).toThrow();
    expect(() => chick.self).toThrow();
  });

  test("empty chicken", () => {
    let empty = createEmptyChicken(2);
    expect(isEmptyChicken(empty)).toBeTrue();
  });
});
