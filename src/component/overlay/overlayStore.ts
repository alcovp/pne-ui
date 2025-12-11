import { create } from 'zustand'
import type { OverlayState, SnackbarOptions, SnackbarVariant } from './types'

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

const showWithVariant = (variant: SnackbarVariant) => (snackbar: Omit<SnackbarOptions, 'variant'>) =>
    useOverlayStore.getState().enqueueSnackbar({ ...snackbar, variant })

export const overlayActions = {
    showSnackbar: (snackbar: SnackbarOptions) => useOverlayStore.getState().enqueueSnackbar(snackbar),
    showSuccess: showWithVariant('success'),
    showError: showWithVariant('error'),
    showWarning: showWithVariant('warning'),
    showInfo: showWithVariant('info'),
    removeSnackbar: (id: string) => useOverlayStore.getState().removeSnackbar(id),
    clearSnackbars: () => useOverlayStore.getState().clearSnackbars(),
}
