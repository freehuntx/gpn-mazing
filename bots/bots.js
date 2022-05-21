const { Client } = require('./Client')

const username = process.argv[2] || '<Your Username>'
const password = process.argv[3] || '<Your Password>'

for (let i=0; i<10; i++) {
  const client = new Client('127.0.0.1', 4000, username + i, password)
  let decisions = {}
  
  client.on('connected', () => {
    console.log('[Bot] Connected to server')
  })
  
  client.on('packet', (type, ...args) => {
    if (type === 'error') {
      console.log('Error:', args[0])
      return
    }
  
    if (type === 'goal') {}

    if (type === 'game') {
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
}
