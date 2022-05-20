import fs from 'fs'
import os from 'os'
import { EventEmitter } from 'events'
import { createServer, Server, Socket } from 'net'
import { WsStateServer } from '../libs/ws-state/server'
import { ClientSocket } from './ClientSocket'
import { Player } from './Player'
import { Game, GameState } from './Game'

const PLAYER_DATA_PATH = os.tmpdir() + '/gpn-mazing-player-data.json'
const INTERNAL_HOST = Object.values(os.networkInterfaces()).map(e => e || []).flat().filter(e => !e.internal && String(e.family).includes('4')).pop()?.address || ''

if (!INTERNAL_HOST) throw new Error('Failed getting internal ip!')

type ServerInfoState = { host: string; port: number }
type ScoreboardState = { username: string; wins: number; loses: number }[]

interface State {
  serverInfo: ServerInfoState
  scoreboard: ScoreboardState
  game?: GameState
}

export class MazeServer extends EventEmitter {
  #gamePort: number // Port number of the game tcp server
  #gameServer: Server // TCP Server instance
  #viewPort: number // Port number of the view server
  #viewServer: WsStateServer<State>
  #game?: Game // Game instance (if a game is active)
  #players: Record<string, Player> = {} // Map of players. Key=username, Value=player

  constructor(gamePort: number, viewPort: number) {
    super()
    this.#gamePort = gamePort
    this.#viewPort = viewPort

    this.#gameServer = createServer(socket => this.#onSocket(socket))
    this.#viewServer = new WsStateServer(this.#viewPort, {
      serverInfo: {
        host: INTERNAL_HOST,
        port: this.#gamePort
      },
      scoreboard: []
    })

    this.#loadPlayerData()
    this.#updateScoreboard()

    // Lets wait a tick before we start. So one could listen to the started event.
    setTimeout(() => {
      this.#startGame()

      // Lets create a tcp server
      this.#gameServer.listen(this.#gamePort)
    }, 1)
  }

  /**
   * This method will load stored player data
   */
  #loadPlayerData() {
    // Create the file if it was not found
    if (!fs.existsSync(PLAYER_DATA_PATH)) {
      fs.writeFileSync(PLAYER_DATA_PATH, '{}') // Empty object is default
    }

    try {
      const playerdata: Record<string, any> = JSON.parse(fs.readFileSync(PLAYER_DATA_PATH).toString())
      for (const [username, { password, scoreHistory }] of Object.entries(playerdata)) {
        if (!this.#players[username]) this.#players[username] = new Player(username, password)
        if (scoreHistory) this.#players[username].scoreHistory = scoreHistory
      }
    } catch (error) { }
  }

  /**
   * This method will store player data
   */
  #storePlayerData() {
    // Create the file if it was not found
    if (!fs.existsSync(PLAYER_DATA_PATH)) {
      fs.writeFileSync(PLAYER_DATA_PATH, '{}') // Empty object is default
    }

    try {
      const playerdata: Record<string, any> = JSON.parse(fs.readFileSync(PLAYER_DATA_PATH).toString())

      for (const { username, password, scoreHistory } of Object.values(this.#players)) {
        playerdata[username] = { password, scoreHistory }
      }

      fs.writeFileSync(PLAYER_DATA_PATH, JSON.stringify(playerdata, null, 2))
    } catch (error) { }
  }

  #updateScoreboard() {
    this.#viewServer.state.scoreboard = Object.values(this.#players)
      .map(({ username, wins, loses }) => {
        const games = wins + loses
        const winRatio = games > 0 ? wins / games : 0
        return { username, winRatio, wins, loses }
      })
      //.filter(({ winRatio }) => winRatio > 0)
      .sort((a, b) => {
        const n = b.winRatio - a.winRatio
        if (n !== 0) return n
        return b.wins - a.wins
      })
      .slice(0, 20)
      .map(({ username, winRatio, wins, loses }) => ({ username, winRatio, wins, loses }))
  }

  /**
   * This method will create a game instance and add current connected players to it.
   * The method will call itself to keep games running.
   * @param difficulty A number that decides the map difficulty
   */
  #startGame(difficulty: number = 2) {
    if (this.#game) throw new Error('Game in progress')
    const startTime = Date.now()

    const game = new Game(difficulty) // Create a new game
    this.#game = game
    this.#viewServer.state.game = game.state

    // Lets add current connected players to the game
    for (const player of Object.values(this.#players)) {
      if (!player.connected) continue
      player.joinGame(game)
    }

    // Lets listen to the game end event
    game.on('end', () => {
      // We use the time the game did run to decide if we increase or decrease difficulty
      const gameTime = Date.now() - startTime
      const minTime = 50 * 1000 // minTime is the minimum time a game should run
      const maxTime = 65 * 1000 // maxTime is the maximum time a game should run
      game.removeAllListeners()
      delete this.#viewServer.state.game
      this.#game = undefined

      // Store the current player data as it contains the new wins and loses
      this.#storePlayerData()

      this.#updateScoreboard()

      // Lets increase/decrease difficulty if needed
      if (gameTime > maxTime && difficulty > 2) difficulty-- // Lower difficulty if its too hard
      else if (gameTime < minTime) difficulty++ // Raise difficulty if its too easy

      // Since the game did end lets create a new one with new difficulty
      setTimeout(() => this.#startGame(difficulty), 100)
    })
  }

  /**
   * Our callback which is called as soon as a peer connects to the tcp server
   * @param socket The tcp client socket that connected to this server
   */
  async #onSocket(socket: Socket) {
    const clientSocket = new ClientSocket(socket) // Lets create a ClientSocket instance which has alot of useful functions

    clientSocket.send('motd', 'You can find the protocol documentation here: https://github.com/freehuntx/gpn-mazing/blob/master/PROTOCOL.md')

    // We need a timeout to detect if a client takes too long to join. 5 seconds should be fine
    const joinTimeout = setTimeout(() => {
      clientSocket.sendError('join timeout', true)
    }, 5000)

    // We listen once to the packet event. We expect the first packet to be a join packet
    clientSocket.once('packet', (packetType: string, username: string, password: string) => {
      if (packetType !== 'join') return clientSocket.sendError('join packet expected', true)

      // Check the username
      if (typeof username !== "string") return clientSocket.sendError('invalid username', true)
      if (username.length < 1) return clientSocket.sendError('username too short', true)
      if (username.length > 32) return clientSocket.sendError('username too long', true)

      if (!/^[ -~]+$/.test(username)) {
        return clientSocket.sendError('username has invalid symbols', true)
      }

      // Check the password
      if (typeof password !== "string") return clientSocket.sendError('invalid password', true)
      if (password.length < 1) return clientSocket.sendError('password too short', true)
      if (username.length > 128) return clientSocket.sendError('password too long', true)

      // If we already have a player instance for this username lets use that
      let player = this.#players[username]

      if (player) {
        // There is a player with this name already? Check if the password is correct!
        if (player.password !== password) return clientSocket.sendError('wrong password', true)
        if (player.connected) {
          player.leaveGame()
          player.sendError('Kicked out of session. Somebody else uses your user!', true)
        }
      } else {
        // Create a new player if we dont know this user yet
        player = new Player(username, password)
        this.#players[username] = player
      }

      clearTimeout(joinTimeout) // Timeout is not needed as the client joined properly
      player.setSocket(clientSocket) // Lets update the socket of this player

      // If there is a game let the player join it
      if (this.#game) player.joinGame(this.#game)
    })
  }
}