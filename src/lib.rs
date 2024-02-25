mod utils;

use rand;
use rand::seq::SliceRandom;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

extern crate web_sys;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Pixel {
    x: u16,
    y: u16,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct DisplayFile {
    pixels: Vec<Pixel>,
}

#[wasm_bindgen]
impl DisplayFile {
    pub fn new() -> DisplayFile {
        let pixels: Vec<Pixel> = vec![Pixel { x: 1, y: 2 }];

        DisplayFile { pixels }
    }

    pub fn pixels(&self) -> *const Pixel {
        self.pixels.as_ptr()
    }

    pub fn pixels_size(&self) -> usize {
        self.pixels.len()
    }

    pub fn show_line(&mut self, x1: u16, y1: u16, x2: u16, y2: u16) {
        let xdiff = x2.abs_diff(x1);
        let ydiff = y2.abs_diff(y1);
        let steps = xdiff.max(ydiff);

        let dx = (x2 as i32 - x1 as i32) as f64 / steps as f64;
        let dy = (y2 as i32 - y1 as i32) as f64 / steps as f64;

        let mut x: f64 = x1 as f64;
        let mut y: f64 = y1 as f64;
        for _ in 0..steps {
            self.pixels.push(Pixel {
                x: x.round() as u16,
                y: y.round() as u16,
            });
            x = x + dx;
            y = y + dy;
        }
    }

    // TODO: add in drawing only sub-arcs of the circle
    pub fn show_circle(&mut self, cx: u16, cy: u16, radius: u16) {
        let cxf: f64 = cx as f64;
        let cyf: f64 = cy as f64;
        let r: f64 = radius as f64;

        let mut x1: f64 = (cx + radius) as f64;
        let mut y1: f64 = cy as f64;

        // TODO: how do we know when to stop?
        let steps = 628;
        for _ in 0..steps {
            self.pixels.push(Pixel {
                x: x1.round() as u16,
                y: y1.round() as u16,
            });

            // Sutherland's thesis, p.78, figure 5-5
            x1 = x1 + (1.0 / r) * (y1 - cyf);
            y1 = y1 - (1.0 / r) * (x1 - cxf);
        }
    }

    pub fn twinkle(&mut self) {
        let mut rng = rand::thread_rng();
        self.pixels.as_mut_slice().shuffle(&mut rng);
    }
}

#[derive(Clone)]
pub struct Display {
    cx: i64,
    cy: i64,
    scale: f64,
    width: u64,
    height: u64,
}

#[wasm_bindgen]
pub struct Controller {
    universe: Universe,
    display_file: DisplayFile,
    display: Display,
}

#[wasm_bindgen]
impl Controller {
    pub fn new() -> Controller {
        utils::set_panic_hook();
        Controller {
            universe: Universe::new(),
            display_file: DisplayFile::new(),
            display: Display {
                cx: 0,
                cy: 0,
                scale: 1.5,
                width: 1024,
                height: 1024,
            },
        }
    }

    pub fn draw(&mut self) {
        self.display_file.pixels.clear();
        let picture = self.universe.pictures.get(0).unwrap_throw();
        picture.deref().draw(&self.display, &mut self.display_file);
        self.display_file.twinkle();
    }

    pub fn display_file(&self) -> DisplayFile {
        self.display_file.clone()
    }

    pub fn mouse_moved(&self, x: u16, y: u16) {
        // log!("Mouse moved: {}, {}", x, y);
    }

    pub fn clicked(&mut self, x: u16, y: u16) {
        // log!("Clicked: {}, {}", x, y);
        self.display_file.pixels.push(Pixel { x: x, y: y })
    }
}

pub trait Draw {
    fn draw(&self, display: &Display, df: &mut DisplayFile);
}

pub trait Topo: Draw {}

pub struct Line {
    start: Rc<Point>,
    end: Rc<Point>,
}

impl Draw for Line {
    fn draw(&self, display: &Display, df: &mut DisplayFile) {
        // TODO: find intersection of line and boundaries of display
        let start = self.start.deref().to_pixel(display);
        let end = self.end.deref().to_pixel(display);

        df.show_line(start.x, start.y, end.x, end.y);
    }
}
impl Topo for Line {}

pub trait Variable {}

pub struct Point {
    x: i64,
    y: i64,
}
impl Variable for Point {}

impl Point {
    fn to_pixel(&self, display: &Display) -> Pixel {
        // TODO: think about number conversions here: Pixel only allows valid coords,
        // but it's not until negative or out-of-range that we know we're off-screen
        Pixel {
            x: ((self.x - display.cx as i64) as f64 * display.scale + display.width as f64 / 2.0)
                .round() as u16,
            y: ((self.y - display.cy as i64) as f64 * display.scale + display.height as f64 / 2.0)
                .round() as u16,
        }
    }
}

// p.148
pub struct Picture {
    topos: Vec<Rc<Topo>>,
    variables: Vec<Rc<Variable>>,
}

impl Draw for Picture {
    fn draw(&self, display: &Display, df: &mut DisplayFile) {
        for topo in &self.topos {
            topo.draw(display, df);
        }
    }
}

pub struct Universe {
    pictures: Vec<Rc<Picture>>,
}

impl Universe {
    /*

        self.pixels = vec![];
        const TOP: u16 = 200;
        const BOTTOM: u16 = 800;
        const LEFT: u16 = 100;
        const RIGHT: u16 = 900;
        self.show_line(LEFT, TOP, RIGHT, TOP);
        self.show_line(RIGHT, TOP, RIGHT, BOTTOM);
        self.show_line(RIGHT, BOTTOM, LEFT, BOTTOM);
        self.show_line(LEFT, BOTTOM, LEFT, TOP);

        self.show_line(LEFT, BOTTOM, RIGHT, TOP);

        self.show_circle(300, 300, 100);
        self.show_line(200, 200, 200, 400);
        self.show_line(400, 200, 400, 400);
    */
    pub fn new() -> Universe {
        let ul = Rc::new(Point { x: -300, y: -300 });
        let ur = Rc::new(Point { x: 300, y: -300 });
        let bl = Rc::new(Point { x: -300, y: 300 });
        let br = Rc::new(Point { x: 300, y: 300 });

        let top = Rc::new(Line {
            start: Rc::clone(&ul),
            end: Rc::clone(&ur),
        });
        let right = Rc::new(Line {
            start: Rc::clone(&ur),
            end: Rc::clone(&br),
        });
        let bottom = Rc::new(Line {
            start: Rc::clone(&br),
            end: Rc::clone(&bl),
        });
        let left = Rc::new(Line {
            start: Rc::clone(&bl),
            end: Rc::clone(&ul),
        });
        let angle = Rc::new(Line {
            start: Rc::clone(&bl),
            end: Rc::clone(&ur),
        });

        let picture = Picture {
            topos: vec![top, right, bottom, left, angle],
            variables: vec![ul, ur, bl, br],
        };
        Universe {
            pictures: vec![Rc::new(picture)],
        }
    }
}
