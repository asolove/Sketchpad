import { Chicken, Hen, chickenParent } from "./ring";

interface Drawonable {
  draw(x: number, y: number): void;
}

interface DisplayTransform {
  (x: number, y: number): { x: number; y: number };
}

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

class Movings {
  movings: Hen<Movings, Movable>;
}

class Universe {}
class Picture implements Drawable {
  display(d: Drawonable, dt: DisplayTransform) {
    let chicken = this.parts.next;
    while (chicken.type === "chicken") {
      chicken.self.display(d, dt);
    }
  }

  parts: Chicken<Picture, Drawable>;
}

class Circle {}
class Constraint {}

class Line implements Drawable, Boundable, Movable {
  display(d: Drawonable) {}
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  getStartPoint(): Point {
    return chickenParent(this.startPoint);
  }
  getEndPoint(): Point {
    return chickenParent(this.endPoint);
  }

  startPoint: Chicken<Point, Line | Circle>;
  endPoint: Chicken<Point, Line | Circle>;

  attacher: Chicken<Picture, Drawable>;
  picture: Chicken<Picture, unknown>;
  moving: Chicken<Movings, Movable>;
}

class Point implements Drawable, Boundable, Movable {
  display(d: Drawonable, displayTransform: DisplayTransform) {
    let { x, y } = displayTransform(this.x, this.y);
    d.draw(x, y);
  }
  move(dx: number, dy: number) {}
  bounds() {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  pointsAndLines: Hen<Point, Line | Circle>;

  attacher: Chicken<Picture, Drawable>;
  picture: Chicken<Picture, unknown>;

  constraints: Hen<Point, Constraint>;
  instancePointConstraints: Hen<Point, Constraint>;

  x: number;
  y: number;
}
