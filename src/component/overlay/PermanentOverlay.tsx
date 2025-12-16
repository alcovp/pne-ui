import { useContext, useEffect, useRef } from 'react'
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
    const renderRef = useRef(render)

    useEffect(() => {
        renderRef.current = render
    }, [render])

    useEffect(() => {
        if (!ctx) return
        ctx.register({
            id,
            slot,
            offset,
            zIndex,
            render: context => renderRef.current(context),
        })
        return () => ctx.unregister(id, slot)
    }, [ctx, id, slot, offset, zIndex])

    return null
}

export default PermanentOverlay
