import blessed from './modified-blessed-library/index.js';
import { Engine } from './engine.ts';
import { Logger } from './logger.ts'
import type { DefaultBoard, DefaultPieces } from "../types/types.ts";

const logger = new Logger();

export class Gui {
  private screen
  private logBox
  private optionsBar
  private currentScoreText
  private currentScoreNumber
  private boardTable
  private userInputBox
  private turnCount

  constructor(private engine: Engine) {
    this.engine = engine;

    this.screen = blessed.screen({
      dockBorders: true,
      smartCSR: true,
      title: "Battleships!",
      fullUnicode: true,
      forceUnicode: true,
      warnings: false,
      keys: true,
      vi: false,
      mouse: true,
      input: process.stdin,
      output: process.stdout,
      terminal: "xterm-color",
      fastCSR: true,
      useBCE: false,
      autoPadding: false,
      ignoreDockContrast: true,
      dockContrast: false
    });

    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

    this.optionsBar = blessed.list({
      top: 0,
      left: 0,
      width: '15%',
      height: '100%',
      border: { type: 'line' },
      style: { 
        border: { fg: 'green' },
        selected: { bg: 'green', fg: 'black' }
      },
      keys: true
    });

    this.logBox = blessed.log({
      top: 0,
      right: 0,
      width: '85.5%',
      height: '100%',
      content: 'Welcome to Battleships!\nWould you like to play a new game?',
      align: 'center',
      valign: 'middle',
      scrollable: true,
      border: { type: 'line' },
      style: { border: { fg: 'blue' } }
    });

    this.currentScoreText = blessed.text({
      top: 0,
      left: 0,
      width: 20,
      height: 1,
      pad: 0,
      style: { 
        fg: 'green',
        border: 'bg'
      },
      content: 'Current Score:'
    });

    this.currentScoreNumber = blessed.text({
      top: 0,
      left: 0,
      width: 3,
      height: 1,
      pad: 0,
      style: { 
        fg: 'green',
        border: 'bg'
      },
      content: '0'
    })

    this.boardTable = blessed.table({
      top: 1,
      left: 0,
      width: undefined,
      height: undefined,
      pad: 0,
      border: { type: 'line' },
      style: { border: { fg: 'green' } }
    });

    this.userInputBox = blessed.textbox({
      bottom: 0,
      left: 0,
      width: 166,
      height: 3,
      content: 'Type a coordinate point... eg. A1, B2',
      border: { type: 'line' },
      inputOnFocus: true,
      keys: true
    });

    this.turnCount = 0;
  }

  mainMenu() {
    const optionsObj: { [key: string]: Function } = {
      'New Game...': () => {
        this.sizeOptionsMenu();
      },

      'Quit': () => {
        process.exit(0);
      }
    }
    this.screen.append(this.logBox);
    this.screen.append(this.optionsBar);
    Object.keys(optionsObj).forEach((cur) => this.optionsBar.addItem(cur));
    this.optionsBar.on('select', (item) => {
      const selectedItem: string = item.getText();

      if (selectedItem) {
        const selectedFunction: { [key: string]: Function } = optionsObj[selectedItem]!();
        selectedFunction;
      } 
    });
    this.optionsBar.focus();
    this.screen.render();
  }

  sizeOptionsMenu() {
    const sizeOptions: (string)[] = ["4x4", "5x5", "6x6"];
    this.logBox.content = "Choose a board size... ";
    this.optionsBar.removeAllListeners('select');
    this.optionsBar.setItems(sizeOptions);
    this.optionsBar.on('select', (item) => {
      const chosenSize: number = Number(item.getText()[0]);
      const [ startingBoard, startingPieces ]: [ DefaultBoard, DefaultPieces] = this.engine.generateNewBoard(chosenSize, sizeOptions) as [DefaultBoard, DefaultPieces];
      this.logBox.log(`New Game...\n${item.getText()} board selected.\n${startingPieces.smallShips.length} small ships & ${startingPieces.largeShips.length} large ships placed on board.\n`);
      this.setupGameBoard(startingBoard);
    });
    this.screen.render();
  }

  setupGameBoard(board: DefaultBoard) {
    this.userInputBox.width = (board.answer.length * 4) + 1;

    this.boardTable.setData(board.inPlay);

    //apply gameplay mode menu
    this.screen.remove(this.optionsBar);

    this.logBox.left = (Number(this.screen.width) / 2);

    this.screen.append(this.currentScoreText);
    this.currentScoreText.left = (Number(this.screen.width) / 2) - (board.answer.length * 6);

    this.screen.append(this.currentScoreNumber);
    this.currentScoreNumber.left = (Number(this.screen.width) / 2) - (board.answer.length * 6) + 15;

    this.screen.append(this.boardTable);
    this.boardTable.left = (Number(this.screen.width) / 2) - (board.answer.length * 6);

    this.screen.append(this.userInputBox);
    this.userInputBox.left = (Number(this.screen.width) / 2) - (board.answer.length * 6);
    
    this.userInputBox.key('enter', () => {
      const [ board, logCont, count ] = this.engine.parseSubmition(this.userInputBox.getValue());
      this.turnCount = this.turnCount + count;
      this.updateGameBoard(board, logCont, this.turnCount);
    });

    // NPM @types/blessed package doesnt contain log element align and valign properties even though they exist
    // in the blessed library code. I submitted a PR to @types/blessed github repo (the DefinitelyTyped repo), hopefully it will be approved
    // which will be my first PR!!
    this.logBox.align = 'left';
    this.logBox.valign = 'top';
    this.logBox.underline = 'top';
    this.logBox.right = 0 ;
    this.logBox.width = 60;
    this.logBox.height = '100%';

    this.userInputBox.focus();
    this.screen.render();
  }

  updateGameBoard(board: DefaultBoard, logCont: string, turnCount: number) {
    this.boardTable.setData(board.inPlay);
    this.logBox.log(logCont);
    this.currentScoreNumber.content = String(turnCount);
    this.userInputBox.clearValue();
    this.userInputBox.focus();

    this.screen.render();
  }
}