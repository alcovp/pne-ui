import {act, renderHook} from '@testing-library/react'
import {
    createEmptyTableSelection,
    type TableSelectionModel,
    useTableSelection,
} from '../src'

type Row = {
    id: number
    enabled?: boolean
}

const rows: Row[] = [
    {id: 1, enabled: true},
    {id: 2, enabled: false},
    {id: 3, enabled: true},
]

describe('useTableSelection', () => {
    it('manages uncontrolled row and current-page selection', () => {
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
        }))

        act(() => {
            result.current.setRowSelected(rows[0], true)
        })

        expect(result.current.selectedCount).toBe(1)
        expect(result.current.pageState).toBe('some')
        expect(result.current.isRowSelected(rows[0])).toBe(true)

        act(() => {
            result.current.setPageSelected(true)
        })

        expect(result.current.selectedCount).toBe(3)
        expect(result.current.pageState).toBe('all')

        act(() => {
            result.current.clear()
        })

        expect(result.current.selection).toEqual(createEmptyTableSelection<number>())
    })

    it('excludes ineligible rows from row, page, and all-matching UI selection', () => {
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            isRowSelectable: row => row.enabled === true,
        }))

        expect(result.current.pageSelectableCount).toBe(2)

        act(() => {
            result.current.setPageSelected(true)
        })

        expect(result.current.selectedCount).toBe(2)
        expect(result.current.pageState).toBe('all')
        expect(result.current.isRowSelected(rows[1])).toBe(false)

        const disabledRowUpdate = result.current.setRowSelected(rows[1], true)
        expect(disabledRowUpdate.changed).toBe(false)

        act(() => {
            result.current.selectAllMatching(2)
        })
        expect(result.current.isRowSelected(rows[0])).toBe(true)
        expect(result.current.isRowSelected(rows[1])).toBe(false)
    })

    it('supports controlled state without changing it before the consumer rerenders', () => {
        const onSelectionChange = jest.fn()
        let selection = createEmptyTableSelection<number>()
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            selection,
            onSelectionChange,
        }))

        const update = result.current.setRowSelected(rows[0], true)

        expect(update.selection).toEqual({
            mode: 'explicit',
            selectedIds: new Set([1]),
        })
        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).toHaveBeenCalledWith(update.selection, {reason: 'row'})

        selection = update.selection
        rerender()

        expect(result.current.selectedCount).toBe(1)
    })

    it('reports an atomic limit rejection without notifying the consumer', () => {
        const onSelectionChange = jest.fn()
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            maxSelected: 2,
            onSelectionChange,
        }))

        const update = result.current.setPageSelected(true)

        expect(update).toEqual({
            selection: result.current.selection,
            changed: false,
            limitExceeded: true,
        })
        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('keeps all-matching mode when current-page rows are deselected', () => {
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            maxSelected: 10,
        }))

        act(() => {
            result.current.selectAllMatching(5)
        })
        act(() => {
            result.current.setRowSelected(rows[0], false)
        })

        expect(result.current.selection).toEqual({
            mode: 'allMatching',
            matchingCount: 5,
            excludedIds: new Set([1]),
        })
        expect(result.current.selectedCount).toBe(4)
    })

    it('clears immediately when its stable result scope changes', () => {
        const onSelectionChange = jest.fn()
        let scopeKey = 'status=enabled'
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            defaultSelection: {
                mode: 'explicit',
                selectedIds: new Set([1]),
            },
            scopeKey,
            onSelectionChange,
        }))

        expect(result.current.selectedCount).toBe(1)

        scopeKey = 'status=disabled'
        rerender()

        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).toHaveBeenLastCalledWith(
            createEmptyTableSelection<number>(),
            {reason: 'scope'},
        )

        rerender()
        expect(onSelectionChange).toHaveBeenCalledTimes(1)
    })

    it('does not reset on page-row changes inside the same scope', () => {
        let currentRows = rows.slice(0, 2)
        const {result, rerender} = renderHook(() => useTableSelection({
            rows: currentRows,
            getRowId: row => row.id,
            scopeKey: 'same-applied-filter',
        }))

        act(() => {
            result.current.setRowSelected(currentRows[0], true)
        })
        currentRows = rows.slice(1)
        rerender()

        expect(result.current.selectedCount).toBe(1)
        expect(result.current.isRowSelected(rows[0])).toBe(true)
        expect(result.current.pageState).toBe('none')
    })

    it('rejects callbacks captured by an obsolete result scope', () => {
        const onSelectionChange = jest.fn()
        let scopeKey = 'scope-a'
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            scopeKey,
            onSelectionChange,
        }))
        const selectAllFromScopeA = result.current.selectAllMatching

        scopeKey = 'scope-b'
        rerender()
        onSelectionChange.mockClear()

        const staleUpdate = selectAllFromScopeA(3)

        expect(staleUpdate).toEqual({
            selection: result.current.selection,
            changed: false,
            limitExceeded: false,
        })
        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('rejects a callback from an earlier occurrence of the same scope key', () => {
        const onSelectionChange = jest.fn()
        let scopeKey = 'scope-a'
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            scopeKey,
            onSelectionChange,
        }))
        const selectAllFromFirstScopeA = result.current.selectAllMatching

        scopeKey = 'scope-b'
        rerender()
        scopeKey = 'scope-a'
        rerender()
        onSelectionChange.mockClear()

        const staleUpdate = selectAllFromFirstScopeA(3)

        expect(staleUpdate).toEqual({
            selection: result.current.selection,
            changed: false,
            limitExceeded: false,
        })
        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('holds a controlled scope reset until the consumer acknowledges it', () => {
        const onSelectionChange = jest.fn()
        let scopeKey = 'scope-a'
        const staleSelection: TableSelectionModel<number> = {
            mode: 'explicit',
            selectedIds: new Set([1]),
        }
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            scopeKey,
            selection: staleSelection,
            onSelectionChange,
        }))

        scopeKey = 'scope-b'
        rerender()
        rerender()

        expect(result.current.selectedCount).toBe(0)
        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(onSelectionChange).toHaveBeenCalledWith(
            createEmptyTableSelection<number>(),
            {reason: 'scope'},
        )
        expect(result.current.interactionDisabled).toBe(true)
        expect(result.current.setRowSelected(rows[0], true).changed).toBe(false)
    })

    it('does not treat a zero-count all-matching model as canonical reset acknowledgement', () => {
        const onSelectionChange = jest.fn()
        let scopeKey = 'scope-a'
        const staleSelection: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 1,
            excludedIds: new Set([1]),
        }
        const {result, rerender} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            scopeKey,
            selection: staleSelection,
            onSelectionChange,
        }))

        scopeKey = 'scope-b'
        rerender()
        rerender()

        expect(result.current.selection).toEqual(createEmptyTableSelection<number>())
        expect(result.current.interactionDisabled).toBe(true)
    })

    it('composes sequential uncontrolled transitions from the latest selection', () => {
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
        }))

        act(() => {
            result.current.setRowSelected(rows[0], true)
            result.current.setRowSelected(rows[1], true)
        })

        expect(result.current.selection).toEqual({
            mode: 'explicit',
            selectedIds: new Set([1, 2]),
        })
    })

    it('blocks transitions while disabled and validates maxSelected eagerly', () => {
        const {result} = renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            disabled: true,
        }))

        expect(result.current.setRowSelected(rows[0], true).changed).toBe(false)
        expect(result.current.selectAllMatching(3).changed).toBe(false)
        expect(result.current.interactionDisabled).toBe(true)
        expect(() => renderHook(() => useTableSelection({
            rows,
            getRowId: row => row.id,
            maxSelected: -1,
        }))).toThrow(RangeError)
    })
})
