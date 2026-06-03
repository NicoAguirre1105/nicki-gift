'use client'

import { useContext } from 'react'
import { NarratorContext } from '@/app/lib/narratorContext'

export function useNarrator() {
  return useContext(NarratorContext)
}
