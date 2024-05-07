import { Display, DisplayFile } from "../src/display";
import { Universe } from "../src/document";

let canvas = document.getElementById("sketchpad-canvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Can't find canvas");

let u = new Universe();

u.addPointInLineSegment([100, 100]);
u.addPointInLineSegment([900, 100]);
u.addPointInLineSegment([900, 900]);
u.addPointInLineSegment([100, 900]);
u.addPointInLineSegment([100, 100]);

u.addPointInLineSegment([-100, -100]);
u.addPointInLineSegment([-900, -100]);
u.addPointInLineSegment([-900, -900]);
u.addPointInLineSegment([-100, -900]);
u.addPointInLineSegment([-100, -100]);

let df = new DisplayFile();

let loop = () => {
  df.clear();
  u.display(df, df.displayTransform());
  requestAnimationFrame(loop);
};
loop();

let d = new Display(df, canvas);
