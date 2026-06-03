'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

// ── Corazones flotantes ───────────────────────────────────────────────────────
const HEARTS = [
  { left: '8%',  delay: '0s',    dur: '3.2s', size: '1.6rem' },
  { left: '18%', delay: '0.5s',  dur: '2.8s', size: '1.2rem' },
  { left: '30%', delay: '1.1s',  dur: '3.5s', size: '2rem'   },
  { left: '42%', delay: '0.3s',  dur: '2.6s', size: '1.4rem' },
  { left: '55%', delay: '0.8s',  dur: '3.1s', size: '1.8rem' },
  { left: '67%', delay: '1.4s',  dur: '2.9s', size: '1.3rem' },
  { left: '78%', delay: '0.2s',  dur: '3.4s', size: '1.7rem' },
  { left: '88%', delay: '0.9s',  dur: '2.7s', size: '1.1rem' },
  { left: '23%', delay: '1.7s',  dur: '3.0s', size: '1.5rem' },
  { left: '60%', delay: '2.0s',  dur: '2.5s', size: '2.2rem' },
  { left: '48%', delay: '1.3s',  dur: '3.3s', size: '1.0rem' },
  { left: '5%',  delay: '2.2s',  dur: '2.8s', size: '1.9rem' },
]

// ── Globos ────────────────────────────────────────────────────────────────────
const BALLOONS = [
  { left: '12%', delay: '0s',   dur: '5s',   color: '#e05c6a' },
  { left: '35%', delay: '0.7s', dur: '6s',   color: '#6c8ed4' },
  { left: '58%', delay: '1.3s', dur: '4.8s', color: '#e8a0bf' },
  { left: '80%', delay: '0.4s', dur: '5.5s', color: '#f0c040' },
  { left: '25%', delay: '1.8s', dur: '6.2s', color: '#e05c6a' },
  { left: '70%', delay: '2.1s', dur: '5.2s', color: '#4caf7d' },
]

// ─────────────────────────────────────────────────────────────────────────────

type Props = { onContinue: () => void }

export default function WinCelebration({ onContinue }: Props) {
  const [showSpace, setShowSpace] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowSpace(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!showSpace) return
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); onContinue() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSpace, onContinue])

  return (
    <>
      <style>{`
        @keyframes float-heart {
          0%   { transform: translateY(0)   scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
        }
        @keyframes float-balloon {
          0%   { transform: translateY(0) rotate(-4deg); opacity: 0; }
          8%   { opacity: 1; }
          50%  { transform: translateY(-55vh) rotate(4deg); }
          100% { transform: translateY(-110vh) rotate(-4deg); opacity: 0; }
        }
        @keyframes bouquet-pulse {
          0%,100% { transform: scale(1)    rotate(-2deg); }
          50%     { transform: scale(1.06) rotate(2deg);  }
        }
        @keyframes win-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes space-blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, #1a1040 0%, #0d0a1e 100%)',
          animation: 'win-fade-in 1s ease forwards',
        }}
        onClick={showSpace ? onContinue : undefined}
      >

        {/* Corazones flotantes */}
        {HEARTS.map((h, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: '-10%', left: h.left,
            fontSize: h.size,
            animation: `float-heart ${h.dur} ${h.delay} ease-in infinite`,
            pointerEvents: 'none',
          }}>💗</div>
        ))}

        {/* Globos */}
        {BALLOONS.map((b, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: '-15%', left: b.left,
            animation: `float-balloon ${b.dur} ${b.delay} ease-in infinite`,
            pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              width: 24, height: 30,
              borderRadius: '50% 50% 45% 45%',
              background: b.color,
              boxShadow: `inset -4px -4px 0 rgba(0,0,0,0.2), inset 4px 4px 0 rgba(255,255,255,0.25)`,
            }} />
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.35)' }} />
          </div>
        ))}

        {/* Ramo de rosas */}
        <div style={{
          animation: 'bouquet-pulse 2.8s ease-in-out infinite',
          filter: 'drop-shadow(0 0 24px rgba(192,57,43,0.65))',
          marginBottom: '1.2rem',
          position: 'relative',
          width: 220,
          height: 220,
        }}>
          <Image
            src="/img/roses.png"
            alt="Ramo de rosas"
            fill
            style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
            unoptimized
          />
        </div>

        {/* Texto */}
        <div style={{
          fontFamily: "'Bitcount Grid Single', monospace",
          fontSize: '1.3rem',
          color: '#f8d0dc',
          letterSpacing: '0.15em',
          textAlign: 'center',
          textShadow: '0 0 12px rgba(224,92,106,0.8)',
          padding: '0 1.5rem',
        }}>
          ✦ Feliz Cumpleaños, Nicki ✦
        </div>
        <div style={{
          fontFamily: "'Bitcount Grid Single', monospace",
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          marginTop: '0.5rem',
        }}>
          💙 con mucho amor 💙
        </div>

        {/* Indicador SPACE */}
        {showSpace && (
          <div style={{
            position: 'absolute', bottom: '2rem',
            fontFamily: "'Bitcount Grid Single', monospace",
            fontSize: '0.8rem',
            color: 'var(--accent)',
            letterSpacing: '0.2em',
            animation: 'space-blink 1s step-end infinite',
          }}>
            ▶ [SPACE] continuar
          </div>
        )}
      </div>
    </>
  )
}
