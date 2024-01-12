import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

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

const renderLoop = () => {
  universe.tick();
  render();

  requestAnimationFrame(renderLoop);
}

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



requestAnimationFrame(renderLoop);
