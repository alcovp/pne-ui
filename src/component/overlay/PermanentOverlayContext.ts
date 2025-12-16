import { createContext } from 'react'
import type { PermanentOverlayInstance, PermanentOverlaySlot } from './types'

export type PermanentOverlayContextValue = {
    register: (overlay: PermanentOverlayInstance) => void
    unregister: (id: string, slot?: PermanentOverlaySlot) => void
}

export const PermanentOverlayContext = createContext<PermanentOverlayContextValue | null>(null)
