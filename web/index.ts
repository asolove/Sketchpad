import { Display, DisplayFile } from "../src/display";
import { Universe } from "../src/document";

let canvas = document.getElementById("sketchpad-canvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Can't find canvas");

let u = new Universe();
u.runConstraints = true;

// line with arrowheads
u.addPointInLineSegment([0, 100]);
let p1 = u.addPointInLineSegment([-20, 80]);
u.addPointInLineSegment([0, 100]);
let p2 = u.addPointInLineSegment([20, 80]);
u.addPointInLineSegment([0, 100]);
u.addPointInLineSegment([0, -100]);
let p3 = u.addPointInLineSegment([-20, -80]);
u.addPointInLineSegment([0, -100]);
let p4 = u.addPointInLineSegment([20, -80]);

u.addSameYConstraint(p1, p2);
u.addSameXConstraint(p1, p3);
u.addSameXConstraint(p2, p4);
u.addSameYConstraint(p3, p4);

let arrowPic = u.currentPicture;

let newPic = u.addPicture();
u.currentPicture.addInstance(arrowPic, 200, -200, 1, Math.PI / 4);
u.currentPicture.addInstance(arrowPic, -200, 180, 0.8, Math.PI / 2);
u.currentPicture.addInstance(arrowPic, 600, 180, 1.3, (-3 * Math.PI) / 4);
u.currentPicture.addInstance(arrowPic, 720, 1000, 1, (3 * Math.PI) / 4);

let df = new DisplayFile();

let loop = () => {
  df.clear();
  u.display(df, df.displayTransform());
  requestAnimationFrame(loop);
};
loop();

let d = new Display(df, canvas);
