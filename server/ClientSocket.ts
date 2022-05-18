import { Socket } from 'net'
import { EventEmitter } from 'events'

export class ClientSocket extends EventEmitter {
  #connected = false
  #socket?: Socket
  #recvBuffer = ''

  constructor(socket: Socket) {
    super()
    this.#connected = !!socket && !socket.connecting && !socket.destroyed
    this.#socket = socket

    this.#socket.on('data', chunk => {
      this.#recvBuffer += chunk.toString()

      while (this.#recvBuffer.includes('\n')) {
        const packetIndex = this.#recvBuffer.indexOf('\n')
        const packetStr = this.#recvBuffer.substring(0, packetIndex)
        this.#recvBuffer = this.#recvBuffer.substring(packetIndex + 1)
        this.#onPacket(packetStr)
      }

      if (this.#recvBuffer.length > 1024) {
        this.sendError('Packet buffer overflow', true)
      }
    })

    this.#socket.on('close', this.#onClose.bind(this))
    this.#socket.on('error', this.#onError.bind(this))
  }

  get connected(): boolean { return this.#connected }

  disconnect() {
    this.#socket?.destroy()
  }

  send(type: string, ...args: any) {
    this.#socket?.write(`${[type, ...args].join('|')}\n`)
  }

  sendError(error: string, disconnect = false) {
    this.send('error', error)
    if (disconnect) this.disconnect()
  }

  #onPacket(packet: string) {
    const args = packet.split('|').map(e => {
      const int = parseInt(e)
      if (!isNaN(int)) return int
      return e
    })
    const type = args.shift()
    this.emit('packet', type, ...args)
  }

  #onClose() {
    const wasConnected = this.#connected
    this.#connected = false
    this.#socket?.removeAllListeners()
    this.#socket = undefined
    if (wasConnected) this.emit('disconnected')
  }

  #onError(error: Error & { code: string }) {
    if (error?.code === 'ECONNRESET') return
    console.error(error)
  }
}