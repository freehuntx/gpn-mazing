import { EventEmitter } from 'events'
import { ClientSocket } from './ClientSocket'
import { Game } from './Game'

export enum PlayerAction {
  NONE,
  MOVE_UP,
  MOVE_RIGHT,
  MOVE_DOWN,
  MOVE_LEFT
}

export interface PlayerState {
  pos: Vec2
  chat?: string
}

export class Player extends EventEmitter {
  #socket?: ClientSocket
  #username = ''
  #password = ''
  #chatMessage?: string
  #pos = { x: 0, y: 0 }
  #game?: Game
  #action: PlayerAction = PlayerAction.NONE
  #state: PlayerState
  wins = 0
  loses = 0

  constructor(username: string, password: string) {
    super()
    this.#username = username
    this.#password = password
    this.#state = {
      pos: { ...this.#pos }
    }
  }

  //get ip(): string { return this.#socket?.ip }
  get username(): string { return this.#username }
  get password(): string { return this.#password }
  get pos(): { x: number; y: number } { return this.#pos }
  get connected(): boolean { return !!this.#socket?.connected }
  get state(): PlayerState { return this.#state }

  readAndResetAction(): PlayerAction {
    const action = this.#action
    this.#action = PlayerAction.NONE
    return action
  }

  setSocket(socket: ClientSocket) {
    this.disconnect()

    this.#socket = socket
    this.#socket.on('packet', this.#onPacket.bind(this))
    this.#socket.on('disconnected', this.#onDisconnect.bind(this))
  }

  joinGame(game: Game) {
    if (this.#game) this.leaveGame()
    this.#game = game
    this.#game.addPlayer(this)
  }

  leaveGame() {
    this.#game?.removePlayer(this)
    this.#game = undefined
  }

  setPos(x: number, y: number) {
    this.#pos.x = x
    this.#pos.y = y
    this.#state.pos.x = x
    this.#state.pos.y = y
  }

  disconnect() {
    this.#socket?.disconnect()
  }

  send(type: string, ...args: any) {
    this.#socket?.send(type, ...args)
  }

  win() {
    this.wins++
    this.#socket?.send('win', this.wins, this.loses)
  }

  lose() {
    this.loses++
    this.#socket?.send('lose', this.wins, this.loses)
  }

  sendError(error: string, disconnect = false) {
    this.#socket?.sendError(error, disconnect)
  }

  #onPacket(packetType: string, ...args: any) {
    if (packetType === 'move') {
      const [direction] = args
      if (direction === 'up') this.#action = PlayerAction.MOVE_UP
      else if (direction === 'right') this.#action = PlayerAction.MOVE_RIGHT
      else if (direction === 'down') this.#action = PlayerAction.MOVE_DOWN
      else if (direction === 'left') this.#action = PlayerAction.MOVE_LEFT
      else this.sendError('unknown move direction')
    }
    else if (packetType === 'chat') {
      if (this.#chatMessage !== undefined) {
        this.sendError('already chatting')
      } else {
        const [chatMessage] = args

        // Check if the chat message contains printable characters
        if (!/^[ -~]+$/.test(chatMessage)) {
          this.sendError('invalid chat message')
        } else {
          this.#chatMessage = chatMessage
          this.#state.chat = chatMessage

          // Clear the chat message in 5 seconds
          setTimeout(() => {
            this.#chatMessage = undefined
            delete this.#state.chat
          }, 5000)
        }
      }
    } else {
      this.sendError('unknown packet')
    }
  }

  #onDisconnect() {
    if (this.#game) this.leaveGame()
    this.#socket?.removeAllListeners()
    this.#socket = undefined
    this.#chatMessage = undefined
    this.#action = PlayerAction.NONE
    this.emit('disconnected')
  }
}
