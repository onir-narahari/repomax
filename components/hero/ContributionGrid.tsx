const COLS = 52
const ROWS = 7
const CELL = 12
const GAP = 3
const TILE_GAP_X = 28
const TILE_GAP_Y = 22

const STRIP_W = COLS * CELL + (COLS - 1) * GAP
const STRIP_H = ROWS * CELL + (ROWS - 1) * GAP
const PATTERN_W = STRIP_W + TILE_GAP_X
const PATTERN_H = STRIP_H + TILE_GAP_Y

function cellLevel(col: number, row: number) {
  const n = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453
  return Math.floor((n - Math.floor(n)) * 5)
}

const LEVEL_OPACITY = [0.08, 0.14, 0.22, 0.36, 0.52]

const STRIP_CELLS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return {
    x: col * (CELL + GAP),
    y: row * (CELL + GAP),
    level: cellLevel(col, row),
  }
})

export default function ContributionGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="hero-contribution-wrap h-full w-full opacity-[0.14] xl:opacity-[0.17]"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
          <defs>
            <pattern
              id="hero-contribution-pattern"
              width={PATTERN_W}
              height={PATTERN_H}
              patternUnits="userSpaceOnUse"
            >
              {STRIP_CELLS.map(({ x, y, level }, i) => (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={`rgba(59, 130, 246, ${LEVEL_OPACITY[level]})`}
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-contribution-pattern)" />
      </svg>
    </div>
  )
}
