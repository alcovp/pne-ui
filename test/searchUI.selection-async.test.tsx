import React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
    PneTableSelectionCell,
    PneTableSelectionControls,
    PneTableSelectionHeaderCell,
    SearchUI,
    type SearchParams,
    type SearchUITableSelectionController,
    type SearchUITableSelectionScope,
    type SearchUIView,
    type TableSelectionChangeDetails,
    type TableSelectionModel,
    type TableSelectionUpdate,
} from '../src'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type Row = {
    id: number
    label: string
}

type ViewId = 'summary' | 'operations'

type Deferred<T> = {
    promise: Promise<T>
    reject: (reason?: unknown) => void
    resolve: (value: T) => void
}

const createDeferred = <T, >(): Deferred<T> => {
    let reject!: (reason?: unknown) => void
    let resolve!: (value: T) => void
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve
        reject = promiseReject
    })

    return {promise, reject, resolve}
}

const rows: Row[] = [
    {id: 1, label: 'Gate 1'},
    {id: 2, label: 'Gate 2'},
]

const createHeader = (
    label: string,
    selection?: SearchUITableSelectionController<Row, number>,
) => <PneTableRow>
    <PneTableSelectionHeaderCell
        aria-label='Select current page'
        disabled={!selection || selection.interactionDisabled}
        onChange={checked => selection?.setPageSelected(checked)}
        state={selection?.pageState ?? 'none'}
    />
    <PneHeaderTableCell>{label}</PneHeaderTableCell>
</PneTableRow>

const createRow = (
    row: Row,
    selection?: SearchUITableSelectionController<Row, number>,
) => <PneTableRow
    aria-selected={selection?.isRowSelected(row) ?? false}
    key={row.id}
    selected={selection?.isRowSelected(row) ?? false}
>
    <PneTableSelectionCell
        aria-label={`Select ${row.label}`}
        checked={selection?.isRowSelected(row) ?? false}
        disabled={!selection || selection.interactionDisabled}
        onChange={checked => selection?.setRowSelected(row, checked)}
    />
    <PneTableCell>{row.label}</PneTableCell>
</PneTableRow>

type ControllerRef = React.MutableRefObject<
    SearchUITableSelectionController<Row, number> | null
>

type AsyncSelectionHarnessProps = {
    controllerRef: ControllerRef
    manualSearch?: boolean
    maxSelected?: number
    onSelectionChange?: (
        selection: TableSelectionModel<number>,
        details: TableSelectionChangeDetails,
    ) => void
    resolveAllMatchingCount?: (scope: SearchUITableSelectionScope) => Promise<number>
    searchData?: (params: SearchParams) => Promise<Row[]>
    selectionOverride?: TableSelectionModel<number>
}

const AsyncSelectionHarness = ({
    controllerRef,
    manualSearch = false,
    maxSelected,
    onSelectionChange,
    resolveAllMatchingCount,
    searchData = jest.fn().mockResolvedValue(rows),
    selectionOverride,
}: AsyncSelectionHarnessProps) => {
    const [selection, setSelection] = React.useState<TableSelectionModel<number>>({
        mode: 'explicit',
        selectedIds: new Set(),
    })

    return <SearchUI<Row, string, number>
        autoTestId='async-gates'
        config={{hideShowFiltersButton: true, hideTemplatesSelect: true, manualSearch}}
        createTableHeader={(_params, context) => createHeader('Gates', context?.selection)}
        createTableRow={(row, _index, _data, _setData, context) => (
            createRow(row, context?.selection)
        )}
        possibleCriteria={[]}
        searchData={searchData}
        settingsContextName='async-gates-selection-test'
        tableSelection={{
            getRowId: row => row.id,
            maxSelected,
            onSelectionChange: (nextSelection, details) => {
                setSelection(nextSelection)
                onSelectionChange?.(nextSelection, details)
            },
            renderControls: ({selection: controller}) => {
                controllerRef.current = controller
                return <PneTableSelectionControls
                    status={controller.selectingAllMatching ? 'Selecting all results' : undefined}
                    summary={`${controller.selectedCount} selected (${controller.selection.mode})`}
                />
            },
            resolveAllMatchingCount,
            selection: selectionOverride ?? selection,
            toolbarAriaLabel: 'Gate table controls',
        }}
    />
}

