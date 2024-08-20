import { clamp, type Position } from "./lib";
import { Arc, Line, type Point, type Universe } from "./document";
import type { DisplayFile } from "./display";
import { chickenParent, collectChickens } from "./ring";

export class Controller {
  universe: Universe;
  displayFile: DisplayFile;
  pictureCount: number;

  canvas: HTMLCanvasElement;
  mode: Mode;

  container: Element;
  select: HTMLSelectElement;
  modeInputs: Array<HTMLInputElement>;
  twinkleInput: HTMLInputElement;

  constructor(
    container: Element,
    canvas: HTMLCanvasElement,
    universe: Universe,
    displayFile: DisplayFile
  ) {
    this.universe = universe;
    this.pictureCount = 0;
    this.container = container;
    this.canvas = canvas;
    this.select = this.container.querySelector("#current-picture")!;
    this.modeInputs = Array.from(
      this.container.querySelectorAll("input[type=radio][name=mode]")
    );
    this.twinkleInput = this.container.querySelector(
      "input[name=twinkle]"
    ) as HTMLInputElement;

    this.displayFile = displayFile;

    // Initialize controller events
    this.select.addEventListener("change", (e) => {
      let target: HTMLSelectElement = e.currentTarget as any;
      let newIndex = parseInt(target.value || "", 10);
      if (this.universe.pictures[newIndex]) {
        this.universe.currentPicture = this.universe.pictures[newIndex];
      } else if (target.value === "New") {
        this.universe.addPicture();
      }
    });

    this.modeInputs.forEach((input) => {
      input.addEventListener("change", (e: any) => {
        let newMode = modeClassByName(e.target.value);
        if (newMode) this.changeMode(newMode);
      });
    });

    this.twinkleInput.addEventListener("change", (e) => {
      this.displayFile.shouldTwinkle = (e.target as HTMLInputElement).checked;
    });

    // Initialize display-related controller events

    // TODO: react to dom changes?
    // FIXME: get displayFile size?
    let xScale = canvas.width / this.displayFile.logicalWidth;
    let yScale = canvas.height / this.displayFile.logicalHeight;
    canvas.getContext("2d")?.scale(xScale, yScale);

    this.mode = new MoveMode(universe, this.displayFile);

    this.canvas.style.cursor = "none";

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      // FIXME: get displayFile zoom?
      let zoom = this.displayFile.zoom;
      zoom += e.deltaY * -0.01;
      zoom = clamp(0.1, zoom, 10);
      this.displayFile.zoom = zoom;
    });

    // FIXME: clean up using multiple coordinate frames for mouse events,

    let prevMX = 0;
    let prevMY = 0;
    let docPosition = (canvasPosition: Position): Position =>
      this.displayFile.inverseDisplayTransform()(canvasPosition);

    this.canvas.addEventListener("mousemove", (e) => {
      // Translate from DOM coordinates to DisplayFile coordinates.
      let mx = e.offsetX / xScale;
      let my = e.offsetY / yScale;

      this.displayFile.mousePosition = [mx, my];

      let dx = (mx - prevMX) / this.displayFile.zoom;
      let dy = -(my - prevMY) / this.displayFile.zoom;

      this.mode.cursorMoved(dx, dy);

      prevMX = mx;
      prevMY = my;
    });

    this.canvas.addEventListener("mousedown", (e) => {
      this.mode.buttonDown(
        this.displayFile.inverseDisplayTransform()([
          e.offsetX / xScale,
          e.offsetY / yScale,
        ])
      );
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.mode.buttonUp(
        this.displayFile.inverseDisplayTransform()([
          e.offsetX / xScale,
          e.offsetY / yScale,
        ])
      );
    });

    // FIXME: listening at document level is a problem.
    this.canvas.ownerDocument.addEventListener("keyup", (e: KeyboardEvent) => {
      // FIXME: cleanup state? prevent reset?
      let key = e.key;
      let modeClass =
        key === "l"
          ? LineMode
          : key === "m"
          ? MoveMode
          : key === "a"
          ? ArcMode
          : key === "c"
          ? PerpendicularConstraintMode
          : key === "p"
          ? PauseMode
          : key === "d"
          ? DeleteMode
          : undefined;
      if (modeClass && !(this.mode instanceof modeClass)) {
        this.mode.cleanup();
        this.mode = new modeClass(this.universe, this.displayFile);
      }
    });

    this.loop();
  }

  changeMode<M extends ConcreteMode>(newModeClass: M) {
    this.mode.cleanup();
    this.mode = new newModeClass(this.universe, this.displayFile);
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
    // Mode radio buttons
    this.modeInputs.forEach((input) => {
      let modeClass = modeClassByName(input.value);
      if (!modeClass) return;
      if (this.mode instanceof modeClass) input.checked = true;
    });

    // Current picture dropdown
    let pictureCount = this.universe.pictures.length;
    if (pictureCount === this.pictureCount) return;
    this.pictureCount = pictureCount;

    let options = "";
    for (let i = 0; i < pictureCount; i++) {
      let selected = this.universe.currentPicture == this.universe.pictures[i];
      options += `<option ${selected ? "selected" : ""}>${i}</option>`;
    }
    options += "<option>New</option>";
    this.select.innerHTML = options;
  }
}

