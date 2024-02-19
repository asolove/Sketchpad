mod utils;

use rand;
use rand::seq::SliceRandom;
use wasm_bindgen::prelude::*;

extern crate web_sys;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub struct Pixel {
    x: u16,
    y: u16,
}

#[wasm_bindgen]
pub struct Controller {
    pixels: Vec<Pixel>,
}

#[wasm_bindgen]
impl Controller {
    pub fn new() -> Controller {
        utils::set_panic_hook();
        let pixels: Vec<Pixel> = vec![Pixel { x: 1, y: 2 }];

        Controller { pixels }
    }

    pub fn pixels(&self) -> *const Pixel {
        self.pixels.as_ptr()
    }

    pub fn pixels_size(&self) -> usize {
        self.pixels.len()
    }

    pub fn mouse_moved(&self, x: u16, y: u16) {
        log!("Mouse moved: {}, {}", x, y);
    }

    pub fn clicked(&mut self, x: u16, y: u16) {
        log!("Clicked: {}, {}", x, y);
        self.pixels.push(Pixel { x: x, y: y })
    }

    pub fn show_ink(&mut self) {
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
