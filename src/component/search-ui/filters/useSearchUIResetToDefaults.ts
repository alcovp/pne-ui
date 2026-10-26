import {useEffect, useRef} from 'react'
import {useTranslation} from 'react-i18next'
import isEqual from 'lodash/isEqual'
import {overlayActions} from '../../..'
import {useSearchUIFiltersStore, useSearchUIFiltersStoreApi} from './state/store'
import {createClearCriteriaUndoSnapshot} from './state/undo'

const UNDO_AUTO_HIDE_MS = 5000

type PendingResetUndo = {
    snackbarId: string
    timeoutId: ReturnType<typeof setTimeout> | null
    baseline: ReturnType<typeof createClearCriteriaUndoSnapshot>
}

/**
 * Brings the filters back to the page defaults without a template, so the next visit starts clean
 * too, and offers Undo for a few seconds. The Undo goes away once the filters move on from the
 * reset state. Filters already at their defaults change nothing and get no Undo.
 */
export const useSearchUIResetToDefaults = (): (() => void) => {
    const {t} = useTranslation()
    const filtersStore = useSearchUIFiltersStoreApi()
    const clearCriteria = useSearchUIFiltersStore(s => s.clearCriteria)
    const restoreClearCriteriaSnapshot = useSearchUIFiltersStore(s => s.restoreClearCriteriaSnapshot)
    const pendingUndoRef = useRef<PendingResetUndo | null>(null)

    const clearPendingUndo = (dismissSnackbar = true) => {
        const pending = pendingUndoRef.current
        if (!pending) return

        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId)
        }

        if (dismissSnackbar) {
            overlayActions.removeSnackbar(pending.snackbarId)
        }

        pendingUndoRef.current = null
    }

    useEffect(() => {
        const unsubscribe = filtersStore.subscribe(state => {
            const pending = pendingUndoRef.current
            if (!pending) return

            if (isEqual(createClearCriteriaUndoSnapshot(state), pending.baseline)) {
                return
            }

            clearPendingUndo()
        })

        return () => {
            clearPendingUndo()
            unsubscribe()
        }
    }, [filtersStore])

    return () => {
        const snapshotBeforeReset = createClearCriteriaUndoSnapshot(filtersStore.getState())

        clearPendingUndo()
        clearCriteria()

        const baseline = createClearCriteriaUndoSnapshot(filtersStore.getState())
        if (isEqual(baseline, snapshotBeforeReset)) {
            return
        }

        const snackbarId = overlayActions.showUndoSnackbar({
            message: t('react.searchUI.clearAll.cleared', {defaultValue: 'All filters cleared'}),
            undoLabel: t('react.searchUI.undo', {defaultValue: 'Undo'}),
            autoHideMs: UNDO_AUTO_HIDE_MS,
            onUndo: () => {
                clearPendingUndo(false)
                restoreClearCriteriaSnapshot(snapshotBeforeReset)
            },
        })

        pendingUndoRef.current = {
            snackbarId,
            baseline,
            timeoutId: setTimeout(() => {
                clearPendingUndo(false)
            }, UNDO_AUTO_HIDE_MS),
        }
    }
}
