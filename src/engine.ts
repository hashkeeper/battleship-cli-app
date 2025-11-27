import type { DefaultBoard, DefaultPieces } from "../types/types.ts";

export class Engine {
  private currentBoard: DefaultBoard
  private piecesInPlay: DefaultPieces
  private prevChosen: [ number, number ][] | []


  constructor() {
    this.currentBoard = {
      answer: [[]],
      inPlay: [[]]
    };

    this.piecesInPlay = {
      smallShips: [],
      largeShips: []
    };

    this.prevChosen = [];
  }

  generateNewBoard = (selection: number, sizeOptions: (string)[]): [ DefaultBoard['inPlay'], DefaultPieces] => {
    for(let i = 0; i < selection + 1; i++) {
      if(i === 0) { 
        const horzLabels: (string)[] = [ " ", " 1 ", " 2 ", " 3 ", " 4 ", " 5 ", " 6 " ].slice(0, selection + 1);
        this.currentBoard.answer[i] = horzLabels;
        this.currentBoard.inPlay[i] = horzLabels;
        continue;
      } else {
        this.currentBoard.answer[i] = [];
        this.currentBoard.inPlay[i] = [];
      }
      for(let j = 0; j < selection + 1; j++) {
        if (j === 0 && i !== 0) {
          const vertLabels: (string)[] = [ " A ", " B ", " C ", " D ", " E ", " F " ].slice(0, selection + 1);
          this.currentBoard.answer[i]![j] = vertLabels[i - 1]!;
          this.currentBoard.inPlay[i]![j] = vertLabels[i - 1]!;
        } else {
          this.currentBoard.answer[i]![j] = "❗";
          this.currentBoard.inPlay[i]![j] = " - ";
        }
      }
    }

    const pieceTouple = [ [1, 1], [2, 1], [2, 2] ].at(Number(sizeOptions.indexOf(`${selection}x${selection}`)));

    let horzOptions: [number, number][][] = Array(selection).fill(Array(selection).fill([]));
    let vertOptions: [number, number][][] = Array(selection).fill(Array(selection).fill([]));

    for(let i = 0; i < selection; i++) {
      horzOptions[i] = [];
      vertOptions[i] = [];
      for(let j = 0; j < selection; j++) {
        horzOptions[i]![j] = [ i, j ];
        vertOptions[i]![j] = [ j, i ];
      }
    }

    const spliceArrays = (len: number) => {
      const viableArr = ((): [number, number][][] => {
        return [
          ...horzOptions!.reduce((acc1: [number, number][][], opts: [number, number][]) => {
            acc1.push( ...opts.reduce((acc2: [number, number][][], cur: [number, number], ind: number, arr: [number, number][]) => {
              if(ind < arr.length - 1 && cur[1] + 1 !== arr[ind + 1]![1]) {
                acc2[acc2.length - 1]!.push(cur);
                acc2.push([]);
              } else {
                acc2[acc2.length - 1]!.push(cur);
              }
              return acc2;
            }, [[]] as [number, number][][]) );
            return acc1;
          }, [] as [number, number][][]), 
          ...vertOptions!.reduce((acc1: [number, number][][], opts: [number, number][]) => {
            acc1.push( ...opts.reduce((acc2: [number, number][][], cur: [number, number], ind: number, arr: [number, number][]) => {
              if(ind < arr.length - 1 && cur[0] + 1 !== arr[ind + 1]![0]) {
                acc2[acc2.length - 1]!.push(cur);
                acc2.push([]);
              } else {
                acc2[acc2.length - 1]!.push(cur);
              }
              return acc2;
            }, [[]] as [number, number][][]) );
            return acc1;
          }, [] as [number, number][][])
        ].reduce((acc: [number, number][][], cur: [number, number][]) => {
          if(cur.length >= len) { acc[acc.length] = cur }
          return acc;
        }, []);
      })();

      const viableRandom: number = Math.floor(Math.random() * viableArr.length);
      const randomPlacement: number = Math.floor(Math.random() * (viableArr[viableRandom]!.length - (len - 1)));
      const chosenCords: [number, number][] = viableArr[viableRandom]!.splice(randomPlacement, len);
      const [ curX, curY ] = [ ...chosenCords[0]! ];

      if(chosenCords[0]![0] === chosenCords[1]![0]){
        horzOptions[curX]!.splice(randomPlacement, len);
        chosenCords.forEach((cur) => {
          vertOptions[cur[1]]!.splice(cur[0], 1);
        });
      } else {
        vertOptions[curY]!.splice(randomPlacement, len);
        chosenCords.forEach((cur) => {
          horzOptions[cur[0]]!.splice(cur[1], 1);
        });
      }

      if(len === 2) {
        return { 
          pegs: ["🔵","🔵"], 
          coordinates: chosenCords
        };
      } else {
        return { 
          pegs: ["🟠","🟠","🟠"], 
          coordinates: chosenCords
        };
      }
    }
    
    pieceTouple!.forEach((cur, ind) => {
      Array(cur).fill(0).forEach((ship) => {
        if(ind === 0) {
          this.piecesInPlay.smallShips[this.piecesInPlay.smallShips.length] = spliceArrays(2) as { pegs: [("🔵" | "❗"), ("🔵" | "❗")], coordinates: [[number, number], [number, number]]};
        } else {
          this.piecesInPlay.largeShips[this.piecesInPlay.largeShips.length] = spliceArrays(3) as { pegs: [("🟠" | "❗"), ("🟠" | "❗"), ("🟠" | "❗")], coordinates: [[number, number], [number, number], [number, number]]};
        }
      });
    });

    Object.keys(this.piecesInPlay).forEach((cur: string): void => {
      this.piecesInPlay[cur].forEach((ship: { pegs: string, coordinates: [number, number][] }): void => {
        ship.coordinates.forEach((cord: [number, number]): void => {
          if (this.currentBoard.answer[cord[0]! + 1] && this.currentBoard.answer[cord[0]! + 1]![cord[1]! + 1] !== undefined) {
            this.currentBoard.answer[cord[0]! + 1]![cord[1]! + 1] = ship.pegs[0]!;
          }
        });
      });
    });

    return [ this.currentBoard.inPlay, this.piecesInPlay ];
  };

