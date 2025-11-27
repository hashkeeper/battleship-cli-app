import blessed from './modified-blessed-library/index.js';
import { Engine } from './engine.ts';
import { Logger } from './logger.ts';
import fs from 'fs/promises';
import path from 'path';
import type { CurrentBoard, DefaultPieces } from "../types/types.ts";

const logger = new Logger();

export class Gui {
  private screen!: blessed.Widgets.Screen
  private engine!: Engine
  private logBox!: blessed.Widgets.Log
  private optionsBar!: blessed.Widgets.ListElement
  private currentScoreText!: blessed.Widgets.TextElement
  private currentScoreNumber!: blessed.Widgets.TextElement
  private boardTable!: blessed.Widgets.TableElement
  private userInputBox!: blessed.Widgets.TextboxElement
  private chosenSize!: string
  private turnCount!: number

  constructor() {
    this.initialize();
  }

  initialize() {
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

    this.chosenSize = "";
    this.turnCount = 0;

    this.mainMenu();
  }

  mainMenu() {
    const optionsObj: { [key: string]: Function } = {
      'New Game...': () => {
        this.sizeOptionsMenu();
      },

      'Reset Highscores': () => {
        this.resetHighscores();
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
    this.engine = new Engine();
    const sizeOptions: (string)[] = ["4x4", "5x5", "6x6"];
    this.logBox.content = "Choose a board size... ";
    this.optionsBar.removeAllListeners('select');
    this.optionsBar.setItems(sizeOptions);
    this.optionsBar.on('select', (item) => {
      let chosenSize: number = 0;
      chosenSize = Number(item.getText()[0]);
      this.chosenSize = item.getText();
      const [ startingBoard, startingPieces ]: [ CurrentBoard, DefaultPieces] = this.engine.generateNewBoard(chosenSize, sizeOptions);
      this.logBox.content = "";
      this.logBox.log(`New Game...\n${item.getText()} board selected.\n${startingPieces.smallShips.length} small ships & ${startingPieces.largeShips.length} large ships placed on board.\n${"*".repeat(46)}\n`);
      this.setupGameBoard(startingBoard);
    });
    this.screen.render();
  }

  setupGameBoard(board: CurrentBoard) {
    this.userInputBox.width = (board.length * 4) + 1;

    this.boardTable.setData(board);

    //apply gameplay mode menu
    this.screen.remove(this.optionsBar);

    this.logBox.left = (Number(this.screen.width) / 2);

    this.screen.append(this.currentScoreText);
    this.currentScoreText.left = (Number(this.screen.width) / 2) - (board.length * 6);

    this.screen.append(this.currentScoreNumber);
    this.currentScoreNumber.left = (Number(this.screen.width) / 2) - (board.length * 6) + 15;

    this.screen.append(this.boardTable);
    this.boardTable.left = (Number(this.screen.width) / 2) - (board.length * 6);

    this.screen.append(this.userInputBox);
    this.userInputBox.left = (Number(this.screen.width) / 2) - (board.length * 6);
    
    this.userInputBox.key('enter', () => {
      if(this.userInputBox.getValue().replace(" ", "") === "clear") this.logBox.setContent("");
      const [ board, logCont, count, gameOverBool ] = this.engine.parseSubmition(this.userInputBox.getValue());
      this.turnCount = this.turnCount + count;
      this.updateGameBoard(board, logCont, this.turnCount);
      if(gameOverBool) setTimeout(this.gameOverScreen, 5000);
    });

    this.logBox.align = 'left';
    this.logBox.valign = 'top';
    this.logBox.underline = 'top';
    this.logBox.right = 0 ;
    this.logBox.width = 60;
    this.logBox.height = '100%';

    this.userInputBox.focus();
    this.screen.render();
  }

  updateGameBoard(board: CurrentBoard, logCont: string, turnCount: number) {
    this.boardTable.setData(board);
    this.logBox.log(logCont);
    this.currentScoreNumber.content = String(turnCount);
    this.userInputBox.clearValue();
    this.userInputBox.focus();

    this.screen.render();
  }

  gameOverScreen = async () => {
    const dataPath = path.join(__dirname, '..', 'data', 'highscores.json');
    const highscoreData = await fs.readFile(dataPath, 'utf8');
    const highscoreJson = JSON.parse(highscoreData);

    if(this.turnCount < highscoreJson.battleships[this.chosenSize] || highscoreJson.battleships[this.chosenSize] === 0) {
      highscoreJson.battleships[this.chosenSize] = this.turnCount;
      await fs.writeFile(dataPath, JSON.stringify(highscoreJson), 'utf8');
    }

    this.screen.remove(this.boardTable);
    this.screen.remove(this.userInputBox);
    this.screen.remove(this.currentScoreText);
    this.screen.remove(this.currentScoreNumber);

    this.screen.append(this.optionsBar);

    this.logBox.setContent("");
    this.logBox.content = `Congratulations, You Win!\n You're score was ${this.turnCount}!\nThe all-time highscore for a ${this.chosenSize} board is ${highscoreJson.battleships[this.chosenSize]}\nWant to play again?`;
    this.currentScoreNumber.content = String(0);
    this.logBox.align = 'center';
    this.logBox.valign = 'middle';
    this.logBox.underline = 'top';
    this.logBox.left = '15%';
    this.logBox.right = 0;
    this.logBox.width = '85.5%';
    this.logBox.height = '100%';

    const yesOrNoArr = ["Yes!", "No..."]
    this.optionsBar.removeAllListeners('select');
    this.optionsBar.setItems(yesOrNoArr);
    this.optionsBar.on('select', (item) => {
      if(item.getText() === "Yes!") {
        this.screen.destroy();
        this.initialize();
        this.sizeOptionsMenu();
      } else {
        process.exit(0);
      }
    });
     
    this.screen.render;
  }

  resetHighscores = async () => {
    const dataPath = path.join(__dirname, '..', 'data', 'highscores.json');
    const highscoreJson = { "battleships": {
      "4x4": 0,
      "5x5": 0,
      "6x6": 0
    }};
    await fs.writeFile(dataPath, JSON.stringify(highscoreJson), 'utf8');
  }
}