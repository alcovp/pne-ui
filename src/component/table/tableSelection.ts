export type TableRowId = string | number

export type TableSelectionModel<TKey extends TableRowId = TableRowId> =
    | {
        mode: 'explicit'
        selectedIds: ReadonlySet<TKey>
    }
    | {
        mode: 'allMatching'
        /** IDs from the same selectable, applied-result scope represented by matchingCount. */
        excludedIds: ReadonlySet<TKey>
        /** Exact number of selectable rows in the applied-result scope. */
        matchingCount: number
    }

export type TableSelectionPageState = 'none' | 'some' | 'all'

export type TableSelectionUpdate<TKey extends TableRowId = TableRowId> = {
    selection: TableSelectionModel<TKey>
    changed: boolean
    /** True only when the requested transition was rejected by maxSelected. */
    limitExceeded: boolean
}

export const createEmptyTableSelection = <TKey extends TableRowId, >(): TableSelectionModel<TKey> => ({
    mode: 'explicit',
    selectedIds: new Set<TKey>(),
})

export const getTableSelectionCount = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
): number => {
    if (selection.mode === 'explicit') {
        return selection.selectedIds.size
    }

    return Math.max(0, selection.matchingCount - selection.excludedIds.size)
}

export const isTableRowSelected = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
    rowId: TKey,
): boolean => {
    if (selection.mode === 'explicit') {
        return selection.selectedIds.has(rowId)
    }

    return !selection.excludedIds.has(rowId)
}

export const getTableSelectionPageState = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
    rowIds: Iterable<TKey>,
): TableSelectionPageState => {
    const uniqueRowIds = new Set(rowIds)

    if (uniqueRowIds.size === 0) {
        return 'none'
    }

    let selectedCount = 0
    uniqueRowIds.forEach(rowId => {
        if (isTableRowSelected(selection, rowId)) {
            selectedCount += 1
        }
    })

    if (selectedCount === 0) {
        return 'none'
    }

    return selectedCount === uniqueRowIds.size ? 'all' : 'some'
}

export const setTableRowSelected = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
    rowId: TKey,
    selected: boolean,
    maxSelected?: number,
): TableSelectionUpdate<TKey> => {
    assertMaxSelected(maxSelected)

    if (isTableRowSelected(selection, rowId) === selected) {
        return unchanged(selection)
    }

    if (selection.mode === 'explicit') {
        const selectedIds = new Set(selection.selectedIds)

        if (selected) {
            selectedIds.add(rowId)
        } else {
            selectedIds.delete(rowId)
        }

        return acceptedOrRejected(
            selection,
            {mode: 'explicit', selectedIds},
            selected ? maxSelected : undefined,
        )
    }

    const excludedIds = new Set(selection.excludedIds)

    if (selected) {
        excludedIds.delete(rowId)
    } else {
        excludedIds.add(rowId)
    }

    return acceptedOrRejected(
        selection,
        normalizeAllMatchingSelection(selection.matchingCount, excludedIds),
        selected ? maxSelected : undefined,
    )
}

export const setTablePageSelected = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
    rowIds: Iterable<TKey>,
    selected: boolean,
    maxSelected?: number,
): TableSelectionUpdate<TKey> => {
    assertMaxSelected(maxSelected)

    const uniqueRowIds = new Set(rowIds)
    if (uniqueRowIds.size === 0) {
        return unchanged(selection)
    }

    if (selection.mode === 'explicit') {
        const selectedIds = new Set(selection.selectedIds)
        uniqueRowIds.forEach(rowId => {
            if (selected) {
                selectedIds.add(rowId)
            } else {
                selectedIds.delete(rowId)
            }
        })

        return acceptedOrRejected(
            selection,
            {mode: 'explicit', selectedIds},
            selected ? maxSelected : undefined,
        )
    }

    const excludedIds = new Set(selection.excludedIds)
    uniqueRowIds.forEach(rowId => {
        if (selected) {
            excludedIds.delete(rowId)
        } else {
            excludedIds.add(rowId)
        }
    })

    return acceptedOrRejected(
        selection,
        normalizeAllMatchingSelection(selection.matchingCount, excludedIds),
        selected ? maxSelected : undefined,
    )
}

export const selectAllMatchingTableRows = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
    matchingCount: number,
    maxSelected?: number,
): TableSelectionUpdate<TKey> => {
    assertMatchingCount(matchingCount)
    assertMaxSelected(maxSelected)

    const nextSelection = normalizeAllMatchingSelection<TKey>(matchingCount, new Set())
    return acceptedOrRejected(selection, nextSelection, maxSelected)
}

export const clearTableSelection = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
): TableSelectionUpdate<TKey> => {
    if (getTableSelectionCount(selection) === 0 && selection.mode === 'explicit') {
        return unchanged(selection)
    }

    return {
        selection: createEmptyTableSelection<TKey>(),
        changed: true,
        limitExceeded: false,
    }
}

const normalizeAllMatchingSelection = <TKey extends TableRowId, >(
    matchingCount: number,
    excludedIds: ReadonlySet<TKey>,
): TableSelectionModel<TKey> => {
    if (matchingCount === 0) {
        return createEmptyTableSelection<TKey>()
    }

    return {
        mode: 'allMatching',
        excludedIds,
        matchingCount,
    }
}

const acceptedOrRejected = <TKey extends TableRowId, >(
    previousSelection: TableSelectionModel<TKey>,
    nextSelection: TableSelectionModel<TKey>,
    maxSelected?: number,
): TableSelectionUpdate<TKey> => {
    if (maxSelected !== undefined && getTableSelectionCount(nextSelection) > maxSelected) {
        return {
            selection: previousSelection,
            changed: false,
            limitExceeded: true,
        }
    }

    if (areTableSelectionsEqual(previousSelection, nextSelection)) {
        return unchanged(previousSelection)
    }

    return {
        selection: nextSelection,
        changed: true,
        limitExceeded: false,
    }
}

const unchanged = <TKey extends TableRowId, >(
    selection: TableSelectionModel<TKey>,
): TableSelectionUpdate<TKey> => {
    return {
        selection,
        changed: false,
        limitExceeded: false,
    }
}

const areTableSelectionsEqual = <TKey extends TableRowId, >(
    left: TableSelectionModel<TKey>,
    right: TableSelectionModel<TKey>,
): boolean => {
    if (left.mode !== right.mode) {
        return false
    }

    if (left.mode === 'explicit' && right.mode === 'explicit') {
        return areSetsEqual(left.selectedIds, right.selectedIds)
    }

    if (left.mode === 'allMatching' && right.mode === 'allMatching') {
        return left.matchingCount === right.matchingCount
            && areSetsEqual(left.excludedIds, right.excludedIds)
    }

    return false
}

const areSetsEqual = <TKey extends TableRowId, >(
    left: ReadonlySet<TKey>,
    right: ReadonlySet<TKey>,
): boolean => left.size === right.size
    && Array.from(left).every(value => right.has(value))

const assertMatchingCount = (matchingCount: number): void => {
    if (!Number.isSafeInteger(matchingCount) || matchingCount < 0) {
        throw new RangeError('matchingCount must be a non-negative safe integer')
    }
}

const assertMaxSelected = (maxSelected?: number): void => {
    if (maxSelected !== undefined
        && (!Number.isSafeInteger(maxSelected) || maxSelected < 0)) {
        throw new RangeError('maxSelected must be a non-negative safe integer')
    }
}
