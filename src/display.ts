import { clamp, distance, type Position } from "./lib";
import { type Drawable, Point, Universe, Arc, Line } from "./document";
import { chickenParent, collectChickens, isEmptyChicken } from "./ring";

export interface Drawonable {
  drawPoint(point: Position, item: Drawable): void;
  drawLine(start: Position, end: Position, item: Drawable): void;
  drawText(text: string, position: Position): void;
}

export interface DisplayTransform {
  ([x, y]: Position): Position;
}

export class DisplayFile implements Drawonable {
  pixels: Position[];
  cx: number;
  cy: number;
  zoom: number;
  logicalWidth = 1024;
  logicalHeight = 1024;

  mousePosition: Position;
  // TODO: generalize to multiple and other types
  pointNearestCursor: Point | undefined;
  shapesNearCursor: Set<Arc | Line>;

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 0.5;
    this.pixels = [];
    this.mousePosition = [0, 0];

    this.pointNearestCursor = undefined;
    this.shapesNearCursor = new Set();
  }

  displayTransform(): DisplayTransform {
    return ([x, y]: Position): Position => {
      return [
        Math.round((x - this.cx) * this.zoom) + this.logicalWidth / 2,
        Math.round((this.cy - y) * this.zoom) + this.logicalHeight / 2,
      ];
    };
  }

  // Translates display coordinates back into the Universe document coordinate system
  inverseDisplayTransform(): DisplayTransform {
    return ([x, y]: Position): Position => {
      return [
        (x - this.logicalWidth / 2) / this.zoom + this.cx,
        -(y - this.logicalHeight / 2) / this.zoom + this.cy,
      ];
    };
  }

  clear() {
    this.pixels = [];
    this.pointNearestCursor = undefined;
    this.shapesNearCursor.clear();
  }

  twinkle() {
    let times = this.pixels.length;
    for (let i = 0; i < times; i++) {
      let j = Math.floor(Math.random() * times);
      let k = Math.floor(Math.random() * times);
      [this.pixels[j], this.pixels[k]] = [this.pixels[k], this.pixels[j]];
    }
  }

  drawPoint([x, y]: Position, item: Drawable): void {
    if (x < 0 || x > this.logicalWidth) return;
    if (y < 0 || y > this.logicalHeight) return;

    this.pixels.push([x, y]);

    // Record if this is also the closest point to the cursor
    if (item instanceof Point) {
      if (!isEmptyChicken(item.moving)) return;

      let d = distance([x, y], this.mousePosition);
      if (d > 6) return;

      // TODO: should memoize this
      let dCurrent = this.pointNearestCursor
        ? distance(this.pointNearestCursor.position, this.mousePosition)
        : Infinity;
      if (d > dCurrent) return;

      this.pointNearestCursor = item;
    } else if (item instanceof Arc || item instanceof Line) {
      if (!isEmptyChicken(item.moving)) return;

      let d = distance([x, y], this.mousePosition);
      if (d > 4) return;
      this.shapesNearCursor.add(item);
    }
  }

  drawLine([x1, y1]: Position, [x2, y2]: Position, item: Drawable): void {
    let xdiff = Math.abs(x2 - x1);
    let ydiff = Math.abs(y2 - y1);
    let steps = Math.max(xdiff, ydiff);

    let dx = (x2 - x1) / steps;
    let dy = (y2 - y1) / steps;

    let x = x1;
    let y = y1;

    for (let i = 0; i < steps; i++) {
      let xNext = x + dx;
      let yNext = y + dy;
      this.drawPoint([Math.round(xNext), Math.round(yNext)], item);
      x = xNext;
      y = yNext;
    }
  }

  drawText(text: string, position: Position): void {
    // TODO: make this in terms of points so it twinkles?
  }
}

// FIXME: refactor control state and issuing commands back to the Universe into a Controller.
export class Controller {}

export abstract class Mode {
  universe: Universe;
  displayFile: DisplayFile;

  constructor(universe: Universe, displayFile: DisplayFile) {
    this.universe = universe;
    this.displayFile = displayFile;
  }
  cursorMoved(dx: number, dy: number) {}
  buttonDown(position: Position) {}
  buttonUp(position: Position) {}

  cleanup() {}
}

export class LineMode extends Mode {
  movingPoint: Point | undefined;

  buttonDown(position: Position) {
    if (this.displayFile.pointNearestCursor && this.movingPoint) {
      this.displayFile.pointNearestCursor.merge(this.movingPoint);
      this.universe.clearMovings();
      this.movingPoint = undefined;
    } else {
      let toPoint = this.universe.currentPicture.addPoint(position);
      // FIXME: refactor a helper to get the current point
      let fromPoint =
        this.movingPoint ||
        this.displayFile.pointNearestCursor ||
        this.universe.currentPicture.addPoint(position);
      this.universe.currentPicture.addLine(fromPoint, toPoint);
      if (!this.displayFile.pointNearestCursor) {
        this.displayFile.shapesNearCursor.forEach((shape) => {
          shape.constrainPoint(fromPoint);
        });
      }

      this.universe.clearMovings();
      this.universe.addMovings([toPoint]);
      this.movingPoint = toPoint;
    }
  }

