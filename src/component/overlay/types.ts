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
 * One constraint violation of a Paynet UI API validation response, the server's `ViolationModel`.
 * The server reports Bean Validation of the service method parameters; the method node is already
 * removed from the path, so it starts with the parameter name.
 */
export type PaynetViolation = {
    /** Last node of `propertyPath`, for example `levelName`. Absent for a class-level constraint. */
    property?: string | null
    /** Path of the rejected value, for example `request.subEndpoints[1].countriesString`. */
    propertyPath: string
    /** Text as the server rendered it, usually the English Hibernate Validator default. */
    message: string
    /**
     * Message template with the bundle key resolved and the parameters kept, for example
     * `size must be between {min} and {max}`. A key that no bundle on the server knows stays as `{key}`.
     */
    messageFormat?: string | null
    /** Constraint attributes without `message`, `groups` and `payload`, for example `{ min: 0, max: 3 }`. */
    messageParams?: Record<string, unknown> | null
}

/**
 * Host-side text for one violation, passed to `OverlayHost` or `PaynetErrorContent`. The host knows
 * its backend's message formats and translation keys; the library does not. Return `undefined`
 * (or an empty string) to keep the library default: a `{key}` template is translated with its
 * `messageParams` through the host i18n, anything else shows the server `message`.
 */
export type PaynetViolationMessageResolver = (violation: PaynetViolation) => string | undefined

/** Error envelope returned by Paynet v1 endpoints. */
export type PaynetErrorResponse = {
    errorId?: string | null
    messageId?: string | null
    details?: unknown
    errorType?: string | null
    errorI18N?: string | null
    /** Present when the request failed Bean Validation on the server (`errorType: VALIDATION_ERROR`). */
    violations?: PaynetViolation[] | null
}

/**
 * Transport-independent error data used by the shared error presentation.
 * `notificationId` is a per-report internal overlay identity and is deliberately
 * separate from the backend-provided `errorId`, even when that error id repeats.
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
    /** Well-formed entries of the envelope's `violations`, in response order; absent when there are none. */
    violations?: PaynetViolation[]
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
