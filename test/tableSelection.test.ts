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
} from '../src'

describe('table selection model', () => {
    it('selects and deselects explicit row IDs without duplicating them', () => {
        const empty = createEmptyTableSelection<number>()
        const selected = setTableRowSelected(empty, 7, true)
        const repeated = setTableRowSelected(selected.selection, 7, true)
        const cleared = setTableRowSelected(repeated.selection, 7, false)

        expect(selected).toMatchObject({changed: true, limitExceeded: false})
        expect(getTableSelectionCount(selected.selection)).toBe(1)
        expect(isTableRowSelected(selected.selection, 7)).toBe(true)
        expect(repeated).toEqual({
            selection: selected.selection,
            changed: false,
            limitExceeded: false,
        })
        expect(cleared.selection).toEqual(createEmptyTableSelection<number>())
    })

    it('preserves all-matching mode when a row is excluded and included again', () => {
        const allMatching = selectAllMatchingTableRows(
            createEmptyTableSelection<number>(),
            5,
        ).selection
        const excluded = setTableRowSelected(allMatching, 3, false).selection

        expect(excluded).toEqual({
            mode: 'allMatching',
            matchingCount: 5,
            excludedIds: new Set([3]),
        })
        expect(getTableSelectionCount(excluded)).toBe(4)
        expect(isTableRowSelected(excluded, 3)).toBe(false)
        expect(isTableRowSelected(excluded, 4)).toBe(true)

        const included = setTableRowSelected(excluded, 3, true).selection
        expect(included).toEqual({
            mode: 'allMatching',
            matchingCount: 5,
            excludedIds: new Set(),
        })
    })

    it('derives page state from unique current-page IDs', () => {
        const empty = createEmptyTableSelection<number>()
        const partiallySelected = setTablePageSelected(empty, [1, 1, 2], true).selection

        expect(getTableSelectionPageState(empty, [])).toBe('none')
        expect(getTableSelectionPageState(partiallySelected, [1, 2])).toBe('all')
        expect(getTableSelectionPageState(partiallySelected, [2, 3])).toBe('some')
        expect(getTableSelectionPageState(partiallySelected, [3, 4])).toBe('none')
    })

    it('selects and deselects a page by editing all-matching exclusions', () => {
        const selection: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 6,
            excludedIds: new Set([2, 5]),
        }
        const pageSelected = setTablePageSelected(selection, [1, 2, 3], true).selection
        const pageDeselected = setTablePageSelected(pageSelected, [1, 2, 3], false).selection

        expect(pageSelected).toEqual({
            mode: 'allMatching',
            matchingCount: 6,
            excludedIds: new Set([5]),
        })
        expect(pageDeselected).toEqual({
            mode: 'allMatching',
            matchingCount: 6,
            excludedIds: new Set([1, 2, 3, 5]),
        })
        expect(getTableSelectionPageState(pageDeselected, [1, 2, 3])).toBe('none')
    })

    it('rejects row and page additions atomically when they exceed the limit', () => {
        const atLimit = setTablePageSelected(
            createEmptyTableSelection<number>(),
            [1, 2],
            true,
            2,
        ).selection
        const rejectedRow = setTableRowSelected(atLimit, 3, true, 2)
        const rejectedPage = setTablePageSelected(atLimit, [3, 4], true, 3)

        expect(getTableSelectionCount(atLimit)).toBe(2)
        expect(rejectedRow).toEqual({
            selection: atLimit,
            changed: false,
            limitExceeded: true,
        })
        expect(rejectedPage).toEqual({
            selection: atLimit,
            changed: false,
            limitExceeded: true,
        })
        expect(isTableRowSelected(rejectedPage.selection, 3)).toBe(false)
    })

    it('allows deselection while an externally controlled model is already above the limit', () => {
        const externallyControlled: TableSelectionModel<number> = {
            mode: 'explicit',
            selectedIds: new Set([1, 2, 3, 4]),
        }

        const result = setTableRowSelected(externallyControlled, 4, false, 2)

        expect(result).toMatchObject({changed: true, limitExceeded: false})
        expect(getTableSelectionCount(result.selection)).toBe(3)

        const pageResult = setTablePageSelected(result.selection, [2, 3], false, 0)
        expect(pageResult).toMatchObject({changed: true, limitExceeded: false})
        expect(getTableSelectionCount(pageResult.selection)).toBe(1)
    })

    it('accepts or rejects all-matching selection as one transition', () => {
        const previous = setTableRowSelected(
            createEmptyTableSelection<number>(),
            99,
            true,
        ).selection
        const accepted = selectAllMatchingTableRows(previous, 20_000, 20_000)
        const rejected = selectAllMatchingTableRows(previous, 20_001, 20_000)

        expect(accepted).toEqual({
            selection: {
                mode: 'allMatching',
                matchingCount: 20_000,
                excludedIds: new Set(),
            },
            changed: true,
            limitExceeded: false,
        })
        expect(rejected).toEqual({
            selection: previous,
            changed: false,
            limitExceeded: true,
        })
    })

    it('applies the limit when all-matching exclusions are included again', () => {
        const atLimit: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 4,
            excludedIds: new Set([3, 4]),
        }
        const rejectedRow = setTableRowSelected(atLimit, 3, true, 2)
        const rejectedPage = setTablePageSelected(atLimit, [3, 4], true, 3)

        expect(rejectedRow).toEqual({
            selection: atLimit,
            changed: false,
            limitExceeded: true,
        })
        expect(rejectedPage).toEqual({
            selection: atLimit,
            changed: false,
            limitExceeded: true,
        })
    })

    it('allows all-matching deselection while the controlled model remains above the limit', () => {
        const aboveLimit: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 5,
            excludedIds: new Set(),
        }

        const result = setTablePageSelected(aboveLimit, [1, 2], false, 1)

        expect(result).toEqual({
            selection: {
                mode: 'allMatching',
                matchingCount: 5,
                excludedIds: new Set([1, 2]),
            },
            changed: true,
            limitExceeded: false,
        })
    })

    it('normalizes an empty result scope while retaining all-matching exclusions', () => {
        const emptyAll = selectAllMatchingTableRows(
            createEmptyTableSelection<number>(),
            0,
        )
        const allMatching: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 2,
            excludedIds: new Set(),
        }
        const fullyExcluded = setTablePageSelected(allMatching, [1, 2], false)

        expect(emptyAll.selection).toEqual(createEmptyTableSelection<number>())
        expect(fullyExcluded.selection).toEqual({
            mode: 'allMatching',
            matchingCount: 2,
            excludedIds: new Set([1, 2]),
        })
        expect(getTableSelectionCount(fullyExcluded.selection)).toBe(0)
    })

    it('clears either selection mode and validates numeric limits', () => {
        const allMatching: TableSelectionModel<number> = {
            mode: 'allMatching',
            matchingCount: 5,
            excludedIds: new Set([2]),
        }

        expect(clearTableSelection(allMatching)).toEqual({
            selection: createEmptyTableSelection<number>(),
            changed: true,
            limitExceeded: false,
        })
        expect(() => selectAllMatchingTableRows(allMatching, -1)).toThrow(RangeError)
        expect(() => selectAllMatchingTableRows(allMatching, Number.NaN)).toThrow(RangeError)
        expect(() => selectAllMatchingTableRows(allMatching, Number.POSITIVE_INFINITY)).toThrow(RangeError)
        expect(() => selectAllMatchingTableRows(allMatching, 1.5)).toThrow(RangeError)
        expect(() => setTableRowSelected(allMatching, 1, true, -1)).toThrow(RangeError)
        expect(() => setTableRowSelected(allMatching, 1, true, 1.5)).toThrow(RangeError)
    })
})
