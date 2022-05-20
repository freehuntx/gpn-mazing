import React from 'react'
import { useGame } from '../providers/Game'
import { Scoreboard } from './Scoreboard'
import { Game } from './Game'

export function App() {
  const { serverInfo, lastWinners } = useGame()

  return (
    <div style={{ display: 'flex', height: '100%', fontSize: '1.3em', wordBreak: 'break-all', background: 'black', color: 'white' }}>
      <div style={{ width: '60%', height: '80%', flexShrink: 0 }}>
        <Game />
      </div>
      <div style={{ flexGrow: 1, padding: '1em' }}>
        {serverInfo && (
          <span style={{ fontSize: '1.7em' }}><b>TCP Server:</b> {serverInfo.host}:{serverInfo.port}</span>
        )}
        <hr style={{ margin: '1em 0' }} />
        {lastWinners.length > 0 && (
          <>
            <h2>Last winners</h2>
            <ul>
              {lastWinners.map(username => (
                <li key={username}>{username}</li>
              ))}
            </ul>
            <hr style={{ margin: '1em 0' }} />
          </>
        )}
        <h2 style={{ marginBottom: '.5em' }}>Scoreboard (Last 2 Hours)</h2>
        <Scoreboard />
      </div>
    </div>
  )
}
