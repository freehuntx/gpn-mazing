import { EventEmitter } from 'events'
import jsynchronous from 'jsynchronous'
import { WebSocketServer } from 'ws'
import { GameServer } from '../game/GameServer'
import { Game } from '../game/Game'
import { Player } from '../game/Player'

jsynchronous.send = (websocket: any, data: any) => websocket.send(data)

export class ViewServer extends EventEmitter {
  #port: number // The port the server listens to
  #server?: WebSocketServer // The websocket server
  #gameServer: GameServer // The gameserver instance
  #state = jsynchronous({
    players: [],
    walls: [],
    goal: null
  })

  constructor(port: number, gameServer: GameServer) {
    super()

    this.#port = port
    this.#gameServer = gameServer

    //this.#sendServerinfo()
    //this.#sendScoreboard()

    //this.#gameServer.on('startGame', (game: Game) => {
    //  this.#onGame(game)
    //})

    setTimeout(() => {
      this.#start()
    }, 1)
  }

  get port(): number { return this.#port } // Make the port accessible outside this class

  /**
   * This method will start the websocket server and setup state sync
   */
  #start(): void {
    this.#server = new WebSocketServer({ port: this.#port })

    this.#server.on('connection', ws => {
      this.#state.$ync(ws)
      ws.on('message', data => jsynchronous.onmessage(ws, data))
      ws.on('close', () => this.#state.$unsync(ws))
    })

    this.emit('listening')
  }
}
