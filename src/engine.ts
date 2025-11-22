import { Logger }  from './logger.ts';
import type { DefaultBoard, DefaultPieces } from "../types/types.ts";

const logger = new Logger();

export class Engine {
  private boardInPlay: DefaultBoard
  private piecesInPlay: DefaultPieces

  constructor() {
    this.boardInPlay = {
      answer: [[]],
      inPlay: [[]]
    };

    this.piecesInPlay = {
      smallShips: [],
      largeShips: []
    };
  }

  generateNewBoard = (selection: number, sizeOptions: (string)[]) => {
    for(let i = 0; i < selection + 1; i++) {
      if(i === 0) { 
        const horzLabels: (string)[] = [ " ", "1", "2", "3", "4", "5", "6" ].slice(0, selection + 1);
        this.boardInPlay.answer[i] = horzLabels;
        this.boardInPlay.inPlay[i] = horzLabels;
        continue;
      } else {
        this.boardInPlay.answer[i] = [];
        this.boardInPlay.inPlay[i] = [];
      }
      for(let j = 0; j < selection + 1; j++) {
        if (j === 0 && i !== 0) {
          const vertLabels: (string)[] = [ " A ", " B ", " C ", " D ", " E ", " F " ].slice(0, selection + 1);
          this.boardInPlay.answer[i]![j] = vertLabels[i - 1]!;
          this.boardInPlay.inPlay[i]![j] = vertLabels[i - 1]!;
        } else {
          this.boardInPlay.answer[i]![j] = "❗";
          this.boardInPlay.inPlay[i]![j] = " - ";
          //❗
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
          if (this.boardInPlay.answer[cord[0]! + 1] && this.boardInPlay.answer[cord[0]! + 1]![cord[1]! + 1] !== undefined) {
            this.boardInPlay.answer[cord[0]! + 1]![cord[1]! + 1] = ship.pegs[0]!;
          }
        });
      });
    });

    // logger.log(this.boardInPlay.answer);

    return [ this.boardInPlay, this.piecesInPlay ];
  };

  parseSubmition = (userInput: string): [ DefaultBoard, string, number ] => {
    const inputArr = userInput.split(/[\s|,]/g).filter(cur => cur.length > 0);
    let logCont: string = '';
    let turnCount: number = 0;

    inputArr.forEach(subm => {
      let submitioN: [] | [number, string] = [];
      subm.split("").forEach(curCoord => {

        const numCheck = Number(curCoord);
        if(!isNaN(numCheck) && !submitioN[0]) {
          submitioN[0] = (numCheck);
        } else if (curCoord !== "" && !submitioN[1]) {
          submitioN[1] = (curCoord);
        }

        if(submitioN.length >= 2 && typeof submitioN[0] === 'number' && typeof submitioN[1] === 'string') {
          logCont = logCont + this.boardCheck(submitioN[0], submitioN[1]) + `\n`;
          submitioN = [];
          ++turnCount;
        }
      })
    });

    return [ this.boardInPlay, logCont, turnCount ];
  }

  boardCheck = (xNum: number, yLett: string): string => {
    const yCoordArr = ['a', 'b', 'c', 'd', 'e', 'f'].splice(0, this.boardInPlay.answer.length - 1);
    yLett = yLett.toLowerCase();
    const yNum: number = yCoordArr.indexOf(yLett) + 1;

    if(yNum && yNum <= this.boardInPlay.answer.length && xNum <= this.boardInPlay.answer.length) {
      this.boardInPlay.inPlay[yNum]![xNum]! = this.boardInPlay.answer[yNum]![xNum]!
      this.pieceHit(xNum, yNum);
      return `xCoord: ${xNum}, yCoord: ${yNum} is a valid entry!`;
    } else {
      return `xCoord: ${xNum}, yCoord: ${yNum} is an invalid entry.`;
    }
  }

  pieceHit = (xCoord: number, yCoord: number) => {
    const curCoord = [ xCoord, yCoord ];
    this.piecesInPlay.smallShips.forEach(ship => {
      ship.coordinates.forEach(coord => {
        if(coord === curCoord) return
      });
    });
  }

  piecesCheck = (xCoord: number, yCoord: number) => {

  }
}