mod utils;

use std::{char::MAX, fmt};
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
        let TOP = 200;
        let BOTTOM = 800;
        let LEFT = 100;
        let RIGHT = 900;
        self.show_line(LEFT, TOP, RIGHT, TOP);
        self.show_line(RIGHT, TOP, RIGHT, BOTTOM);
        self.show_line(RIGHT, BOTTOM, LEFT, BOTTOM);
        self.show_line(LEFT, BOTTOM, LEFT, TOP);
    }

    pub fn show_line(&mut self, x1: u16, y1: u16, x2: u16, y2: u16) {
        let xdiff = x2.abs_diff(x1);
        let ydiff = y2.abs_diff(y1);
        let steps = xdiff.max(ydiff);

        let dx = xdiff as f64 / steps as f64;
        let dy = ydiff as f64 / steps as f64;

        let mut x = x2.min(x1);
        let mut y: u16 = y2.min(y1);
        for step in 0..steps {
            self.pixels.push(Pixel { x, y });
            x = (x as f64 + dx).round() as u16;
            y = (y as f64 + dy).round() as u16;
        }
    }
}
