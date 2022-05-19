import React, { createContext, useContext, useEffect, useState } from 'react'
import { WsStateClient } from '../../libs/ws-state/client'

type ServerInfo = { host: string; port: number }
type ScoreboardEntry = { username: string; wins: number; loses: number }
type Player = { username: string; pos: Vec2 }
type Wall = { pos: Vec2; top: boolean; right: boolean; bottom: boolean; left: boolean }

type Game = {
  players: Record<string, { pos: Vec2; chat?: string }>
  walls: Record<string, Wall>
}

interface GameContext {
  serverInfo?: ServerInfo
  scoreboard: ScoreboardEntry[]
  game?: Game
}

const gameContext = createContext<GameContext>({ scoreboard: [] })

export const useGame = () => useContext(gameContext)

export function GameProvider({ children }: { children: React.ReactElement }) {
  const [serverInfo, setServerInfo] = useState<ServerInfo>()
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [game, setGame] = useState<Game>()

  useEffect(() => {
    const client = new WsStateClient(4001)

    client.on('update', () => {
      setServerInfo(client.state.serverInfo)
      setScoreboard(client.state.scoreboard)
      setGame(client.state.game)
      window.game = client.state.game
    })
  }, [])

  return (
    <gameContext.Provider value={{ serverInfo, scoreboard, game }}>
      {children}
    </gameContext.Provider>
  )
}