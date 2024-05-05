import { DisplayTransform, Drawonable } from "./display";
import {
  Chicken,
  Hen,
  addChicken,
  chickenParent,
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

export class Universe implements Drawable {
  currentPicture: Picture;
  pictures: Picture[];
  movings: Hen<Universe, Movable>;

  constructor() {
    this.currentPicture = new Picture();
    this.pictures = [this.currentPicture];
    this.movings = createHen(this);
  }

  addPoint(position: [number, number]): Point {
    return this.currentPicture.addPoint(position);
  }

  addLine(start: Point, end: Point): Line {
    return this.currentPicture.addLine(start, end);
  }

  addPointInLineSegment(position: [number, number]): Point {
    // TODO: this only handles drawing new points. In the future, this interface
    // should change so if the pen is pointed at an existing point, it connects.
    let current = this.movings.next;
    if (isChicken(current.next))
      throw new Error("Cannot draw line while more than one item is moving");

    if (isChicken(current) && !(current.self instanceof Point))
      throw new Error("Cannot draw line while current moving is not a Point.");

    let p0 =
      current.self instanceof Point ? current.self : this.addPoint(position);

    let p1 = this.addPoint(position);
    let l = this.addLine(p0, p1);
    if (isChicken(current)) removeChicken(current);
    addChicken(this.movings, p1);
    return p1;
  }

  display(d: Drawonable, dt: DisplayTransform) {
    this.currentPicture.display(d, dt);
  }
}

class Picture implements Drawable {
  parts: Hen<Picture, Drawable>;

  constructor() {
    this.parts = createHen(this);
  }

  display(d: Drawonable, dt: DisplayTransform) {
    let current = this.parts.next;
    while (isChicken(current)) {
      current.self.display(d, dt);
      current = current.next;
    }
  }

  addPoint(position: [number, number]): Point {
    return new Point(position, this.parts);
  }

  addLine(start: Point, end: Point): Line {
    return new Line(start.linesAndCircles, end.linesAndCircles, this.parts);
  }
}

class Circle implements Drawable {
  display(d: Drawonable) {}
}
class Constraint {}

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

  display(d: Drawonable) {}
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  getStartPoint(): Point {
    return chickenParent(this.start);
  }
  getEndPoint(): Point {
    return chickenParent(this.end);
  }
}

class Point implements Drawable, Boundable, Movable {
  x: number;
  y: number;

  attacher: Chicken<Picture, Drawable>;
  picture: Chicken<Picture, unknown>;

  linesAndCircles: Hen<Point, Line | Circle>;

  constraints: Hen<Point, Constraint>;
  instancePointConstraints: Hen<Point, Constraint>;
  moving: Chicken<Universe, Movable>;

  constructor([x, y]: [number, number], picture: Hen<Picture, Drawable>) {
    this.x = x;
    this.y = y;
    this.picture = addChicken(picture, this);
    this.constraints = createHen(this);
    this.instancePointConstraints = createHen(this);
    this.linesAndCircles = createHen(this);

    // TODO: handle null chicken for attacher?
  }

  display(d: Drawonable, displayTransform: DisplayTransform) {
    let [x, y] = displayTransform(this.x, this.y);
    d.drawPoint(x, y);
  }
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }
}
