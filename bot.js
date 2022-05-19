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

      const chatSendInterval = setInterval(() => {
        this.send('chat', 'Im a stupid bot')
      }, 6000)

      this.once('disconnected', () => {
        clearInterval(chatSendInterval)
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
    this.#socket.removeAllListeners()
    this.#socket = null
    if (wasConnected) this.emit('disconnected')
  }
}

const client = new Client('127.0.0.1', 4000, 'bot-boschi', 'somePass')
let decisions = {}

client.on('connected', () => {
  console.log('[Bot] Connected to server')
})

client.on('packet', (type, ...args) => {
  if (type === 'error') {
    console.log('Error:', args[0])
    return
  }

  if (type === 'goal') {
    decisions = {}
  }

  if (type === 'pos') {
    const [x, y, top, right, bottom, left] = args

    let moves = []
    if (!top) moves.push('up')
    if (!right) moves.push('right')
    if (!bottom) moves.push('down')
    if (!left) moves.push('left')

    const newMoves = moves.filter(move => !decisions[`${x}:${y}:${move}`])

    if (newMoves.length > 0) moves = newMoves
    const move = moves[Math.floor(Math.random()*moves.length)]

    decisions[`${x}:${y}:${move}`] = true

    client.send('move', move)

    return
  }

  console.log('[Bot] Packet:', type, ...args)
})

client.on('disconnected', () => {
  console.log('[Bot] Disconnected')
})
