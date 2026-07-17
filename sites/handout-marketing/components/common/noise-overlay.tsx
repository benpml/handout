"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const NOISE_OCTAVES = 8
const NOISE_TILE_SIZE = 256
const SQUARE_GRAIN_DENSITY = 0.82

type NoiseOverlayProps = {
  id: string
  className?: string
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function sampleGrid(x: number, y: number, seed: number) {
  let value =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(seed, 1442695041)

  value = Math.imul(value ^ (value >>> 13), 1274126177)

  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

function sampleOctaves(x: number, y: number, seed: number) {
  let amplitude = 1
  let amplitudeTotal = 0
  let cellSize = 1
  let value = 0

  for (let octave = 0; octave < NOISE_OCTAVES; octave += 1) {
    value +=
      sampleGrid(
        Math.floor(x / cellSize),
        Math.floor(y / cellSize),
        seed + octave * 1013,
      ) * amplitude
    amplitudeTotal += amplitude
    amplitude *= 0.5
    cellSize *= 2
  }

  return value / amplitudeTotal
}

function createNoiseTile(seed: number) {
  const tile = document.createElement("canvas")
  const context = tile.getContext("2d", { alpha: false })

  tile.width = NOISE_TILE_SIZE
  tile.height = NOISE_TILE_SIZE

  if (!context) {
    return tile
  }

  const pixels = context.createImageData(NOISE_TILE_SIZE, NOISE_TILE_SIZE)

  for (let y = 0; y < NOISE_TILE_SIZE; y += 1) {
    for (let x = 0; x < NOISE_TILE_SIZE; x += 1) {
      const pixelIndex = (y * NOISE_TILE_SIZE + x) * 4
      const occupied =
        sampleGrid(x, y, seed ^ 0x9e3779b9) < SQUARE_GRAIN_DENSITY
      const intensity = occupied
        ? Math.round(20 + Math.pow(sampleOctaves(x, y, seed), 1.15) * 235)
        : 0

      pixels.data[pixelIndex] = intensity
      pixels.data[pixelIndex + 1] = intensity
      pixels.data[pixelIndex + 2] = intensity
      pixels.data[pixelIndex + 3] = 255
    }
  }

  context.putImageData(pixels, 0, 0)

  return tile
}

function NoiseOverlay({ id, className }: NoiseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const tile = createNoiseTile(hashString(id))
    let animationFrame = 0

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const pixelWidth = Math.max(1, Math.round(width))
      const pixelHeight = Math.max(1, Math.round(height))

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }

      const context = canvas.getContext("2d", { alpha: false })

      if (!context) {
        return
      }

      context.imageSmoothingEnabled = false

      const pattern = context.createPattern(tile, "repeat")

      if (!pattern) {
        return
      }

      context.fillStyle = pattern
      context.fillRect(0, 0, pixelWidth, pixelHeight)
    }

    const scheduleRender = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(render)
    }

    const resizeObserver = new ResizeObserver(scheduleRender)

    resizeObserver.observe(canvas)
    render()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [id])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] size-full opacity-100 mix-blend-lighten [image-rendering:pixelated]",
        className,
      )}
    />
  )
}

export { NoiseOverlay }
