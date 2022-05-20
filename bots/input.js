const { Client } = require('./Client')

const client = new Client('94.45.241.27', 4000, '<Your Username>', '<Your Password>')

client.on('connected', () => {
  console.log('[Bot] Connected to server')
})

client.on('packet', (type, ...args) => {
  if (type === 'error') {
    console.log('Error:', args[0])
    return
  }
})

client.on('disconnected', () => {
  console.log('[Bot] Disconnected')
})

process.stdin.resume()
process.stdin.setRawMode(true)

process.stdin.on(
  'data',
  chunk => {
    if (chunk[0] === 119) client.send('move', 'up')
    if (chunk[0] === 97) client.send('move', 'left')
    if (chunk[0] === 115) client.send('move', 'down')
    if (chunk[0] === 100) client.send('move', 'right')
  }
)
