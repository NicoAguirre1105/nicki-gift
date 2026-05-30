'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { loginAction, type LoginState } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  )

  return (
    <main
      className="scanlines min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Decoración de esquinas pixel */}
      <span className="fixed top-3 left-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>╔══</span>
      <span className="fixed top-3 right-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>══╗</span>
      <span className="fixed bottom-3 left-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>╚══</span>
      <span className="fixed bottom-3 right-3 text-xs select-none" style={{ color: 'var(--border-pixel)' }}>══╝</span>

      <div
        className="pixel-border w-full max-w-sm flex flex-col items-center gap-5 p-7"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Título */}
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            ✦ Login ✦
          </p>
          <h1
            className="text-3xl tracking-wide"
            style={{ color: 'var(--text-primary)' }}
          >
            NxN
          </h1>
        </div>

        {/* Formulario */}
        <form action={action} className="w-full flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              className="pixel-input"
              suppressHydrationWarning
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="pixel-input"
              suppressHydrationWarning
            />
          </div>

          {/* Error */}
          {state?.error && (
            <p
              className="text-xs text-center px-2 py-1"
              style={{
                color: 'var(--error)',
                border: '1px solid var(--error)',
                backgroundColor: 'rgba(224,92,106,0.08)',
              }}
            >
              ✖ {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="pixel-btn w-full mt-1"
          >
            {pending ? '[ cargando... ]' : '[ ingresar ]'}
          </button>
        </form>

        {/* Pie decorativo */}
        <p
          className="text-xs tracking-widest select-none"
          style={{ color: 'var(--border-pixel)' }}
        >
          ── v1.0.0 ──
        </p>
      </div>
    </main>
  )
}
