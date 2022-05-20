import generator from 'generate-maze'

export type WallsMap = Record<string, Record<string, WallInfo>>

export type Maze = {
  walls: WallsMap
  start: Vec2
  goal: Vec2
}

export function createMaze(difficulty: number): Maze {
  const width = difficulty
  const height = difficulty
  const walls: WallsMap = {}

  generator(width, height, true, Math.floor(Math.random() * 1337420)).flat().forEach(({ x, y, top, left, bottom, right }) => {
    if (!walls[x]) walls[x] = {}
    walls[x][y] = { top, left, bottom, right }
  })

  const start = { x: width - 1, y: height - 1 }
  const goal = { x: 0, y: 0 }

  return { walls, start, goal }
}
