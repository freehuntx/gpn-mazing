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
      if (!canvas.parentElement) return

      // Calculate canvas size
      const canvasPixelSize = Math.min(
        canvas.parentElement.clientHeight,
        canvas.parentElement.clientWidth
      )
      canvas.width = canvasPixelSize
      canvas.height = canvasPixelSize

      // Calculate view
      const view = (() => {
        let lowestX = 0, lowestY = 0
        let highestX = 0, highestY = 0

        // Get size info by walls
        for (const { pos: { x, y } } of Object.values(game.walls)) {
          lowestX = Math.min(lowestX, x)
          lowestY = Math.min(lowestY, y)
          highestX = Math.max(highestX, x+1)
          highestY = Math.max(highestY, y+1)
        }

        const width = Math.abs(highestX - lowestX)
        const height = Math.abs(highestY - lowestY)
        const size = Math.max(width, height)
        const pixelSize = size * roomSize
        const factor = canvasPixelSize / pixelSize

        return {
          width, height, size,
          x: lowestX,
          y: lowestY,
          pixelSize,
          factor
        }
      })()

      const factoredRoomSize = roomSize * view.factor
      const factoredWallSize = wallSize * view.factor
      const factoredFloorSize = floorSize * view.factor

      // Clear frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Render walls
      for (const { pos: { x, y }, top, right, bottom, left } of Object.values(game.walls)) {
        const xInView = x - view.x
        const yInView = y - view.y
        const nativeX = xInView * factoredRoomSize
        const nativeY = yInView * factoredRoomSize
        ctx.fillStyle = "white"

        if (top == true) ctx.fillRect(nativeX, nativeY, factoredRoomSize, factoredWallSize)
        if (right == true) ctx.fillRect(nativeX + factoredWallSize + factoredFloorSize, nativeY, factoredWallSize, factoredRoomSize)
        if (bottom == true) ctx.fillRect(nativeX, nativeY + factoredWallSize + factoredFloorSize, factoredRoomSize, factoredWallSize)
        if (left == true) ctx.fillRect(nativeX, nativeY, factoredWallSize, factoredRoomSize)
      }

      // Render players
      ctx.font = '12px serif'
      const playerEntries = Object.entries(game.players)
      for (let i = 0; i < playerEntries.length; i++) {
        const [username, { pos: { x, y }, chat }] = playerEntries[i]
        const xInView = x - view.x
        const yInView = y - view.y
        const nativeX = xInView * factoredRoomSize
        const nativeY = yInView * factoredRoomSize

        const playerRadius = factoredFloorSize * 0.2
        ctx.fillStyle = playerColors[i % (playerColors.length - 1)]

        ctx.beginPath()
        ctx.arc(nativeX + factoredFloorSize * 0.5 + 1, nativeY + factoredFloorSize * 0.5 + 1, playerRadius, 0, 2 * Math.PI, false);
        ctx.fill()

        ctx.fillText(username, nativeX, nativeY, factoredRoomSize)

        if (chat) {
          ctx.fillStyle = 'white'
          ctx.fillRect(nativeX  - 10, nativeY + factoredRoomSize - 20, ctx.measureText(chat).width + 20, 40)
          ctx.fillStyle = 'black'
          ctx.fillText(chat, nativeX, nativeY + factoredRoomSize)
        }
      }
    }, 1000 / 30)

    return () => {
      clearInterval(tickInterval)
    }
  }, [canvasRef.current, game])

  return (
    <canvas ref={canvasRef} style={{ background: 'black' }}></canvas>
  )
}