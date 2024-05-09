import { DisplayTransform, Drawonable } from "./display";
import { Picture, Point } from "./document";
import { angle, distance } from "./lib";
import { Chicken, Hen, addChicken, chickenParent } from "./ring";

export abstract class Constraint {
  picture: Chicken<Picture, Constraint>;

  constructor(picture: Hen<Picture, Constraint>) {
    this.picture = addChicken(picture, this);
  }

  display(d: Drawonable, displayTransform: DisplayTransform): void {}

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
    super(picture);
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
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
    super(picture);
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
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

export class PointOnLineConstraint extends Constraint {
  point: Chicken<Point, Constraint>;
  end1: Chicken<Point, Constraint>;
  end2: Chicken<Point, Constraint>;

  constructor(
    point: Point,
    end1: Point,
    end2: Point,
    picture: Hen<Picture, Constraint>
  ) {
    super(picture);
    this.point = addChicken(point.constraints, this);
    this.end1 = addChicken(end1.constraints, this);
    this.end2 = addChicken(end2.constraints, this);
  }

  get pointPosition(): [number, number] {
    let point = chickenParent(this.point);
    return [point.x, point.y];
  }

  get end1Position(): [number, number] {
    let end1 = chickenParent(this.end1);
    return [end1.x, end1.y];
  }

  get end2Position(): [number, number] {
    let end2 = chickenParent(this.end2);
    return [end2.x, end2.y];
  }

  error(): number {
    let end1 = this.end1Position;
    let end2 = this.end2Position;
    let point = this.pointPosition;

    // There are two components to the error:
    // 1. errorOrthogonal: how far the point is off-line (orthogonal to the line)
    let dist = distance(end1, point);
    let theta = angle(end1, end2) - angle(end1, point);
    let errorOrthogonal = dist * Math.sin(theta);

    // 2. errorParallel: How far the point is outside of the endpoints (parallel to the line)
    let pointParallelDistance = dist * Math.cos(theta);
    let end2Distance = distance(end1, end2);
    let errorParallel = 0;
    if (pointParallelDistance < 0) {
      errorParallel = -pointParallelDistance;
    }

    if (pointParallelDistance > end2Distance) {
      errorParallel = pointParallelDistance - end2Distance;
    }

    return Math.sqrt(Math.pow(errorOrthogonal, 2) + Math.pow(errorParallel, 2));
  }

  name(): string {
    return "L";
  }
  ncon(): number {
    return 2;
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

  constructor(
    pa1: Point,
    pa2: Point,
    pb1: Point,
    pb2: Point,
    picture: Hen<Picture, Constraint>
  ) {
    super(picture);
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
