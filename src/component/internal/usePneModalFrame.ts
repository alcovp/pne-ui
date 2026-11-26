import * as React from 'react'

/**
 * The place and the size a person gave the window. `null` is the window as it opens: centred, as wide and as
 * tall as its styles and content make it. The numbers are pixels from the top left corner of the modal root.
 */
export type PneModalFrame = {
    left: number
    top: number
    /** The width the window had when it left the centre, or the one the corner was dragged to. */
    width: number
    /** Set only after the corner was dragged; a window that was only moved stays as tall as its content. */
    height?: number
}

export type PneModalFrameAction = 'move' | 'resize'

type Size = {width: number; height: number}

type FrameSession = {
    action: PneModalFrameAction
    pointerId: number | undefined
    pointerX: number
    pointerY: number
    left: number
    top: number
    width: number
    height: number
    min: Size
    max: Size
    stop: () => void
}

type UsePneModalFrameOptions = {
    container: HTMLElement | null
    movable: boolean
    open: boolean
    resizable: boolean
}

type UsePneModalFrameResult = {
    /** What the person is doing with the window right now. */
    action: PneModalFrameAction | null
    frameStyle: React.CSSProperties | undefined
    onMoveStart: (event: React.PointerEvent<HTMLElement>) => void
    onResizeStart: (event: React.PointerEvent<HTMLElement>) => void
}

// A press on a control of the header acts on the control; the window moves by the rest of the header.
const HEADER_CONTROLS = 'a[href], button, input, select, textarea, [role="button"], [contenteditable="true"]'

// The smallest window a person can make when its styles set no minimum: room for the header, a few lines
// and the buttons. A window that opened smaller keeps its own size as the minimum.
const MIN_SIZE: Size = {width: 240, height: 160}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max))

const getBounds = (container: HTMLElement): Size & {left: number; top: number} => {
    const parent = container.offsetParent
    if (parent instanceof HTMLElement) {
        const rect = parent.getBoundingClientRect()
        return {left: rect.left, top: rect.top, width: parent.clientWidth, height: parent.clientHeight}
    }

    const view = container.ownerDocument.defaultView
    return {left: 0, top: 0, width: view?.innerWidth ?? 0, height: view?.innerHeight ?? 0}
}

// The limits the styles of the window give, in pixels. A browser answers with resolved lengths; where the
// answer is not a length (`none`, `auto`, a test environment), the limit is absent.
const getStyleLimits = (container: HTMLElement, size: Size): {min: Size; max: Size} => {
    const style = container.ownerDocument.defaultView?.getComputedStyle(container)
    const read = (value: string | undefined): number | undefined => {
        const pixels = value !== undefined && /^[\d.]+px$/.test(value) ? Number.parseFloat(value) : Number.NaN
        return Number.isFinite(pixels) && pixels > 0 ? pixels : undefined
    }

    return {
        min: {
            width: Math.min(size.width, read(style?.minWidth) ?? MIN_SIZE.width),
            height: Math.min(size.height, read(style?.minHeight) ?? MIN_SIZE.height),
        },
        max: {
            width: read(style?.maxWidth) ?? Number.POSITIVE_INFINITY,
            height: read(style?.maxHeight) ?? Number.POSITIVE_INFINITY,
        },
    }
}

const fitFrame = (frame: PneModalFrame, size: Size, bounds: Size): PneModalFrame => {
    const width = Math.min(frame.width, bounds.width)
    const height = frame.height === undefined ? undefined : Math.min(frame.height, bounds.height)
    const left = clamp(frame.left, 0, bounds.width - Math.min(size.width, width))
    const top = clamp(frame.top, 0, bounds.height - (height ?? size.height))

    return left === frame.left && top === frame.top && width === frame.width && height === frame.height
        ? frame
        : {left, top, width, height}
}

/**
 * Lets a person move the window by its header and resize it by its lower right corner. The window stays
 * whole inside the modal root, also when the browser window or the content changes, and opens centred again
 * next time.
 */
