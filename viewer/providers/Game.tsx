import React, { createContext, useContext, useEffect, useState } from 'react'
import { WsStateClient } from '../../libs/ws-state/client'

type ServerInfoList = { host: string; port: number }[]
type ScoreboardEntry = { username: string; winRatio: number; wins: number; loses: number, elo: number }
type Wall = { pos: Vec2; top: boolean; right: boolean; bottom: boolean; left: boolean }
type ChartData = Record<string, any>[]

type Game = {
  id: string
  width: number
  height: number
  start: Vec2
  goal: Vec2
  players: Record<string, { pos: Vec2; chat?: string }>
  walls: Record<string, Wall>
}

interface GameContext {
  serverInfoList: ServerInfoList
  scoreboard: ScoreboardEntry[]
  lastWinners: string[]
  chartData: ChartData
  game?: Game
}

const gameContext = createContext<GameContext>({ serverInfoList: [], scoreboard: [], lastWinners: [], chartData: [] })

export const useGame = () => useContext(gameContext)

export function GameProvider({ children }: { children: React.ReactElement }) {
  const [serverInfoList, setServerInfoList] = useState<ServerInfoList>([])
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [game, setGame] = useState<Game>()
  const [lastWinners, setLastWinners] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartData>([])

  useEffect(() => {
    const client = new WsStateClient(4001)

    client.on('update', (path) => {
      setServerInfoList(client.state.serverInfoList)
      setScoreboard(client.state.scoreboard)
      setLastWinners(client.state.lastWinners)
      setChartData(client.state.chartData)
      setGame(client.state.game)
    })
  }, [])

  return (
    <gameContext.Provider value={{ serverInfoList, chartData, scoreboard, game, lastWinners }}>
      {children}
    </gameContext.Provider>
  )
}