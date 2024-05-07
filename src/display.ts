import { clamp } from "./lib";

export interface Drawonable {
  drawPoint(point: [number, number]): void;
  drawLine(start: [number, number], end: [number, number]);
}

export interface DisplayTransform {
  ([x, y]: [number, number]): [number, number];
}

export class DisplayFile implements Drawonable {
  pixels: [number, number][];
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
    return ([x, y]: [number, number]): [number, number] => {
      return [
        Math.round((x - this.cx) * this.zoom) + this.logicalWidth / 2,
        Math.round((y - this.cy) * this.zoom) + this.logicalHeight / 2,
      ];
    };
  }

  clear() {
    this.pixels = [];
  }

  drawPoint([x, y]: [number, number]): void {
    this.pixels.push([x, y]);
  }

  drawLine([x1, y1]: [number, number], [x2, y2]: [number, number]): void {
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
      this.pixels.push([Math.round(xNext), Math.round(yNext)]);
      x = xNext;
      y = yNext;
    }
  }
}

export class Display {
  #displayFile: DisplayFile;
  #canvas: HTMLCanvasElement;
  #pixelsPerDraw = 2000;
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
      zoom += e.deltaY * 0.01;
      zoom = clamp(0.1, zoom, 10);
      this.#displayFile.zoom = zoom;
    });
  }

  loop() {
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

    ctx.fillStyle = "rgb(230 240 255 / 50%)";
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
