//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate sketchpad;
use sketchpad::Controller;

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);
