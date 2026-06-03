'use client'

import { useState } from 'react'
import SectionCard from './SectionCard'
import CartasSection from './CartasSection'

export default function CartasDashboard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <SectionCard
        title="Cartas"
        icon="💌"
        description="Palabras escritas para ti, cuando quieras leerlas."
        available
        onClick={() => setOpen(true)}
      />

      {/* ── Panel lateral de cartas ─────────────────────────────── */}
      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(8,10,20,0.6)',
            }}
          />

          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 60,
            width: '100%', maxWidth: '480px',
            background: '#100e1e',
            borderLeft: '1px solid #2e3a5c',
            display: 'flex', flexDirection: 'column',
            animation: 'slide-in 0.25s ease',
          }}>
            <style>{`
              @keyframes slide-in {
                from { transform: translateX(100%); }
                to   { transform: translateX(0); }
              }
            `}</style>

            {/* Header del drawer */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem',
              borderBottom: '1px solid #1e2340',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontFamily: "'Georgia', serif",
                  color: '#e8eaf6',
                  fontWeight: 600,
                }}>
                  💌 Cartas
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#7b8ab8' }}>
                  Para cuando quieras leer algo bonito
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#7b8ab8', cursor: 'pointer',
                  fontSize: '1.1rem', padding: '6px 10px', borderRadius: '6px',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e8eaf6' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7b8ab8' }}
              >
                ✕
              </button>
            </div>

            {/* Lista de cartas */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              <CartasSection />
            </div>
          </div>
        </>
      )}
    </>
  )
}
