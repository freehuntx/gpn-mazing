import React from 'react'
import { useGame } from '../providers/Game'

export function Scoreboard() {
  const { scoreboard } = useGame()

  return (
    <table style={{ width: '100%', textAlign: 'left' }}>
      <thead>
        <tr>
          <th></th>
          <th>Username</th>
          <th>Wins</th>
          <th>Loses</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ height: '1em' }}></tr>
        {scoreboard.map(({ username, wins, loses }, index) => (
          <tr key={username}>
            <td>{index + 1}.</td>
            <td>{username}</td>
            <td>{wins}</td>
            <td>{loses}</td>
          </tr>
        ))}
        {scoreboard.length === 0 && (
          <tr>
            <td colSpan={4}>Nobody scored yet :(</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}