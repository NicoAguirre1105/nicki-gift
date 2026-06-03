'use client'

import { useRef, useCallback, useEffect } from 'react'

// ─── Track ───────────────────────────────────────────────────────────────────
export type Track = {
  src:      string
  gainNorm: number   // volumen normalizado (0–1), ajustado por canción
}

// ─── Config de fades ─────────────────────────────────────────────────────────
const FADE_IN_S  = 3.0
const FADE_OUT_S = 2.0

// ─── Playlist ─────────────────────────────────────────────────────────────────
export const PLAYLIST: Track[] = [
  { src: '/music/estrella_fugaz.mp3',   gainNorm: 0.85 },  // 0
  { src: '/music/medialuna.mp3',        gainNorm: 0.80 },  // 1
  { src: '/music/primeras_veces.mp3',   gainNorm: 0.90 },  // 2
  { src: '/music/mix_chelero.mp3',      gainNorm: 0.85 },  // 3
  { src: '/music/seguro_te_pierdo.mp3', gainNorm: 0.90 },  // 4
  { src: '/music/volare.mp3',           gainNorm: 0.85 },  // 5
  { src: '/music/bruno.mp3',            gainNorm: 0.85 },  // 6
  { src: '/music/my_you.mp3',           gainNorm: 0.90 },  // 7
]

export function useMusicPlayer() {
  const audioCtxRef   = useRef<AudioContext | null>(null)
  const gainNodeRef   = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioElRef    = useRef<HTMLAudioElement | null>(null)
  const currentIdxRef = useRef<number>(-1)
  const stoppedRef    = useRef(false)

  // ── Inicializar AudioContext (lazy, requiere gesto del usuario) ──────────
  const ensureCtx = useCallback(() => {
    if (audioCtxRef.current) return
    const ctx  = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.connect(ctx.destination)
    audioCtxRef.current = ctx
    gainNodeRef.current = gain
  }, [])

  // ── Fade in ───────────────────────────────────────────────────────────────
  const fadeIn = useCallback((targetGain: number, durationS = FADE_IN_S) => {
    const ctx  = audioCtxRef.current
    const gain = gainNodeRef.current
    if (!ctx || !gain) return
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + durationS)
  }, [])

  // ── Fade out ──────────────────────────────────────────────────────────────
  const fadeOut = useCallback((durationS = FADE_OUT_S, onDone?: () => void) => {
    const ctx  = audioCtxRef.current
    const gain = gainNodeRef.current
    if (!ctx || !gain) { onDone?.(); return }
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationS)
    if (onDone) setTimeout(onDone, durationS * 1000)
  }, [])

  // ── Conectar <audio> al grafo ─────────────────────────────────────────────
  const connectAudio = useCallback((el: HTMLAudioElement) => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect() } catch (_) {}
    }
    const source = audioCtxRef.current!.createMediaElementSource(el)
    source.connect(gainNodeRef.current!)
    sourceNodeRef.current = source
  }, [])

  // ── Reproducir track por índice ───────────────────────────────────────────
  /**
   * @param idx           Índice en PLAYLIST
   * @param onNearEnd     Se llama `nearEndSecs` segundos ANTES de que termine la canción.
   *                      El fade-out también empieza en ese momento.
   * @param nearEndSecs   Cuántos segundos antes del final disparar onNearEnd (default 2)
   */
  const play = useCallback((
    idx: number,
    onNearEnd?: () => void,
    nearEndSecs = 2,
  ) => {
    stoppedRef.current = false
    const track = PLAYLIST[idx]
    if (!track) return

    ensureCtx()
    const ctx = audioCtxRef.current!

    // Crear el elemento <audio> solo la primera vez
    let el = audioElRef.current
    if (!el) {
      el = new Audio()
      el.crossOrigin = 'anonymous'
      el.preload     = 'auto'
      audioElRef.current = el
      connectAudio(el)
    }

    // Limpiar listeners previos de timeupdate y ended
    const prevTimeupdate = (el as HTMLAudioElement & { _tuHandler?: EventListener })._tuHandler
    if (prevTimeupdate) el.removeEventListener('timeupdate', prevTimeupdate)

    currentIdxRef.current = idx
    el.src = track.src
    el.loop = false
    el.currentTime = 0

    // ── timeupdate: detectar el momento "nearEndSecs antes del final" ──────
    let nearEndFired = false
    const tuHandler = () => {
      if (nearEndFired) return
      const el2 = audioElRef.current
      if (!el2 || !el2.duration || isNaN(el2.duration)) return
      if (el2.currentTime >= el2.duration - nearEndSecs) {
        nearEndFired = true
        el2.removeEventListener('timeupdate', tuHandler)
        // Fade-out empieza aquí
        fadeOut(nearEndSecs)
        // Callback al caller para que muestre el narrador, inicie la siguiente, etc.
        onNearEnd?.()
      }
    }
    ;(el as HTMLAudioElement & { _tuHandler?: EventListener })._tuHandler = tuHandler
    if (onNearEnd) el.addEventListener('timeupdate', tuHandler)

    // Iniciar reproducción con fade-in
    ctx.resume().then(() => {
      gainNodeRef.current!.gain.cancelScheduledValues(ctx.currentTime)
      gainNodeRef.current!.gain.setValueAtTime(0, ctx.currentTime)
      el!.play().catch(console.warn)
      fadeIn(track.gainNorm)
    })
  }, [ensureCtx, connectAudio, fadeIn, fadeOut])

  /** Fade-out + pausa (por ejemplo, al llegar al final del laberinto) */
  const stop = useCallback((onDone?: () => void) => {
    stoppedRef.current = true
    const el = audioElRef.current
    // Limpiar timeupdate pendiente
    const prevTu = (el as (HTMLAudioElement & { _tuHandler?: EventListener }) | null)?._tuHandler
    if (el && prevTu) el.removeEventListener('timeupdate', prevTu)
    fadeOut(FADE_OUT_S, () => {
      el?.pause()
      onDone?.()
    })
  }, [fadeOut])

  // ── Cleanup al desmontar ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stoppedRef.current = true
      audioElRef.current?.pause()
      audioCtxRef.current?.close()
    }
  }, [])

  return { play, stop, currentIdxRef }
}
