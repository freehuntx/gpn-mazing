import React from 'react'
import { useGame } from '../providers/Game'
import { Scoreboard } from './Scoreboard'
import { Game } from './Game'

export function App() {
  const { serverInfoList, lastWinners } = useGame()

  return (
    <div style={{ display: 'flex', height: '100%', fontSize: '1.3em', wordBreak: 'break-all', background: 'black', color: 'white' }}>
      <div style={{ width: '60%', height: '80%', flexShrink: 0 }}>
        <Game />
      </div>
      <div style={{ flexGrow: 1, padding: '1em' }}>
        <h3>Serverinfo: (Please prefer IPv6! As IPv4 may change :()</h3>
        <ul>
          {serverInfoList.map(({ host, port }) => (
            <li key={`${host}:${port}`}>TCP: {`${host}:${port}`}</li>
          ))}
        </ul>
        <hr style={{ margin: '1em 0' }} />
        {lastWinners.length > 0 && (
          <>
            <b>Last winners:</b> {lastWinners.join(', ')}
            <hr style={{ margin: '1em 0' }} />
          </>
        )}
        <h3 style={{ marginBottom: '.5em' }}>Scoreboard (Last 2 Hours)</h3>
        <Scoreboard />
      </div>
    </div>
  )
}
