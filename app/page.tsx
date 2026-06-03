'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNarrator } from '@/app/hooks/useNarrator'
import PixelHeartLoader from '@/app/_components/login/PixelHeartLoader'
import LoginForm from '@/app/_components/login/LoginForm'
import PortalTransition from '@/app/_components/login/PortalTransition'

// ── Fases ────────────────────────────────────────────────────────────────────
// loading       → pantalla blanca + loader de corazones (mín. 5 seg)
// transitioning → fade a fondo oscuro (800ms)
// narrating     → narrador intro (6 líneas pre-login)
// ready         → formulario visible
// post_login    → narrador post-login (6 líneas)
// portal        → animación de portal → redirect
type Phase = 'loading' | 'transitioning' | 'narrating' | 'ready' | 'post_login' | 'portal'

export default function LoginPage() {
  const { say }           = useNarrator()
  const router            = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const destinationRef    = useRef<'/game' | '/dashboard'>('/game')

  // ── Fase 1: loader mínimo 5 seg ──────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setPhase('transitioning'), 5000)
    return () => clearTimeout(t)
  }, [])

  // ── Fase 2: transición bg (800ms) → narrador intro ───────────────────────
  useEffect(() => {
    if (phase !== 'transitioning') return
    const t = setTimeout(() => setPhase('narrating'), 800)
    return () => clearTimeout(t)
  }, [phase])

  // ── Fase 3: narrador intro ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'narrating') return
    say([
      { text: 'Hace mucho, mucho tiempo...', image: 'guide_wizard.png' },
      { text: 'Nahhh, mentira. Siempre quise decir eso jaja.', image: 'guide_wizard_out.png', side: 'right' },
      { text: 'Tengo un regalo muy importante para Nicki por su cumpleaños. 🎁', image: 'guide_gift.png' },
      { text: 'Dame unos segundos... tengo que verificar que eres tú.', image: 'guide_computer.png', side: 'right' },
      { text: '¡Qué raro! Quería ver tu cámara para verificar, pero se ve todo negro... (es buena señal, pero no es concluyente)', image: 'guide_computer_confused.png' },
      { text: 'Bueno, voy a ver qué hago. Hasta eso, ingresa el correo y la contraseña que solo Nicki sabe. 🔐', image: 'guide_computer_closing.png', side: 'right' },
    ]).then(() => setPhase('ready'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Fase 5: narrador post-login ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'post_login') return
    say([
      { text: 'La contraseña era muy fácil. Todo el mundo sabe eso...', image: 'guide_confident.png' },
      { text: 'Bueno, me tocará hacer una prueba infalible para verificar.', image: 'guide_computer_closing.png', side: 'right' },
      { text: 'El regalo es muy importante y no puede caer en las manos equivocadas.', image: 'guide_gift_hidden.png' },
      { text: 'sjf82nWepQxLmRt9vKzAo4YcNbHiGu7w... *Trabajando arduamente*', image: 'guide_computer_thinking.png', side: 'right' },
      { text: 'Bueno, terminé. Veamos si eres o no la real Junghee.', image: 'guide_indifferent.png' },
      { text: 'Tendrás que entrar... Nos vemos en un rato.', image: 'guide_suspect.png', side: 'right' },
    ]).then(() => setPhase('portal'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Callback desde LoginForm cuando login exitoso ─────────────────────────
  const handleLoginSuccess = useCallback((destination: '/game' | '/dashboard') => {
    destinationRef.current = destination
    setPhase('post_login')
  }, [])

  // ── Callback desde PortalTransition cuando termina la animación ───────────
  const handlePortalEntered = useCallback(() => {
    router.push(destinationRef.current)
  }, [router])

  const bgColor = phase === 'loading' ? '#ffffff' : 'var(--bg-base)'

  return (
    <main
      className="scanlines min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: bgColor, transition: 'background-color 0.8s ease' }}
    >
      {/* Loader de corazones */}
      <PixelHeartLoader visible={phase === 'loading' || phase === 'transitioning'} />

      {/* Decoración de esquinas */}
      {phase !== 'loading' && (
        <>
          <span className="fixed top-3 left-3 text-xs select-none"
            style={{ color: 'var(--border-pixel)', opacity: phase === 'transitioning' ? 0 : 1, transition: 'opacity 0.5s ease 0.4s' }}>╔══</span>
          <span className="fixed top-3 right-3 text-xs select-none"
            style={{ color: 'var(--border-pixel)', opacity: phase === 'transitioning' ? 0 : 1, transition: 'opacity 0.5s ease 0.4s' }}>══╗</span>
          <span className="fixed bottom-3 left-3 text-xs select-none"
            style={{ color: 'var(--border-pixel)', opacity: phase === 'transitioning' ? 0 : 1, transition: 'opacity 0.5s ease 0.4s' }}>╚══</span>
          <span className="fixed bottom-3 right-3 text-xs select-none"
            style={{ color: 'var(--border-pixel)', opacity: phase === 'transitioning' ? 0 : 1, transition: 'opacity 0.5s ease 0.4s' }}>══╝</span>
        </>
      )}

      {/* Formulario de login */}
      <LoginForm
        visible={phase === 'ready'}
        onSuccess={handleLoginSuccess}
      />

      {/* Portal */}
      {phase === 'portal' && (
        <PortalTransition onEntered={handlePortalEntered} />
      )}
    </main>
  )
}
