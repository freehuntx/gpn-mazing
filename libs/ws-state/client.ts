import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'

export class WsStateClient extends EventEmitter {
  #socket: Socket
  #state: Record<string, any> = {}

  constructor(port: number) {
    super()
    this.#socket = io('ws://127.0.0.1:' + port)

    this.#socket.on('update', newState => {
      this.#state = newState
      this.emit('update')
    })
  }

  get state(): any { return this.#state }
}