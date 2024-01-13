mod utils;

use std::fmt;
use wasm_bindgen::prelude::*;

extern crate web_sys;
use web_sys::console;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub struct Point {
    x: i32,
    y: i32,
}

#[wasm_bindgen]
pub struct Controller {
    width: i32,
    height: i32,
    points: Vec<Point>,
}

#[wasm_bindgen]
impl Controller {
    pub fn new(width: i32, height: i32) -> Controller {
        utils::set_panic_hook();
        let points: Vec<Point> = vec![Point { x: 1, y: 2 }];

        Controller {
            width,
            height,
            points,
        }
    }

    pub fn mouse_moved(&self, x: i32, y: i32) {
        log!("Mouse moved: {}, {}", x, y);
    }

    pub fn clicked(&mut self, x: i32, y: i32) {
        log!("Clicked: {}, {}", x, y);
        self.points.push(Point { x: x, y: y })
    }
}
