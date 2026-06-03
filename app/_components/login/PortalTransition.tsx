'use client'

import { useEffect, useState } from 'react'

// ── Pixel art rings usando box-shadow ────────────────────────────────────────
const U  = 10   // px por celda
const G  = 13   // grid 13×13 (índices 0–12, centro en 6)
const CX = 6, CY = 6
const W  = G * U  // 130px

function makeRing(r: number, tol: number, col: string) {
  const out: string[] = []
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++)
      if (Math.abs(Math.sqrt((x - CX) ** 2 + (y - CY) ** 2) - r) <= tol)
        out.push(`${x * U}px ${y * U}px 0 0 ${col}`)
  return out.join(',')
}

// Tres anillos concéntricos en colores del proyecto
const RING_OUT = makeRing(5.5, 0.65, '#6c8ed4')  // accent
const RING_MID = makeRing(4.0, 0.65, '#4a6fa5')  // accent-dark
const RING_IN  = makeRing(2.5, 0.65, '#2e3a5c')  // border-pixel

// ── Componente ───────────────────────────────────────────────────────────────
export default function PortalTransition({ onEntered }: { onEntered: () => void }) {
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntering(true), 2400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!entering) return
    const t = setTimeout(onEntered, 900)
    return () => clearTimeout(t)
  }, [entering, onEntered])

  return (
    <>
      <style>{`
        @keyframes portal-appear {
          0%   { opacity: 0; transform: scale(0.05); }
          65%  { opacity: 1; transform: scale(1.1);  }
          100% { opacity: 1; transform: scale(1);    }
        }
        @keyframes portal-enter {
          0%   { transform: scale(1);  opacity: 1; }
          100% { transform: scale(22); opacity: 0; }
        }
        @keyframes orbit-cw {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(0deg);    }
          to   { transform: rotate(-360deg); }
        }
        @keyframes inner-pulse {
          0%,100% { opacity: 0.55; transform: scale(0.95); }
          50%     { opacity: 1;    transform: scale(1.08); }
        }
        @keyframes pixel-twinkle {
          0%,100% { opacity: 0; transform: translateY(0px)   scale(0.6); }
          40%     { opacity: 1; transform: translateY(-8px)  scale(1);   }
          80%     { opacity: 0; transform: translateY(-18px) scale(0.7); }
        }
        @keyframes screen-black {
          0%,45% { opacity: 0; }
          100%   { opacity: 1; }
        }

        .portal-root {
          animation: portal-appear 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .portal-root.entering {
          animation: portal-enter 0.85s ease-in forwards;
        }
      `}</style>

      {/* Overlay negro al entrar */}
      {entering && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 210,
          background: '#000',
          animation: 'screen-black 0.9s ease forwards',
        }} />
      )}

      {/* Portal centrado en pantalla */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 150,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div
          className={`portal-root${entering ? ' entering' : ''}`}
          style={{ position: 'relative', width: W, height: W }}
        >

          {/* ── Anillos pixel art (estáticos) ──────────────────────────── */}
          {[RING_OUT, RING_MID, RING_IN].map((shadow, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, left: 0,
              width: U, height: U,
              background: 'transparent',
              boxShadow: shadow,
            }} />
          ))}

          {/* ── Interior del portal (fondo oscuro + glow) ──────────────── */}
          <div style={{
            position: 'absolute',
            top: CY * U - 24, left: CX * U - 24,
            width: 58, height: 58,
            background: 'radial-gradient(circle, #1c2235 30%, #151929 100%)',
          }} />
          <div style={{
            position: 'absolute',
            top: CY * U - 18, left: CX * U - 18,
            width: 46, height: 46,
            background: 'radial-gradient(circle, #6c8ed4 0%, #4a6fa5 40%, transparent 75%)',
            animation: 'inner-pulse 1.4s ease-in-out infinite',
          }} />

          {/* ── Puntos orbitando — órbita exterior (CW) ────────────────── */}
          {[0, 90, 180, 270].map((deg, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 0, height: 0,
              animation: `orbit-cw 1.8s linear ${i * -0.45}s infinite`,
            }}>
              <div style={{
                position: 'absolute',
                top: -40, left: -5,
                width: U, height: U,
                background: '#6c8ed4',
                boxShadow: '0 0 6px 2px #4a6fa5',
                imageRendering: 'pixelated',
              }} />
            </div>
          ))}

          {/* ── Puntos orbitando — órbita interior (CCW) ───────────────── */}
          {[45, 135, 225, 315].map((deg, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 0, height: 0,
              transform: `rotate(${deg}deg)`,
              animation: `orbit-ccw 1.1s linear ${i * -0.275}s infinite`,
            }}>
              <div style={{
                position: 'absolute',
                top: -22, left: -4,
                width: 8, height: 8,
                background: '#e8eaf6',
              }} />
            </div>
          ))}

          {/* ── Destellos pixel ✦ flotando alrededor ──────────────────── */}
          {([
            { top: '5%',  left: '-18%', delay: '0s'    },
            { top: '80%', left: '-20%', delay: '0.6s'  },
            { top: '5%',  left: '108%', delay: '1.1s'  },
            { top: '75%', left: '110%', delay: '0.3s'  },
            { top: '45%', left: '-22%', delay: '1.5s'  },
            { top: '40%', left: '112%', delay: '0.85s' },
          ] as const).map(({ top, left, delay }, i) => (
            <div key={i} style={{
              position: 'absolute', top, left,
              color: '#6c8ed4',
              fontSize: '12px',
              fontFamily: 'monospace',
              animation: `pixel-twinkle 2s ease-in-out ${delay} infinite`,
            }}>✦</div>
          ))}

          {/* ── Etiqueta ─────────────────────────────────────────────────── */}
          {!entering && (
            <div style={{
              position: 'absolute',
              top: '118%', left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: "'Bitcount Grid Single', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              color: '#6c8ed4',
              animation: 'blink 1s step-end infinite',
            }}>
              portal abierto
            </div>
          )}
        </div>
      </div>
    </>
  )
}
