import { Display, DisplayFile } from "../src/display";
import { Universe } from "../src/document";

console.log("Hello, world!");

let canvas = document.getElementById("sketchpad-canvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Can't find canvas");

let u = new Universe();
let df = new DisplayFile();
let d = new Display(df, canvas);

u.display(df, df.displayTransform());
