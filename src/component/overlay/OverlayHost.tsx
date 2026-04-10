import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Snackbar, type SnackbarOrigin } from '@mui/material'
import { useBreakpoint } from '../responsive/useBreakpoint'
import { useOverlayStore } from './overlayStore'
import type { PermanentOverlayInstance, PermanentOverlaySlot, SnackbarOptions } from './types'
import { Box } from '@mui/material'
import { PermanentOverlayContext } from './PermanentOverlayContext'
import { registerOverlayHost } from './overlayRuntime'

type OverlayHostProps = {
    anchorOrigin?: SnackbarOrigin
    maxSnack?: number
    children?: React.ReactNode
}

type ManagedSnackbarProps = {
    anchor: SnackbarOrigin
    onRemove: (id: string) => void
    snack: SnackbarOptions
}

const STACK_GAP = 12
const STACK_OFFSET = 24
const PERMANENT_OFFSET = 24

const clearTimer = (timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null) => {
    if (timer) {
        clearTimeout(timer)
    }
}

const ManagedSnackbar = ({ anchor, onRemove, snack }: ManagedSnackbarProps) => {
    const autoHideMs = typeof snack.autoHideMs === 'number' && snack.autoHideMs > 0 ? snack.autoHideMs : null
    const [remainingMs, setRemainingMs] = useState<number | null>(autoHideMs)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const startedAtRef = React.useRef<number | null>(null)
    const remainingRef = React.useRef<number | null>(autoHideMs)

    const remove = useCallback(() => {
        if (snack.id) {
            onRemove(snack.id)
        }
    }, [onRemove, snack.id])

    const stopTimer = useCallback(() => {
        clearTimer(timeoutRef.current)
        clearTimer(intervalRef.current)
        timeoutRef.current = null
        intervalRef.current = null
    }, [])

    const syncRemaining = useCallback(() => {
        if (startedAtRef.current == null || remainingRef.current == null) {
            return
        }

        const elapsed = Date.now() - startedAtRef.current
        setRemainingMs(Math.max(remainingRef.current - elapsed, 0))
    }, [])

    const startTimer = useCallback((duration: number) => {
        if (autoHideMs == null) {
            return
        }

        if (duration <= 0) {
            stopTimer()
            remove()
            return
        }

        stopTimer()
        remainingRef.current = duration
        startedAtRef.current = Date.now()
        setRemainingMs(duration)

        timeoutRef.current = setTimeout(() => {
            stopTimer()
            remove()
        }, duration)

        intervalRef.current = setInterval(syncRemaining, 50)
    }, [autoHideMs, remove, stopTimer, syncRemaining])

    const pauseTimer = useCallback(() => {
        if (autoHideMs == null || startedAtRef.current == null || remainingRef.current == null) {
            return
        }

        const elapsed = Date.now() - startedAtRef.current
        const nextRemaining = Math.max(remainingRef.current - elapsed, 0)
        remainingRef.current = nextRemaining
        startedAtRef.current = null
        setRemainingMs(nextRemaining)
        stopTimer()
    }, [autoHideMs, stopTimer])

    const resumeTimer = useCallback(() => {
        if (autoHideMs == null || startedAtRef.current != null) {
            return
        }

        startTimer(remainingRef.current ?? autoHideMs)
    }, [autoHideMs, startTimer])

    React.useEffect(() => {
        if (autoHideMs == null) {
            return undefined
        }

        startTimer(autoHideMs)
        return stopTimer
    }, [autoHideMs, startTimer, stopTimer])

    const progressScale = autoHideMs != null && remainingMs != null
        ? Math.max(Math.min(remainingMs / autoHideMs, 1), 0)
        : null

    return (
        <Snackbar
            open
            anchorOrigin={anchor}
            data-testid={snack.id ? `overlay-snackbar-${snack.id}` : 'overlay-snackbar'}
            onClose={(_event, reason) => {
                if (reason === 'clickaway') return
                remove()
            }}
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            onFocus={pauseTimer}
            onBlur={resumeTimer}
            sx={{ position: 'static', transform: 'none', pointerEvents: 'auto', minWidth: 288 }}
        >
            <Alert
                elevation={1}
                onClose={remove}
                severity={snack.variant ?? 'info'}
                action={snack.action}
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    alignItems: 'center',
                }}
            >
                {progressScale != null ? (
                    <Box
                        data-testid='overlay-snackbar-progress'
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            backgroundColor: 'currentColor',
                            opacity: 0.24,
                            transformOrigin: 'left',
                            transform: `scaleX(${progressScale})`,
                            pointerEvents: 'none',
                        }}
                    />
                ) : null}
                {snack.message}
            </Alert>
        </Snackbar>
    )
}

