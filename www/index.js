import { Controller, Pixel } from "sketchpad";
import { memory } from "sketchpad/sketchpad_bg";


const SCALE = 1; // scaling between Sketchpad pixels and monitor pixels
const WIDTH = 1024 * SCALE;
const HEIGHT = 1024 * SCALE;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

let controller = Controller.new();
controller.show_ink();
controller.twinkle();

let i = 0;
let PIXELS_PER_DRAW = 100000 / 10 / 60;

let ctx = canvas.getContext('2d');
ctx.scale(SCALE, SCALE);

let render = () => {
  const pixels = new Uint16Array(memory.buffer, controller.pixels(), 2 * controller.pixels_size());

  ctx.fillStyle = "rgb(40 40 40 / 5%)";
  ctx.fillRect(0, 0, WIDTH / SCALE, HEIGHT / SCALE);

  ctx.fillStyle = "rgb(230 240 255 / 50%)";
  for(let j=0; j<PIXELS_PER_DRAW; j++) {
    i = (i + 1) % controller.pixels_size();
    ctx.beginPath();
    let xIndex = i * 2;
    ctx.arc(pixels[xIndex], pixels[xIndex + 1], 1, 0, 2 * Math.PI);
    ctx.fill();
  }
}

canvas.addEventListener("mousemove", (e) => {
  // Assumes no scaling in canvas.
  controller.mouse_moved(e.offsetX / SCALE, e.offsetY / SCALE);
});

canvas.addEventListener("click", (e) => {
  // Assumes no scaling in canvas.
  controller.clicked(e.offsetX / SCALE, e.offsetY / SCALE);
});

let loop = () => {
  requestAnimationFrame(loop);
  render();
}

loop();
