/** Stable, non-secret column identifier owned by the consumer; never an index or a translated label. */
export type PneTableColumnId = string

/**
 * One entry of a table column catalog. The catalog lists every column a
 * consumer can render for a given table view, in the default display order.
 */
export type PneTableColumnOption = {
    id: PneTableColumnId
    /** Plain-text label used by the settings dialog for display and search; keep it equal to the header text. */
    label: string
    /** Whether the column is shown before the user configures anything. Defaults to `true`. */
    defaultVisible?: boolean
}

/**
 * Persisted user preference for one table view. The consumer stores it as-is
 * and passes it back; the library never inspects where it lives.
 */
export type PneTableColumnSettingsValue = {
    /** Column IDs the user keeps visible, in display order. */
    visibleColumnIds: readonly PneTableColumnId[]
    /**
     * Column IDs the user explicitly hid. Catalog columns absent from both lists
     * are new since the value was saved and are shown by default.
     */
    hiddenColumnIds: readonly PneTableColumnId[]
}

/** Catalog-aware result of applying a stored value to the current column catalog. */
export type PneTableResolvedColumnSettings<TColumn extends PneTableColumnOption> = {
    /** Catalog columns to render, in display order. Never empty for a non-empty catalog. */
    visibleColumns: readonly TColumn[]
    /** Catalog columns currently hidden, in catalog order. */
    hiddenColumns: readonly TColumn[]
    /** Normalized value that references only existing catalog columns. */
    value: PneTableColumnSettingsValue
    /** True when `value` equals the catalog defaults. */
    isDefault: boolean
}
