import { clamp, distance, type Position } from "./lib";
import {
  type Drawable,
  Point,
  Universe,
  Arc,
  Line,
  Instance,
} from "./document";
import { chickenParent, collectChickens, isEmptyChicken } from "./ring";
import {
  ArcMode,
  DeleteMode,
  LineMode,
  MoveMode,
  PauseMode,
  PerpendicularConstraintMode,
  type Mode,
} from "./controller";

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
  shapesNearCursor: Set<Arc | Line | Instance>;

  shouldTwinkle: boolean;

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 0.5;
    this.pixels = [];
    this.mousePosition = [0, 0];
    this.shouldTwinkle = true;

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

  prepare() {
    // anything the file should do each render
    if (this.shouldTwinkle) this.twinkle();
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
    } else if (
      item instanceof Arc ||
      item instanceof Line ||
      item instanceof Instance
    ) {
      if (item.isMoving()) return;

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

export class Display {
  #universe: Universe; // FIXME: remove this reference
  #displayFile: DisplayFile;
  #canvas: HTMLCanvasElement;
  #pixelsPerDraw = 1000;
  #pixelIndex = 0;

  constructor(df: DisplayFile, canvas: HTMLCanvasElement, universe: Universe) {
    this.#displayFile = df;
    this.#canvas = canvas;
    this.#universe = universe;

    this.loop();
  }

  loop() {
    this.#displayFile.prepare();
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
