import {useCallback, useMemo, useState} from 'react'
import type {PneTableColumnId, PneTableColumnOption, PneTableColumnSettingsValue} from './types'
import {resolvePneTableColumnSettings} from './resolveColumnSettings'
import type {PneTableColumnSettingsDialogProps} from './PneTableColumnSettingsDialog'

export type UsePneTableColumnSettingsParams<TColumn extends PneTableColumnOption> = {
    /** Column catalog of the configured table view, in default display order. */
    columns: readonly TColumn[]
    /** Stored preference owned by the consumer; `undefined` or `null` means the catalog defaults. */
    value?: PneTableColumnSettingsValue | null
    /** Persists the normalized value. Reject to keep the dialog open; report the failure yourself. */
    onSave: (value: PneTableColumnSettingsValue) => void | Promise<void>
}

export type UsePneTableColumnSettingsResult<TColumn extends PneTableColumnOption> = {
    /** Catalog columns to render, in display order. */
    visibleColumns: readonly TColumn[]
    /** Catalog columns currently hidden, in catalog order. */
    hiddenColumns: readonly TColumn[]
    /** Normalized current value after catalog reconciliation. */
    value: PneTableColumnSettingsValue
    /** True when the current value equals the catalog defaults. */
    isDefault: boolean
    isVisible: (columnId: PneTableColumnId) => boolean
    /** Dialog visibility. */
    open: boolean
    openDialog: () => void
    closeDialog: () => void
    /** Spread into `PneTableColumnSettingsDialog`. */
    dialogProps: Pick<
        PneTableColumnSettingsDialogProps<TColumn>,
        'columns' | 'onClose' | 'onSave' | 'open' | 'value'
    >
}

/**
 * Reconciles a stored column preference with the catalog and owns the dialog
 * open state. Storage stays with the consumer: pass the loaded `value` and an
 * `onSave` that writes it back.
 */
const usePneTableColumnSettings = <TColumn extends PneTableColumnOption>(
    params: UsePneTableColumnSettingsParams<TColumn>,
): UsePneTableColumnSettingsResult<TColumn> => {
    const {columns, onSave, value} = params
    const [open, setOpen] = useState(false)
    const resolved = useMemo(() => resolvePneTableColumnSettings(columns, value), [columns, value])
    const visibleIds = useMemo(
        () => new Set(resolved.value.visibleColumnIds),
        [resolved.value.visibleColumnIds],
    )
    const openDialog = useCallback(() => setOpen(true), [])
    const closeDialog = useCallback(() => setOpen(false), [])
    const isVisible = useCallback((columnId: PneTableColumnId) => visibleIds.has(columnId), [visibleIds])

    return {
        visibleColumns: resolved.visibleColumns,
        hiddenColumns: resolved.hiddenColumns,
        value: resolved.value,
        isDefault: resolved.isDefault,
        isVisible,
        open,
        openDialog,
        closeDialog,
        dialogProps: {
            columns,
            onClose: closeDialog,
            onSave,
            open,
            value,
        },
    }
}

export default usePneTableColumnSettings
