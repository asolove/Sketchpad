import { DisplayTransform, Drawonable } from "./display";
import {
  Chicken,
  Hen,
  addChicken,
  chickenParent,
  collectChickens,
  createHen,
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

export class Universe {
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
    // eventually will need to consult UI mode/state to see what we want
    // but for now assume we are in line-drawing mode and click to add a point
    let movings = collectChickens(this.movings);
    switch (movings.length) {
      case 0:
        let p0 = this.addPoint(position);
        let p1 = this.addPoint(position);
        let l = this.addLine(p0, p1);
        addChicken(this.movings, p1);
        return p0;
      case 1:
        return;
      default:
        throw new Error("Can't draw a line while multiple items are moving");
    }
  }
}

class Picture implements Drawable {
  parts: Hen<Picture, Drawable>;

  constructor() {
    this.parts = createHen(this);
  }

  display(d: Drawonable, dt: DisplayTransform) {
    let chicken = this.parts.next;
    while (chicken.type === "chicken") {
      chicken.self.display(d, dt);
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
