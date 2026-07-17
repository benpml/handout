import { cn } from "@/lib/utils"

type NoiseOverlayProps = {
  id: string
  className?: string
}

function NoiseOverlay({ id, className }: NoiseOverlayProps) {
  const filterId = `${id}-filter`

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] size-full opacity-100 mix-blend-lighten",
        className,
      )}
      preserveAspectRatio="none"
    >
      <filter
        id={filterId}
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.95"
          numOctaves="8"
          seed="7"
          stitchTiles="stitch"
        />
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0"
        />
        <feComponentTransfer>
          <feFuncR type="linear" slope="3.45" intercept="-1.556" />
          <feFuncG type="linear" slope="3.45" intercept="-1.556" />
          <feFuncB type="linear" slope="3.45" intercept="-1.556" />
        </feComponentTransfer>
        <feComponentTransfer>
          <feFuncR type="gamma" amplitude="1" exponent="0.9" offset="0" />
          <feFuncG type="gamma" amplitude="1" exponent="0.9" offset="0" />
          <feFuncB type="gamma" amplitude="1" exponent="0.9" offset="0" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  )
}

export { NoiseOverlay }
