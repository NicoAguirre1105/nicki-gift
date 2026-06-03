'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { NarratorLine } from '@/app/lib/narratorContext'

type Props = {
  lines: NarratorLine[]
  onDone: () => void
}

const TYPEWRITER_MS  = 28   // ms por carácter
const FRAME_ANIM_MS  = 400  // ms por frame en sprites animados

export default function Narrator({ lines, onDone }: Props) {
  const [lineIdx, setLineIdx]     = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)   // typewriter terminó
  const [frameIdx, setFrameIdx]   = useState(0)       // frame activo para sprites animados

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoCloseRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameAnimRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = lines[lineIdx]

  // Guard: si current aún no existe (render transitorio antes de onDone), no pintar nada
  if (!current) return null

  // ── Imagen activa (frame animado o imagen estática) ───────────────────────
  const activeImage = current.frames
    ? current.frames[frameIdx % current.frames.length]
    : current.image

  // ── Animación de frames ───────────────────────────────────────────────────
  useEffect(() => {
    if (!current.frames || current.frames.length < 2) return
    setFrameIdx(0)
    frameAnimRef.current = setInterval(() => {
      setFrameIdx(i => i + 1)
    }, FRAME_ANIM_MS)
    return () => clearInterval(frameAnimRef.current!)
  }, [lineIdx, current.frames])

  // ── Typewriter ────────────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayed('')
    setDone(false)

    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(current.text.slice(0, i))
      if (i >= current.text.length) {
        clearInterval(intervalRef.current!)
        setDone(true)
      }
    }, TYPEWRITER_MS)

    return () => clearInterval(intervalRef.current!)
  }, [lineIdx, current.text])

  // ── Auto-cierre: empieza cuando el typewriter termina ────────────────────
  useEffect(() => {
    if (!done || !current.autoCloseMs) return

    autoCloseRef.current = setTimeout(() => {
      advance()
    }, current.autoCloseMs)

    return () => clearTimeout(autoCloseRef.current!)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, lineIdx])

  // ── Avanzar con Espacio ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return
      e.preventDefault()
      // Si hay auto-cierre pendiente, cancelarlo al avanzar manualmente
      clearTimeout(autoCloseRef.current!)
      advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function advance() {
    if (!done) {
      clearInterval(intervalRef.current!)
      setDisplayed(current.text)
      setDone(true)
      return
    }
    if (lineIdx < lines.length - 1) {
      setLineIdx(lineIdx + 1)
    } else {
      onDone()
    }
  }

  const isRight = current.side === 'right'

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: 'rgba(8,10,20,0.65)' }}
      />

      {/* Barra de diálogo */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pixel-border"
        style={{
          background: 'linear-gradient(135deg, #0d1428 0%, #111827 100%)',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          minHeight: '160px',
        }}
        onClick={() => { clearTimeout(autoCloseRef.current!); advance() }}
      >
        <div
          className="flex items-center gap-5 px-6 max-w-5xl mx-auto py-10"
          style={{ flexDirection: isRight ? 'row-reverse' : 'row', minHeight: '160px' }}
        >
          {/* Imagen / sprite animado del narrador */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: '130px', height: '172px', background: 'transparent', position: 'relative' }}
          >
            <Image
              src={`/characters/Nico/${activeImage}`}
              alt="Narrador"
              fill
              style={{ objectFit: 'contain', objectPosition: 'bottom', imageRendering: 'pixelated' }}
              unoptimized
            />
          </div>

          {/* Texto */}
          <div className="flex-1 flex flex-col justify-center gap-3">
            <p
              style={{
                fontFamily: "'Bitcount Grid Single', monospace",
                fontSize: '1.05rem',
                lineHeight: '1.7',
                color: 'var(--text-primary)',
              }}
            >
              {displayed}
              {!done && (
                <span style={{ animation: 'blink 0.6s step-end infinite', color: 'var(--accent)' }}>
                  ▌
                </span>
              )}
            </p>

            {/* Indicador de avanzar — oculto si hay auto-cierre */}
            {done && !current.autoCloseMs && (
              <div
                className="self-end flex items-center gap-1 text-xs"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'Bitcount Grid Single', monospace",
                  animation: 'blink 1s step-end infinite',
                }}
              >
                {lineIdx < lines.length - 1 ? 'SIGUIENTE' : 'CERRAR'}
                <span style={{ color: 'var(--accent)' }}>▶ [SPACE]</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
