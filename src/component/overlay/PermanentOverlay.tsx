import { useContext, useEffect } from 'react'
import { PermanentOverlayContext } from './PermanentOverlayContext'
import type { PermanentOverlayRender, PermanentOverlaySlot } from './types'

const DEFAULT_SLOT: PermanentOverlaySlot = 'bottom-right'

type PermanentOverlayProps = {
    id: string
    slot?: PermanentOverlaySlot
    render: PermanentOverlayRender
    offset?: number
    zIndex?: number
}

/**
 * Declaratively registers a permanent overlay with the nearest `<OverlayHost />` in the tree.
 * Only one overlay per slot is kept; the latest registered wins.
 */
export function PermanentOverlay({ id, slot = DEFAULT_SLOT, render, offset, zIndex }: PermanentOverlayProps) {
    const ctx = useContext(PermanentOverlayContext)

    // Re-register on every new `render` so the host re-renders the slot with fresh content and closures.
    useEffect(() => {
        if (!ctx) return
        ctx.register({ id, slot, offset, zIndex, render })
        return () => ctx.unregister(id, slot)
    }, [ctx, id, slot, offset, zIndex, render])

    return null
}

export default PermanentOverlay
