'use client'

import { useState } from 'react'
import { CARTAS, type Carta } from '@/app/lib/cartas'

export default function CartasSection() {
  const [selected, setSelected] = useState<Carta | null>(null)

  return (
    <>
      {/* ── Lista de cartas ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CARTAS.map(carta => (
          <button
            key={carta.id}
            onClick={() => setSelected(carta)}
            style={{
              background: '#1a1830',
              border: '1px solid #2e3a5c',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              transition: 'border-color 0.18s, background 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6c8ed4'
              e.currentTarget.style.background = '#1f1e38'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#2e3a5c'
              e.currentTarget.style.background = '#1a1830'
            }}
          >
            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#e8eaf6',
                fontFamily: "'Georgia', serif",
                marginBottom: '0.2rem',
              }}>
                💌 {carta.titulo}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7b8ab8' }}>
                {carta.fecha}
              </div>
            </div>
            <div style={{ color: '#6c8ed4', fontSize: '1rem', flexShrink: 0 }}>→</div>
          </button>
        ))}
      </div>

      {/* ── Modal de carta completa ───────────────────────────────── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,10,20,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#13111f',
              border: '1px solid #2e3a5c',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '82vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Cerrar */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none',
                color: '#7b8ab8', cursor: 'pointer', fontSize: '1.1rem',
                lineHeight: 1, padding: '4px 8px', borderRadius: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e8eaf6' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7b8ab8' }}
            >
              ✕
            </button>

            {/* Título */}
            <h3 style={{
              margin: '0 0 0.3rem',
              fontSize: '1.25rem',
              fontFamily: "'Georgia', serif",
              color: '#e8eaf6',
              paddingRight: '2rem',
            }}>
              {selected.titulo}
            </h3>
            <p style={{ margin: '0 0 1.8rem', fontSize: '0.75rem', color: '#4a6fa5' }}>
              {selected.fecha}
            </p>

            {/* Separador */}
            <div style={{ borderTop: '1px solid #2e3a5c', marginBottom: '1.8rem' }} />

            {/* Contenido */}
            <div style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: '#cdd0e8',
              whiteSpace: 'pre-wrap',
              fontFamily: "'Georgia', serif",
            }}>
              {selected.contenido}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
