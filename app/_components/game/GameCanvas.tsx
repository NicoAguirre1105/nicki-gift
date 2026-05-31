'use client'

import { useEffect, useRef, useReducer, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  parseMap,
  isWallTile,
  getTileSrc,
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  TILESET_PATH,
} from '@/app/lib/map'
import {
  initialGameState,
  gameReducer,
  PLAYER_START,
  TOTAL_TRIVIA,
} from '@/app/lib/gameState'
import { createSupabaseBrowserClient } from '@/app/lib/supabase'
import HUD from './HUD'
import TriviaModal from './TriviaModal'
import DPad, { Direction } from './DPad'

// ─── Escala y dimensiones ────────────────────────────────────────────────────
const SCALE        = 3
const TILE_RENDER  = TILE_SIZE * SCALE   // 48px por tile en pantalla
const VIEWPORT_COLS = 15
const VIEWPORT_ROWS = 12
const CANVAS_W     = (VIEWPORT_COLS + 1) * TILE_RENDER
const CANVAS_H     = (VIEWPORT_ROWS + 1) * TILE_RENDER

// ─── Velocidad de movimiento (px por frame a ~60fps) ─────────────────────────
const SPEED = 4   // ~90px/s · TILE_RENDER=48px → ~0.53s por tile

// ─── Hitbox en los pies ───────────────────────────────────────────────────────
// Rectángulo pequeño centrado en el anchor (posición de los pies del personaje)
const HB_HALF_W = 10  // px a cada lado horizontalmente
const HB_HALF_H = 6   // px arriba/abajo

// ─── Sprite ──────────────────────────────────────────────────────────────────
const FRAME_COUNT = 4
const FRAME_MS    = 150   // ms por frame de animación

type AnimDir = 'up' | 'down' | 'left' | 'right'

const DIR_FRAMES: Record<AnimDir, string[]> = {
  down:  Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_down_${i + 1}-removebg-preview.png`),
  up:    Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_up_${i + 1}-removebg-preview.png`),
  left:  Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_left_${i + 1}-removebg-preview.png`),
  right: Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_right_${i + 1}-removebg-preview.png`),
}
const IDLE_SRC = '/characters/Nicki/frame_base-removebg-preview.png'

// Altura fija de render del sprite en pantalla (en px canvas)
// Las imágenes son rectángulos portrait: down/up/base ≈ 185×242, left/right ≈ 157×234
const SPRITE_H = TILE_RENDER * 2  

// Anchos calculados por ratio de las imágenes originales
const SPRITE_W: Record<AnimDir | 'idle', number> = {
  down:  Math.round(SPRITE_H * (185 / 242)),
  up:    Math.round(SPRITE_H * (155 / 239)),
  left:  Math.round(SPRITE_H * (157 / 234)),
  right: Math.round(SPRITE_H * (157 / 233)),
  idle:  Math.round(SPRITE_H * (184 / 241)),
}

// Cooldown de trampa (ms) — evita perder varias vidas seguidas en el mismo tile
const TRAP_COOLDOWN_MS = 2000

// ─── Mapa de teclas → dirección ───────────────────────────────────────────────
const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',    w: 'up',    W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
}

// ─── Dirección → delta ────────────────────────────────────────────────────────
const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy:  1 },
  left:  { dx: -1, dy:  0 },
  right: { dx: 1,  dy:  0 },
}

