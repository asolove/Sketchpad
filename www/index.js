import { Controller } from "sketchpad";
import { memory } from "sketchpad/sketchpad_bg";

const WIDTH = 1024;
const HEIGHT = 1024;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

let controller = Controller.new();


let pixelsToDraw = [];
let LEFT = 100;
let RIGHT = 900;
let TOP = 200;
let BOTTOM = 800;
for(let x=LEFT; x<RIGHT; x++) {
  pixelsToDraw.push([x, TOP]);
}
for(let y=TOP; y<BOTTOM; y++) {
  pixelsToDraw.push([RIGHT, y]);
}
for(let x=LEFT; x<RIGHT; x++) {
  pixelsToDraw.push([x, BOTTOM]);
}
for(let y=BOTTOM; y>TOP; y--) {
  pixelsToDraw.push([LEFT, y]);
}

let randomize = () => {
  for(let i=0; i<pixelsToDraw.length; i++) {
    let j = (i + Math.random() * pixelsToDraw.length) % pixelsToDraw.length;
    let p = pixelsToDraw[j];
    pixelsToDraw[j] = pixelsToDraw[i];
    pixelsToDraw[i] = p;
  }
}


let i = 0;
let PIXELS_PER_DRAW = 100000 / 10 / 60;

let render = () => {
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgb(0 0 0 / 10%)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgb(230 240 255 / 50%)";
  for(let j=0; j<PIXELS_PER_DRAW; j++) {
    i++;
    ctx.beginPath();
    let pixel = pixelsToDraw[i % pixelsToDraw.length];
    ctx.arc(pixel[0], pixel[1], 1, 0, 2 * Math.PI);
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
