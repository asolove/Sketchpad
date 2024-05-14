export type Hen<Parent, Child> = {
  type: "hen";
  self: Parent;
  next: Chicken<Parent, Child> | Hen<Parent, Child>;
  prev: Chicken<Parent, Child> | Hen<Parent, Child>;
};

export function createHen<A, B>(parent: A): Hen<A, B> {
  // Typing the self-reference in `next`/`prev` is tricky, but losing all safety would be sad.
  // So this checks we've filled in everything but those two, and then we add them in, to
  // minimize the amount of unsafety covered by the `as`.
  let partialHen: Omit<Hen<A, B>, "next" | "prev"> = {
    type: "hen",
    self: parent,
  };
  let fakeCompleteHen: Hen<A, B> = partialHen as Hen<A, B>;
  fakeCompleteHen.next = fakeCompleteHen;
  fakeCompleteHen.prev = fakeCompleteHen;
  return fakeCompleteHen;
}

export function isHen<A, B>(
  item: Chicken<A, B> | Hen<A, B>
): item is Hen<A, B> {
  return item && item.type === "hen";
}

export function clearHen<A, B>(hen: Hen<A, B>) {
  let current = hen.next;
  while (current.type === "chicken") {
    let next = current.next;
    emptyChicken(current);
    current = next;
  }
  hen.next = hen;
  hen.prev = hen;
}

export function collectChickens<A, B>(hen: Hen<A, B>): Array<B> {
  let r: Array<B> = [];
  let current = hen.next;
  while (current.type === "chicken") {
    r.push(current.self);
    current = current.next;
  }
  return r;
}

export type Chicken<Parent, Child> = {
  type: "chicken";
  self: Child;
  next: Chicken<Parent, Child> | Hen<Parent, Child>;
  prev: Chicken<Parent, Child> | Hen<Parent, Child>;
};

export function isChicken<A, B>(
  item: Chicken<A, B> | Hen<A, B>
): item is Chicken<A, B> {
  return item && item.type === "chicken";
}

export function createEmptyChicken<A, B>(self: B): Chicken<A, B> {
  // See comment under `createHen` for this strategy.
  let partialChicken: Omit<Chicken<A, B>, "next" | "prev"> = {
    type: "chicken",
    self,
  };
  let fakeCompleteChicken: Chicken<A, B> = partialChicken as Chicken<A, B>;
  fakeCompleteChicken.next = fakeCompleteChicken;
  fakeCompleteChicken.prev = fakeCompleteChicken;
  return fakeCompleteChicken;
}

export function emptyChicken<A, B>(chicken: Chicken<A, B>) {
  chicken.next = chicken;
  chicken.prev = chicken;
}

export function isEmptyChicken<A, B>(chicken: Chicken<A, B>): boolean {
  return chicken.next == chicken;
}

export function chickenParent<A, B>(chicken: Chicken<A, B>): A {
  let current: Chicken<A, B> | Hen<A, B> = chicken;
  while (current.type === "chicken") {
    current = current.next;
  }
  return current.self;
}

export function addChicken<A, B>(hen: Hen<A, B>, child: B): Chicken<A, B> {
  let lastSibling = hen.prev;
  let chicken: Chicken<A, B> = {
    type: "chicken",
    self: child,
    prev: lastSibling,
    next: hen,
  };
  lastSibling.next = chicken;
  hen.prev = chicken;
  return chicken;
}

// This function assumes the caller is handling cleaning up the self pointed to by
// this chicken and making this chicken no longer accessible.
// So all it needs to do is clean up the other nodes in the ring.
export function removeChicken<A, B>(chicken: Chicken<A, B>) {
  [chicken.next.prev, chicken.prev.next] = [chicken.prev, chicken.next];

  // For debuggability, make sure we error loudly if we later use a chicken
  // that's been removed from use.
  Object.defineProperties(chicken, {
    self: {
      enumerable: true,
      configurable: false,
      get: () => {
        throw new Error("Accessing `self` for chicken that has been removed.");
      },
    },
    next: {
      enumerable: true,
      configurable: false,
      get: () => {
        throw new Error("Accessing `next` for chicken that has been removed.");
      },
    },
    prev: {
      enumerable: true,
      configurable: false,
      get: () => {
        throw new Error("Accessing `prev` for chicken that has been removed.");
      },
    },
  });
}