  parseSubmition = (userInput: string): [ DefaultBoard['answer'], string, number, boolean ] => {
    let inputArr: string[] | string[][] = userInput.split(/[\s|,]/g).filter(cur => cur.length > 0).map(cur => cur.split(""));
    let logCont: string = ``;
    let turnCount: number = 0;

    for(let i = 0; i < inputArr.length; i++) {
      let submitioN: ( string | number | null )[] = [ null, null ];
      for(let j = 0; j < inputArr[i]!.length; j++){
        const numCheck = Number(inputArr[i]![j]!);
        if(!isNaN(numCheck) && submitioN[0] === null) {
          submitioN[0] = (numCheck);
        } else if (inputArr[i]![j]! !== "" && submitioN[1] === null) {
          submitioN[1] = (inputArr[i]![j]!);
        }

        if(submitioN.length >= 2 && typeof submitioN[0] === 'number' && typeof submitioN[1] === 'string') {
          const [ validTurnBool, gameOverBool, turnLog ] = this.boardCheck(submitioN[0], submitioN[1]);
          logCont = logCont + turnLog;
          if(validTurnBool) ++turnCount;
          submitioN = [ null, null ];
          if(gameOverBool) return [ this.currentBoard.inPlay, logCont, turnCount, gameOverBool ];
        }
      }
    }

    return [ this.currentBoard.inPlay, logCont, turnCount, false ];
  }

  boardCheck = (xNum: number, yLett: string): [ boolean, boolean, string] => {
    const yCoordArr = ['a', 'b', 'c', 'd', 'e', 'f'].splice(0, this.currentBoard.answer.length - 1);
    yLett = yLett.toLowerCase();
    const yNum: number = yCoordArr.indexOf(yLett) + 1;

    if(this.prevChosen.some(cur => String(cur) === String([ xNum, yNum ]))) return [ false, false, `${yLett}${xNum} is already in play!\nPlease try other coordinates.\n` ];

    if(yNum && yNum <= this.currentBoard.answer.length - 1 && xNum <= this.currentBoard.answer.length - 1 && xNum > 0) {
      this.prevChosen[this.prevChosen.length] = [xNum, yNum];
      const currChoice: string = this.currentBoard.answer[yNum]![xNum]!;
      this.currentBoard.inPlay[yNum]![xNum]! = currChoice;
      if(currChoice !== "❗"){
        const [ gameOverBool, shipSinkLog ] = this.pieceHit(xNum, yNum, currChoice);
        return [ true, gameOverBool, `${yLett}${xNum} is a hit!\n${shipSinkLog}` ];
      } else {
        return [ true, false, `${yLett}${xNum} is a miss! Sorry, try again...\n` ];
      }
    } else {
      return [ false, false, `${yLett}${xNum} is not within the bounds of the board.\nPlease try other coordinates.\n` ];
    }
  }

  pieceHit = (xCoord: number, yCoord: number, choice: string): [ boolean, string ] => {
    // Converting coordinates to piecesInPlay formatting, where y coordinates are listed first, also uses a whole number counting system
    const curCoord = [ yCoord - 1, xCoord - 1 ];
    const curShip = (choice === "🔵")? "smallShips" : "largeShips";
    let logMessage = ``;

    for(let i = 0; i < this.piecesInPlay[curShip].length; i++) {
      for(let j = 0; j < this.piecesInPlay![curShip]![i]!.coordinates.length; j++) {
        if(String(curCoord) === String(this.piecesInPlay![curShip]![i]!.coordinates[j])) {
          this.piecesInPlay![curShip]![i]!.pegs[j] = "❗";
          const [ gameOverBool, logAddition ] = this.piecesHealthCheck(curShip, i);
          logMessage = logMessage + logAddition;
          return [ gameOverBool, logMessage ];
        }
      }
    }

    return [ false, `` ];
  }

  piecesHealthCheck = (ship: string, shipInd: number): [ boolean, string ] => {
    const allPegsArr: ("🟠"|"🔵"|"❗")[] = [ 
      ...this.piecesInPlay.smallShips.reduce((acc: ("🔵"|"❗")[], cur: DefaultPieces['smallShips'][number]) => {
        acc = [ ...acc, ...cur.pegs ];
        return acc;
      }, []),
      ...this.piecesInPlay.largeShips.reduce((acc: ("🟠"|"❗")[], cur: DefaultPieces['largeShips'][number]) => {
        acc = [ ...acc, ...cur.pegs ];
        return acc;
      }, [])
    ];
    let logMessage = ``;
    let gameOverBool = false;
    let shipName = (ship === "smallShips")? "Destroyer" : "Cruiser";

    if(!this.piecesInPlay![ship]![shipInd]!.pegs.find((cur: "🟠"|"🔵"|"❗") => cur === "🟠" || cur === "🔵")) logMessage = logMessage + `You sunk my ${shipName}!\n`;
    if(!allPegsArr.find((cur: "🟠"|"🔵"|"❗") => cur === "🟠" || cur === "🔵")) {
      logMessage = logMessage + `All battleships destroyed! You Win!\n`
      gameOverBool = true;
    }

    return [ gameOverBool, logMessage ];
  }
}