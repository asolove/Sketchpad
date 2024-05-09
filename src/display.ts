import { clamp, Position } from "./lib";

export interface Drawonable {
  drawPoint(point: Position): void;
  drawLine(start: Position, end: Position);
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

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 0.5;
    this.pixels = [];
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
  }

  twinkle() {
    let times = this.pixels.length;
    for (let i = 0; i < times; i++) {
      let j = Math.floor(Math.random() * times);
      let k = Math.floor(Math.random() * times);
      [this.pixels[j], this.pixels[k]] = [this.pixels[k], this.pixels[j]];
    }
  }

  drawPoint([x, y]: Position): void {
    if (x < 0 || x > this.logicalWidth) return;
    if (y < 0 || y > this.logicalHeight) return;
    this.pixels.push([x, y]);
  }

  drawLine([x1, y1]: Position, [x2, y2]: Position): void {
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
      this.drawPoint([Math.round(xNext), Math.round(yNext)]);
      x = xNext;
      y = yNext;
    }
  }
}

export class Display {
  #displayFile: DisplayFile;
  #canvas: HTMLCanvasElement;
  #pixelsPerDraw = 1000;
  #pixelIndex = 0;

  constructor(df: DisplayFile, canvas: HTMLCanvasElement) {
    this.#displayFile = df;
    this.#canvas = canvas;

    // TODO: react to dom changes?
    let xScale = canvas.width / this.#displayFile.logicalWidth;
    let yScale = canvas.height / this.#displayFile.logicalHeight;
    canvas.getContext("2d")?.scale(xScale, yScale);

    this.loop();

    this.#canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      let zoom = this.#displayFile.zoom;
      zoom += e.deltaY * -0.01;
      zoom = clamp(0.1, zoom, 10);
      this.#displayFile.zoom = zoom;
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

    ctx.fillStyle = "rgb(30 30 30 / 20%)";
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
    this.#pixelIndex = i;
  }
}
