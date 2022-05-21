import React, { useEffect, useRef } from "react"
import { useGame } from "../providers/Game"

const wallSize = 2
const floorSize = 16
const roomSize = floorSize + wallSize
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
          highestX = Math.max(highestX, x)
          highestY = Math.max(highestY, y)
        }

        // Increase by one  to get the proper width/height
        highestX++
        highestY++

        const width = Math.abs(highestX - lowestX)
        const height = Math.abs(highestY - lowestY)
        const size = Math.max(width, height)
        const pixelSize = size * roomSize
        const factor = canvasPixelSize / pixelSize

        return {
          //width, height, size,
          x: lowestX,
          y: lowestY,
          //pixelSize,
          factor
        }
      })()

      const factoredRoomSize = roomSize * view.factor
      const factoredWallSize = wallSize * view.factor
      const factoredHalfWallSize = factoredWallSize / 2
      const factoredFloorSize = floorSize * view.factor

      // Clear frame
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Render walls
      for (let { pos: { x, y }, top, right, bottom, left } of Object.values(game.walls)) {
        x -= view.x
        y -= view.y
        x *= factoredRoomSize
        y *= factoredRoomSize
        ctx.fillStyle = "white"
        
        const clearX = x + factoredHalfWallSize
        const clearY = y + factoredHalfWallSize
        ctx.fillStyle = "white"
        ctx.fillRect(x - factoredHalfWallSize, y - factoredHalfWallSize, factoredRoomSize + factoredWallSize, factoredRoomSize + factoredWallSize)
        ctx.clearRect(clearX, clearY, factoredFloorSize, factoredFloorSize)

        if (!top) ctx.clearRect(clearX, clearY - factoredWallSize - 2, factoredFloorSize, factoredWallSize + 4)
        if (!right) ctx.clearRect(clearX, clearY, factoredFloorSize + factoredWallSize + 4, factoredFloorSize)
        if (!bottom) ctx.clearRect(clearX, clearY, factoredFloorSize, factoredFloorSize + factoredWallSize + 4)
        if (!left) ctx.clearRect(clearX - factoredWallSize - 2, clearY, factoredWallSize + 4, factoredFloorSize)
      }

      // Render players
      ctx.font = '12px serif'
      const playerEntries = Object.entries(game.players)
      for (let i = 0; i < playerEntries.length; i++) {
        let [username, { pos: { x, y }, chat }] = playerEntries[i]
        x -= view.x
        y - view.y
        x *= factoredRoomSize
        y *= factoredRoomSize

        const playerRadius = factoredFloorSize * 0.2
        ctx.fillStyle = playerColors[i % (playerColors.length - 1)]

        ctx.beginPath()
        ctx.arc(x + factoredFloorSize * 0.5, y + factoredFloorSize * 0.5 + 1, playerRadius, 0, 2 * Math.PI, false);
        ctx.fill()

        ctx.fillText(username, x, y, factoredRoomSize)

        if (chat) {
          ctx.fillStyle = 'white'
          ctx.fillRect(x  - 10, y + factoredRoomSize - 20, ctx.measureText(chat).width + 20, 40)
          ctx.fillStyle = 'black'
          ctx.fillText(chat, x, y + factoredRoomSize)
        }
      }
    }, 1000 / 30)

    return () => {
      clearInterval(tickInterval)
    }
  }, [canvasRef.current, game])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{
        margin: 'auto',
        backgroundSize: 'cover',
        backgroundImage: `url(https://thiscatdoesnotexist.com/)`
      }}></canvas>
    </div>
  )
}