import type { SnackbarOrigin } from '@mui/material'
import type React from 'react'

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error'

export type SnackbarOptions = {
    id?: string
    message: React.ReactNode
    variant?: SnackbarVariant
    autoHideMs?: number
    action?: React.ReactNode
    anchorOrigin?: SnackbarOrigin
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
