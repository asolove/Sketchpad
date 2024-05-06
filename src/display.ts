export interface Drawonable {
  drawPoint(x: number, y: number): void;
}

export interface DisplayTransform {
  (x: number, y: number): [number, number];
}

export class DisplayFile implements Drawonable {
  pixels: [number, number][];
  cx: number;
  cy: number;
  zoom: number;

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 1;
    this.pixels = [];
  }

  displayTransform(): DisplayTransform {
    return (x: number, y: number): [number, number] => {
      return [
        Math.round((x - this.cx) * this.zoom),
        Math.round((y - this.cy) * this.zoom),
      ];
    };
  }

  clear() {
    this.pixels = [];
  }

  drawPoint(x: number, y: number): void {
    this.pixels.push([x, y]);
  }
}

export class Display {
  #displayFile: DisplayFile;
  #canvas: HTMLCanvasElement;

  constructor(df: DisplayFile, canvas: HTMLCanvasElement) {
    this.#displayFile = df;
    this.#canvas = canvas;

    requestAnimationFrame(() => this.render());
  }

  render() {
    const ctx = this.#canvas.getContext("2d");
    if (!ctx) throw new Error("canot get canvas context");

    ctx.fillStyle = "rgb(200 0 0)";
    ctx.fillRect(1, 1, 2, 2);
  }
}
