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

/** Error envelope returned by Paynet v1 endpoints. */
export type PaynetErrorResponse = {
    errorId?: string | null
    messageId?: string | null
    details?: unknown
    errorType?: string | null
    errorI18N?: string | null
}

/**
 * Transport-independent error data used by the shared error presentation.
 * `notificationId` is an internal overlay identity and is deliberately separate
 * from the backend-provided `errorId`.
 */
export type NormalizedPaynetError = {
    notificationId: string
    errorId?: string
    messageId?: string
    message?: string
    details?: string
    errorType?: string
    errorI18N?: string
    httpStatus?: number
}

export type MessageErrorSnackbarOptions = Omit<SnackbarOptions, 'variant'> & {
    error?: never
}

/**
 * Shows a normalized Paynet error without requiring callers to unwrap a
 * transport-specific error first. The raw value may be a Paynet response,
 * Axios-like error/response, Blob, JSON string, Promise, or ordinary Error.
 */
export type StructuredErrorSnackbarOptions = Omit<SnackbarOptions, 'variant' | 'message'> & {
    error: unknown
    message?: never
}

export type ErrorSnackbarOptions = MessageErrorSnackbarOptions | StructuredErrorSnackbarOptions

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
