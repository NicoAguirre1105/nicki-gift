import mapJson from '@/public/assets/Free CC0 Top Down Tileset Template Pixel Art by Rgsdev/Free CC0 Top Down Tileset Pixel Art/Tilesets/map.json'

export const TILE_SIZE = 16
export const MAP_COLS = 75
export const MAP_ROWS = 68

// Tileset: tileset_full.png — 16 columnas, tiles 16×16
export const TILESET_COLS = 16
export const TILESET_PATH =
  '/assets/Free CC0 Top Down Tileset Template Pixel Art by Rgsdev/Free CC0 Top Down Tileset Pixel Art/Tilesets/tileset_full.png'

export type TilePoint = { x: number; y: number; index: number }

export type ParsedMap = {
  floor:   number[]
  walls:   number[]
  trivia:  number[]
  traps:   number[]
  end:     number[]
  triviaPoints: TilePoint[]
  endPoint:     TilePoint | null
}

function getLayer(name: string): number[] {
  const layer = (mapJson.layers as { name: string; data: number[] }[]).find(
    (l) => l.name === name
  )
  if (!layer) throw new Error(`Capa "${name}" no encontrada en map.json`)
  return layer.data
}

export function parseMap(): ParsedMap {
  const floor  = getLayer('floor and border')
  const walls  = getLayer('walls')
  const trivia = getLayer('trivia points')
  const traps  = getLayer('traps')
  const end    = getLayer('end')

  const triviaPoints: TilePoint[] = []
  trivia.forEach((v, i) => {
    if (v !== 0) triviaPoints.push({ x: i % MAP_COLS, y: Math.floor(i / MAP_COLS), index: triviaPoints.length })
  })

  let endPoint: TilePoint | null = null
  end.forEach((v, i) => {
    if (v !== 0) endPoint = { x: i % MAP_COLS, y: Math.floor(i / MAP_COLS), index: 0 }
  })

  return { floor, walls, trivia, traps, end, triviaPoints, endPoint }
}

/** Devuelve true si la posición en tiles (tx, ty) tiene colisión con walls */
export function isWallTile(walls: number[], tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return true
  return walls[ty * MAP_COLS + tx] !== 0
}

/** Dado un tileId (1-based), calcula el recorte en el tileset */
export function getTileSrc(tileId: number): { sx: number; sy: number } {
  const id = tileId - 1 // Tiled usa 1-based
  const sx = (id % TILESET_COLS) * TILE_SIZE
  const sy = Math.floor(id / TILESET_COLS) * TILE_SIZE
  return { sx, sy }
}
