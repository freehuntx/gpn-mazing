import generator from 'generate-maze'

export type WallsMap = Record<string, Record<string, WallInfo>>

export type Maze = {
  width: number
  height: number
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

  const startX = Math.floor(Math.random() * width)
  const goalX = width - startX - 1

  const start = { x: startX, y: height - 1 }
  const goal = { x: goalX, y: 0 }

  return { width, height, walls, start, goal }
}