export abstract class Mode {
  universe: Universe;
  displayFile: DisplayFile;

  constructor(universe: Universe, displayFile: DisplayFile) {
    this.universe = universe;
    this.displayFile = displayFile;
  }
  cursorMoved(dx: number, dy: number) {}
  buttonDown(position: Position) {}
  buttonUp(position: Position) {}

  cleanup() {}
}

type ConcreteMode = (new (u: Universe, df: DisplayFile) => Mode) & typeof Mode;

export class LineMode extends Mode {
  movingPoint: Point | undefined;

  buttonDown(position: Position) {
    if (this.displayFile.pointNearestCursor && this.movingPoint) {
      this.displayFile.pointNearestCursor.merge(this.movingPoint);
      this.universe.clearMovings();
      this.movingPoint = undefined;
    } else {
      let toPoint = this.universe.currentPicture.addPoint(position);
      // FIXME: refactor a helper to get the current point
      let fromPoint =
        this.movingPoint ||
        this.displayFile.pointNearestCursor ||
        this.universe.currentPicture.addPoint(position);
      this.universe.currentPicture.addLine(fromPoint, toPoint);
      if (!this.displayFile.pointNearestCursor) {
        this.displayFile.shapesNearCursor.forEach((shape) => {
          if (shape instanceof Arc || shape instanceof Line) {
            shape.constrainPoint(fromPoint);
          }
        });
      }

      this.universe.clearMovings();
      this.universe.addMovings([toPoint]);
      this.movingPoint = toPoint;
    }
  }

  cursorMoved(dx: number, dy: number) {
    this.universe.moveMovings([dx, dy]);
  }

  cleanup() {
    // TODO: remove moving point
    this.universe.clearMovings();
  }
}

export class PauseMode extends Mode {
  constructor(universe: Universe, displayFile: DisplayFile) {
    super(universe, displayFile);
    this.universe.runConstraints = false;

    const { constraints, parts } = this.universe.currentPicture;
  }

  cleanup() {
    this.universe.runConstraints = true;
  }
}

export class ArcMode extends Mode {
  arc: Arc | undefined;
  next: "start" | "end" | undefined;

  makeCurrentPoint(position: Position): Point {
    let nearPoint = this.displayFile.pointNearestCursor;
    if (nearPoint) return nearPoint;

    let newPoint = this.universe.currentPicture.addPoint(position);
    this.displayFile.shapesNearCursor.forEach((shape) => {
      if (shape instanceof Arc || shape instanceof Line) {
        shape.constrainPoint(newPoint);
      }
    });
    return newPoint;
  }

