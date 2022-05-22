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
  const startY = height - (difficulty < 4 ? 1 : 2)
  const goalX = width - startX - 1
  const goalY = difficulty < 4 ? 0 : 1

  const start = { x: startX, y: startY }
  const goal = { x: goalX, y: goalY }

  return { width, height, walls, start, goal }
}