  cursorMoved(dx: number, dy: number) {
    this.universe.moveMovings([dx, dy]);
  }

  cleanup() {
    // TODO: remove moving point
    this.universe.clearMovings();
  }
}

export class PauseMode extends Mode {
  constructor(universe: Universe, displayFile: DisplayFile) {
    super(universe, displayFile);
    this.universe.runConstraints = false;

    const { constraints, parts } = this.universe.currentPicture;
    console.log({
      constraints: collectChickens(constraints),
      parts: collectChickens(parts),
    });
  }

  cleanup() {
    this.universe.runConstraints = true;
  }
}

export class ArcMode extends Mode {
  arc: Arc | undefined;
  next: "start" | "end" | undefined;

  makeCurrentPoint(position: Position): Point {
    let nearPoint = this.displayFile.pointNearestCursor;
    if (nearPoint) return nearPoint;

    let newPoint = this.universe.currentPicture.addPoint(position);
    this.displayFile.shapesNearCursor.forEach((shape) => {
      shape.constrainPoint(newPoint);
    });
    return newPoint;
  }

  buttonUp(position: Position) {
    if (!this.arc) {
      let center = this.makeCurrentPoint(position);
      let start = this.universe.currentPicture.addPoint(position);
      let end = this.universe.currentPicture.addPoint(position);
      this.arc = this.universe.currentPicture.addArc(center, start, end);
      this.universe.addMovings([start, end]);
      this.next = "start";
      this.universe.runConstraints = false;
    } else if (this.next === "start") {
      let currentPoint = this.makeCurrentPoint(position);
      currentPoint.merge(chickenParent(this.arc.start));

      this.universe.clearMovings();
      this.universe.addMovings([chickenParent(this.arc.end)]);
      this.next = "end";
    } else {
      let currentPoint = this.makeCurrentPoint(position);
      currentPoint.merge(chickenParent(this.arc.end));
      this.universe.clearMovings();
      this.arc = undefined;

      this.universe.runConstraints = true;
    }
  }

  cursorMoved(dx: number, dy: number) {
    this.universe.moveMovings([dx, dy]);
  }

  cleanup() {
    // FIXME: remove partially-done arcs
    this.universe.clearMovings();
    this.universe.runConstraints = true;
  }
}

export class MoveMode extends Mode {
  state: "dragging" | "panning" | "waiting" = "waiting";

  buttonDown(_position: Position) {
    if (this.state != "waiting") {
      console.error(`Received buttonDown in unexpected state: ${this.state}`);
      return;
    }

    if (this.displayFile.pointNearestCursor) {
      this.state = "dragging";
      this.universe.addMovings([this.displayFile.pointNearestCursor]);
      this.universe.runConstraints = false;
    } else if (this.displayFile.shapesNearCursor) {
      this.state = "dragging";
      this.universe.addMovings([...this.displayFile.shapesNearCursor]);
      this.universe.runConstraints = false;
    } else {
      this.state = "panning";
    }
  }

  cursorMoved(dx: number, dy: number) {
    switch (this.state) {
      case "dragging":
        // Translate from DisplayFile coordinate offsets to Universe coordinate offsets
        this.universe.moveMovings([dx, dy]);
        return;
      case "panning":
        // FIXME: make this a single message.
        this.displayFile.cx -= dx;
        this.displayFile.cy -= dy;
        return;
    }
  }

  buttonUp() {
    // FIXME: run merge if there is an appropriate thing nearby
    this.universe.clearMovings();
    this.universe.runConstraints = true;
    this.state = "waiting";
  }

  cleanup() {
    this.universe.clearMovings();
    this.universe.runConstraints = true;
  }
}

export class ConstraintMode extends Mode {}

type PerpendicularConstraintModeState =
  | { state: "start" }
  | { state: "first"; previousLine: Line };
export class PerpendicularConstraintMode extends Mode {
  state: PerpendicularConstraintModeState = { state: "start" };

  buttonDown(_position: Position) {
    function isLine(shape: unknown): shape is Line {
      return shape instanceof Line;
    }
    let currentLine = [...this.displayFile.shapesNearCursor].find(isLine);

    if (this.state.state === "start") {
      if (currentLine)
        this.state = { state: "first", previousLine: currentLine };
    } else {
      if (currentLine) {
        let firstLine = this.state.previousLine;
        this.universe.currentPicture.addPerpendicularConstraint(
          firstLine.startPoint,
          firstLine.endPoint,
          currentLine.startPoint,
          currentLine.endPoint
        );
        this.state.previousLine = currentLine;
      }
    }
  }
}

