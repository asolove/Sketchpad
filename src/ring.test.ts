import { expect, test, describe } from "bun:test";
import {
  addChicken,
  collectChickens,
  createEmptyChicken,
  createHen,
  isEmptyChicken,
  mergeHens,
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

  test("empty chicken", () => {
    let empty = createEmptyChicken(2);
    expect(isEmptyChicken(empty)).toBeTrue();
  });

  test("mergeHens", () => {
    let hen1 = createHen("a");
    addChicken(hen1, 1);
    addChicken(hen1, 2);

    let hen2 = createHen("b");
    addChicken(hen2, 3);
    addChicken(hen2, 4);

    mergeHens(hen1, hen2);

    expect(collectChickens(hen1)).toEqual([1, 2, 3, 4]);
  });
});
