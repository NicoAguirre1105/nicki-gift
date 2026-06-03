'use client'

import { createContext } from 'react'

export type NarratorSide = 'left' | 'right'

export type NarratorLine = {
  text: string
  /** Nombre de archivo en /characters/Nico/ — ej. 'guide_happy.png' */
  image: string
  side?: NarratorSide
  /** Si se define, el cuadro se cierra automáticamente después de N ms (sin necesidad de SPACE) */
  autoCloseMs?: number
  /** Si se define, alterna entre estos frames como sprite animado (ignora `image`) */
  frames?: string[]
}

export type NarratorContextType = {
  /** Muestra una secuencia de diálogos. Devuelve una promesa que se resuelve al terminar. */
  say: (lines: NarratorLine[]) => Promise<void>
}

export const NarratorContext = createContext<NarratorContextType>({
  say: async () => {},
})
