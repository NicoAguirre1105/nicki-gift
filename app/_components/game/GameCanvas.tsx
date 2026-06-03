'use client'

import { useEffect, useRef, useReducer, useCallback, useState } from 'react'
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
import { useNarrator } from '@/app/hooks/useNarrator'
import type { NarratorLine } from '@/app/lib/narratorContext'
import HUD from './HUD'
import TriviaModal from './TriviaModal'
import DPad, { Direction } from './DPad'
import { useMusicPlayer } from '@/app/hooks/useMusicPlayer'
import WinCelebration from './WinCelebration'
import PortalTransition from '@/app/_components/login/PortalTransition'

// ─── Escala y dimensiones ────────────────────────────────────────────────────
const SCALE         = 3
const TILE_RENDER   = TILE_SIZE * SCALE   // 48px por tile en pantalla
const VIEWPORT_COLS = 15
const VIEWPORT_ROWS = 12
const CANVAS_W      = (VIEWPORT_COLS + 1) * TILE_RENDER
const CANVAS_H      = (VIEWPORT_ROWS + 1) * TILE_RENDER

// ─── Velocidad de movimiento (px por frame a ~60fps) ─────────────────────────
const SPEED = 4

// ─── Hitbox en los pies ───────────────────────────────────────────────────────
const HB_HALF_W = 10
const HB_HALF_H = 6

// ─── Sprite ──────────────────────────────────────────────────────────────────
const FRAME_COUNT = 4
const FRAME_MS    = 150

type AnimDir = 'up' | 'down' | 'left' | 'right'

