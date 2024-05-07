import { DisplayTransform, Drawonable } from "./display";
import { Picture, Point } from "./document";
import { Chicken, Hen, addChicken, chickenParent } from "./ring";

export abstract class Constraint {
  display(d: Drawonable, displayTransform: DisplayTransform): void {}

  move(dx: number, dy: number) {}

  abstract error(): number;
  abstract name(): string;
  abstract ncon(): number; // number of degrees of freedom removed
  abstract chvar(): number; // changeable variables
}

export class SameXConstraint extends Constraint {
  p1: Chicken<Point, Constraint>;
  p2: Chicken<Point, Constraint>;
  picture: Chicken<Picture, Constraint>;

  constructor(p1: Point, p2: Point, picture: Hen<Picture, Constraint>) {
    super();
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
    this.picture = addChicken(picture, this);
  }

  get x1() {
    return chickenParent(this.p1).x;
  }

  get x2() {
    return chickenParent(this.p2).x;
  }

  error(): number {
    return Math.abs(this.x1 - this.x2);
  }

  name(): string {
    return "X";
  }
  ncon(): number {
    return 1;
  }
  chvar(): number {
    return 2;
  }
}

export class SameYConstraint extends Constraint {
  p1: Chicken<Point, Constraint>;
  p2: Chicken<Point, Constraint>;
  picture: Chicken<Picture, Constraint>;

  constructor(p1: Point, p2: Point, picture: Hen<Picture, Constraint>) {
    super();
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
    this.picture = addChicken(picture, this);
  }

  get y1() {
    return chickenParent(this.p1).y;
  }

  get y2() {
    return chickenParent(this.p2).y;
  }

  error(): number {
    return Math.abs(this.y1 - this.y2);
  }

  name(): string {
    return "Y";
  }
  ncon(): number {
    return 1;
  }
  chvar(): number {
    return 2;
  }
}

export class ParallelConstraint extends Constraint {
  pa1: Chicken<Point, Constraint>;
  pa2: Chicken<Point, Constraint>;
  pb1: Chicken<Point, Constraint>;
  pb2: Chicken<Point, Constraint>;

  constructor(pa1: Point, pa2: Point, pb1: Point, pb2: Point) {
    super();
    this.pa1 = addChicken(pa1.constraints, this);
    this.pa2 = addChicken(pa2.constraints, this);
    this.pb1 = addChicken(pb1.constraints, this);
    this.pb2 = addChicken(pb2.constraints, this);
  }

  error(): number {
    // TODO: represent angles of lines in radians, express difference in ~O(pixels)
    return 0;
  }

  name(): string {
    return "P";
  }
  ncon(): number {
    return 1;
  }
  chvar(): number {
    return 4;
  }
}
