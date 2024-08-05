import type { Universe } from "./document";

export class Controller {
  universe: Universe;

  container: Element;
  select: HTMLSelectElement;

  constructor(container: Element, universe: Universe) {
    this.universe = universe;
    this.container = container;
    this.select = document.createElement("select");
    this.container.appendChild(this.select);
    this.select.addEventListener("change", (e) => {
      let newCurrent = parseInt(e.currentTarget.value, 10);
      this.universe.currentPicture = this.universe.pictures[newCurrent];
    });

    this.render();
  }

  render() {
    let pictureCount = this.universe.pictures.length;
    let options = "";
    for (let i = 0; i < pictureCount; i++) {
      let selected = this.universe.currentPicture == this.universe.pictures[i];
      options += `<option ${selected ? "selected" : ""}>${i}</option>`;
    }
    this.select.innerHTML = options;
  }
}
