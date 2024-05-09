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
let end1 = u.addPointInLineSegment([-100, 500]);
let end2 = u.addPointInLineSegment([100, 600]);
let end3 = u.addPointInLineSegment([-100, 700]);
let end4 = u.addPointInLineSegment([-20, 620]);
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

let c = u.addPoint([0, 0]);
let start = u.addPoint([200, 0]);
u.currentPicture.addCircle(c, start, start);

let h1 = u.addPoint([200, 0]);
let h2 = u.addPoint([80, -160]);
u.addLine(h1, h2);
let h3 = u.addPoint([-60, -160]);
u.addLine(h2, h3);
let h4 = u.addPoint([-190, 10]);
u.addLine(h3, h4);
let h5 = u.addPoint([-70, 140]);
u.addLine(h4, h5);
let h6 = u.addPoint([70, 150]);
u.addLine(h5, h6);
u.addLine(h6, h1);
u.currentPicture.addPointOnArcConstraint(h1, c, start, start);
u.currentPicture.addPointOnArcConstraint(h2, c, start, start);
u.currentPicture.addPointOnArcConstraint(h3, c, start, start);
u.currentPicture.addPointOnArcConstraint(h4, c, start, start);
u.currentPicture.addPointOnArcConstraint(h5, c, start, start);
u.currentPicture.addPointOnArcConstraint(h6, c, start, start);
u.currentPicture.addSameDistanceConstraint(h1, h2, h2, h3);
u.currentPicture.addSameDistanceConstraint(h2, h3, h3, h4);
u.currentPicture.addSameDistanceConstraint(h3, h4, h5, h6);
u.currentPicture.addSameDistanceConstraint(h4, h5, h6, h1);

let df = new DisplayFile();

let loop = () => {
  df.clear();
  u.display(df, df.displayTransform());
  requestAnimationFrame(loop);
};
loop();

let d = new Display(df, canvas);
