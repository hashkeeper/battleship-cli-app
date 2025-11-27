import { Gui } from './src/gui.ts';

class App {
  private gui: Gui

  constructor() {
    this.gui = new Gui();
  }
}

const session = new App();