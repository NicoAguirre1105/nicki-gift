'use client'

import { useActionState, useEffect } from 'react'
import { loginAction, type LoginState } from '@/app/actions/auth'

type Props = {
  visible: boolean
  onSuccess: (destination: '/game' | '/dashboard') => void
}

export default function LoginForm({ visible, onSuccess }: Props) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  )

  // Detectar éxito y notificar al padre
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      onSuccess(state.destination)
    }
  }, [state, onSuccess])

  return (
    <div
      style={{
        opacity:       visible ? 1 : 0,
        animation:     visible ? 'fade-in-up 0.6s ease forwards' : 'none',
        pointerEvents: visible ? 'all' : 'none',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        className="pixel-border w-full max-w-sm flex flex-col items-center gap-5 p-7"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            ✦ NxN ✦
          </h1>
        </div>

        <form action={action} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Correo
            </label>
            <input
              id="email" name="email" type="email"
              autoComplete="email" placeholder="tu@correo.com"
              required className="pixel-input" suppressHydrationWarning
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Contraseña
            </label>
            <input
              id="password" name="password" type="password"
              autoComplete="current-password" placeholder="••••••••"
              required className="pixel-input" suppressHydrationWarning
            />
          </div>

          {state && 'error' in state && (
            <p className="text-xs text-center px-2 py-1" style={{
              color: 'var(--error)',
              border: '1px solid var(--error)',
              backgroundColor: 'rgba(224,92,106,0.08)',
            }}>
              ✖ {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="pixel-btn w-full mt-1">
            {pending ? '[ verificando... ]' : '[ ingresar ]'}
          </button>
        </form>

        <p className="text-xs tracking-widest select-none" style={{ color: 'var(--border-pixel)' }}>
          ── v1.0.0 ──
        </p>
      </div>
    </div>
  )
}
