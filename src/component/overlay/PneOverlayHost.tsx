import React, { useMemo } from 'react'
import { Alert, Snackbar, type SnackbarOrigin } from '@mui/material'
import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import { useBreakpoint } from '../responsive/useBreakpoint'
import { useOverlayStore } from './overlayStore'
import type { PermanentOverlayRender, PermanentPosition } from './types'
import { Box } from '@mui/material'

type PneOverlayHostProps = {
    anchorOrigin?: SnackbarOrigin
    maxSnack?: number
    breakpoints?: readonly number[]
    renderPermanent?: PermanentOverlayRender
    permanent?: React.ReactNode
    permanentPosition?: PermanentPosition
}

const STACK_GAP = 12
const STACK_OFFSET = 24

/**
 * Renders overlay elements (currently snackbars) driven by the shared overlay store.
 * Mount this once near the root of the app and trigger notifications via `overlayActions`.
 */
export function PneOverlayHost({
    anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
    maxSnack = 10,
    breakpoints = DEFAULT_BREAKPOINTS,
    renderPermanent,
    permanent,
    permanentPosition,
}: PneOverlayHostProps) {
    const snackbars = useOverlayStore(state => state.snackbars)
    const removeSnackbar = useOverlayStore(state => state.removeSnackbar)
    const breakpoint = useBreakpoint({ breakpoints })

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

    const permanentContent = renderPermanent?.({ breakpoint }) ?? permanent ?? null

    return (
        <>
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
                        {items.map(snack => (
                            <Snackbar
                                key={snack.id}
                                open
                                anchorOrigin={anchor}
                                autoHideDuration={snack.autoHideMs}
                                onClose={(_event, reason) => {
                                    if (reason === 'clickaway') return
                                    snack.id && removeSnackbar(snack.id)
                                }}
                                sx={{ position: 'static', transform: 'none', pointerEvents: 'auto', minWidth: 288 }}
                            >
                                <Alert
                                    elevation={1}
                                    onClose={() => snack.id && removeSnackbar(snack.id)}
                                    severity={snack.variant ?? 'info'}
                                    action={snack.action}
                                    sx={{ alignItems: 'center' }}
                                >
                                    {snack.message}
                                </Alert>
                            </Snackbar>
                        ))}
                    </Box>
                )
            })}
            {permanentContent
                ? permanentPosition
                    ? (
                        <Box
                            sx={{
                                position: 'fixed',
                                zIndex: permanentPosition.zIndex ?? 1300,
                                [permanentPosition.vertical ?? 'bottom']: permanentPosition.offset ?? 24,
                                [permanentPosition.horizontal ?? 'right']: permanentPosition.offset ?? 24,
                            }}
                        >
                            {permanentContent}
                        </Box>
                    )
                    : permanentContent
                : null}
        </>
    )
}

export default PneOverlayHost