  buttonUp(position: Position) {
    if (!this.arc) {
      let center = this.makeCurrentPoint(position);
      let start = this.universe.currentPicture.addPoint(position);
      let end = this.universe.currentPicture.addPoint(position);
      this.arc = this.universe.currentPicture.addArc(center, start, end);
      this.universe.addMovings([start, end]);
      this.next = "start";
      this.universe.runConstraints = false;
    } else if (this.next === "start") {
      let currentPoint = this.makeCurrentPoint(position);
      currentPoint.merge(chickenParent(this.arc.start));

      this.universe.clearMovings();
      this.universe.addMovings([chickenParent(this.arc.end)]);
      this.next = "end";
    } else {
      let currentPoint = this.makeCurrentPoint(position);
      currentPoint.merge(chickenParent(this.arc.end));
      this.universe.clearMovings();
      this.arc = undefined;

      this.universe.runConstraints = true;
    }
  }

  cursorMoved(dx: number, dy: number) {
    this.universe.moveMovings([dx, dy]);
  }

  cleanup() {
    // FIXME: remove partially-done arcs
    this.universe.clearMovings();
    this.universe.runConstraints = true;
  }
}

export class MoveMode extends Mode {
  state: "dragging" | "panning" | "waiting" = "waiting";

  buttonDown(_position: Position) {
    if (this.state != "waiting") {
      console.error(`Received buttonDown in unexpected state: ${this.state}`);
      return;
    }

    if (this.displayFile.pointNearestCursor) {
      this.state = "dragging";
      this.universe.addMovings([this.displayFile.pointNearestCursor]);
      this.universe.runConstraints = false;
    } else if (this.displayFile.shapesNearCursor.size > 0) {
      this.state = "dragging";
      this.universe.addMovings([...this.displayFile.shapesNearCursor]);
      this.universe.runConstraints = false;
    } else {
      this.state = "panning";
    }
  }

  cursorMoved(dx: number, dy: number) {
    switch (this.state) {
      case "dragging":
        // Translate from DisplayFile coordinate offsets to Universe coordinate offsets
        this.universe.moveMovings([dx, dy]);
        return;
      case "panning":
        // FIXME: make this a single message.
        this.displayFile.cx -= dx;
        this.displayFile.cy -= dy;
        return;
    }
  }

  buttonUp() {
    // FIXME: run merge if there is an appropriate thing nearby
    this.universe.clearMovings();
    this.universe.runConstraints = true;
    this.state = "waiting";
  }

  cleanup() {
    this.universe.clearMovings();
    this.universe.runConstraints = true;
  }
}

export class ConstraintMode extends Mode {}

type PerpendicularConstraintModeState =
  | { state: "start" }
  | { state: "first"; previousLine: Line };
export class PerpendicularConstraintMode extends Mode {
  state: PerpendicularConstraintModeState = { state: "start" };

  buttonDown(_position: Position) {
    function isLine(shape: unknown): shape is Line {
      return shape instanceof Line;
    }
    let currentLine = [...this.displayFile.shapesNearCursor].find(isLine);

    if (this.state.state === "start") {
      if (currentLine)
        this.state = { state: "first", previousLine: currentLine };
    } else {
      if (currentLine) {
        let firstLine = this.state.previousLine;
        this.universe.currentPicture.addPerpendicularConstraint(
          firstLine.startPoint,
          firstLine.endPoint,
          currentLine.startPoint,
          currentLine.endPoint
        );
        this.state.previousLine = currentLine;
      }
    }
  }
}

export class DeleteMode extends Mode {
  buttonUp(_position: Position) {
    if (this.displayFile.pointNearestCursor) {
      this.displayFile.pointNearestCursor.remove();
    } else {
      this.displayFile.shapesNearCursor.values().next().value?.remove();
    }
  }
}

let modeClassNames: { [name: string]: ConcreteMode } = {
  move: MoveMode,
  line: LineMode,
  arc: ArcMode,
  delete: DeleteMode,
  pause: PauseMode,
};

function modeClassByName(name: string): ConcreteMode | undefined {
  return modeClassNames[name];
}
