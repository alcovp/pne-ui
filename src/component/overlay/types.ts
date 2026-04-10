import type { SnackbarOrigin } from '@mui/material'
import type React from 'react'

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error'

export type SnackbarOptions = {
    id?: string
    message: React.ReactNode
    variant?: SnackbarVariant
    /**
     * Auto-close timeout in milliseconds. `undefined` keeps the snackbar open until closed explicitly.
     * Timed snackbars render a progress bar in `OverlayHost`.
     */
    autoHideMs?: number
    action?: React.ReactNode
    anchorOrigin?: SnackbarOrigin
}

/**
 * Options for a snackbar with a built-in undo action.
 * `OverlayHost` renders the same timed-progress indicator as for any other timed snackbar.
 */
export type UndoSnackbarOptions = Omit<SnackbarOptions, 'action'> & {
    undoLabel?: React.ReactNode
    onUndo: () => void
}

export type OverlayState = {
    snackbars: SnackbarOptions[]
    enqueueSnackbar: (snackbar: SnackbarOptions) => void
    removeSnackbar: (id: string) => void
    clearSnackbars: () => void
}

export type PermanentOverlayRender = (context: { breakpoint: number }) => React.ReactNode

export type PermanentOverlaySlot = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type PermanentOverlayInstance = {
    id: string
    slot: PermanentOverlaySlot
    render: PermanentOverlayRender
    offset?: number
    zIndex?: number
}
