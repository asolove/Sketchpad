import { Controller, Pixel } from "sketchpad";
import { memory } from "sketchpad/sketchpad_bg";

const WIDTH = 1024;
const HEIGHT = 1024;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

let controller = Controller.new();
controller.show_ink();

let i = 0;
let PIXELS_PER_DRAW = 100000 / 20 / 60;

let render = () => {
  const pixels = new Uint16Array(memory.buffer, controller.pixels(), 2 * controller.pixels_size());

  let ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgb(0 0 0 / 3%)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgb(230 240 255 / 50%)";
  for(let j=0; j<controller.pixels_size(); j++) {
    ctx.beginPath();
    let xIndex = j * 2;
    ctx.arc(pixels[xIndex], pixels[xIndex + 1], 1, 0, 2 * Math.PI);
    ctx.fill();
  }
}

canvas.addEventListener("mousemove", (e) => {
  // Assumes no scaling in canvas.
  controller.mouse_moved(e.offsetX, e.offsetY);
});

canvas.addEventListener("click", (e) => {
  // Assumes no scaling in canvas.
  controller.clicked(e.offsetX, e.offsetY);
});

let loop = () => {
  requestAnimationFrame(loop);
  render();
}

loop();
