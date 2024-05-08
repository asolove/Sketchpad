import { Display, DisplayFile } from "../src/display";
import { Universe } from "../src/document";

let canvas = document.getElementById("sketchpad-canvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Can't find canvas");

let u = new Universe();
u.runConstraints = true;

let p0 = u.addPointInLineSegment([100, 100]);
u.addPointInLineSegment([900, 100]);
u.addPointInLineSegment([900, 900]);
u.addPointInLineSegment([100, 900]);
u.addPointInLineSegment(p0);

let p1 = u.addPointInLineSegment([0, 0]);
let pY = u.addPointInLineSegment([-900, -100]);
u.addPointInLineSegment([-900, -900]);
let pX = u.addPointInLineSegment([-100, -900]);
u.addPointInLineSegment(p1);

u.addSameXConstraint(p1, pX);
u.addSameYConstraint(p1, pY);

let p = u.currentPicture;

let p2 = u.addPicture();
u.addPointInLineSegment([0, 20]);
u.addPointInLineSegment([0, -20]);
u.currentPicture.addInstance(p, 100, -100, 0.5, Math.PI / 4);

let df = new DisplayFile();

let loop = () => {
  df.clear();
  u.display(df, df.displayTransform());
  requestAnimationFrame(loop);
};
loop();

let d = new Display(df, canvas);
