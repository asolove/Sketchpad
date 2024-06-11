import type { DisplayTransform, Drawonable } from "./display";
import type { Copyable, Picture, Point, Removable } from "./document";
import { type Position, angle, distance } from "./lib";
import {
  type Chicken,
  type Hen,
  addChicken,
  chickenParent,
  createEmptyChicken,
  emptyChicken,
  removeChicken,
} from "./ring";

export abstract class Constraint implements Removable, Copyable {
  picture: Chicken<Picture, Constraint>;

  constructor(picture: Hen<Picture, Constraint>) {
    this.picture = addChicken(picture, this);
  }

  display(_d: Drawonable, _displayTransform: DisplayTransform): void {
    // TODO: enable optional display of constraints
  }

  abstract error(): number;
  abstract name(): string;
  abstract ncon(): number; // number of degrees of freedom removed
  abstract chvar(): number; // changeable variables

  remove() {
    removeChicken(this.picture);
  }

  abstract copy(picture: Picture, copies: Map<unknown, unknown>): this;
}

export class SameXConstraint extends Constraint {
  p1: Chicken<Point, Constraint>;
  p2: Chicken<Point, Constraint>;
  picture: Chicken<Picture, Constraint>;

  constructor(p1: Point, p2: Point, picture: Hen<Picture, Constraint>) {
    super(picture);
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
    this.picture = createEmptyChicken(this);
  }

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let p1 = chickenParent(this.p1).copy(picture, copies);
    let p2 = chickenParent(this.p2).copy(picture, copies);

    let copy = new SameXConstraint(p1, p2, picture.constraints);
    copies.set(this, copy);
    return copy as this;
  }

  remove() {
    super.remove();
    removeChicken(this.p1);
    removeChicken(this.p2);
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
    this.picture = createEmptyChicken(this);
  }

  remove() {
    super.remove();
    removeChicken(this.p1);
    removeChicken(this.p2);
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

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let p1 = chickenParent(this.p1).copy(picture, copies);
    let p2 = chickenParent(this.p2).copy(picture, copies);

    let copy = new SameYConstraint(p1, p2, picture.constraints);
    copies.set(this, copy);
    return copy as this;
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

  remove() {
    super.remove();
    removeChicken(this.point);
    removeChicken(this.end1);
    removeChicken(this.end2);
  }

  get pointPosition(): Position {
    let point = chickenParent(this.point);
    return [point.x, point.y];
  }

  get end1Position(): Position {
    let end1 = chickenParent(this.end1);
    return [end1.x, end1.y];
  }

  get end2Position(): Position {
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

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let point = chickenParent(this.point).copy(picture, copies);
    let end1 = chickenParent(this.end1).copy(picture, copies);
    let end2 = chickenParent(this.end2).copy(picture, copies);

    let copy = new PointOnLineConstraint(
      point,
      end1,
      end2,
      picture.constraints
    );
    copies.set(this, copy);
    return copy as this;
  }
}

export class EqualLengthConstraint extends Constraint {
  middle: Chicken<Point, Constraint>;
  p1: Chicken<Point, Constraint>;
  p2: Chicken<Point, Constraint>;

  constructor(
    middle: Point,
    p1: Point,
    p2: Point,
    picture: Hen<Picture, Constraint>
  ) {
    super(picture);
    this.middle = addChicken(middle.constraints, this);
    this.p1 = addChicken(p1.constraints, this);
    this.p2 = addChicken(p2.constraints, this);
  }

  error(): number {
    let d1 = distance(
      chickenParent(this.middle).position,
      chickenParent(this.p1).position
    );
    let d2 = distance(
      chickenParent(this.middle).position,
      chickenParent(this.p1).position
    );
    return Math.abs(d2 - d1);
  }

  name(): string {
    return "E";
  }
  ncon(): number {
    return 2;
  }
  chvar(): number {
    return 3;
  }

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let middle = chickenParent(this.middle).copy(picture, copies);
    let p1 = chickenParent(this.p1).copy(picture, copies);
    let p2 = chickenParent(this.p2).copy(picture, copies);

    let copy = new EqualLengthConstraint(middle, p1, p2, picture.constraints);
    copies.set(this, copy);
    return copy as this;
  }
}

export class PointOnArcConstraint extends Constraint {
  point: Chicken<Point, Constraint>;
  center: Chicken<Point, Constraint>;
  start: Chicken<Point, Constraint>;
  end: Chicken<Point, Constraint>;

  constructor(
    point: Point,
    center: Point,
    start: Point,
    end: Point,
    picture: Hen<Picture, Constraint>
  ) {
    super(picture);
    this.point = addChicken(point.constraints, this);
    this.center = addChicken(center.constraints, this);
    this.start = addChicken(start.constraints, this);
    this.end = addChicken(end.constraints, this);
  }

  remove() {
    super.remove();
    removeChicken(this.point);
    removeChicken(this.center);
    removeChicken(this.start);
    removeChicken(this.end);
  }

  get pointPosition(): Position {
    let point = chickenParent(this.point);
    return [point.x, point.y];
  }

  get centerPosition(): Position {
    let center = chickenParent(this.center);
    return [center.x, center.y];
  }

  get startPosition(): Position {
    let start = chickenParent(this.start);
    return [start.x, start.y];
  }

  get endPosition(): Position {
    let end = chickenParent(this.end);
    return [end.x, end.y];
  }

