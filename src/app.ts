import fs from 'fs';
import { Gui } from './gui.ts';
import type { DefaultBoard, DefaultPieces } from "../types/types.ts";

export class App {
  private gui: Gui

  constructor() {
    this.gui = new Gui();
  }
}
