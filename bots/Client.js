const { createConnection } = require('net')
const { EventEmitter } = require('events')

class Client extends EventEmitter {
  #host = ''
  #port = 0
  #socket = null
  #connected = false
  #recvBuffer = ''

  constructor(host, port, username, password) {
    super()
    this.#host = host
    this.#port = port

    this.once('connected', () => {
      this.send('join', username, password)
    })

    setTimeout(() => {
      this.#connect()
    }, 1)
  }

  #connect() {
    this.#socket = createConnection(this.#port, this.#host)

    this.#socket.on('connect', () => {
      this.#connected = true
      this.emit('connected')

      this.once('disconnected', () => {
        console.log('Disconnected. Reconnecting in 1 second...')
        setTimeout(() => {
          this.#connect()
        }, 1000)
      })
    })

    this.#socket.on('data', chunk => {
      this.#recvBuffer += chunk.toString()

      while (this.#recvBuffer.includes('\n')) {
        const packetIndex = this.#recvBuffer.indexOf('\n')
        const packetStr = this.#recvBuffer.substring(0, packetIndex)
        this.#recvBuffer = this.#recvBuffer.substring(packetIndex + 1)
        this.#onPacket(packetStr)
      }
    })

    this.#socket.on('close', this.#onClose.bind(this))
  }

  disconnect() {
    this.#socket?.destroy()
  }

  send(type, ...args) {
    this.#socket?.write(`${[type, ...args].join('|')}\n`)
  }

  #onPacket(packet) {
    const args = packet.split('|').map(e => {
      if (/^\-?\d+(\.\d+)?$/.test(e)) return Number(e)
      return e
    })
    const type = args.shift()
    this.emit('packet', type, ...args)
  }

  #onClose() {
    const wasConnected = this.#connected
    this.#connected = false
    this.#socket.removeAllListeners()
    this.#socket = null
    if (wasConnected) this.emit('disconnected')
  }
}

module.exports = {
  Client
}
