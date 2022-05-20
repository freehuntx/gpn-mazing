import { EventEmitter } from 'events'
import { Player, PlayerAction, PlayerState } from "./Player"
import { createMaze, Maze } from './util/maze'

export interface GameState {
  players: Record<string, PlayerState>
  walls: Record<string, { pos: Vec2 } & WallInfo>
  goal: Vec2
}

export class Game extends EventEmitter {
  #maze: Maze
  #players: Player[] = []

  #state: GameState

  constructor(difficulty: number) {
    super()

    this.#maze = createMaze(difficulty)

    this.#state = {
      players: {},
      walls: {},
      goal: this.#maze.goal
    }

    const tickInterval = setInterval(() => this.#onTick(), 1000 / 3)
    this.on('end', () => clearInterval(tickInterval))
  }

  get state(): GameState { return this.#state }

  addPlayer(player: Player) {
    if (this.#players.includes(player)) {
      console.error('[Error] Player already joined!')
      return
    }

    this.#players.push(player)
    this.#state.players[player.username] = player.state

    player.send('goal', this.#maze.goal.x, this.#maze.goal.y)
    this.#updatePlayerPosition(player, this.#maze.start.x, this.#maze.start.y)
  }

  removePlayer(player: Player) {
    const playerIndex = this.#players.indexOf(player)
    if (playerIndex === -1) return

    this.#players.splice(playerIndex, 1)
    delete this.#state.players[player.username]
  }

  #updatePlayerPosition(player: Player, x: number, y: number) {
    const { top, right, bottom, left } = this.#maze.walls[x][y]
    const wallArgs = [top, right, bottom, left].map(e => e ? 1 : 0)
    player.setPos(x, y)
    player.send('pos', x, y, ...wallArgs)
  }

  #onTick() {
    // Check for winners
    const winners = this.#players.filter(player => player.pos.x === this.#maze.goal.x && player.pos.y === this.#maze.goal.y)
    if (winners.length > 0) {
      for (const player of this.#players) {
        if (winners.includes(player)) player.win()
        else player.lose()
      }

      this.emit('end', winners)
      return
    }

    // Handle movement
    for (const player of this.#players) {
      const action = player.readAndResetAction()
      let hitWall = false
      let moved = false

      if (action === PlayerAction.MOVE_UP) {
        if (this.#maze.walls[player.pos.x][player.pos.y].top) hitWall = true
        else {
          player.setPos(player.pos.x, player.pos.y - 1)
          moved = true
        }
      } else if (action === PlayerAction.MOVE_RIGHT) {
        if (this.#maze.walls[player.pos.x][player.pos.y].right) hitWall = true
        else {
          player.setPos(player.pos.x + 1, player.pos.y)
          moved = true
        }
      } else if (action === PlayerAction.MOVE_DOWN) {
        if (this.#maze.walls[player.pos.x][player.pos.y].bottom) hitWall = true
        else {
          player.setPos(player.pos.x, player.pos.y + 1)
          moved = true
        }
      } else if (action === PlayerAction.MOVE_LEFT) {
        if (this.#maze.walls[player.pos.x][player.pos.y].left) hitWall = true
        else {
          player.setPos(player.pos.x - 1, player.pos.y)
          moved = true
        }
      }

      const { x, y } = player.pos
      const isAtGoal = this.#maze.goal.x === x && this.#maze.goal.y === y
      if (!this.#state.walls[`${x}:${y}`]) {
        this.#state.walls[`${x}:${y}`] = { pos: { x, y }, ...this.#maze.walls[x][y] }
      }

      if (hitWall) player.sendError('you cant walk into walls...')
      if (moved) {
        if (!isAtGoal) this.#updatePlayerPosition(player, x, y)
      }
    }
  }
}