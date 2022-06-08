import React, { useEffect, useState, useRef } from "react"
import { useGame } from "../providers/Game"
import { getColor } from "../../shared/contants/colors"

const wallSize = 2
const floorSize = 16
const roomSize = floorSize + wallSize

export function Game() {
  const { game } = useGame()
  const [offScreenCanvas] = useState<HTMLCanvasElement>(document.createElement('canvas'))
  const [offScreenContext] = useState<CanvasRenderingContext2D>(offScreenCanvas.getContext('2d') as CanvasRenderingContext2D)
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) {
      setCanvasContext(undefined)
      setCanvas(undefined)
      return
    }

    const newCanvas = canvasRef.current 
    setCanvas(newCanvas)

    const newContext = canvasRef.current.getContext('2d')
    if (newContext) setCanvasContext(newContext)
  }, [canvasRef.current])

  useEffect(() => {
    if (!canvas || !offScreenContext || !canvasContext || !game) return

    const tickInterval = setInterval(() => {
      if (!canvas.parentElement) return

      // Calculate canvas size
      const canvasPixelSize = Math.min(
        canvas.parentElement.clientHeight,
        canvas.parentElement.clientWidth
      )

      offScreenCanvas.width = canvasPixelSize
      offScreenCanvas.height = canvasPixelSize

      // Calculate view
      const view = (() => {
        //let lowestX = 0, lowestY = 0
        //let highestX = 0, highestY = 0

        // Get size info by walls
        //for (const { pos: { x, y } } of Object.values(game.walls)) {
        //  lowestX = Math.min(lowestX, x)
        //  lowestY = Math.min(lowestY, y)
        //  highestX = Math.max(highestX, x)
        //  highestY = Math.max(highestY, y)
        //}

        // Increase by one  to get the proper width/height
        //highestX++
        //highestY++

        //const width = Math.abs(highestX - lowestX)
        //const height = Math.abs(highestY - lowestY)
        const size = Math.max(game.width, game.height)
        const pixelSize = size * roomSize
        const factor = canvasPixelSize / pixelSize

        return {
          //width, height, size,
          x: 0,
          y: 0,
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
      offScreenContext.fillStyle = 'black'
      offScreenContext.fillRect(0, 0, canvas.width, canvas.height)

      // Render walls
      for (let { pos: { x, y }, top, right, bottom, left } of Object.values(game.walls)) {
        x -= view.x
        y -= view.y
        x *= factoredRoomSize
        y *= factoredRoomSize
        
        const clearX = x + factoredHalfWallSize
        const clearY = y + factoredHalfWallSize
        offScreenContext.fillStyle = "white"
        offScreenContext.fillRect(x - factoredHalfWallSize, y - factoredHalfWallSize, factoredRoomSize + factoredWallSize, factoredRoomSize + factoredWallSize)
        offScreenContext.clearRect(clearX, clearY, factoredFloorSize, factoredFloorSize)

        if (!top) offScreenContext.clearRect(clearX, clearY - factoredWallSize - 2, factoredFloorSize, factoredWallSize + 4)
        if (!right) offScreenContext.clearRect(clearX, clearY, factoredFloorSize + factoredWallSize + 4, factoredFloorSize)
        if (!bottom) offScreenContext.clearRect(clearX, clearY, factoredFloorSize, factoredFloorSize + factoredWallSize + 4)
        if (!left) offScreenContext.clearRect(clearX - factoredWallSize - 2, clearY, factoredWallSize + 4, factoredFloorSize)
      }

      // Render start
      let startX = (game.start.x - view.x) * factoredRoomSize + factoredFloorSize / 2
      let startY = (game.start.y - view.y) * factoredRoomSize + factoredFloorSize / 2
      offScreenContext.fillStyle = 'green'
      offScreenContext.fillRect(startX, startY, 10, 10)

      // Render goal
      let goalX = (game.goal.x - view.x) * factoredRoomSize + factoredFloorSize / 2
      let goalY = (game.goal.y - view.y) * factoredRoomSize + factoredFloorSize / 2
      offScreenContext.fillStyle = 'red'
      offScreenContext.fillRect(goalX, goalY, 10, 10)

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
        
        offScreenContext.font = `bold ${textHeight}px serif`
        const nameMetrics = offScreenContext.measureText(username)

        const nameX = x - nameMetrics.width / 2 - 10
        const nameY = y - textHeight * 3 - 5


        // Draw name box
        offScreenContext.fillStyle = playerColor
        offScreenContext.strokeStyle = 'black'
        offScreenContext.lineWidth = 2
        offScreenContext.beginPath()
        offScreenContext.rect(nameX, nameY, nameMetrics.width + 10, textHeight + 10)
        offScreenContext.fill()
        offScreenContext.stroke()

        // Draw player name
        offScreenContext.textBaseline = 'top'
        offScreenContext.fillStyle = 'black'
        offScreenContext.fillText(username, nameX + 5, nameY + 5)

        // Draw player circle
        offScreenContext.fillStyle = playerColor
        offScreenContext.beginPath()
        offScreenContext.arc(x, y, playerRadius, 0, 2 * Math.PI, false);
        offScreenContext.fill()

        if (chat) {
          offScreenContext.fillStyle = 'white'
          offScreenContext.fillRect(x  - 10, y + factoredRoomSize - 20, offScreenContext.measureText(chat).width + 20, 40)
          offScreenContext.fillStyle = 'black'
          offScreenContext.fillText(chat, x, y + factoredRoomSize)
        }
      }

      // Now push the rendering to real canvas
      canvas.width = offScreenCanvas.width
      canvas.height = offScreenCanvas.height
      canvasContext.drawImage(offScreenCanvas, 0, 0)
    }, 1000 / 30)

    return () => {
      clearInterval(tickInterval)
    }
  }, [offScreenContext, canvasContext, game])

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