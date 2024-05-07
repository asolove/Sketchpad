import { DisplayTransform, Drawonable } from "./display";
import { sum } from "./lib";
import {
  Chicken,
  Hen,
  addChicken,
  chickenParent,
  collectChickens,
  createHen,
  isChicken,
  removeChicken,
} from "./ring";

interface Drawable {
  display(d: Drawonable, displayTransform: DisplayTransform): void;
}

interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface Boundable {
  bounds(): Bounds;
}

interface Movable {
  move(dx: number, dy: number);
}

abstract class Variable {
  isVariable: Chicken<Picture, Variable>;
  constraints: Hen<Variable, Constraint>;

  constructor(variables: Hen<Picture, Variable>) {
    this.isVariable = addChicken(variables, this);
  }

  error() {
    let cs = collectChickens(this.constraints);
    return cs.map((c) => c.error()).reduce(sum, 0);
  }

  abstract satisfyConstraints(): void;
}

export class Universe implements Drawable {
  currentPicture: Picture;
  pictures: Picture[];
  movings: Hen<Universe, Movable>;

  #runConstraints: boolean;
  constraintTimeout: Timer | void;

  constructor() {
    this.currentPicture = new Picture();
    this.pictures = [this.currentPicture];
    this.movings = createHen(this);
    this.#runConstraints = false;
  }

  set runConstraints(value: boolean) {
    if (this.constraintTimeout)
      this.constraintTimeout = clearTimeout(this.constraintTimeout);
    this.#runConstraints = value;
    if (value) this.loop();
  }

  loop() {
    console.log(
      collectChickens(this.currentPicture.variables).map((v) =>
        v.satisfyConstraints()
      )
    );
    this.constraintTimeout = setTimeout(() => this.loop(), 16);
  }

  addPoint(position: [number, number]): Point {
    return this.currentPicture.addPoint(position);
  }

  addLine(start: Point, end: Point): Line {
    return this.currentPicture.addLine(start, end);
  }

  addPointInLineSegment(position: [number, number] | Point): Point {
    // TODO: this only handles drawing new points. In the future, this interface
    // should change so if the pen is pointed at an existing point, it connects.
    let current = this.movings.next;
    if (isChicken(current.next))
      throw new Error("Cannot draw line while more than one item is moving");

    if (isChicken(current) && !(current.self instanceof Point))
      throw new Error("Cannot draw line while current moving is not a Point.");

    let p1: Point =
      position instanceof Point ? position : this.addPoint(position);
    let p0 =
      current.self instanceof Point
        ? current.self
        : this.addPoint([p1.x, p1.y]);

    let l = this.addLine(p0, p1);
    if (isChicken(current)) removeChicken(current);
    addChicken(this.movings, p1);
    return p1;
  }

  addSameXConstraint(p1: Point, p2: Point): SameXConstraint {
    return this.currentPicture.addSameXConstraint(p1, p2);
  }

  display(d: Drawonable, dt: DisplayTransform) {
    this.currentPicture.display(d, dt);
  }
}

class Picture implements Drawable {
  parts: Hen<Picture, Drawable>;
  variables: Hen<Picture, Variable>;
  constraints: Hen<Picture, Constraint>;

  constructor() {
    this.parts = createHen(this);
    this.variables = createHen(this);
    this.constraints = createHen(this);
  }

  display(d: Drawonable, dt: DisplayTransform) {
    let current = this.parts.next;
    while (isChicken(current)) {
      current.self.display(d, dt);
      current = current.next;
    }
  }
  addSameXConstraint(p1: Point, p2: Point): SameXConstraint {
    return new SameXConstraint(p1, p2, this.constraints);
  }

  addPoint(position: [number, number]): Point {
    return new Point(position, this.parts, this.variables);
  }

  addLine(start: Point, end: Point): Line {
    return new Line(start.linesAndCircles, end.linesAndCircles, this.parts);
  }
}

class Circle implements Drawable {
  display(d: Drawonable) {}
}
abstract class Constraint implements Movable, Drawable {
  display(d: Drawonable, displayTransform: DisplayTransform): void {}

  move(dx: number, dy: number) {}

  abstract error(): number;
  abstract name(): string;
  abstract ncon(): number; // number of degrees of freedom removed
  abstract chvar(): number; // changeable variables
}

class SameXConstraint extends Constraint {
  p1: Chicken<Variable, Constraint>;
  p2: Chicken<Variable, Constraint>;
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

class Line implements Drawable, Boundable, Movable {
  start: Chicken<Point, Line | Circle>;
  end: Chicken<Point, Line | Circle>;

  attacher: Chicken<Picture, Drawable>;
  picture: Chicken<Picture, unknown>;
  moving: Chicken<Universe, Movable>;

  constructor(
    start: Hen<Point, Line | Circle>,
    end: Hen<Point, Line | Circle>,
    picture: Hen<Picture, Drawable>
  ) {
    this.start = addChicken(start, this);
    this.end = addChicken(end, this);
    this.picture = addChicken(picture, this);
  }

  display(d: Drawonable, dt: DisplayTransform) {
    d.drawLine(dt(this.startCoordinates), dt(this.endCoordinates));
  }

  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  get startPoint(): Point {
    return chickenParent(this.start);
  }
  get endPoint(): Point {
    return chickenParent(this.end);
  }

  get startCoordinates(): [number, number] {
    let p = this.startPoint;
    return [p.x, p.y];
  }

  get endCoordinates(): [number, number] {
    let p = this.endPoint;
    return [p.x, p.y];
  }
}

class Point extends Variable implements Drawable, Boundable, Movable {
  x: number;
  y: number;

  attacher: Chicken<Picture, Drawable>;
  picture: Chicken<Picture, unknown>;

  linesAndCircles: Hen<Point, Line | Circle>;

  constraints: Hen<Point, Constraint>;
  instancePointConstraints: Hen<Point, Constraint>;
  moving: Chicken<Universe, Movable>;

  constructor(
    [x, y]: [number, number],
    picture: Hen<Picture, Drawable>,
    variables: Hen<Picture, Variable>
  ) {
    super(variables);
    this.x = x;
    this.y = y;
    this.picture = addChicken(picture, this);
    this.constraints = createHen(this);
    this.instancePointConstraints = createHen(this);
    this.linesAndCircles = createHen(this);

    // TODO: handle null chicken for attacher?
  }

  // Constraints
  satisfyConstraints() {
    let e0 = this.error();
    this.x += 1;
    let exp = this.error();
    this.x -= 2;
    let exn = this.error();
    this.x += 1;

    if (exp < exn && exp < e0) {
      this.x += 1;
      e0 = exp;
    } else if (exn < e0) {
      this.x -= 1;
      e0 = exn;
    }
  }

  display(d: Drawonable, displayTransform: DisplayTransform) {
    let [x, y] = displayTransform([this.x, this.y]);
    d.drawPoint([x, y]);
  }
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }
}
