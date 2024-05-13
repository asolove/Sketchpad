import { clamp, distance, Position } from "./lib";
import { Drawable, Point, Universe } from "./document";

export interface Drawonable {
  drawPoint(point: Position, item: Drawable): void;
  drawLine(start: Position, end: Position, item: Drawable);
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
  nearMouse: Point | undefined;

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 0.5;
    this.pixels = [];
    this.mousePosition = [0, 0];
  }

  displayTransform(): DisplayTransform {
    return ([x, y]: Position): Position => {
      return [
        Math.round((x - this.cx) * this.zoom) + this.logicalWidth / 2,
        Math.round((this.cy - y) * this.zoom) + this.logicalHeight / 2,
      ];
    };
  }

  clear() {
    this.pixels = [];
    this.nearMouse = undefined;
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

    if (distance([x, y], this.mousePosition) < 8 && item instanceof Point) {
      this.nearMouse = item;
    }

    this.pixels.push([x, y]);
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
  cursorMoved(x: number, y: number) {}
  buttonDown() {}
  buttonUp() {}
}
export class MoveMode extends Mode {
  state: "dragging" | "panning" | "waiting" = "waiting";

  buttonDown() {
    if (this.state != "waiting") {
      console.error(`Received buttonDown in unexpected state: ${this.state}`);
      return;
    }

    if (this.displayFile.nearMouse) {
      this.state = "dragging";
      this.universe.addMovings([this.displayFile.nearMouse]);
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
    this.universe.clearMovings();
    this.universe.runConstraints = true;
    this.state = "waiting";
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

    let prevMX = 0;
    let prevMY = 0;
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
      this.#mode.buttonDown();
    });

    this.#canvas.addEventListener("mouseup", (e) => {
      this.#mode.buttonUp();
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
    if (pixels.length === 0) return;
    let i = this.#pixelIndex;
    for (let j = 0; j < this.#pixelsPerDraw; j++) {
      i = (i + 1) % pixels.length;
      ctx.beginPath();
      ctx.arc(pixels[i][0], pixels[i][1], 1, 0, 2 * Math.PI);
      ctx.fill();
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
    this.#pixelIndex = i;
  }
}
