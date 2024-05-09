import { Display, DisplayFile } from "../src/display";
import { Universe } from "../src/document";

let canvas = document.getElementById("sketchpad-canvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Can't find canvas");

let u = new Universe();
u.runConstraints = true;

// line with arrowheads
let arrowPic = u.currentPicture;
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

// Point on line
let pointOnLinePic = u.addPicture();
let end1 = u.addPointInLineSegment([-100, -100]);
let end2 = u.addPointInLineSegment([100, 100]);
let end3 = u.addPointInLineSegment([-100, 100]);
let end4 = u.addPointInLineSegment([-20, 20]);
let point = u.addPoint([20, 20]);
pointOnLinePic.addPointOnLineConstraint(point, end1, end2);
pointOnLinePic.addPointOnLineConstraint(point, end3, end4);

let combinedPic = u.addPicture();
u.currentPicture.addInstance(pointOnLinePic, 0, 0, 1, 0);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, 0);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, Math.PI / 6);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, Math.PI / 3);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, (3 * Math.PI) / 6);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, (2 * Math.PI) / 3);
u.currentPicture.addInstance(arrowPic, 200, -200, 1, (5 * Math.PI) / 6);

let c = u.addPoint([-300, 300]);
let start = u.addPoint([-500, 300]);
let end = u.addPoint([-100, 300]);
u.currentPicture.addCircle(c, start, end);

let pa = u.addPointInLineSegment([-500, -500]);
let pb = u.addPointInLineSegment([-400, -200]);
let pc = u.addPointInLineSegment([-300, -600]);
u.currentPicture.addSameDistanceConstraint(pa, pb, pb, pc);

let df = new DisplayFile();

let loop = () => {
  df.clear();
  u.display(df, df.displayTransform());
  requestAnimationFrame(loop);
};
loop();

let d = new Display(df, canvas);
