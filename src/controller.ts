import type { Universe } from "./document";

export class Controller {
  universe: Universe;
  pictureCount: number;

  container: Element;
  select: HTMLSelectElement;

  constructor(container: Element, universe: Universe) {
    this.universe = universe;
    this.pictureCount = 0;
    this.container = container;
    this.select = document.createElement("select");
    this.container.appendChild(this.select);
    this.select.addEventListener("change", (e) => {
      let target: HTMLSelectElement = e.currentTarget as any;
      let newIndex = parseInt(target.value || "", 10);
      if (this.universe.pictures[newIndex]) {
        this.universe.currentPicture = this.universe.pictures[newIndex];
      } else if (target.value === "New") {
        debugger;
        this.universe.addPicture();
      }
    });

    this.loop();
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
    let pictureCount = this.universe.pictures.length;
    if (pictureCount === this.pictureCount) return;
    this.pictureCount = pictureCount;

    let options = "";
    for (let i = 0; i < pictureCount; i++) {
      let selected = this.universe.currentPicture == this.universe.pictures[i];
      options += `<option ${selected ? "selected" : ""}>${i}</option>`;
    }
    options += "<option>New</option>";
    this.select.innerHTML = options;
  }
}
