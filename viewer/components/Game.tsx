import React, { useEffect, useRef } from "react"
import { useGame } from "../providers/Game"

const wallSize = 1
const floorSize = 16
const roomSize = floorSize + wallSize * 2
const playerColors = ['red', 'green', 'blue', 'orange', 'yellow', 'violet']

export function Game() {
  const { game } = useGame()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !game) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tickInterval = setInterval(() => {
      // Clear frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Render walls
      for (const { pos: { x, y }, top, right, bottom, left } of Object.values(game.walls)) {
        const nativeX = x * roomSize
        const nativeY = y * roomSize
        ctx.fillStyle = "white"

        if (top == true) ctx.fillRect(nativeX, nativeY, roomSize, wallSize)
        if (right == true) ctx.fillRect(nativeX + wallSize + floorSize, nativeY, wallSize, roomSize)
        if (bottom == true) ctx.fillRect(nativeX, nativeY + wallSize + floorSize, roomSize, wallSize)
        if (left == true) ctx.fillRect(nativeX, nativeY, wallSize, roomSize)
      }

      // Render players
      ctx.font = '12px serif'
      const playerEntries = Object.entries(game.players)
      for (let i = 0; i < playerEntries.length; i++) {
        const [username, { pos: { x, y }, chat }] = playerEntries[i]

        const nativeX = x * roomSize
        const nativeY = y * roomSize
        const playerRadius = roomSize * 0.2
        ctx.fillStyle = playerColors[i % (playerColors.length - 1)]

        ctx.beginPath()
        ctx.arc(nativeX + roomSize * 0.5 + 1, nativeY + roomSize * 0.5 + 1, playerRadius, 0, 2 * Math.PI, false);
        ctx.fill()

        ctx.fillText(username, nativeX - 10, nativeY + roomSize * 1.5)
      }
    }, 1000 / 30)

    return () => {
      clearInterval(tickInterval)
    }
  }, [canvasRef.current, game])

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', background: 'black' }}></canvas>
  )
}