export default function GameCanvas() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGameState)

  // ── Assets ────────────────────────────────────────────────────────────────
  const tilesetImg = useRef<HTMLImageElement | null>(null)
  const idleImg    = useRef<HTMLImageElement | null>(null)
  const dirImgs    = useRef<Record<AnimDir, HTMLImageElement[]>>({} as Record<AnimDir, HTMLImageElement[]>)
  const assetsOk   = useRef(false)

  // ── Mapa ──────────────────────────────────────────────────────────────────
  const mapData = useRef(parseMap())

  // ── Estado de movimiento (refs para no bloquear el loop) ──────────────────
  // Anchor en px (world space) — empieza en el centro del tile inicial
  const posRef = useRef({
    x: (PLAYER_START.x + 0.5) * TILE_RENDER,
    y: (PLAYER_START.y + 0.75) * TILE_RENDER,
  })
  const facingRef    = useRef<AnimDir>('down')
  const frameIdxRef  = useRef(0)
  const lastFrameMs  = useRef(0)
  const rafRef       = useRef(0)

  // Set de teclas actualmente presionadas (fix multi-key)
  const heldKeys = useRef(new Set<Direction>())

  // Tile bajo los pies en el frame anterior (para detectar entradas a trivia/end/traps)
  const lastFeetTile  = useRef({ x: PLAYER_START.x, y: PLAYER_START.y })
  const lastTrapHitMs = useRef(0)   // timestamp del último golpe de trampa

  // Ref mutable de triviaCollected para acceder desde el loop sin stale closure
  const triviaCollectedRef = useRef<number[]>([])
  triviaCollectedRef.current = state.triviaCollected

  // Ref mutable de phase
  const phaseRef = useRef(state.phase)
  phaseRef.current = state.phase

  // ── Carga de assets ───────────────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0
    const total = 1 + 1 + (4 * FRAME_COUNT)   // tileset + idle + 4dirs*4frames

    function onLoad() {
      loaded++
      if (loaded >= total) assetsOk.current = true
    }

    const ts = new Image(); ts.src = TILESET_PATH; ts.onload = onLoad
    tilesetImg.current = ts

    const idle = new Image(); idle.src = IDLE_SRC; idle.onload = onLoad
    idleImg.current = idle

    ;(['up', 'down', 'left', 'right'] as AnimDir[]).forEach(dir => {
      dirImgs.current[dir] = DIR_FRAMES[dir].map(src => {
        const img = new Image(); img.src = src; img.onload = onLoad; return img
      })
    })
  }, [])

  // ── Diálogos de introducción ──────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'intro') return
    const msgs = [
      '¡Bienvenida, Nicki! 🗺️\nEste es el laberinto que preparé para ti.',
      'Usa las teclas de dirección (o el D-Pad en móvil) para moverte.',
      'Encuentra las 10 llaves doradas repartidas por el mapa.\nCada una tiene una pregunta especial.',
      '¡Buena suerte! Te espero al final del laberinto. 💙',
    ]
    let i = 0
    function next() {
      if (i < msgs.length) { alert(msgs[i++]); next() }
      else dispatch({ type: 'SET_PHASE', phase: 'playing' })
    }
    const t = setTimeout(next, 300)
    return () => clearTimeout(t)
  }, [state.phase])

  // ── Teclado: usa un Set para manejar múltiples teclas simultáneas ─────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEY_MAP[e.key]
      if (!dir) return
      e.preventDefault()
      heldKeys.current.add(dir)
    }
    function onKeyUp(e: KeyboardEvent) {
      const dir = KEY_MAP[e.key]
      if (dir) heldKeys.current.delete(dir)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  // ── Fin del laberinto ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'end') return
    alert('¡Lo lograste! Has completado el laberinto. 🎉\nAhora te espera algo especial...')
    async function finish() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({ maze_completed: true }).eq('id', user.id)
      router.push('/dashboard')
    }
    finish()
  }, [state.phase, router])

  // ── Colisión con hitbox ───────────────────────────────────────────────────
  function wouldCollide(nx: number, ny: number): boolean {
    const corners = [
      { x: nx - HB_HALF_W, y: ny - HB_HALF_H },
      { x: nx + HB_HALF_W, y: ny - HB_HALF_H },
      { x: nx - HB_HALF_W, y: ny + HB_HALF_H },
      { x: nx + HB_HALF_W, y: ny + HB_HALF_H },
    ]
    return corners.some(c => {
      const tx = Math.floor(c.x / TILE_RENDER)
      const ty = Math.floor(c.y / TILE_RENDER)
      return isWallTile(mapData.current.walls, tx, ty)
    })
  }

  // ── Loop principal ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop)

      if (!assetsOk.current) return
      const phase = phaseRef.current
      if (phase === 'intro' || phase === 'end') return

      const held = heldKeys.current

      // ── Calcular movimiento ─────────────────────────────────────────────
      let isMoving = false

      if (phase === 'playing' && held.size > 0) {
        // Prioridad: las dos primeras teclas del Set (orden de inserción)
        const activeDirs = [...held].slice(0, 2) as Direction[]

        // Intentar mover en X e Y por separado (permite deslizarse en paredes)
        let dx = 0, dy = 0
        activeDirs.forEach(dir => {
          dx += DIR_DELTA[dir].dx
          dy += DIR_DELTA[dir].dy
        })

        // Normalizar para que la velocidad sea constante en diagonal
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const vx = (dx / len) * SPEED
        const vy = (dy / len) * SPEED

        const cur = posRef.current
        const nx = cur.x + vx
        const ny = cur.y + vy

        // Movimiento separado en X e Y para deslizamiento suave en paredes
        const canX = !wouldCollide(nx, cur.y)
        const canY = !wouldCollide(cur.x, ny)

        if (canX) posRef.current.x = nx
        if (canY) posRef.current.y = ny

        isMoving = canX || canY

        // Actualizar facing según la dirección dominante
        if (isMoving) {
          // Preferir la dirección con mayor componente de movimiento
          const dominantDir = activeDirs.reduce<Direction>((best, dir) => {
            const db = Math.abs(DIR_DELTA[best].dx) + Math.abs(DIR_DELTA[best].dy)
            const dc = Math.abs(DIR_DELTA[dir].dx) + Math.abs(DIR_DELTA[dir].dy)
            return dc >= db ? dir : best
          })
          facingRef.current = dominantDir
        }
      }

      // ── Animación del personaje ─────────────────────────────────────────
      if (isMoving) {
        if (now - lastFrameMs.current > FRAME_MS) {
          lastFrameMs.current = now
          frameIdxRef.current = (frameIdxRef.current + 1) % FRAME_COUNT
        }
      } else {
        // Parado → frame_base
        frameIdxRef.current = 0
      }

      // ── Detectar tile bajo los pies ─────────────────────────────────────
      const { x: px, y: py } = posRef.current
      const feetTileX = Math.floor(px / TILE_RENDER)
      const feetTileY = Math.floor(py / TILE_RENDER)

      if (phase === 'playing') {
        const prev = lastFeetTile.current
        const tileChanged = feetTileX !== prev.x || feetTileY !== prev.y

        if (tileChanged) {
          lastFeetTile.current = { x: feetTileX, y: feetTileY }

          // ¿Punto de trivia?
          const tp = mapData.current.triviaPoints.find(
            p => p.x === feetTileX && p.y === feetTileY
          )
          if (tp && !triviaCollectedRef.current.includes(tp.index)) {
            dispatch({ type: 'OPEN_TRIVIA', point: tp })
          }

          // ¿Punto final?
          const ep = mapData.current.endPoint
          if (ep && ep.x === feetTileX && ep.y === feetTileY) {
            const missing = TOTAL_TRIVIA - triviaCollectedRef.current.length
            if (missing > 0) {
              // Limpiar ANTES del alert (el alert bloquea y puede disparar keyup/keydown)
              heldKeys.current.clear()
              alert(`Aún faltan ${missing} llave${missing > 1 ? 's' : ''} por encontrar.`)
              // Limpiar TAMBIÉN después: el usuario pudo haber pulsado teclas al cerrar el alert
              heldKeys.current.clear()
            } else {
              heldKeys.current.clear()
              // Actualizar phaseRef sincrónicamente para que el loop se detenga
              // en el mismo frame, sin esperar el re-render de React
              phaseRef.current = 'end'
              dispatch({ type: 'SET_PHASE', phase: 'end' })
            }
          }
        }

        // ¿Trampa? — se revisan las 4 esquinas del hitbox: con 1-2 px de contacto ya activa
        const isTrap = [
          { x: px - HB_HALF_W, y: py - HB_HALF_H },
          { x: px + HB_HALF_W, y: py - HB_HALF_H },
          { x: px - HB_HALF_W, y: py + HB_HALF_H },
          { x: px + HB_HALF_W, y: py + HB_HALF_H },
        ].some(c => {
          const tx = Math.floor(c.x / TILE_RENDER)
          const ty = Math.floor(c.y / TILE_RENDER)
          if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return false
          return mapData.current.traps[ty * MAP_COLS + tx] !== 0
        })
        if (isTrap && now - lastTrapHitMs.current > TRAP_COOLDOWN_MS) {
          lastTrapHitMs.current = now
          heldKeys.current.clear()
          dispatch({ type: 'LOSE_LIFE' })
          alert('¡Una trampa! Perdiste una vida. 💔')
          heldKeys.current.clear()
        }
      }

      // ── Cámara en píxeles continuos (smooth) ───────────────────────────
      // Centro de la cámara = posición del jugador, clampeado a los límites del mapa
      const MAP_PX_W = MAP_COLS * TILE_RENDER
      const MAP_PX_H = MAP_ROWS * TILE_RENDER
      const camPxX = Math.max(0, Math.min(px - CANVAS_W / 2, MAP_PX_W - CANVAS_W))
      const camPxY = Math.max(0, Math.min(py - CANVAS_H / 2, MAP_PX_H - CANVAS_H))

      // Rango de tiles a dibujar (un tile extra en cada borde para cubrir el desplazamiento)
      const startTX = Math.floor(camPxX / TILE_RENDER)
      const startTY = Math.floor(camPxY / TILE_RENDER)
      const endTX   = Math.min(startTX + VIEWPORT_COLS + 2, MAP_COLS)
      const endTY   = Math.min(startTY + VIEWPORT_ROWS + 2, MAP_ROWS)

      // ── Render ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Trasladar el contexto para que (0,0) quede en la esquina superior-izquierda del mundo
      ctx.save()
      ctx.translate(-camPxX, -camPxY)

      const { floor, walls: wallsLayer, trivia, traps, end: endLayer } = mapData.current
      const collected = triviaCollectedRef.current
      const ts = tilesetImg.current

      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const worldX = tx * TILE_RENDER
          const worldY = ty * TILE_RENDER
          const idx    = ty * MAP_COLS + tx

          function drawTile(tileId: number) {
            if (!ts || tileId === 0) return
            const { sx, sy } = getTileSrc(tileId)
            ctx.drawImage(ts, sx, sy, TILE_SIZE, TILE_SIZE, worldX, worldY, TILE_RENDER, TILE_RENDER)
          }

          // Floor
          drawTile(floor[idx])

          // Walls
          drawTile(wallsLayer[idx])

          // Traps
          drawTile(traps[idx])

          // End / goal
          drawTile(endLayer[idx])

          // Trivia (solo si no recogida)
          const tp = mapData.current.triviaPoints.find(p => p.x === tx && p.y === ty)
          if (!tp || !collected.includes(tp.index)) {
            drawTile(trivia[idx])
          }
        }
      }

      // Personaje — dibujado en espacio mundo (mismo sistema de coordenadas que el mapa)
      let img: HTMLImageElement | null = null
      let spriteW: number
      if (!isMoving) {
        img = idleImg.current
        spriteW = SPRITE_W.idle
      } else {
        const dir = facingRef.current
        img = dirImgs.current[dir]?.[frameIdxRef.current] ?? idleImg.current
        spriteW = SPRITE_W[dir]
      }

      if (img) {
        ctx.drawImage(
          img,
          px - spriteW / 2,  // centrado en X sobre el anchor
          py - SPRITE_H,     // pies = bottom del sprite = anchor Y
          spriteW,
          SPRITE_H
        )
      }

      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── DPad handlers (touch) ─────────────────────────────────────────────────
  const onDirStart = useCallback((dir: Direction) => heldKeys.current.add(dir),    [])
  const onDirEnd   = useCallback((dir: Direction) => heldKeys.current.delete(dir), [])

  const isTouchDevice = typeof window !== 'undefined'
    && window.matchMedia('(pointer: coarse)').matches

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: CANVAS_W, height: CANVAS_H, backgroundColor: 'var(--bg-base)' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />

      <HUD triviaCollected={state.triviaCollected.length} lives={state.lives} />

      {state.phase === 'trivia' && state.activeTriviaPoint && (
        <TriviaModal
          point={state.activeTriviaPoint}
          onCollect={(index) => dispatch({ type: 'COLLECT_TRIVIA', index })}
          onClose={() => dispatch({ type: 'CLOSE_TRIVIA' })}
        />
      )}

      {isTouchDevice && state.phase === 'playing' && (
        <DPad onDirectionStart={onDirStart} onDirectionEnd={onDirEnd} />
      )}
    </div>
  )
}