  error(): number {
    let center = this.centerPosition;
    let start = this.startPosition;
    let end = this.endPosition;
    let point = this.pointPosition;

    // There are two components to the error (treated like polar coordinates)
    // 1. how far the distance is wrong from the radius of the circle
    let dist = distance(center, point);
    let radius = distance(center, start);
    let radiusError = Math.abs(radius - dist);

    // 2. how far the angle is away from the being on the arc between the ends
    let startAngle = angle(center, start);
    let endAngle = angle(center, end);
    let pointAngle = angle(center, point);
    let allowedRanges: Array<[number, number]> = [];
    if (endAngle <= startAngle) {
      allowedRanges.push([0, endAngle]);
      allowedRanges.push([startAngle, Math.PI * 2]);
    } else {
      allowedRanges.push([startAngle, endAngle]);
    }

    let angleError = Math.PI * 2;
    for (let [start, end] of allowedRanges) {
      let startRadianError = pointAngle > start ? 0 : start - pointAngle;
      let endRadiabnError = pointAngle < end ? 0 : pointAngle - end;
      let rangeError = radius * Math.min(startRadianError, endRadiabnError);
      angleError = Math.min(angleError, rangeError);
    }
    if (angleError >= Math.PI * 2) debugger;
    if (angleError < 0) debugger;

    return Math.sqrt(Math.pow(radiusError, 2) + Math.pow(angleError, 2));
  }

  name(): string {
    return "C";
  }
  ncon(): number {
    return 2;
  }
  chvar(): number {
    return 4;
  }

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let point = chickenParent(this.point).copy(picture, copies);
    let center = chickenParent(this.center).copy(picture, copies);
    let start = chickenParent(this.start).copy(picture, copies);
    let end = chickenParent(this.end).copy(picture, copies);

    let copy = new PointOnArcConstraint(
      point,
      center,
      start,
      end,
      picture.constraints
    );
    copies.set(this, copy);
    return copy as this;
  }
}

export class SameDistanceConstraint extends Constraint {
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

  remove() {
    super.remove();
    removeChicken(this.pa1);
    removeChicken(this.pa2);
    removeChicken(this.pb1);
    removeChicken(this.pb2);
  }

  error(): number {
    let da = distance(
      chickenParent(this.pa1).position,
      chickenParent(this.pa2).position
    );
    let db = distance(
      chickenParent(this.pb1).position,
      chickenParent(this.pb2).position
    );
    return Math.abs(db - da);
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

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let pa1 = chickenParent(this.pa1).copy(picture, copies);
    let pa2 = chickenParent(this.pa2).copy(picture, copies);
    let pb1 = chickenParent(this.pb1).copy(picture, copies);
    let pb2 = chickenParent(this.pb2).copy(picture, copies);

    let copy = new SameDistanceConstraint(
      pa1,
      pa2,
      pb1,
      pb2,
      picture.constraints
    );
    copies.set(this, copy);
    return copy as this;
  }
}

export class PerpendicularConstraint extends Constraint {
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

  remove() {
    super.remove();
    removeChicken(this.pa1);
    removeChicken(this.pa2);
    removeChicken(this.pb1);
    removeChicken(this.pb2);
  }

  error(): number {
    let pa1 = chickenParent(this.pa1).position;
    let pa2 = chickenParent(this.pa2).position;
    let pb1 = chickenParent(this.pb1).position;
    let pb2 = chickenParent(this.pb2).position;

    let minD = Math.min(distance(pa1, pa2), distance(pb1, pb2));
    let angle1 = angle(pa1, pa2);
    let angle2 = angle(pb1, pb2);

    // TODO: represent angles of lines in radians, express difference in ~O(pixels)
    return Math.abs(Math.cos(Math.abs(angle2 - angle1)) * minD);
  }

  name(): string {
    return "+";
  }
  ncon(): number {
    return 1;
  }
  chvar(): number {
    return 4;
  }

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let pa1 = chickenParent(this.pa1).copy(picture, copies);
    let pa2 = chickenParent(this.pa2).copy(picture, copies);
    let pb1 = chickenParent(this.pb1).copy(picture, copies);
    let pb2 = chickenParent(this.pb2).copy(picture, copies);

    let copy = new PerpendicularConstraint(
      pa1,
      pa2,
      pb1,
      pb2,
      picture.constraints
    );
    copies.set(this, copy);
    return copy as this;
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

  remove() {
    super.remove();
    removeChicken(this.pa1);
    removeChicken(this.pa2);
    removeChicken(this.pb1);
    removeChicken(this.pb2);
  }

  error(): number {
    let pa1 = chickenParent(this.pa1).position;
    let pa2 = chickenParent(this.pa2).position;
    let pb1 = chickenParent(this.pb1).position;
    let pb2 = chickenParent(this.pb2).position;

    let minD = Math.min(distance(pa1, pa2), distance(pb1, pb2));
    let angle1 = angle(pa1, pa2);
    let angle2 = angle(pb1, pb2);

    // TODO: represent angles of lines in radians, express difference in ~O(pixels)
    return Math.abs(Math.sin(Math.abs(angle2 - angle1)) * minD);
  }

  name(): string {
    return "=";
  }
  ncon(): number {
    return 1;
  }
  chvar(): number {
    return 4;
  }

  copy(picture: Picture, copies: Map<unknown, unknown>): this {
    if (copies.has(this)) return copies.get(this) as this;

    let pa1 = chickenParent(this.pa1).copy(picture, copies);
    let pa2 = chickenParent(this.pa2).copy(picture, copies);
    let pb1 = chickenParent(this.pb1).copy(picture, copies);
    let pb2 = chickenParent(this.pb2).copy(picture, copies);

    let copy = new ParallelConstraint(pa1, pa2, pb1, pb2, picture.constraints);
    copies.set(this, copy);
    return copy as this;
  }
}
