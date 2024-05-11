import {
  Constraint,
  ParallelConstraint,
  PerpendicularConstraint,
  PointOnArcConstraint,
  PointOnLineConstraint,
  SameDistanceConstraint,
  SameXConstraint,
  SameYConstraint,
} from "./constraint";
import { DisplayTransform, Drawonable } from "./display";
import { Position, angle, distance, sum } from "./lib";
import {
  Chicken,
  Hen,
  addChicken,
  chickenParent,
  clearHen,
  collectChickens,
  createHen,
  isChicken,
  removeChicken,
} from "./ring";

export interface Drawable {
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
    if (this.#runConstraints) this.loop();
  }

  loop() {
    this.pictures
      .flatMap((p) => collectChickens(p.variables))
      .map((v) => v.satisfyConstraints());
    this.constraintTimeout = setTimeout(() => this.loop(), 16);
  }

  addPicture(): Picture {
    let p = new Picture();
    this.pictures.push(p);
    this.currentPicture = p;
    clearHen(this.movings);
    return p;
  }

  addPointInLineSegment(position: Position | Point): Point {
    let picture = this.currentPicture;

    // TODO: this only handles drawing new points. In the future, this interface
    // should change so if the pen is pointed at an existing point, it connects.
    let current = this.movings.next;
    if (isChicken(current.next))
      throw new Error("Cannot draw line while more than one item is moving");

    if (isChicken(current) && !(current.self instanceof Point))
      throw new Error("Cannot draw line while current moving is not a Point.");

    let p1: Point =
      position instanceof Point ? position : picture.addPoint(position);
    let p0 =
      current.self instanceof Point
        ? current.self
        : picture.addPoint([p1.x, p1.y]);

    let l = picture.addLine(p0, p1);
    if (isChicken(current)) removeChicken(current);
    addChicken(this.movings, p1);
    return p1;
  }

  display(d: Drawonable, dt: DisplayTransform) {
    this.currentPicture.display(d, dt);
  }
}

type Attachable = Point | Line | Circle;

export class Picture implements Drawable {
  parts: Hen<Picture, Drawable>;
  variables: Hen<Picture, Variable>;
  constraints: Hen<Picture, Constraint>;
  attachers: Hen<Picture, Attachable>;
  instances: Hen<Picture, Instance>;

  constructor() {
    this.parts = createHen(this);
    this.variables = createHen(this);
    this.constraints = createHen(this);
    this.attachers = createHen(this);
    this.instances = createHen(this);
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
  addSameYConstraint(p1: Point, p2: Point): SameYConstraint {
    return new SameYConstraint(p1, p2, this.constraints);
  }
  addPointOnLineConstraint(
    p: Point,
    end1: Point,
    end2: Point
  ): PointOnLineConstraint {
    return new PointOnLineConstraint(p, end1, end2, this.constraints);
  }
  addPointOnArcConstraint(
    p: Point,
    center: Point,
    start: Point,
    end: Point
  ): PointOnArcConstraint {
    return new PointOnArcConstraint(p, center, start, end, this.constraints);
  }
  addSameDistanceConstraint(
    pa1: Point,
    pa2: Point,
    pb1: Point,
    pb2: Point
  ): SameDistanceConstraint {
    return new SameDistanceConstraint(pa1, pa2, pb1, pb2, this.constraints);
  }
  addPerpendicularConstraint(
    pa1: Point,
    pa2: Point,
    pb1: Point,
    pb2: Point
  ): PerpendicularConstraint {
    return new PerpendicularConstraint(pa1, pa2, pb1, pb2, this.constraints);
  }
  addParallelConstraint(
    pa1: Point,
    pa2: Point,
    pb1: Point,
    pb2: Point
  ): ParallelConstraint {
    return new ParallelConstraint(pa1, pa2, pb1, pb2, this.constraints);
  }

  addPoint(position: Position): Point {
    return new Point(position, this.parts, this.variables);
  }

  addLine(start: Point, end: Point): Line {
    return new Line(start.linesAndCircles, end.linesAndCircles, this.parts);
  }

  addCircle(center: Point, start: Point, end: Point): Circle {
    let circle = new Circle(
      center.linesAndCircles,
      start.linesAndCircles,
      end.linesAndCircles,
      this.parts
    );
    this.addPointOnArcConstraint(end, center, start, end);
    return circle;
  }

  // Adds an instance of `ofPicture` to the current picture.
  addInstance(
    ofPicture: Picture,
    cx: number = 0,
    cy: number = 0,
    zoom: number = 1,
    rotation: number = 0
  ): Instance {
    // TODO: check ofPicture for attachers and duplicate/constrain them
    return new Instance(
      this.variables,
      this.parts,
      ofPicture,
      [cx, cy],
      zoom,
      rotation
    );
  }
}

abstract class Variable {
  isVariable: Chicken<Picture, Variable>;
  constraints: Hen<this, Constraint>;

  constructor(variables: Hen<Picture, Variable>) {
    this.isVariable = addChicken(variables, this);
    this.constraints = createHen(this);
  }

  error() {
    let cs = collectChickens(this.constraints);
    return cs.map((c) => Math.pow(c.error(), 2)).reduce(sum, 0);
  }

