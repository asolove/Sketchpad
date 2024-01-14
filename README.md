# Sketchpad

An in-progress re-implementation of Ivan Sutherland's Sketchpad,
runnable in webassembly in the browser.

Plan, progress, and research in [NOTES](NOTES.md).

## How to use

### Initial setup

- Install [Rust stable](https://rustup.rs/)
- Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- Install Node (v16 is known to work)
- Install NPM dependencies:

```sh
cd web/
npm install
```

### Each session

- To build webpack code:

```sh
wasm-pack build --target web --out-name web --out-dir web/pkg
```

- To run js server: `cd web; npm run serve;`

### License and Contributions

- Available under the [Apache](LICENSE_APACHE) and [MIT](LICENSE_MIT) licenses, at your choice.
- Based on and thanks to [wasm-pack-template](https://rustwasm.github.io/docs/wasm-pack/tutorials/index.html) from <a href="https://rustwasm.github.io/">The Rust and WebAssembly Working Group</a>
