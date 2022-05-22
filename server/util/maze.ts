import generator from 'generate-maze'

export type WallsMap = Record<string, Record<string, WallInfo>>

export type Maze = {
  width: number
  height: number
  walls: WallsMap
  start: Vec2
  goal: Vec2
}

enum Moves {
  UP,
  RIGHT,
  DOWN,
  LEFT
}

export function createMaze(difficulty: number): Maze {
  const width = difficulty
  const height = difficulty
  const walls: WallsMap = {}

  // Create initial walls
  for (let x = 0; x < width; x++) {
    if (!walls[x]) walls[x] = {}
    
    for (let y = 0; y < height; y++) {
      walls[x][y] = {
        top: true,
        right: true,
        bottom: true,
        left: true
      }
    }
  }

  // Create maze
  const start = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }
  const goal = { x: start.x, y: start.y }
  const visitedRooms: Record<string, boolean> = {}
  let furthestDistance = 0
  let roomsLeft = width * height // The amount of rooms we have to walk
  const walkStack: Vec2[] = []

  // Enter the start room
  walkStack.push({ x: start.x, y: start.y })
  visitedRooms[`${start.x}:${start.y}`] = true
  roomsLeft--

  // Keep entering rooms
  while (roomsLeft > 0) {
    const currentRoom: Vec2 = walkStack[walkStack.length - 1]

    const possibleMoves: Moves[] = []
    if (currentRoom.y > 0 && !visitedRooms[`${currentRoom.x}:${currentRoom.y - 1}`]) possibleMoves.push(Moves.UP)
    if (currentRoom.x < width - 1 && !visitedRooms[`${currentRoom.x + 1}:${currentRoom.y}`]) possibleMoves.push(Moves.RIGHT)
    if (currentRoom.y < height - 1 && !visitedRooms[`${currentRoom.x}:${currentRoom.y + 1}`]) possibleMoves.push(Moves.DOWN)
    if (currentRoom.x > 0 && !visitedRooms[`${currentRoom.x - 1}:${currentRoom.y}`]) possibleMoves.push(Moves.LEFT)

    // Dead end? Go back!
    if (possibleMoves.length === 0) {
      walkStack.pop()
      continue
    }

    // Choose a move
    const move: Moves = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
    const newPos: Vec2 = { x: currentRoom.x, y: currentRoom.y }

    if (move === Moves.UP) newPos.y--
    else if (move === Moves.RIGHT) newPos.x++
    else if (move === Moves.DOWN) newPos.y++
    else if (move === Moves.LEFT) newPos.x--

    walkStack.push(newPos)
    visitedRooms[`${newPos.x}:${newPos.y}`] = true
    roomsLeft--

    // Crush walls
    const oldWalls = walls[currentRoom.x][currentRoom.y]
    const newWalls = walls[newPos.x][newPos.y]
    if (move === Moves.DOWN) {
      oldWalls.bottom = false
      newWalls.top = false
    } else if (move === Moves.LEFT) {
      oldWalls.left = false
      newWalls.right = false
    } else if (move === Moves.UP) {
      oldWalls.top = false
      newWalls.bottom = false
    } else if (move === Moves.RIGHT) {
      oldWalls.right = false
      newWalls.left = false
    }

    // Update goal and furthest distance
    if (walkStack.length > furthestDistance) {
      furthestDistance = walkStack.length
      goal.x = newPos.x
      goal.y = newPos.y
    }
  }

  return { width, height, walls, start: goal, goal: start }
}

export function createMaze2(difficulty: number): Maze {
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
