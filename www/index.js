import { Controller } from "sketchpad";
import { memory } from "sketchpad/sketchpad_bg";

const WIDTH = 800;
const HEIGHT = 600;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

let controller = Controller.new();

let loop = () => {
  requestAnimationFrame(loop);
  render();
}

let render = () => {
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 10, 10);
}

canvas.addEventListener("mousemove", (e) => {
  // Assumes no scaling in canvas.
  controller.mouse_moved(e.offsetX, e.offsetY);
});

canvas.addEventListener("click", (e) => {
  // Assumes no scaling in canvas.
  controller.clicked(e.offsetX, e.offsetY);
});