/**
 * Renders overlay elements (currently snackbars) driven by the shared overlay store.
 * Mount this once near the root of the app and trigger notifications via `overlayActions`.
 * Permanent overlays are registered declaratively via `<PermanentOverlay />` components.
 */
export function OverlayHost({
    anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
    maxSnack = 10,
    children,
}: OverlayHostProps) {
    const snackbars = useOverlayStore(state => state.snackbars)
    const removeSnackbar = useOverlayStore(state => state.removeSnackbar)
    const breakpoint = useBreakpoint()

    const [permanentOverlays, setPermanentOverlays] = useState<Map<PermanentOverlaySlot, PermanentOverlayInstance>>(
        () => new Map(),
    )

    const registerPermanentOverlay = useCallback((overlay: PermanentOverlayInstance) => {
        setPermanentOverlays(prev => {
            const next = new Map(prev)
            next.set(overlay.slot, overlay)
            return next
        })
    }, [])

    const unregisterPermanentOverlay = useCallback((id: string, slot?: PermanentOverlaySlot) => {
        setPermanentOverlays(prev => {
            const next = new Map(prev)
            if (slot) {
                const current = next.get(slot)
                if (current?.id === id) next.delete(slot)
            } else {
                for (const [key, value] of next.entries()) {
                    if (value.id === id) next.delete(key)
                }
            }
            return next
        })
    }, [])

    const contextValue = useMemo(
        () => ({ register: registerPermanentOverlay, unregister: unregisterPermanentOverlay }),
        [registerPermanentOverlay, unregisterPermanentOverlay],
    )

    const visibleSnackbars = useMemo(() => {
        if (typeof maxSnack === 'number' && maxSnack > 0 && snackbars.length > maxSnack) {
            return snackbars.slice(snackbars.length - maxSnack)
        }
        return snackbars
    }, [maxSnack, snackbars])

    const groupedSnackbars = useMemo(() => {
        const groups: Array<{ anchor: SnackbarOrigin; items: typeof visibleSnackbars }> = []
        const map = new Map<string, { anchor: SnackbarOrigin; items: typeof visibleSnackbars }>()
        visibleSnackbars.forEach(snack => {
            const anchor = snack.anchorOrigin ?? anchorOrigin
            const key = `${anchor.vertical}-${anchor.horizontal}`
            if (!map.has(key)) {
                const group = { anchor, items: [] as typeof visibleSnackbars }
                map.set(key, group)
                groups.push(group)
            }
            map.get(key)!.items.push(snack)
        })
        return groups
    }, [anchorOrigin, visibleSnackbars])

    const permanentContent = useMemo(() => {
        const entries = Array.from(permanentOverlays.values())
        return entries
            .map(entry => {
                const content = entry.render({ breakpoint })
                if (!content) return null
                const offset = entry.offset ?? PERMANENT_OFFSET
                const vertical = entry.slot.startsWith('top') ? 'top' : 'bottom'
                const horizontal = entry.slot.endsWith('left') ? 'left' : 'right'
                return (
                    <Box
                        key={entry.slot}
                        sx={{
                            position: 'fixed',
                            zIndex: entry.zIndex ?? 1300,
                            [vertical]: offset,
                            [horizontal]: offset,
                        }}
                    >
                        {content}
                    </Box>
                )
            })
            .filter(Boolean)
    }, [breakpoint, permanentOverlays])

    React.useEffect(() => registerOverlayHost(), [])

    return (
        <PermanentOverlayContext.Provider value={contextValue}>
            {children}
            {groupedSnackbars.map(group => {
                const { anchor, items } = group
                const horizontalStyles =
                    anchor.horizontal === 'left'
                        ? { left: STACK_OFFSET, right: 'auto', transform: 'none' }
                        : anchor.horizontal === 'right'
                            ? { right: STACK_OFFSET, left: 'auto', transform: 'none' }
                            : { left: '50%', transform: 'translateX(-50%)' }

                const verticalStyles =
                    anchor.vertical === 'top'
                        ? { top: STACK_OFFSET, bottom: 'auto', flexDirection: 'column-reverse' as const }
                        : { bottom: STACK_OFFSET, top: 'auto', flexDirection: 'column-reverse' as const }

                return (
                    <Box
                        key={`${anchor.vertical}-${anchor.horizontal}`}
                        sx={{
                            position: 'fixed',
                            zIndex: 1400,
                            display: 'flex',
                            gap: `${STACK_GAP}px`,
                            pointerEvents: 'none',
                            ...horizontalStyles,
                            ...verticalStyles,
                        }}
                    >
                        {items.map(snack => snack.id ? (
                            <ManagedSnackbar
                                key={snack.id}
                                anchor={anchor}
                                onRemove={removeSnackbar}
                                snack={snack}
                            />
                        ) : null)}
                    </Box>
                )
            })}
            {permanentContent}
        </PermanentOverlayContext.Provider>
    )
}

export default OverlayHost
