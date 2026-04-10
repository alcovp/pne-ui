import React from 'react'
import UndoIcon from '@mui/icons-material/Undo'
import PneButton from '../PneButton'
import { create } from 'zustand'
import type { OverlayState, SnackbarOptions, SnackbarVariant, UndoSnackbarOptions } from './types'
import { reportMissingOverlayHost } from './overlayRuntime'

const defaultAutoHideMs = 5000

const makeId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `snackbar-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useOverlayStore = create<OverlayState>(set => ({
    snackbars: [],
    enqueueSnackbar: snackbar =>
        set(state => ({
            snackbars: [
                ...state.snackbars,
                {
                    id: snackbar.id ?? makeId(),
                    variant: snackbar.variant ?? 'info',
                    autoHideMs: snackbar.autoHideMs ?? (snackbar.variant === 'error' ? undefined : defaultAutoHideMs),
                    ...snackbar,
                },
            ],
        })),
    removeSnackbar: id => set(state => ({ snackbars: state.snackbars.filter(snack => snack.id !== id) })),
    clearSnackbars: () => set({ snackbars: [] }),
}))

const showWithVariant = (variant: SnackbarVariant) => (snackbar: Omit<SnackbarOptions, 'variant'>) => {
    reportMissingOverlayHost(`show${variant.charAt(0).toUpperCase()}${variant.slice(1)}`)
    useOverlayStore.getState().enqueueSnackbar({ ...snackbar, variant })
}

export const overlayActions = {
    showSnackbar: (snackbar: SnackbarOptions) => {
        reportMissingOverlayHost('showSnackbar')
        useOverlayStore.getState().enqueueSnackbar(snackbar)
    },
    showSuccess: showWithVariant('success'),
    showError: showWithVariant('error'),
    showWarning: showWithVariant('warning'),
    showInfo: showWithVariant('info'),
    /**
     * Shows an info snackbar with a built-in undo button and returns the snackbar id.
     * By default it behaves like other non-error snackbars and auto-hides after 5000 ms unless `autoHideMs` is overridden.
     */
    showUndoSnackbar: ({ undoLabel = 'Undo', onUndo, ...snackbar }: UndoSnackbarOptions) => {
        const id = snackbar.id ?? makeId()
        reportMissingOverlayHost('showUndoSnackbar')

        useOverlayStore.getState().enqueueSnackbar({
            ...snackbar,
            id,
            action: React.createElement(
                PneButton,
                {
                    variant: 'text',
                    size: 'small',
                    startIcon: React.createElement(UndoIcon, { fontSize: 'inherit' }),
                    onClick: () => {
                        useOverlayStore.getState().removeSnackbar(id)
                        onUndo()
                    },
                    sx: {
                        fontWeight: 600,
                    },
                },
                undoLabel,
            ),
        })

        return id
    },
    removeSnackbar: (id: string) => useOverlayStore.getState().removeSnackbar(id),
    clearSnackbars: () => useOverlayStore.getState().clearSnackbars(),
}