  abstract satisfyConstraints(): void;
}

class Instance extends Variable implements Drawable {
  cx: number;
  cy: number;
  zoom: number; // scale as multiple: 1 is original size
  rotation: number; // rotation in radians: 0 is upright (original orientation), moves counter-clockwise

  inPicture: Chicken<Picture, Drawable>;
  ofPicture: Chicken<Picture, Instance>;

  constructor(
    variables: Hen<Picture, Variable>,
    inPicture: Hen<Picture, Drawable>,
    ofPicture: Picture,
    [cx, cy]: Position = [0, 0],
    zoom: number = 0.5,
    rotation: number = 0
  ) {
    super(variables);
    this.cx = cx;
    this.cy = cy;
    this.zoom = zoom;
    this.rotation = rotation;

    this.inPicture = addChicken(inPicture, this);
    this.ofPicture = addChicken(ofPicture.instances, this);
  }

  error() {
    let cs = collectChickens(this.constraints);
    return cs.map((c) => c.error()).reduce(sum, 0);
  }

  display(d: Drawonable, displayTransform: DisplayTransform): void {
    const dt: DisplayTransform = ([x, y]: Position): Position => {
      let scaledX = x * this.zoom;
      let scaledY = y * this.zoom;

      // FIXME: get the math right so I don't have to negate the rotation angle
      return displayTransform([
        scaledX * Math.cos(this.rotation) -
          scaledY * Math.sin(this.rotation) +
          this.cx,

        scaledX * Math.sin(this.rotation) +
          scaledY * Math.cos(this.rotation) +
          this.cy,
      ]);
    };
    chickenParent(this.ofPicture).display(d, dt);
  }

  satisfyConstraints() {
    // TODO
  }
}

class Circle implements Drawable {
  center: Chicken<Point, Line | Circle>;
  start: Chicken<Point, Line | Circle>;
  end: Chicken<Point, Line | Circle>;

  attacher: Chicken<Picture, Attachable> | null;
  picture: Chicken<Picture, unknown>;
  moving: Chicken<Universe, Movable>;

  constructor(
    center: Hen<Point, Line | Circle>,
    start: Hen<Point, Line | Circle>,
    end: Hen<Point, Line | Circle>,
    picture: Hen<Picture, Drawable>
  ) {
    this.center = addChicken(center, this);
    this.start = addChicken(start, this);
    this.end = addChicken(end, this);
    this.picture = addChicken(picture, this);
  }

  get centerPosition(): Position {
    return chickenParent(this.center).position;
  }
  get startPosition(): Position {
    return chickenParent(this.start).position;
  }
  get endPosition(): Position {
    return chickenParent(this.end).position;
  }

  display(d: Drawonable, dt: DisplayTransform) {
    let center = this.centerPosition;
    let start = this.startPosition;
    let end = this.endPosition;
    let [cx, cy] = center;
    let [x, y] = start;
    let r = distance(center, start);

    let startAngle = angle(center, start);
    let endAngle = angle(center, end);
    if (endAngle <= startAngle) {
      endAngle += 2 * Math.PI;
    }
    let arcRadians = endAngle - startAngle;
    if (arcRadians < 0) arcRadians += 2 * Math.PI;

    // FIXME: allow drawing in other direction
    //   (update PointOnArcConstraint to also take direction into account)
    let steps = 0;
    while (steps++ < arcRadians * r) {
      d.drawPoint(dt([x, y]), this);
      x = x - (1 / r) * (y - cy);
      y = y + (1 / r) * (x - cx);
    }
  }
}

class Line implements Drawable, Boundable, Movable {
  start: Chicken<Point, Line | Circle>;
  end: Chicken<Point, Line | Circle>;

  attacher: Chicken<Picture, Attachable> | null;
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
    d.drawLine(dt(this.startPosition), dt(this.endPosition), this);
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

  get startPosition(): Position {
    let p = this.startPoint;
    return [p.x, p.y];
  }

  get endPosition(): Position {
    let p = this.endPoint;
    return [p.x, p.y];
  }
}
export class Point extends Variable implements Drawable, Boundable, Movable {
  x: number;
  y: number;

  attacher: Chicken<Picture, Attachable> | null;
  picture: Chicken<Picture, unknown>;

  linesAndCircles: Hen<Point, Line | Circle>;

  instancePointConstraints: Hen<Point, Constraint>;
  moving: Chicken<Universe, Movable>;

  constructor(
    [x, y]: Position,
    picture: Hen<Picture, Drawable>,
    variables: Hen<Picture, Variable>
  ) {
    super(variables);
    this.x = x;
    this.y = y;
    this.picture = addChicken(picture, this);
    this.instancePointConstraints = createHen(this);
    this.linesAndCircles = createHen(this);
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

    this.y += 1;
    let eyp = this.error();
    this.y -= 2;
    let eyn = this.error();
    this.y += 1;

    if (eyp < eyn && eyp < e0) {
      this.y += 1;
    } else if (eyn < e0) {
      this.y -= 1;
    }
  }

  display(d: Drawonable, dt: DisplayTransform) {
    d.drawPoint(dt([this.x, this.y]), this);
  }
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  get position(): Position {
    return [this.x, this.y];
  }
}