const DIR_FRAMES: Record<AnimDir, string[]> = {
  down:  Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_down_${i + 1}-removebg-preview.png`),
  up:    Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_up_${i + 1}-removebg-preview.png`),
  left:  Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_left_${i + 1}-removebg-preview.png`),
  right: Array.from({ length: FRAME_COUNT }, (_, i) => `/characters/Nicki/frame_right_${i + 1}-removebg-preview.png`),
}
const IDLE_SRC = '/characters/Nicki/frame_base-removebg-preview.png'

const SPRITE_H = TILE_RENDER * 2

const SPRITE_W: Record<AnimDir | 'idle', number> = {
  down:  Math.round(SPRITE_H * (185 / 242)),
  up:    Math.round(SPRITE_H * (155 / 239)),
  left:  Math.round(SPRITE_H * (157 / 234)),
  right: Math.round(SPRITE_H * (157 / 233)),
  idle:  Math.round(SPRITE_H * (184 / 241)),
}

const TRAP_COOLDOWN_MS = 2000

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',    w: 'up',    W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
}

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy:  1 },
  left:  { dx: -1, dy:  0 },
  right: { dx: 1,  dy:  0 },
}

// ─── Tipo para la cola de narrador ───────────────────────────────────────────
type NarratorRequest = {
  lines: NarratorLine[]
  onDone: () => void
}

export default function GameCanvas() {
  const router   = useRouter()
  const { say }  = useNarrator()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGameState)

  // ── Assets ────────────────────────────────────────────────────────────────
  const tilesetImg = useRef<HTMLImageElement | null>(null)
  const idleImg    = useRef<HTMLImageElement | null>(null)
  const dirImgs    = useRef<Record<AnimDir, HTMLImageElement[]>>({} as Record<AnimDir, HTMLImageElement[]>)
  const assetsOk   = useRef(false)

  // ── Mapa ──────────────────────────────────────────────────────────────────
  const mapData = useRef(parseMap())

  // ── Canvas offscreen para el efecto de oscuridad ─────────────────────────
  const fogCanvas = useRef<HTMLCanvasElement | null>(null)

  // ── Estado de movimiento ──────────────────────────────────────────────────
  const posRef       = useRef({ x: (PLAYER_START.x + 0.5) * TILE_RENDER, y: (PLAYER_START.y + 0.75) * TILE_RENDER })
  const facingRef    = useRef<AnimDir>('down')
  const frameIdxRef  = useRef(0)
  const lastFrameMs  = useRef(0)
  const rafRef       = useRef(0)

  const heldKeys      = useRef(new Set<Direction>())
  const lastFeetTile  = useRef({ x: PLAYER_START.x, y: PLAYER_START.y })
  const lastTrapHitMs  = useRef(0)
  const firstTrapRef   = useRef(true)   // true = todavía no ha caído en ninguna trampa

  // ── Pausa del movimiento mientras el narrador está activo ─────────────────
  const pausedRef = useRef(false)

  // ── Fog of war — se activa al terminar el diálogo intro ──────────────────
  const fogEnabledRef   = useRef(false)
  const fogStartTimeRef = useRef(0)         // timestamp cuando se activó el fog
  const FOG_FADE_MS     = 1500              // duración del fade-in de oscuridad

  // ── Cola del narrador ─────────────────────────────────────────────────────
  // El loop escribe aquí; el useEffect de abajo lo consume y llama a say()
  const narratorQueue  = useRef<NarratorRequest | null>(null)
  const [narratorTick, setNarratorTick] = useState(0)   // incrementar dispara el useEffect

  // ── Refs de estado de React (lectura sin stale closure) ──────────────────
  const triviaCollectedRef = useRef<number[]>([])
  triviaCollectedRef.current = state.triviaCollected

  const phaseRef = useRef(state.phase)
  phaseRef.current = state.phase

  // ── Música ────────────────────────────────────────────────────────────────
  const music = useMusicPlayer()

  // ── Helper: pausar juego, mostrar narrador, reanudar al cerrar ────────────
  function showNarrator(lines: NarratorLine[], onDone: () => void) {
    heldKeys.current.clear()
    pausedRef.current = true
    narratorQueue.current = { lines, onDone }
    setNarratorTick(t => t + 1)
  }

  // ── Consumir la cola del narrador ─────────────────────────────────────────
  useEffect(() => {
    if (!narratorQueue.current) return
    const { lines, onDone } = narratorQueue.current
    narratorQueue.current = null

    say(lines).then(() => {
      heldKeys.current.clear()
      pausedRef.current = false
      onDone()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narratorTick])

  // ── Inicializar fog canvas (offscreen) ───────────────────────────────────
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width  = CANVAS_W
    c.height = CANVAS_H
    fogCanvas.current = c
  }, [])

  // ── Carga de assets ───────────────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0
    const total = 1 + 1 + (4 * FRAME_COUNT)

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

    const t = setTimeout(() => {
      showNarrator([
        { text: 'Bueno, te puse la skin de mi noviecita hermosa. 💙', image: 'guide_base.png' },
        { text: 'Eeeeeeepa, pero te has robado ciertos items de una amiga...', image: 'guide_suspect.png', side: 'right' },
        { text: 'Parece que sí eres la real... Veamos.', image: 'guide_writing.png' },
        { text: 'La real Nicki hermosa le sabe a los videojuegos.', image: 'guide_complete.png', side: 'right' },
        { text: 'Acabo de preparar un laberinto para ver si le sabes o no.', image: 'guide_confident2.png' },
        { text: 'Tienes que juntar 10 llaves y llegar al final del laberinto.', image: 'guide_advertising.png', side: 'right' },
        { text: 'Pero eso sería muy fácil, así que...', image: 'guide_finger.png' },
      ], () => {
        // Activar fog of war al terminar el diálogo intro
        fogEnabledRef.current   = true
        fogStartTimeRef.current = performance.now()

        // Esperar a que el fog termine de aparecer + 1.5s extra, luego mostrar ghost
        setTimeout(() => {
          showNarrator([
            { text: 'Ahora sí veamos quién eres en realidad.', image: 'guide_ghost.png', side: 'right' },
          ], () => {
            dispatch({ type: 'SET_PHASE', phase: 'playing' })
          })
        }, FOG_FADE_MS + 1500)
      })
    }, 2500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Sub-fases de victoria ─────────────────────────────────────────────────
  type WinPhase = 'none' | 'celebrate' | 'narrate2' | 'portal'
  const [winPhase, setWinPhase] = useState<WinPhase>('none')

  // ── Guard: la secuencia musical solo arranca una vez ─────────────────────
  const musicStartedRef = useRef(false)

  // ── Música: 5s después de entrar en 'playing', narrador + fade-in ────────
  useEffect(() => {
    if (state.phase !== 'playing') return
    if (musicStartedRef.current) return   // ← evita re-trigger por trivia/trampa
    musicStartedRef.current = true

    const t = setTimeout(() => {
      showNarrator([
        { text: 'Bueno como que está apagado el ambiente...', image: 'guide_bored.png' },
        { text: 'Ambientemos un poco el juego. Nicki lo valoraría.', image: 'guide_dj.png', side: 'right' },
      ], () => {
        // play(0): fade-out + onNearEnd 2s antes del final de estrella_fugaz
        music.play(0, () => {
          showNarrator([
            { text: '♩ ♫ ♬ ♪ ♩ ♫ ♬', image: 'guide_guitar.png' },
            { text: '¡Qué linda canción!!!', image: 'guide_happy.png', side: 'right' },
            { text: 'Pondré otra.', image: 'guide_guitar.png' },
          ], () => {
            music.play(1, () => {
              // 1.5s antes del final de medialuna
              showNarrator([
                { text: '♩ ♫ ♬ ♪ ♩ ♫ ♬', image: 'guide_whistle.png' },
                { text: 'AAAAAA!!!! ¡Qué lindooooooo! Cómo extraño a mi medialuna...', image: 'guide_sad.png', side: 'right' },
                { text: '¡Cierto! Aún no sé si eres tú.', image: 'guide_critic.png' },
                { text: 'Sigamos, sigamos.', image: 'guide_suspect.png', side: 'right' },
              ], () => {
                music.play(4, () => {
                  // 2.5s antes del final de seguro_te_pierdo
                  showNarrator([
                    { text: 'Seguroooooooo te pierdoooo...', image: 'guide_shower.png' },
                    { text: 'AHHHHHHHHHH!!!!!....', image: 'guide_shower_surprised.png', side: 'right' },
                    { text: 'Sori, se me fue el tiempo en la canción.', image: 'guide_towel.png' },
                    { text: 'Uste siga nomás en lo suyo.', image: 'guide_towel.png', side: 'right' },
                  ], () => {
                    music.play(2, () => {
                      // 2s antes del final de primeras_veces
                      showNarrator([
                        { text: 'Aunque las primera veceeeees...', image: 'guide_sing.png' },
                        { text: 'Qué hermoso recordar a mi reina preciosa.', image: 'guide_tears.png', side: 'right' },
                        { text: 'Te cuento que cada día estoy más cerca de volver a verla.', image: 'guide_happy.png' },
                        { text: '¡Qué hago contando esto?!', image: 'guide_critic.png', side: 'right' },
                        { text: 'Sigamos, sigamos nomás.', image: 'guide_indifferent.png' },
                      ], () => {
                        // ── volare (5) ──────────────────────────────────────
                        music.play(5, () => {
                          // 3s antes del final de volare
                          showNarrator([
                            { text: 'Ohhh ohhh...', image: 'guide_opera.png' },
                            { text: 'Ayyy mi principessa qué falta me hace.', image: 'guide_tears.png', side: 'right' },
                            { text: 'Hace poco escuché la siguiente canción y dije: es mi Nicki preciosa.', image: 'guide_base.png' },
                          ], () => {
                            // ── bruno (6) ──────────────────────────────────
                            music.play(6, () => {
                              // 2s antes del final de bruno
                              showNarrator([
                                { text: 'Ehh ehh...', image: 'guide_sing.png' },
                                { text: 'Mi reina hermosa es eso y mucho más.', image: 'guide_happy.png', side: 'right' },
                                { text: 'Escuchemos algo más movido.', image: 'guide_base.png' },
                              ], () => {
                                // ── mix_chelero (3) ────────────────────────
                                music.play(3, () => {
                                  // 3s antes del final de mix_chelero
                                  showNarrator([
                                    { text: 'Uyyyy, ¡oiga que fuefff?! Mucho se demora.', image: 'guide_critic.png' },
                                    { text: 'Quizá la Nicki bella está bailando en vez de jugar. Ya voy a hacer silencio nomás. Te espero al final.', image: 'guide_time.png', side: 'right' },
                                  ], () => { /* fin de secuencia */ })
                                }, 3)
                                // 4s desde inicio de mix_chelero — auto-cierra en 10s
                                setTimeout(() => {
                                  showNarrator([
                                    { text: 'SIEMPRE CONTIGO, SIEMPRE CONTIGO.... ¡LA BELLA LUZ!!!', image: 'guide_sing.png', autoCloseMs: 10000 },
                                  ], () => { /* reanudar */ })
                                }, 4000)
                                // 17s desde inicio de mix_chelero — sprite bailando
                                setTimeout(() => {
                                  showNarrator([
                                    {
                                      text: '¡Chelas arriba, chelas arriba!',
                                      image: 'guide_dancing.png',
                                      frames: ['guide_dancing.png', 'guide_dancing2.png'],
                                    },
                                  ], () => { /* reanudar */ })
                                }, 17000)
                              })
                            }, 2)
                          })
                        }, 3)
                        // 9s desde inicio de volare
                        setTimeout(() => {
                          showNarrator([
                            { text: 'Te mando un beso elástico...', image: 'guide_kiss.png' },
                          ], () => { /* solo reanudar */ })
                        }, 9000)
                      })
                    }, 2)
                  })
                }, 2.5)
              })
            }, 1.5)
          })
        }, 2)
      })
    }, 5000)

    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Sin vidas: narrador + reinicio al punto inicial ──────────────────────
  useEffect(() => {
    if (state.lives > 0) return
    if (state.phase !== 'playing' && state.phase !== 'trivia') return

    showNarrator([
      { text: '...Se acabaron las vidas. 💔', image: 'guide_deception.png' },
      { text: 'Volvemos al inicio, pero no te preocupes, la música sigue.', image: 'guide_computer_closing.png', side: 'right' },
    ], () => {
      // Resetear refs de posición
      posRef.current       = { x: (PLAYER_START.x + 0.5) * TILE_RENDER, y: (PLAYER_START.y + 0.75) * TILE_RENDER }
      lastFeetTile.current = { x: PLAYER_START.x, y: PLAYER_START.y }
      lastTrapHitMs.current = 0
      heldKeys.current.clear()
      // Resetear estado del juego (vidas + llaves, fase queda 'playing')
      dispatch({ type: 'RESET_PLAYER' })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lives])

  // ── Teclado ───────────────────────────────────────────────────────────────
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

    // Fade-out de la música del laberinto
    music.stop()

    // Narrador 1: celebración inicial (4 líneas)
    showNarrator([
      { text: '¡Yeeeeeeeee!!!', image: 'guide_party.png' },
      { text: '¡Ahora sí. Bienvenida mi Nicki hermosa!', image: 'guide_welcome.png', side: 'right' },
      { text: 'Aunque siempre supe que eras tú jeje.', image: 'guide_confident.png' },
      { text: 'Te entregaré tu regalito de cumpleaños.', image: 'guide_gift.png', side: 'right' },
    ], () => {
      // Guardar progreso en Supabase
      const supabase = createSupabaseBrowserClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('profiles').update({ maze_completed: true }).eq('id', user.id)
      })
      // Iniciar my_you y mostrar celebración
      music.play(7)
      setWinPhase('celebrate')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Al continuar desde la celebración → narrador 2 ───────────────────────
  const handleCelebrationContinue = useCallback(() => {
    setWinPhase('narrate2')
    showNarrator([
      { text: 'Y también tiene esto...', image: 'guide_letter.png' },
      { text: 'Pero esto podrás verlo en un ratito, en tu nuevo espacio favorito.', image: 'guide_happy.png', side: 'right' },
      { text: 'Este espacio es para ti, con mucho cariño y con muchas actualizaciones futuras. Pasa...', image: 'guide_pass.png' },
    ], () => {
      setWinPhase('portal')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Colisión con paredes ──────────────────────────────────────────────────
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
      if (phase === 'end') return

      const held    = heldKeys.current
      const paused  = pausedRef.current || phase === 'intro'

      // ── Calcular movimiento (solo si no está pausado) ───────────────────
      let isMoving = false

      if (!paused && phase === 'playing' && held.size > 0) {
        const activeDirs = [...held].slice(0, 2) as Direction[]

        let dx = 0, dy = 0
        activeDirs.forEach(dir => {
          dx += DIR_DELTA[dir].dx
          dy += DIR_DELTA[dir].dy
        })

        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const vx = (dx / len) * SPEED
        const vy = (dy / len) * SPEED

        const cur = posRef.current
        const nx = cur.x + vx
        const ny = cur.y + vy

        const canX = !wouldCollide(nx, cur.y)
        const canY = !wouldCollide(cur.x, ny)

        if (canX) posRef.current.x = nx
        if (canY) posRef.current.y = ny

        isMoving = canX || canY

        if (isMoving) {
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
        frameIdxRef.current = 0
      }

      // ── Detectar tile bajo los pies (solo si no está pausado) ───────────
      const { x: px, y: py } = posRef.current
      const feetTileX = Math.floor(px / TILE_RENDER)
      const feetTileY = Math.floor(py / TILE_RENDER)

      if (!paused && phase === 'playing') {
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
              showNarrator([
                {
                  text: `Aún te faltan ${missing} llave${missing > 1 ? 's' : ''}.`,
                  image: 'guide_advertising.png',
                },
                {
                  text: 'Vaya vaya y robe las que le faltan.',
                  image: 'guide_confident2.png',
                  side: 'right',
                },
              ], () => { /* solo reanudar movimiento */ })
            } else {
              heldKeys.current.clear()
              phaseRef.current = 'end'
              dispatch({ type: 'SET_PHASE', phase: 'end' })
            }
          }
        }

        // ¿Trampa?
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
          dispatch({ type: 'LOSE_LIFE' })

          if (firstTrapRef.current) {
            // Primera vez en una trampa
            firstTrapRef.current = false
            showNarrator([
              { text: 'Uy... se me olvidó decirte.', image: 'guide_happy.png' },
              { text: 'Aunque ya deberías saberlo.', image: 'guide_critic.png', side: 'right' },
              { text: '¡Nicki no sabe nadar. Ten cuidado con el agua!', image: 'guide_advertising.png' },
            ], () => {
              lastTrapHitMs.current = performance.now()
            })
          } else {
            // Trampas siguientes
            showNarrator([
              { text: '¡Quesffff!!!', image: 'guide_angry.png' },
              { text: 'Nicki sí le sabe a mover las flechitas.', image: 'guide_suspect.png', side: 'right' },
              { text: '.........', image: 'guide_writing.png' },
            ], () => {
              lastTrapHitMs.current = performance.now()
            })
          }
        }
      }

      // ── Cámara ──────────────────────────────────────────────────────────
      const MAP_PX_W = MAP_COLS * TILE_RENDER
      const MAP_PX_H = MAP_ROWS * TILE_RENDER
      const camPxX = Math.max(0, Math.min(px - CANVAS_W / 2, MAP_PX_W - CANVAS_W))
      const camPxY = Math.max(0, Math.min(py - CANVAS_H / 2, MAP_PX_H - CANVAS_H))

      const startTX = Math.floor(camPxX / TILE_RENDER)
      const startTY = Math.floor(camPxY / TILE_RENDER)
      const endTX   = Math.min(startTX + VIEWPORT_COLS + 2, MAP_COLS)
      const endTY   = Math.min(startTY + VIEWPORT_ROWS + 2, MAP_ROWS)

      // ── Render ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
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

          drawTile(floor[idx])
          drawTile(wallsLayer[idx])
          drawTile(traps[idx])
          drawTile(endLayer[idx])

          const tp = mapData.current.triviaPoints.find(p => p.x === tx && p.y === ty)
          if (!tp || !collected.includes(tp.index)) {
            drawTile(trivia[idx])
          }
        }
      }

      // Personaje
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
        ctx.drawImage(img, px - spriteW / 2, py - SPRITE_H, spriteW, SPRITE_H)
      }

      ctx.restore()

      // ── Efecto de oscuridad (fog of war) ────────────────────────────────
      const fog = fogCanvas.current
      if (fog && fogEnabledRef.current) {
        const fctx = fog.getContext('2d')!

        // Opacidad del fog: fade-in suave desde 0 → 1 en FOG_FADE_MS
        const elapsed  = now - fogStartTimeRef.current
        const fogAlpha = Math.min(elapsed / FOG_FADE_MS, 1)

        // Posición del jugador en espacio de pantalla
        const screenX = px - camPxX
        const screenY = py - camPxY - SPRITE_H * 0.4

        const VISION_R    = TILE_RENDER * 3.5
        const VISION_SOFT = TILE_RENDER * 1.2

        // 1. Rellenar de negro
        fctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
        fctx.fillStyle = '#000'
        fctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        // 2. Perforar círculo suave con destination-out
        const grad = fctx.createRadialGradient(
          screenX, screenY, VISION_R - VISION_SOFT,
          screenX, screenY, VISION_R
        )
        grad.addColorStop(0, 'rgba(0,0,0,1)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')

        fctx.globalCompositeOperation = 'destination-out'
        fctx.fillStyle = grad
        fctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        fctx.globalCompositeOperation = 'source-over'

        // 3. Dibujar fog sobre el canvas con la opacidad animada
        ctx.globalAlpha = fogAlpha
        ctx.drawImage(fog, 0, 0)
        ctx.globalAlpha = 1
      }
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

  // Cuando hay secuencia de victoria, fondo del login en vez del canvas
  if (winPhase !== 'none') {
    return (
      <div
        className="scanlines"
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'var(--bg-base)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Esquinas decorativas */}
        <span className="fixed top-3 left-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>╔══</span>
        <span className="fixed top-3 right-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>══╗</span>
        <span className="fixed bottom-3 left-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>╚══</span>
        <span className="fixed bottom-3 right-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>══╝</span>

        {winPhase === 'celebrate' && (
          <WinCelebration onContinue={handleCelebrationContinue} />
        )}
        {winPhase === 'portal' && (
          <PortalTransition onEntered={() => router.push('/dashboard')} />
        )}
      </div>
    )
  }

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
          onWrongAnswer={() => {
            dispatch({ type: 'LOSE_LIFE' })
            showNarrator([
              { text: 'Mmmmmmmm....', image: 'guide_suspect.png' },
              { text: '.........', image: 'guide_writing.png', side: 'right' },
            ], () => { /* reanudar — el modal de trivia sigue abierto */ })
          }}
          onClose={() => dispatch({ type: 'CLOSE_TRIVIA' })}
        />
      )}

      {isTouchDevice && state.phase === 'playing' && (
        <DPad onDirectionStart={onDirStart} onDirectionEnd={onDirEnd} />
      )}

    </div>
  )
}
