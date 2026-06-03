'use client'

import { useState } from 'react'
import { TRIVIA_QUESTIONS } from '@/app/lib/trivia'
import { TilePoint } from '@/app/lib/map'

type TriviaModalProps = {
  point: TilePoint
  onCollect: (index: number) => void
  onWrongAnswer: () => void
  onClose: () => void
}

export default function TriviaModal({ point, onCollect, onWrongAnswer, onClose }: TriviaModalProps) {
  const question = TRIVIA_QUESTIONS[point.index]
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  if (!question) {
    onClose()
    return null
  }

  function handleSelect(optionIndex: number) {
    if (answered) return
    setSelected(optionIndex)
    setAnswered(true)

    if (optionIndex === question.correctIndex) {
      setTimeout(() => onCollect(point.index), 900)
    } else {
      onWrongAnswer()
    }
  }

  const isCorrect = answered && selected === question.correctIndex
  const isWrong   = answered && selected !== question.correctIndex

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(13,15,26,0.82)' }}>

      <div
        className="w-full max-w-xs mx-4 flex flex-col gap-4 p-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '2px solid var(--border-pixel)',
          boxShadow: '-2px 0 0 0 #080a12, 2px 0 0 0 #080a12, 0 -2px 0 0 #080a12, 0 2px 0 0 #080a12',
          fontFamily: "'Bitcount Grid Single', monospace",
        }}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            ✦ llave {point.index + 1}/10
          </span>
          <button
            onClick={onClose}
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Pregunta */}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {question.question}
        </p>

        {/* Opciones */}
        <div className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            let borderColor = 'var(--border-pixel)'
            let textColor   = 'var(--text-primary)'
            let bgColor     = 'transparent'

            if (answered) {
              if (i === selected && isCorrect) {
                // Solo marcar verde si es la respuesta correcta seleccionada
                borderColor = '#4caf7d'
                textColor   = '#4caf7d'
                bgColor     = 'rgba(76,175,125,0.08)'
              } else if (i === selected && isWrong) {
                // Marcar rojo solo la opción elegida, sin revelar la correcta
                borderColor = 'var(--error)'
                textColor   = 'var(--error)'
                bgColor     = 'rgba(224,92,106,0.08)'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className="text-left text-xs px-3 py-2 transition-all"
                style={{
                  border: `2px solid ${borderColor}`,
                  color: textColor,
                  backgroundColor: bgColor,
                  cursor: answered ? 'default' : 'pointer',
                  fontFamily: "'Bitcount Grid Single', monospace",
                }}
              >
                {String.fromCharCode(65 + i)}. {option}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {answered && (
          <p
            className="text-xs text-center"
            style={{ color: isCorrect ? '#4caf7d' : 'var(--error)' }}
          >
            {isCorrect
              ? '✔ ¡Correcto! Llave obtenida.'
              : '✖ Incorrecto. Inténtalo de nuevo.'}
          </p>
        )}

        {/* Reintentar si falló */}
        {isWrong && (
          <button
            onClick={() => { setSelected(null); setAnswered(false) }}
            className="pixel-btn w-full text-xs"
          >
            [ reintentar ]
          </button>
        )}
      </div>
    </div>
  )
}
