import type {
    PneTableColumnId,
    PneTableColumnOption,
    PneTableColumnSettingsValue,
    PneTableResolvedColumnSettings,
} from './types'

const uniqueIds = (ids: readonly PneTableColumnId[]): PneTableColumnId[] => {
    const seen = new Set<PneTableColumnId>()
    const result: PneTableColumnId[] = []
    for (const id of ids) {
        if (!seen.has(id)) {
            seen.add(id)
            result.push(id)
        }
    }
    return result
}

const sameIds = (
    left: readonly PneTableColumnId[],
    right: readonly PneTableColumnId[],
): boolean => left.length === right.length && left.every((id, index) => id === right[index])

/**
 * Allowed shape of a column ID: a letter or digit followed by letters, digits,
 * dots, underscores or hyphens. IDs travel into storage keys, DOM ids,
 * Selenium locators and drag identifiers, so anything looser (spaces, colons,
 * slashes, translated text) breaks at least one of them.
 */
export const PNE_TABLE_COLUMN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export const isValidPneTableColumnId = (id: unknown): id is PneTableColumnId =>
    typeof id === 'string' && PNE_TABLE_COLUMN_ID_PATTERN.test(id)

/**
 * Throws on a catalog that cannot be configured: empty, with duplicate IDs, or
 * with an ID outside `PNE_TABLE_COLUMN_ID_PATTERN`. Column identity belongs to
 * the consumer, so silently repairing the catalog would hide a bug; the hook
 * resolves the catalog on every render, so a bad ID fails the first render and
 * every page test instead of the first save.
 */
export const assertPneTableColumnCatalog = (columns: readonly PneTableColumnOption[]): void => {
    if (columns.length === 0) {
        throw new Error('PneTable column settings: the column catalog must not be empty')
    }
    const seen = new Set<PneTableColumnId>()
    for (const column of columns) {
        if (!isValidPneTableColumnId(column.id)) {
            throw new Error(
                `PneTable column settings: column ID ${JSON.stringify(column.id)} must match ${PNE_TABLE_COLUMN_ID_PATTERN}`,
            )
        }
        if (seen.has(column.id)) {
            throw new Error(`PneTable column settings: duplicate column ID "${column.id}"`)
        }
        seen.add(column.id)
    }
}

/** Default value for a catalog: `defaultVisible !== false` columns in catalog order, the rest hidden. */
export const createDefaultPneTableColumnSettings = (
    columns: readonly PneTableColumnOption[],
): PneTableColumnSettingsValue => ({
    visibleColumnIds: columns.filter(column => column.defaultVisible !== false).map(column => column.id),
    hiddenColumnIds: columns.filter(column => column.defaultVisible === false).map(column => column.id),
})

/**
 * Applies a stored value to the current catalog:
 *
 * - IDs unknown to the catalog are dropped;
 * - visible columns keep their stored order;
 * - catalog columns absent from both stored lists are new since the save and
 *   are appended as visible, in catalog order;
 * - a value that leaves nothing visible falls back to the catalog defaults.
 *
 * `undefined` means "never configured" and yields the defaults.
 */
export const resolvePneTableColumnSettings = <TColumn extends PneTableColumnOption>(
    columns: readonly TColumn[],
    value: PneTableColumnSettingsValue | null | undefined,
): PneTableResolvedColumnSettings<TColumn> => {
    assertPneTableColumnCatalog(columns)

    const byId = new Map<PneTableColumnId, TColumn>(columns.map(column => [column.id, column]))
    const defaults = createDefaultPneTableColumnSettings(columns)

    const resolveIds = (source: PneTableColumnSettingsValue): PneTableColumnSettingsValue => {
        const visible = uniqueIds(source.visibleColumnIds).filter(id => byId.has(id))
        const visibleSet = new Set(visible)
        const hidden = uniqueIds(source.hiddenColumnIds)
            .filter(id => byId.has(id) && !visibleSet.has(id))
        const known = new Set([...visible, ...hidden])
        const added = columns.filter(column => !known.has(column.id)).map(column => column.id)
        return {
            visibleColumnIds: [...visible, ...added],
            hiddenColumnIds: hidden,
        }
    }

    let resolved = value ? resolveIds(value) : defaults
    if (resolved.visibleColumnIds.length === 0) {
        resolved = defaults
    }

    const hiddenSet = new Set(resolved.hiddenColumnIds)

    return {
        visibleColumns: resolved.visibleColumnIds.map(id => byId.get(id) as TColumn),
        hiddenColumns: columns.filter(column => hiddenSet.has(column.id)),
        value: resolved,
        isDefault: sameIds(resolved.visibleColumnIds, defaults.visibleColumnIds)
            && sameIds([...resolved.hiddenColumnIds].sort(), [...defaults.hiddenColumnIds].sort()),
    }
}

/** Structural equality of two normalized values; hidden order is irrelevant. */
export const isSamePneTableColumnSettings = (
    left: PneTableColumnSettingsValue,
    right: PneTableColumnSettingsValue,
): boolean => sameIds(left.visibleColumnIds, right.visibleColumnIds)
    && sameIds([...left.hiddenColumnIds].sort(), [...right.hiddenColumnIds].sort())
