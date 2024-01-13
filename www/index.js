import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const FPS = new class {
  constructor() {
    this.fps = document.getElementById("fps");
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    // Convert the delta time since the last frame render into a measure
    // of frames per second.
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = 1 / delta * 1000;

    // Save only the latest 100 timings.
    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    // Find the max, min, and mean of our 100 latest timings.
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    let mean = sum / this.frames.length;

    // Render the statistics.
    this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
  }
};


const CELL_SIZE = 5; //px;
const GRID_COLOR = '#cccccc';
const DEAD_COLOR = '#ffffff';
const ALIVE_COLOR = '#000000';


const universe = Universe.new();
const height = universe.height();
const width = universe.width();

const canvas = document.getElementById("game-of-life-canvas");
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.height = (CELL_SIZE + 1) * height + 1;


let animationId = null;
const renderLoop = () => {
  universe.tick();
  render();

  animationId = requestAnimationFrame(renderLoop);
}

const isPaused = () => animationId === null;
const play = () => { 
  playPauseButton.textContent = "⏸︎";
  animationId = requestAnimationFrame(renderLoop);
}
const pause = () => {
  playPauseButton.textContent = "⏵︎";
  cancelAnimationFrame(animationId);
  animationId = null;
}

const playPauseButton = document.getElementById("play-pause");
playPauseButton.addEventListener("click", () => {
  if(isPaused()) {
    play();
  } else {
    pause();
  }
});
play();

const stopButton = document.getElementById("stop");
stopButton.addEventListener("click", () => {
  universe.clear_all();
  pause();
  render();
});

const getIndex = (row, column) => row * width + column;

const render = () => {
  const ctx = canvas.getContext('2d');

  // Grid
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;
  // vertical lines
  for (let i=0; i<=width; i++) {
    ctx.moveTo(i * (CELL_SIZE+1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE+1) + 1, height * (CELL_SIZE+1) + 1 );
  }

  // horizontal lines
  for (let i=0; i<=width; i++) {
    ctx.moveTo(0, i * (CELL_SIZE+1) + 1);
    ctx.lineTo(width * (CELL_SIZE+1) + 1, i * (CELL_SIZE+1) + 1 );
  }
  ctx.stroke();

  // cells
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width*height);
  ctx.beginPath();
  for(let r = 0; r<height; r++) {
    for(let c = 0; c<width; c++) {
      const cell = cells[getIndex(r, c)];
      ctx.fillStyle = cell === Cell.Alive ? ALIVE_COLOR : DEAD_COLOR;
      ctx.fillRect(
        c * (CELL_SIZE + 1) + 1,
        r * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      )
    }

    ctx.stroke();
  }
}

canvas.addEventListener("click", (e) => {
  const boundingRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (e.clientX - boundingRect.left) * scaleX;
  const canvasTop = (e.clientY - boundingRect.top) * scaleY;

  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE+1)), height - 1);

  universe.toggle_cell(row, col);
  render();
});

