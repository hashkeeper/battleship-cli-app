import fs from 'fs';
import { Engine } from './engine.ts';
import { Gui } from './gui.ts';
import type { DefaultBoard, DefaultPieces } from "../types/types.ts";

export class App {
  private engine: Engine
  private gui: Gui

  constructor() {
    this.engine = new Engine();
    this.gui = new Gui(this.engine);
  }

  initialize() {
    fs.writeFileSync('./debug.log', '');

    this.gui.mainMenu();
  }
}
