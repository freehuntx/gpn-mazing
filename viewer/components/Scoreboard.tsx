import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { useGame } from '../providers/Game'
import { getColor } from '../../shared/contants/colors'

export function Scoreboard() {
  const { chartData, scoreboard } = useGame()

  const lines = {};
  chartData.forEach((point) => {
    Object.keys(point).forEach((key, index) => {
      if (lines[key] || key === "name") return;
      lines[key] = {
        dataKey: key,
        stroke: getColor(index)
      };
    });
  });

  return (
    <>
      <table style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th></th>
            <th>Username</th>
            <th>Win Ratio</th>
            <th>Wins</th>
            <th>Loses</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: '1em' }}></tr>
          {scoreboard.map(({ username, winRatio, wins, loses }, index) => (
            <tr key={username}>
              <td>{index + 1}.</td>
              <td>{username}</td>
              <td>{winRatio.toFixed(2)}</td>
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
      <LineChart
        width={500}
        height={300}
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        {/*<CartesianGrid strokeDasharray="3 3" />*/}
        <XAxis dataKey="name" />
        <YAxis />
        {/*<Tooltip />*/}
        <Legend />
        {Object.values(lines).map(({ dataKey, stroke }) => (
          <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={stroke} />
        ))}
      </LineChart>
    </>
  )
}