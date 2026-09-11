import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {
    clearTableSelection,
    createEmptyTableSelection,
    getTableSelectionCount,
    getTableSelectionPageState,
    isTableRowSelected,
    selectAllMatchingTableRows,
    setTablePageSelected,
    setTableRowSelected,
    type TableSelectionModel,
    type TableSelectionPageState,
    type TableRowId,
    type TableSelectionUpdate,
} from './tableSelection'

export type TableSelectionScopeKey = string | number | boolean | null | undefined

export type TableSelectionChangeReason =
    | 'row'
    | 'page'
    | 'allMatching'
    | 'clear'
    | 'scope'

export type TableSelectionChangeDetails = {
    reason: TableSelectionChangeReason
}

const NO_PENDING_CONTROLLED_SCOPE = Symbol('no-pending-controlled-scope')
const useSelectionLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type UseTableSelectionBaseParams<TRow, TKey extends TableRowId> = {
    rows: readonly TRow[]
    getRowId: (row: TRow) => TKey
    /**
     * Eligibility for loaded rows. An all-matching adapter must use the same
     * eligibility when it resolves matchingCount and builds the backend scope.
     */
    isRowSelectable?: (row: TRow) => boolean
    maxSelected?: number
    disabled?: boolean
    /** Stable value identity for the matching result set; changing it clears selection. */
    scopeKey?: TableSelectionScopeKey
}

type UseControlledTableSelectionParams<TKey extends TableRowId> = {
    selection: TableSelectionModel<TKey>
    defaultSelection?: never
    onSelectionChange: (
        selection: TableSelectionModel<TKey>,
        details: TableSelectionChangeDetails,
    ) => void
}

type UseUncontrolledTableSelectionParams<TKey extends TableRowId> = {
    selection?: never
    defaultSelection?: TableSelectionModel<TKey>
    onSelectionChange?: (
        selection: TableSelectionModel<TKey>,
        details: TableSelectionChangeDetails,
    ) => void
}

export type UseTableSelectionParams<TRow, TKey extends TableRowId> = UseTableSelectionBaseParams<TRow, TKey> & (
    UseControlledTableSelectionParams<TKey>
    | UseUncontrolledTableSelectionParams<TKey>
)

export type UseTableSelectionResult<TRow, TKey extends TableRowId> = {
    selection: TableSelectionModel<TKey>
    selectedCount: number
    atLimit: boolean
    interactionDisabled: boolean
    pageState: TableSelectionPageState
    pageSelectableCount: number
    isRowSelected: (row: TRow) => boolean
    isRowSelectable: (row: TRow) => boolean
    setRowSelected: (row: TRow, selected: boolean) => TableSelectionUpdate<TKey>
    setPageSelected: (selected: boolean) => TableSelectionUpdate<TKey>
    selectAllMatching: (matchingCount: number) => TableSelectionUpdate<TKey>
    clear: () => TableSelectionUpdate<TKey>
}

