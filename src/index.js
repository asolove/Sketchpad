const WIDTH = 800;
const HEIGHT = 800;

let screen = document.getElementById("screen");
let ctx = screen.getContext("2d");

let state = {
  points: [[10, 30], [100, 300]],
  lines: [[0,1]]
}

let renderLoop = () => {
  render(state);
  requestAnimationFrame(renderLoop);
}

let render = (state) => {
  ctx.imageSmoothingEnabled = false;
  // Background and clear old state
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";

  // Lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  state.lines.forEach(line => {
    ctx.beginPath();
    ctx.moveTo(...state.points[line[0]]);
    ctx.lineTo(...state.points[line[1]]);
    ctx.closePath();
    ctx.stroke();
  });

  // Points
  state.points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
  });

}

let listen = (el, event, cb) => {
  el.addEventListener(event, cb);
  return () => {
    el.removeEventListener(event, cb);
  }
}

// Editor control states: 
let pen = () => {
  return listen(screen, "click", (e) => {
    state.points.push([e.offsetX, e.offsetY]);
    state.lines.push([state.points.length-2, state.points.length-1]);
  });
};

let init = () => {
  pen();
  renderLoop();
}

init();