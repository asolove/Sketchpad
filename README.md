# Sketchpad

An in-progress re-implementation of Ivan Sutherland's Sketchpad,
runnable in webassembly in the browser.

## How to use

### Initial setup

- Install [Rust stable](https://rustup.rs/)
- Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- Install Node (v16 is known to work)
- Install NPM dependencies:

```sh
cd www/
npm install
```

### Each session

- To build webpack code: `wasm-pack build`
- To run js server: `cd www; npm run start;`

### License and Contributions

- Available under the [Apache](LICENSE_APACHE) and [MIT](LICENSE_MIT) licenses, at your choice.
- Based on and thanks to [wasm-pack-template](https://rustwasm.github.io/docs/wasm-pack/tutorials/index.html) from <a href="https://rustwasm.github.io/">The Rust and WebAssembly Working Group</a>

---

# Based on wasm-pack-template README

TODO: clean up into internal docs

## About

[**📚 Read this template tutorial! 📚**][template-docs]

This template is designed for compiling Rust libraries into WebAssembly and
publishing the resulting package to NPM.

Be sure to check out [other `wasm-pack` tutorials online][tutorials] for other
templates and usages of `wasm-pack`.

[tutorials]:
[template-docs]: https://rustwasm.github.io/docs/wasm-pack/tutorials/npm-browser-packages/index.html

## 🚴 Usage

### 🛠️ Build with `wasm-pack build`

```
wasm-pack build
```

### 🔬 Test in Headless Browsers with `wasm-pack test`

```
wasm-pack test --headless --firefox
```

### 🎁 Publish to NPM with `wasm-pack publish`

```
wasm-pack publish
```

## 🔋 Batteries Included

- [`wasm-bindgen`](https://github.com/rustwasm/wasm-bindgen) for communicating
  between WebAssembly and JavaScript.
- [`console_error_panic_hook`](https://github.com/rustwasm/console_error_panic_hook)
  for logging panic messages to the developer console.
