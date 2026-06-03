'use client'

import { useCallback, useRef, useState } from 'react'
import { NarratorContext, NarratorLine } from '@/app/lib/narratorContext'
import Narrator from './Narrator'

export default function NarratorProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines]   = useState<NarratorLine[] | null>(null)
  const resolveRef          = useRef<(() => void) | null>(null)

  const say = useCallback((newLines: NarratorLine[]): Promise<void> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setLines(newLines)
    })
  }, [])

  function handleDone() {
    setLines(null)
    resolveRef.current?.()
    resolveRef.current = null
  }

  return (
    <NarratorContext.Provider value={{ say }}>
      {children}
      {lines && <Narrator lines={lines} onDone={handleDone} />}
    </NarratorContext.Provider>
  )
}
