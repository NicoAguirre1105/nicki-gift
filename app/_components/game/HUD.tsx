'use client'

import { TOTAL_TRIVIA, MAX_LIVES } from '@/app/lib/gameState'

type HUDProps = {
  triviaCollected: number
  lives: number
}

export default function HUD({ triviaCollected, lives }: HUDProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10 select-none"
      style={{
        background: 'linear-gradient(to bottom, rgba(13,15,26,0.92) 70%, transparent)',
        fontFamily: "'Bitcount Grid Single', monospace",
      }}
    >
      {/* Vidas */}
      <div className="flex items-center gap-2">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <span
            key={i}
            className="text-2xl"
            style={{
              color: i < lives ? '#e05c6a' : '#2e3a5c',
              letterSpacing: '0.05em',
              display: 'inline-block',
              transform: 'scaleX(1.25)',
            }}
          >
            ♥
          </span>
        ))}
      </div>

      {/* Trivia counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          llaves
        </span>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_TRIVIA }).map((_, i) => (
            <span
              key={i}
              className="text-sm"
              style={{ color: i < triviaCollected ? '#6c8ed4' : '#2e3a5c' }}
            >
              ■
            </span>
          ))}
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {triviaCollected}/{TOTAL_TRIVIA}
        </span>
      </div>
    </div>
  )
}
