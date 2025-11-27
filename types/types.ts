export type DefaultBoard = {
    answer: ( "❗" | "🟠" | "🔵" | string )[][],
    inPlay: ( "-" | "❗" | "🟠" | "🔵" | string )[][]
}

export type DefaultPieces = {
  [key: string]: any,
  smallShips:
    {
    pegs: [("🔵" | "❗"), ("🔵" | "❗")], 
    coordinates: [[number, number], [number, number]]
    }[],
  largeShips:
    {
      pegs: [("🟠" | "❗"), ("🟠" | "❗"), ("🟠" | "❗")],
      coordinates: [[number, number], [number, number], [number, number]]
    }[]
}

export type CurrentBoard = DefaultBoard['inPlay'];