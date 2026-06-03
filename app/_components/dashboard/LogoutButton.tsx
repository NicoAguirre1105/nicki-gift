'use client'

import { logoutAction } from '@/app/actions/logout'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Cerrar sesión"
        style={{
          background: 'transparent',
          border: '1px solid #2e3a5c',
          borderRadius: '8px',
          padding: '8px 10px',
          cursor: 'pointer',
          color: '#7b8ab8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.color = '#e8eaf6'
          el.style.borderColor = '#6c8ed4'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.color = '#7b8ab8'
          el.style.borderColor = '#2e3a5c'
        }}
      >
        {/* Ícono salida */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Salir
      </button>
    </form>
  )
}