const AsyncViewsHarness = ({
    controllerRef,
    onSelectionChange,
    resolveAllMatchingCount,
}: {
    controllerRef: ControllerRef
    onSelectionChange: (
        selection: TableSelectionModel<number>,
        details: TableSelectionChangeDetails,
    ) => void
    resolveAllMatchingCount: (scope: SearchUITableSelectionScope) => Promise<number>
}) => {
    const [view, setView] = React.useState<ViewId>('summary')
    const [selection, setSelection] = React.useState<TableSelectionModel<number>>({
        mode: 'explicit',
        selectedIds: new Set(),
    })
    const searchData = React.useCallback(() => Promise.resolve(rows), [])
    const views = React.useMemo<readonly SearchUIView<Row, ViewId, number>[]>(() => [
        {
            id: 'summary',
            label: 'Summary',
            searchData,
            createTableHeader: (_params, context) => createHeader(
                'Summary heading',
                context?.selection,
            ),
            createTableRow: (row, _index, _data, _setData, context) => (
                createRow(row, context?.selection)
            ),
        },
        {
            id: 'operations',
            label: 'Operations',
            searchData,
            createTableHeader: (_params, context) => createHeader(
                'Operations heading',
                context?.selection,
            ),
            createTableRow: (row, _index, _data, _setData, context) => (
                createRow(row, context?.selection)
            ),
        },
    ], [searchData])

    return <SearchUI<Row, ViewId, number>
        autoTestId='async-view-gates'
        config={{hideShowFiltersButton: true, hideTemplatesSelect: true}}
        possibleCriteria={[]}
        settingsContextName='async-view-gates-selection-test'
        tableSelection={{
            getRowId: row => row.id,
            onSelectionChange: (nextSelection, details) => {
                setSelection(nextSelection)
                onSelectionChange(nextSelection, details)
            },
            renderControls: ({selection: controller}) => {
                controllerRef.current = controller
                return <PneTableSelectionControls
                    status={controller.selectingAllMatching ? 'Selecting all results' : undefined}
                    summary={`${controller.selectedCount} selected (${controller.selection.mode})`}
                />
            },
            resolveAllMatchingCount,
            selection,
            toolbarAriaLabel: 'Gate table controls',
        }}
        tableViews={{
            'aria-label': 'Gate view',
            onChange: setView,
            value: view,
            views,
        }}
    />
}