export const usePneModalFrame = ({
    container,
    movable,
    open,
    resizable,
}: UsePneModalFrameOptions): UsePneModalFrameResult => {
    const [frame, setFrame] = React.useState<PneModalFrame | null>(null)
    const [action, setAction] = React.useState<PneModalFrameAction | null>(null)
    const sessionRef = React.useRef<FrameSession | null>(null)

    const stopSession = React.useCallback(() => {
        sessionRef.current?.stop()
        sessionRef.current = null
        setAction(null)
    }, [])

    // The next opening starts from the centre; a window that lost both features goes back there as well.
    React.useEffect(() => {
        if (!open || (!movable && !resizable)) {
            /* eslint-disable @eslint-react/set-state-in-effect -- a closed window, or one that can no longer move, forgets its place */
            stopSession()
            setFrame(null)
            /* eslint-enable @eslint-react/set-state-in-effect */
        }
    }, [movable, open, resizable, stopSession])

    React.useEffect(() => stopSession, [stopSession])

    // A smaller browser window or taller content pushes the window back inside the modal root and, if it
    // has to, makes it smaller.
    const hasFrame = frame !== null
    React.useEffect(() => {
        const view = container?.ownerDocument.defaultView
        if (!hasFrame || !container || !view) return undefined

        const fit = () => {
            // While the person drags, the drag itself keeps the window inside.
            if (sessionRef.current) return
            const rect = container.getBoundingClientRect()
            setFrame(current => current && fitFrame(current, rect, getBounds(container)))
        }
        view.addEventListener('resize', fit)
        const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(fit) : undefined
        observer?.observe(container)

        return () => {
            view.removeEventListener('resize', fit)
            observer?.disconnect()
        }
    }, [container, hasFrame])

    const start = (nextAction: PneModalFrameAction, event: React.PointerEvent<HTMLElement>) => {
        if (!container || event.button !== 0 || sessionRef.current) return

        const handle = event.currentTarget
        const ownerDocument = container.ownerDocument
        const rect = container.getBoundingClientRect()
        const bounds = getBounds(container)
        const pointerId = event.pointerId
        const left = Math.round(rect.left - bounds.left)
        const top = Math.round(rect.top - bounds.top)
        const size = {width: Math.round(rect.width), height: Math.round(rect.height)}

        const onMove = (moveEvent: PointerEvent) => {
            const session = sessionRef.current
            if (!session || moveEvent.pointerId !== session.pointerId) return

            // The button was let go where the page could not see it.
            if (moveEvent.pointerType === 'mouse' && moveEvent.buttons === 0) {
                stopSession()
                return
            }

            const deltaX = moveEvent.clientX - session.pointerX
            const deltaY = moveEvent.clientY - session.pointerY
            const liveBounds = getBounds(container)
            const next: PneModalFrame =
                session.action === 'move'
                    ? {
                          left: clamp(session.left + deltaX, 0, liveBounds.width - session.width),
                          top: clamp(session.top + deltaY, 0, liveBounds.height - session.height),
                          width: session.width,
                      }
                    : {
                          left: session.left,
                          top: session.top,
                          width: clamp(
                              session.width + deltaX,
                              session.min.width,
                              Math.min(liveBounds.width - session.left, session.max.width),
                          ),
                          height: clamp(
                              session.height + deltaY,
                              session.min.height,
                              Math.min(liveBounds.height - session.top, session.max.height),
                          ),
                      }

            setFrame(current => {
                // A move keeps the height the corner was dragged to before, if it was.
                const merged = session.action === 'move' ? {...next, height: current?.height} : next
                return current &&
                    current.left === merged.left &&
                    current.top === merged.top &&
                    current.width === merged.width &&
                    current.height === merged.height
                    ? current
                    : merged
            })
        }
        const onEnd = (endEvent: PointerEvent) => {
            if (endEvent.pointerId === sessionRef.current?.pointerId) stopSession()
        }

        ownerDocument.addEventListener('pointermove', onMove)
        ownerDocument.addEventListener('pointerup', onEnd)
        ownerDocument.addEventListener('pointercancel', onEnd)
        // With the capture the moves keep coming when the pointer leaves the browser window. A scripted
        // event may name a pointer the browser does not know: the capture is refused, and the listeners of
        // the document do the whole work.
        if (pointerId !== undefined) {
            try {
                handle.setPointerCapture?.(pointerId)
            } catch {
                // No capture for this pointer.
            }
        }

        sessionRef.current = {
            action: nextAction,
            pointerId,
            pointerX: event.clientX,
            pointerY: event.clientY,
            left,
            top,
            ...size,
            ...getStyleLimits(container, size),
            stop: () => {
                ownerDocument.removeEventListener('pointermove', onMove)
                ownerDocument.removeEventListener('pointerup', onEnd)
                ownerDocument.removeEventListener('pointercancel', onEnd)
                try {
                    if (pointerId !== undefined && handle.hasPointerCapture?.(pointerId)) {
                        handle.releasePointerCapture(pointerId)
                    }
                } catch {
                    // The pointer is gone, and its capture with it.
                }
            },
        }
        setAction(nextAction)
        // The window leaves the centre for the very place and width it has: nothing jumps under the pointer.
        setFrame(current => ({
            left,
            top,
            width: size.width,
            height: nextAction === 'resize' ? size.height : current?.height,
        }))
        // No text selection and no page scroll start with this press.
        event.preventDefault()
    }

    const onMoveStart = (event: React.PointerEvent<HTMLElement>) => {
        if (!movable) return
        if (event.target instanceof Element && event.target.closest(HEADER_CONTROLS)) return
        start('move', event)
    }

    const onResizeStart = (event: React.PointerEvent<HTMLElement>) => {
        if (!resizable) return
        start('resize', event)
    }

    const frameStyle: React.CSSProperties | undefined = frame
        ? {
              left: `${frame.left}px`,
              top: `${frame.top}px`,
              transform: 'none',
              width: `${frame.width}px`,
              height: frame.height === undefined ? undefined : `${frame.height}px`,
          }
        : undefined

    return {action, frameStyle, onMoveStart, onResizeStart}
}