export class DeleteMode extends Mode {
  buttonUp(_position: Position) {
    if (this.displayFile.pointNearestCursor) {
      this.displayFile.pointNearestCursor.remove();
    } else {
      this.displayFile.shapesNearCursor.values().next().value?.remove();
    }
  }
}

export class Display {
  #universe: Universe; // FIXME: remove this reference
  #displayFile: DisplayFile;
  #canvas: HTMLCanvasElement;
  #pixelsPerDraw = 2000;
  #pixelIndex = 0;
  #mode: Mode;

  constructor(df: DisplayFile, canvas: HTMLCanvasElement, universe: Universe) {
    this.#displayFile = df;
    this.#canvas = canvas;
    this.#universe = universe;

    // TODO: react to dom changes?
    let xScale = canvas.width / this.#displayFile.logicalWidth;
    let yScale = canvas.height / this.#displayFile.logicalHeight;
    canvas.getContext("2d")?.scale(xScale, yScale);

    this.#mode = new MoveMode(universe, df);

    this.loop();

    this.#canvas.style.cursor = "none";

    this.#canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      let zoom = this.#displayFile.zoom;
      zoom += e.deltaY * -0.01;
      zoom = clamp(0.1, zoom, 10);
      this.#displayFile.zoom = zoom;
    });

    // FIXME: clean up using multiple coordinate frames for mouse events,

    let prevMX = 0;
    let prevMY = 0;
    let docPosition = (canvasPosition: Position): Position =>
      this.#displayFile.inverseDisplayTransform()(canvasPosition);

    this.#canvas.addEventListener("mousemove", (e) => {
      // Translate from DOM coordinates to DisplayFile coordinates.
      let mx = e.offsetX / xScale;
      let my = e.offsetY / yScale;

      this.#displayFile.mousePosition = [mx, my];

      let dx = (mx - prevMX) / this.#displayFile.zoom;
      let dy = -(my - prevMY) / this.#displayFile.zoom;

      this.#mode.cursorMoved(dx, dy);

      prevMX = mx;
      prevMY = my;
    });

    this.#canvas.addEventListener("mousedown", (e) => {
      this.#mode.buttonDown(
        this.#displayFile.inverseDisplayTransform()([
          e.offsetX / xScale,
          e.offsetY / yScale,
        ])
      );
    });

    this.#canvas.addEventListener("mouseup", (e) => {
      this.#mode.buttonUp(
        this.#displayFile.inverseDisplayTransform()([
          e.offsetX / xScale,
          e.offsetY / yScale,
        ])
      );
    });

    // FIXME: listening at document level is a problem.
    this.#canvas.ownerDocument.addEventListener("keyup", (e: KeyboardEvent) => {
      // FIXME: cleanup state? prevent reset?
      let key = e.key;
      let modeClass =
        key === "l"
          ? LineMode
          : key === "m"
          ? MoveMode
          : key === "a"
          ? ArcMode
          : key === "c"
          ? PerpendicularConstraintMode
          : key === "p"
          ? PauseMode
          : key === "d"
          ? DeleteMode
          : undefined;
      if (modeClass && !(this.#mode instanceof modeClass)) {
        this.#mode.cleanup();
        this.#mode = new modeClass(this.#universe, this.#displayFile);
      }
    });
  }

  loop() {
    this.#displayFile.twinkle();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
    const ctx = this.#canvas.getContext("2d");

    if (!ctx) throw new Error("canot get canvas context");

    ctx.fillStyle = "rgb(30 30 30 / 40%)";
    ctx.fillRect(
      0,
      0,
      this.#displayFile.logicalWidth,
      this.#displayFile.logicalHeight
    );

    ctx.fillStyle = "rgb(210 240 255 / 50%)";
    const pixels = this.#displayFile.pixels;
    if (pixels.length > 0) {
      let i = this.#pixelIndex;
      for (let j = 0; j < this.#pixelsPerDraw; j++) {
        i = (i + 1) % pixels.length;
        ctx.beginPath();
        ctx.arc(pixels[i][0], pixels[i][1], 1, 0, 2 * Math.PI);
        ctx.fill();
      }
      this.#pixelIndex = i;
    }

    // Display cursor
    let CURSOR_SIZE = 30;
    let CURSOR_STROKE = 2;
    let [mx, my] = this.#displayFile.mousePosition;
    ctx.fillRect(
      mx - CURSOR_SIZE / 2,
      my - CURSOR_STROKE / 2,
      CURSOR_SIZE,
      CURSOR_STROKE
    );
    ctx.fillRect(
      mx - CURSOR_STROKE / 2,
      my - CURSOR_SIZE / 2,
      CURSOR_STROKE,
      CURSOR_SIZE
    );
  }
}
