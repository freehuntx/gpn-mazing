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

    this.#socket.on('set', (path, value) => {
      const realPath = path.slice(0, -1)
      const key = path.slice(-1).pop()
      let target = this.#state

      if (realPath.length > 0) {
        target = realPath.reduce((a: any, e: string) => a[e], target)
      }

      target[key] = value
      this.emit('update', path)
    })

    this.#socket.on('delete', (path) => {
      const realPath = path.slice(0, -1)
      const key = path.slice(-1).pop()
      let target = this.#state

      if (realPath.length > 0) {
        target = realPath.reduce((a: any, e: string) => a[e], target)
      }

      delete target[key]
      this.emit('update', path)
    })
  }

  get state(): any { return this.#state }
}