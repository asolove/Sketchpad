import type { Position } from "./lib";
import { Arc, Line, type Point, type Universe } from "./document";
import type { DisplayFile } from "./display";
import { chickenParent, collectChickens } from "./ring";

export class Controller {
  universe: Universe;
  pictureCount: number;

  container: Element;
  select: HTMLSelectElement;

  constructor(container: Element, universe: Universe) {
    this.universe = universe;
    this.pictureCount = 0;
    this.container = container;
    this.select = document.createElement("select");
    this.container.appendChild(this.select);
    this.select.addEventListener("change", (e) => {
      let target: HTMLSelectElement = e.currentTarget as any;
      let newIndex = parseInt(target.value || "", 10);
      if (this.universe.pictures[newIndex]) {
        this.universe.currentPicture = this.universe.pictures[newIndex];
      } else if (target.value === "New") {
        this.universe.addPicture();
      }
    });

    this.loop();
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
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
    console.log({
      constraints: collectChickens(constraints),
      parts: collectChickens(parts),
    });
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