const useTableSelection = <TRow, TKey extends TableRowId>(
    params: UseTableSelectionParams<TRow, TKey>,
): UseTableSelectionResult<TRow, TKey> => {
    const {
        rows,
        getRowId,
        isRowSelectable: isConfiguredRowSelectable,
        maxSelected,
        disabled = false,
        scopeKey,
        onSelectionChange,
    } = params

    assertMaxSelected(maxSelected)

    const isControlled = params.selection !== undefined
    const controlledModeRef = useRef(isControlled)
    if (controlledModeRef.current !== isControlled) {
        throw new Error('useTableSelection must not switch between controlled and uncontrolled modes')
    }
    const [uncontrolledSelection, setUncontrolledSelection] = useState<TableSelectionModel<TKey>>(
        () => params.defaultSelection ?? createEmptyTableSelection<TKey>(),
    )
    const emptySelectionRef = useRef<TableSelectionModel<TKey>>(createEmptyTableSelection<TKey>())
    const previousScopeKeyRef = useRef<TableSelectionScopeKey>(scopeKey)
    const [scopeEpoch, setScopeEpoch] = useState(0)
    const [pendingControlledScopeKey, setPendingControlledScopeKey] = useState<
        TableSelectionScopeKey | typeof NO_PENDING_CONTROLLED_SCOPE
    >(NO_PENDING_CONTROLLED_SCOPE)
    const configuredSelection = isControlled ? params.selection : uncontrolledSelection
    const scopeChanged = !Object.is(previousScopeKeyRef.current, scopeKey)
    const configuredSelectionIsCanonicalEmpty = isCanonicalEmptySelection(configuredSelection)
    const controlledResetPending = isControlled
        && !configuredSelectionIsCanonicalEmpty
        && (
            scopeChanged
            || Object.is(pendingControlledScopeKey, scopeKey)
        )

    const selection = scopeChanged || controlledResetPending
        ? emptySelectionRef.current
        : configuredSelection
    const committedScopeKeyRef = useRef<TableSelectionScopeKey>(scopeKey)
    const committedScopeEpochRef = useRef(scopeEpoch)
    const committedSelectionRef = useRef<TableSelectionModel<TKey>>(selection)
    const interactionDisabled = disabled || controlledResetPending || (!isControlled && scopeChanged)

    useSelectionLayoutEffect(() => {
        committedScopeKeyRef.current = scopeKey
        committedScopeEpochRef.current = scopeEpoch
        committedSelectionRef.current = selection
    }, [scopeEpoch, scopeKey, selection])

    useEffect(() => {
        if (Object.is(previousScopeKeyRef.current, scopeKey)) {
            return
        }

        previousScopeKeyRef.current = scopeKey
        setScopeEpoch(currentEpoch => currentEpoch + 1)
        const emptySelection = createEmptyTableSelection<TKey>()
        emptySelectionRef.current = emptySelection

        if (isControlled) {
            setPendingControlledScopeKey(
                configuredSelectionIsCanonicalEmpty
                    ? NO_PENDING_CONTROLLED_SCOPE
                    : scopeKey,
            )
        } else {
            setUncontrolledSelection(emptySelection)
        }
        onSelectionChange?.(emptySelection, {reason: 'scope'})
    }, [
        configuredSelectionIsCanonicalEmpty,
        isControlled,
        onSelectionChange,
        scopeKey,
    ])

    useEffect(() => {
        if (isControlled
            && configuredSelectionIsCanonicalEmpty
            && pendingControlledScopeKey !== NO_PENDING_CONTROLLED_SCOPE) {
            setPendingControlledScopeKey(NO_PENDING_CONTROLLED_SCOPE)
        }
    }, [configuredSelectionIsCanonicalEmpty, isControlled, pendingControlledScopeKey])

    const isSelectable = useCallback((row: TRow): boolean => (
        isConfiguredRowSelectable?.(row) ?? true
    ), [isConfiguredRowSelectable])

    const pageRowIds = useMemo(() => rows
        .filter(isSelectable)
        .map(getRowId), [getRowId, isSelectable, rows])

    const applyUpdate = useCallback((
        update: TableSelectionUpdate<TKey>,
        reason: TableSelectionChangeReason,
    ): TableSelectionUpdate<TKey> => {
        if (!update.changed) {
            return update
        }

        if (!isControlled) {
            committedSelectionRef.current = update.selection
            setUncontrolledSelection(update.selection)
        }
        onSelectionChange?.(update.selection, {reason})
        return update
    }, [isControlled, onSelectionChange])

    const createBlockedUpdate = useCallback((): TableSelectionUpdate<TKey> => ({
        selection: committedSelectionRef.current,
        changed: false,
        limitExceeded: false,
    }), [])

    const isCallbackScopeCurrent = useCallback((): boolean => (
        Object.is(committedScopeKeyRef.current, scopeKey)
        && committedScopeEpochRef.current === scopeEpoch
    ), [scopeEpoch, scopeKey])

    const setRowSelected = useCallback((
        row: TRow,
        selected: boolean,
    ): TableSelectionUpdate<TKey> => {
        if (interactionDisabled || !isCallbackScopeCurrent() || !isSelectable(row)) {
            return createBlockedUpdate()
        }

        const currentSelection = isControlled ? selection : committedSelectionRef.current
        return applyUpdate(
            setTableRowSelected(currentSelection, getRowId(row), selected, maxSelected),
            'row',
        )
    }, [
        applyUpdate,
        createBlockedUpdate,
        getRowId,
        interactionDisabled,
        isCallbackScopeCurrent,
        isControlled,
        isSelectable,
        maxSelected,
        selection,
    ])

    const setPageSelected = useCallback((selected: boolean): TableSelectionUpdate<TKey> => {
        if (interactionDisabled || !isCallbackScopeCurrent()) {
            return createBlockedUpdate()
        }

        const currentSelection = isControlled ? selection : committedSelectionRef.current
        return applyUpdate(
            setTablePageSelected(currentSelection, pageRowIds, selected, maxSelected),
            'page',
        )
    }, [
        applyUpdate,
        createBlockedUpdate,
        interactionDisabled,
        isCallbackScopeCurrent,
        isControlled,
        maxSelected,
        pageRowIds,
        selection,
    ])

    const selectAllMatching = useCallback((matchingCount: number): TableSelectionUpdate<TKey> => {
        if (interactionDisabled || !isCallbackScopeCurrent()) {
            return createBlockedUpdate()
        }

        const currentSelection = isControlled ? selection : committedSelectionRef.current
        return applyUpdate(
            selectAllMatchingTableRows(currentSelection, matchingCount, maxSelected),
            'allMatching',
        )
    }, [
        applyUpdate,
        createBlockedUpdate,
        interactionDisabled,
        isCallbackScopeCurrent,
        isControlled,
        maxSelected,
        selection,
    ])

    const clear = useCallback((): TableSelectionUpdate<TKey> => {
        if (interactionDisabled || !isCallbackScopeCurrent()) {
            return createBlockedUpdate()
        }

        const currentSelection = isControlled ? selection : committedSelectionRef.current
        return applyUpdate(clearTableSelection(currentSelection), 'clear')
    }, [
        applyUpdate,
        createBlockedUpdate,
        interactionDisabled,
        isCallbackScopeCurrent,
        isControlled,
        selection,
    ])

    const selectedCount = getTableSelectionCount(selection)

    return {
        selection,
        selectedCount,
        atLimit: maxSelected !== undefined && selectedCount >= maxSelected,
        interactionDisabled,
        pageState: getTableSelectionPageState(selection, pageRowIds),
        pageSelectableCount: new Set(pageRowIds).size,
        isRowSelected: (row: TRow) => isSelectable(row)
            && isTableRowSelected(selection, getRowId(row)),
        isRowSelectable: isSelectable,
        setRowSelected,
        setPageSelected,
        selectAllMatching,
        clear,
    }
}

const assertMaxSelected = (maxSelected?: number): void => {
    if (maxSelected !== undefined
        && (!Number.isSafeInteger(maxSelected) || maxSelected < 0)) {
        throw new RangeError('maxSelected must be a non-negative safe integer')
    }
}

const isCanonicalEmptySelection = <TKey extends TableRowId>(
    selection: TableSelectionModel<TKey>,
): boolean => selection.mode === 'explicit' && selection.selectedIds.size === 0

export default useTableSelection