describe('SearchUI asynchronous all-matching selection', () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: jest.fn(),
        })
    })

    afterAll(() => {
        if (originalScrollIntoView) {
            Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
                configurable: true,
                value: originalScrollIntoView,
            })
        } else {
            delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
        }
    })

    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        resetSearchUIRetentionForTests()
    })

    it('deduplicates an in-flight request and exposes pending state', async () => {
        const count = createDeferred<number>()
        const resolver = jest.fn().mockReturnValue(count.promise)
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        onSelectionChange.mockClear()

        let firstRequest!: Promise<TableSelectionUpdate<number>>
        let duplicateRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            firstRequest = controllerRef.current!.selectAllMatchingResults!()
            duplicateRequest = controllerRef.current!.selectAllMatchingResults!()
        })

        expect(duplicateRequest).toBe(firstRequest)
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1))
        expect(controllerRef.current?.selectingAllMatching).toBe(true)
        expect(controllerRef.current?.interactionDisabled).toBe(true)
        expect(screen.getByText('Selecting all results')).toBeTruthy()

        let result!: TableSelectionUpdate<number>
        await act(async () => {
            count.resolve(2)
            result = await firstRequest
        })

        expect(result.changed).toBe(true)
        expect(controllerRef.current?.selectingAllMatching).toBe(false)
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(onSelectionChange).toHaveBeenCalledWith(
            {mode: 'allMatching', matchingCount: 2, excludedIds: new Set()},
            {reason: 'allMatching'},
        )
    })

    it('recovers after an active resolver rejection', async () => {
        const resolverError = new Error('summary unavailable')
        const resolver = jest.fn()
            .mockRejectedValueOnce(resolverError)
            .mockResolvedValueOnce(2)
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let caught: unknown
        await act(async () => {
            try {
                await controllerRef.current!.selectAllMatchingResults!()
            } catch (error) {
                caught = error
            }
        })

        expect(caught).toBe(resolverError)
        expect(controllerRef.current?.selectingAllMatching).toBe(false)
        expect(controllerRef.current?.interactionDisabled).toBe(false)
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()

        await act(async () => {
            await controllerRef.current!.selectAllMatchingResults!()
        })
        expect(resolver).toHaveBeenCalledTimes(2)
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
    })

    it('rejects an over-limit count atomically', async () => {
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            maxSelected={1}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={jest.fn().mockResolvedValue(2)}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        onSelectionChange.mockClear()

        let result!: TableSelectionUpdate<number>
        await act(async () => {
            result = await controllerRef.current!.selectAllMatchingResults!()
        })

        expect(result).toEqual({
            selection: {mode: 'explicit', selectedIds: new Set()},
            changed: false,
            limitExceeded: true,
        })
        expect(onSelectionChange).not.toHaveBeenCalled()
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()
    })

    it('invalidates a pending request when the selection limit changes', async () => {
        const oldCount = createDeferred<number>()
        const resolver = jest.fn()
            .mockReturnValueOnce(oldCount.promise)
            .mockResolvedValueOnce(2)
        const controllerRef: ControllerRef = {current: null}
        const {rerender} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let oldRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            oldRequest = controllerRef.current!.selectAllMatchingResults!()
        })
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1))

        rerender(<AsyncSelectionHarness
            controllerRef={controllerRef}
            maxSelected={1}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.selectingAllMatching).toBe(false))

        let oldResult!: TableSelectionUpdate<number>
        await act(async () => {
            oldCount.resolve(2)
            oldResult = await oldRequest
        })
        expect(oldResult.changed).toBe(false)
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()

        let currentResult!: TableSelectionUpdate<number>
        await act(async () => {
            currentResult = await controllerRef.current!.selectAllMatchingResults!()
        })
        expect(currentResult.limitExceeded).toBe(true)
        expect(resolver).toHaveBeenCalledTimes(2)
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()
    })

    it('applies a resolved count against the latest controlled selection', async () => {
        const count = createDeferred<number>()
        const resolver = jest.fn().mockReturnValue(count.promise)
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        const emptySelection: TableSelectionModel<number> = {
            mode: 'explicit',
            selectedIds: new Set(),
        }
        const alreadySelected: TableSelectionModel<number> = {
            mode: 'allMatching',
            excludedIds: new Set(),
            matchingCount: 2,
        }
        const {rerender} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={resolver}
            selectionOverride={emptySelection}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let request!: Promise<TableSelectionUpdate<number>>
        act(() => {
            request = controllerRef.current!.selectAllMatchingResults!()
        })
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1))

        rerender(<AsyncSelectionHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={resolver}
            selectionOverride={alreadySelected}
        />)
        onSelectionChange.mockClear()

        let result!: TableSelectionUpdate<number>
        await act(async () => {
            count.resolve(2)
            result = await request
        })

        expect(result.changed).toBe(false)
        expect(onSelectionChange).not.toHaveBeenCalled()
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
    })

    it('does not start the resolver while initial table data is loading', async () => {
        const data = createDeferred<Row[]>()
        const searchData = jest.fn().mockReturnValue(data.promise)
        const resolver = jest.fn().mockResolvedValue(2)
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={resolver}
            searchData={searchData}
        />)
        await waitFor(() => expect(searchData).toHaveBeenCalled())
        expect(controllerRef.current?.interactionDisabled).toBe(true)

        let result!: TableSelectionUpdate<number>
        await act(async () => {
            result = await controllerRef.current!.selectAllMatchingResults!()
        })
        expect(result.changed).toBe(false)
        expect(resolver).not.toHaveBeenCalled()

        await act(async () => {
            data.resolve(rows)
            await data.promise
        })
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
    })

    it('keeps a pending resolver through a same-scope refresh', async () => {
        const count = createDeferred<number>()
        const refreshedRows = createDeferred<Row[]>()
        const searchData = jest.fn()
            .mockResolvedValueOnce(rows)
            .mockReturnValueOnce(refreshedRows.promise)
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            manualSearch
            resolveAllMatchingCount={jest.fn().mockReturnValue(count.promise)}
            searchData={searchData}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let request!: Promise<TableSelectionUpdate<number>>
        act(() => {
            request = controllerRef.current!.selectAllMatchingResults!()
        })
        fireEvent.click(screen.getByRole('button', {name: 'react.searchUI.search'}))
        await waitFor(() => expect(searchData).toHaveBeenCalledTimes(2))
        expect(controllerRef.current?.interactionDisabled).toBe(true)

        await act(async () => {
            count.resolve(2)
            await request
        })
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
        expect(controllerRef.current?.interactionDisabled).toBe(true)

        await act(async () => {
            refreshedRows.resolve(rows)
            await refreshedRows.promise
        })
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
    })

    it('rejects a saved callback from an earlier scope before starting its resolver', async () => {
        const resolver = jest.fn().mockResolvedValue(2)
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncViewsHarness
            controllerRef={controllerRef}
            onSelectionChange={jest.fn()}
            resolveAllMatchingCount={resolver}
        />)
        await screen.findByRole('columnheader', {name: 'Summary heading'})
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        const oldSummarySelectAll = controllerRef.current!.selectAllMatchingResults!
        const oldSummarySetRowSelected = controllerRef.current!.setRowSelected

        act(() => screen.getByRole('button', {name: 'Operations'}).click())
        await screen.findByRole('columnheader', {name: 'Operations heading'})
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let result!: TableSelectionUpdate<number>
        let rowResult!: TableSelectionUpdate<number>
        await act(async () => {
            result = await oldSummarySelectAll()
            rowResult = oldSummarySetRowSelected(rows[0], true)
        })

        expect(result.changed).toBe(false)
        expect(rowResult.changed).toBe(false)
        expect(resolver).not.toHaveBeenCalled()
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()
    })

    it('ignores an old A request after A to B to A and applies the new A request', async () => {
        const oldSummaryCount = createDeferred<number>()
        const newSummaryCount = createDeferred<number>()
        const resolver = jest.fn()
            .mockReturnValueOnce(oldSummaryCount.promise)
            .mockReturnValueOnce(newSummaryCount.promise)
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        render(<AsyncViewsHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={resolver}
        />)
        await screen.findByRole('columnheader', {name: 'Summary heading'})
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let oldRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            oldRequest = controllerRef.current!.selectAllMatchingResults!()
        })
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1))

        act(() => screen.getByRole('button', {name: 'Operations'}).click())
        await screen.findByRole('columnheader', {name: 'Operations heading'})
        act(() => screen.getByRole('button', {name: 'Summary'}).click())
        await screen.findByRole('columnheader', {name: 'Summary heading'})
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        onSelectionChange.mockClear()

        let newRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            newRequest = controllerRef.current!.selectAllMatchingResults!()
        })
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(2))

        let oldResult!: TableSelectionUpdate<number>
        await act(async () => {
            oldSummaryCount.resolve(2)
            oldResult = await oldRequest
        })
        expect(oldResult.changed).toBe(false)
        expect(onSelectionChange).not.toHaveBeenCalled()
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()

        await act(async () => {
            newSummaryCount.resolve(2)
            await newRequest
        })
        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()
        expect(resolver.mock.calls[0][0].viewId).toBe('summary')
        expect(resolver.mock.calls[1][0].viewId).toBe('summary')
    })

    it('invalidates pending work when the resolver is removed', async () => {
        const count = createDeferred<number>()
        const resolver = jest.fn().mockReturnValue(count.promise)
        const controllerRef: ControllerRef = {current: null}
        const {rerender} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        const savedSelectAll = controllerRef.current!.selectAllMatchingResults!

        let pendingRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            pendingRequest = savedSelectAll()
        })
        await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1))

        rerender(<AsyncSelectionHarness controllerRef={controllerRef}/>)
        await waitFor(() => expect(controllerRef.current?.selectingAllMatching).toBe(false))
        expect(controllerRef.current?.selectAllMatchingResults).toBeUndefined()

        let pendingResult!: TableSelectionUpdate<number>
        await act(async () => {
            count.resolve(2)
            pendingResult = await pendingRequest
        })
        expect(pendingResult.changed).toBe(false)
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()

        let savedResult!: TableSelectionUpdate<number>
        await act(async () => {
            savedResult = await savedSelectAll()
        })
        expect(savedResult.changed).toBe(false)
        expect(resolver).toHaveBeenCalledTimes(1)
    })

    it('keeps the resolver that started a request and uses its replacement next', async () => {
        const firstCount = createDeferred<number>()
        const firstResolver = jest.fn().mockReturnValue(firstCount.promise)
        const replacementResolver = jest.fn().mockResolvedValue(1)
        const controllerRef: ControllerRef = {current: null}
        const {rerender} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={firstResolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))

        let firstRequest!: Promise<TableSelectionUpdate<number>>
        act(() => {
            firstRequest = controllerRef.current!.selectAllMatchingResults!()
            rerender(<AsyncSelectionHarness
                controllerRef={controllerRef}
                resolveAllMatchingCount={replacementResolver}
            />)
        })
        await waitFor(() => expect(firstResolver).toHaveBeenCalledTimes(1))
        expect(replacementResolver).not.toHaveBeenCalled()

        await act(async () => {
            firstCount.resolve(2)
            await firstRequest
        })
        expect(screen.getByText('2 selected (allMatching)')).toBeTruthy()

        act(() => {
            controllerRef.current!.clear()
        })
        await act(async () => {
            await controllerRef.current!.selectAllMatchingResults!()
        })
        expect(replacementResolver).toHaveBeenCalledTimes(1)
        expect(screen.getByText('1 selected (allMatching)')).toBeTruthy()
    })

    it('does not invoke a saved resolver callback after unmount', async () => {
        const resolver = jest.fn().mockResolvedValue(2)
        const controllerRef: ControllerRef = {current: null}
        const {unmount} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            resolveAllMatchingCount={resolver}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        const savedSelectAll = controllerRef.current!.selectAllMatchingResults!
        unmount()

        let result!: TableSelectionUpdate<number>
        await act(async () => {
            result = await savedSelectAll()
        })
        expect(result.changed).toBe(false)
        expect(resolver).not.toHaveBeenCalled()
    })

    it('blocks saved synchronous selection callbacks after unmount', async () => {
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        const {unmount} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        const savedSetRowSelected = controllerRef.current!.setRowSelected
        onSelectionChange.mockClear()
        unmount()

        const result = savedSetRowSelected(rows[0], true)

        expect(result.changed).toBe(false)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('suppresses completion after unmount', async () => {
        const count = createDeferred<number>()
        const onSelectionChange = jest.fn()
        const controllerRef: ControllerRef = {current: null}
        const {unmount} = render(<AsyncSelectionHarness
            controllerRef={controllerRef}
            onSelectionChange={onSelectionChange}
            resolveAllMatchingCount={jest.fn().mockReturnValue(count.promise)}
        />)
        await waitFor(() => expect(controllerRef.current?.interactionDisabled).toBe(false))
        onSelectionChange.mockClear()

        let request!: Promise<TableSelectionUpdate<number>>
        act(() => {
            request = controllerRef.current!.selectAllMatchingResults!()
        })
        unmount()
        let result!: TableSelectionUpdate<number>
        await act(async () => {
            count.resolve(2)
            result = await request
        })

        expect(result.changed).toBe(false)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })
})
