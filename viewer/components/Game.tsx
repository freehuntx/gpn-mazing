import React, { useEffect, useRef } from "react"
import { useGame } from "../providers/Game"
import { getColor } from "../../shared/contants/colors"

const wallSize = 2
const floorSize = 16
const roomSize = floorSize + wallSize

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
      const factoredHalfRoomSize = factoredRoomSize / 2
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
      const playerEntries = Object.entries(game.players)
      for (let i = 0; i < playerEntries.length; i++) {
        const playerColor = getColor(i)
        let [username, { pos: { x, y }, chat }] = playerEntries[i]
        x -= view.x
        y - view.y
        x *= factoredRoomSize
        y *= factoredRoomSize
        x += factoredHalfRoomSize
        y += factoredHalfRoomSize

        const playerRadius = factoredFloorSize * 0.4
        const textHeight = 18
        
        ctx.font = `bold ${textHeight}px serif`
        const nameMetrics = ctx.measureText(username)

        const nameX = x - nameMetrics.width / 2 - 10
        const nameY = y - textHeight * 3 - 5


        // Draw name box
        ctx.fillStyle = playerColor
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.rect(nameX, nameY, nameMetrics.width + 10, textHeight + 10)
        ctx.fill()
        ctx.stroke()

        // Draw player name
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'black'
        ctx.fillText(username, nameX + 5, nameY + 5)

        // Draw player circle
        ctx.fillStyle = playerColor
        ctx.beginPath()
        ctx.arc(x, y, playerRadius, 0, 2 * Math.PI, false);
        ctx.fill()

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
      <div style={{
        position: 'absolute',
        zIndex: 0,
        top: canvasRef.current ? canvasRef.current.offsetTop + 'px' : 0,
        left: canvasRef.current ? canvasRef.current.offsetLeft + 'px' : 0,
        width: canvasRef.current ? canvasRef.current.width + 'px' : 0,
        height: canvasRef.current ? canvasRef.current.height + 'px' : 0,
        opacity: 0.5,
        backgroundSize: 'cover',
        backgroundImage: `url(https://thiscatdoesnotexist.com/?rand=${game?.id})`
      }}>
      </div>
      <canvas ref={canvasRef} style={{
        margin: 'auto',
        zIndex: 1,
      }}></canvas>
    </div>
  )
}