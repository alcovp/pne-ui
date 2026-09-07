import {useEffect} from 'react'
import type {FluidDragActions, PreDragActions, SensorAPI} from '@hello-pangea/dnd'

const movementThreshold = 5

type Point = {x: number; y: number}
type Gesture = {
    pointerId: number
    handle: Element
    origin: Point
} & (
    | {phase: 'pending'; actions: PreDragActions}
    | {phase: 'dragging'; actions: FluidDragActions}
    | {phase: 'dropping'; actions: FluidDragActions; frame: number}
)

/** Immediate touch dragging for a stable handle whose CSS touch-action is none. */
export default function useImmediateTouchSensor(api: SensorAPI): void {
    useEffect(() => {
        let gesture: Gesture | null = null
        let removeClickGuard: (() => void) | undefined

        const releaseCapture = (current: Gesture) => {
            if (current.handle.hasPointerCapture?.(current.pointerId)) {
                current.handle.releasePointerCapture(current.pointerId)
            }
        }

        // Called by Pangea while it is already releasing the lock: no API calls here.
        const forceStop = () => {
            const current = gesture
            gesture = null
            if (!current) return
            if (current.phase === 'dropping') cancelAnimationFrame(current.frame)
            releaseCapture(current)
        }

        const cancel = () => {
            const current = gesture
            forceStop()
            if (!current?.actions.isActive()) return
            if (current.phase === 'pending') {
                current.actions.abort()
            } else {
                current.actions.cancel({shouldBlockNextClick: true})
            }
        }

        const blockCompatibilityClick = () => {
            removeClickGuard?.()
            const preventClick = (event: MouseEvent) => {
                event.preventDefault()
                event.stopPropagation()
            }
            window.addEventListener('click', preventClick, {capture: true, passive: false, once: true})
            const timer = window.setTimeout(() => removeClickGuard?.(), 0)
            removeClickGuard = () => {
                window.clearTimeout(timer)
                window.removeEventListener('click', preventClick, true)
                removeClickGuard = undefined
            }
        }

        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType !== 'touch') return
            if (gesture) {
                if (event.pointerId !== gesture.pointerId) cancel()
                return
            }
            if (!event.isPrimary || event.button !== 0 || event.defaultPrevented) return
            const id = api.findClosestDraggableId(event)
            if (!id || !(event.target instanceof Element)) return
            const handle = event.target.closest('[data-rfd-drag-handle-draggable-id]')
            if (!handle) return
            const actions = api.tryGetLock(id, forceStop, {sourceEvent: event})
            if (!actions) return
            gesture = {
                phase: 'pending', actions, handle,
                pointerId: event.pointerId,
                origin: {x: event.clientX, y: event.clientY},
            }
            try {
                handle.setPointerCapture?.(event.pointerId)
            } catch {
                cancel()
            }
        }

        const onPointerMove = (event: PointerEvent) => {
            const current = gesture
            if (!current || current.pointerId !== event.pointerId || current.phase === 'dropping') return
            if (!current.actions.isActive()) {
                forceStop()
                return
            }
            const point = {x: event.clientX, y: event.clientY}
            if (current.phase === 'pending') {
                if (Math.max(Math.abs(point.x - current.origin.x), Math.abs(point.y - current.origin.y)) < movementThreshold) return
                const actions = current.actions.fluidLift(current.origin)
                if (!actions.isActive()) {
                    forceStop()
                    return
                }
                gesture = {...current, phase: 'dragging', actions}
                actions.move(point)
            } else {
                current.actions.move(point)
            }
            event.preventDefault()
        }

        const onPointerUp = (event: PointerEvent) => {
            const current = gesture
            if (!current || current.pointerId !== event.pointerId || current.phase === 'dropping') return
            if (current.phase === 'pending') {
                cancel()
                return
            }
            if (!current.actions.isActive()) {
                forceStop()
                return
            }
            event.preventDefault()
            blockCompatibilityClick()
            // move() is RAF-throttled by Pangea. Finish after that frame, not before it.
            current.actions.move({x: event.clientX, y: event.clientY})
            const frame = requestAnimationFrame(() => {
                if (gesture?.phase !== 'dropping' || gesture.frame !== frame) return
                gesture = null
                if (current.actions.isActive()) {
                    // The compatibility click was blocked at pointerup, before this frame.
                    current.actions.drop({shouldBlockNextClick: false})
                }
            })
            gesture = {...current, phase: 'dropping', frame}
            releaseCapture(current)
        }

        const onPointerCancel = (event: PointerEvent) => {
            if (gesture?.pointerId === event.pointerId) cancel()
        }
        const onTouchMove = (event: TouchEvent) => {
            // Pointer events move the item, while native touch gestures must also be
            // consumed. Otherwise Chrome can swallow the first tap after a drag.
            if (gesture && gesture.phase !== 'pending'
                && event.target instanceof Node && gesture.handle.contains(event.target)) {
                event.preventDefault()
            }
        }
        const onLostCapture = (event: PointerEvent) => {
            if (gesture?.pointerId === event.pointerId && gesture.phase !== 'dropping') cancel()
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (!gesture) return
            if (event.key === 'Escape') event.preventDefault()
            cancel()
        }
        const onVisibilityChange = () => {
            if (document.hidden) cancel()
        }
        const onScroll = () => {
            if (gesture?.phase === 'pending') cancel()
        }
        const onContextMenu = (event: MouseEvent) => {
            if (gesture) event.preventDefault()
        }

        window.addEventListener('pointerdown', onPointerDown, {capture: true, passive: false})
        window.addEventListener('pointermove', onPointerMove, {capture: true, passive: false})
        window.addEventListener('pointerup', onPointerUp, {capture: true, passive: false})
        window.addEventListener('pointercancel', onPointerCancel, true)
        window.addEventListener('touchmove', onTouchMove, {passive: false})
        window.addEventListener('lostpointercapture', onLostCapture, true)
        window.addEventListener('keydown', onKeyDown, true)
        window.addEventListener('blur', cancel)
        window.addEventListener('resize', cancel)
        window.addEventListener('orientationchange', cancel)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('contextmenu', onContextMenu)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            cancel()
            removeClickGuard?.()
            window.removeEventListener('pointerdown', onPointerDown, true)
            window.removeEventListener('pointermove', onPointerMove, true)
            window.removeEventListener('pointerup', onPointerUp, true)
            window.removeEventListener('pointercancel', onPointerCancel, true)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('lostpointercapture', onLostCapture, true)
            window.removeEventListener('keydown', onKeyDown, true)
            window.removeEventListener('blur', cancel)
            window.removeEventListener('resize', cancel)
            window.removeEventListener('orientationchange', cancel)
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('contextmenu', onContextMenu)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [api])
}
