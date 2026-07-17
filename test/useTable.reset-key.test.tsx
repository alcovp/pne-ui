import React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {
    PneTable,
    useTable,
    type UseTableParams,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type ViewId = 'brief' | 'full'

type Row = {
    id: string
    label: string
}

type FetchData = NonNullable<UseTableParams<Row>['fetchData']>

const createDeferred = <T, >() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve
    })

    return {promise, resolve}
}

const displayOptionsByView = {
    brief: {sortColumnIndex: 2, sortAsc: false},
    full: {sortColumnIndex: 7, sortAsc: true},
} as const

const ResetKeyHarness = ({preserveSortOnReset = false, view, searchByView}: {
    preserveSortOnReset?: boolean
    view: ViewId
    searchByView: Record<ViewId, FetchData>
}) => {
    const [externalData, setExternalData] = React.useState<Row[]>([])
    const viewDisplayOptions = displayOptionsByView[view]
    const table = useTable<Row>({
        dataUseState: [externalData, setExternalData],
        displayOptions: viewDisplayOptions,
        fetchData: args => searchByView[view](args),
        resetDisplayOptions: preserveSortOnReset ? 'preserve' : viewDisplayOptions,
        resetKey: view,
        rowsPerPageOptions: [10],
    })

    return <>
        <output data-testid='page'>{table.page}</output>
        <output data-testid='sort'>{`${table.sortIndex}:${table.order}`}</output>
        <output data-testid='external-data'>{externalData.map(row => row.label).join(',')}</output>
        <button
            onClick={() => table.paginator.onPageChange(null, 2)}
            type='button'
        >
            Go to page three
        </button>
        <button
            onClick={() => {
                table.setSortIndex(9)
                table.setOrder('desc')
            }}
            type='button'
        >
            Change sort
        </button>
        <button
            onClick={() => table.paginator.requestScrollToPagination?.()}
            type='button'
        >
            Request pagination scroll
        </button>
        <div data-testid='pagination-target' ref={table.paginator.paginationRef}/>
        <PneTable<Row>
            autoTestId='reset-table'
            createTableHeader={() => <tr><th>Label</th></tr>}
            createRow={row => <tr key={row.id}><td>{row.label}</td></tr>}
            data={table.data}
            loading={table.loading}
        />
    </>
}

const ManualDataHarness = ({view}: {view: ViewId}) => {
    const dataState = React.useState<Row[]>([{id: 'manual', label: 'Manual row'}])
    const table = useTable<Row>({
        dataUseState: dataState,
        resetKey: view,
    })

    return <output data-testid='manual-data'>{table.data.map(row => row.label).join(',')}</output>
}

describe('useTable resetKey', () => {
    it('resets page/sort, clears external rows, and fetches the new identity once', async () => {
        const fullResponse = createDeferred<Row[]>()
        const briefSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockResolvedValue([{id: 'brief', label: 'Brief row'}])
        const fullSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockReturnValue(fullResponse.promise)
        const searchByView = {brief: briefSearch, full: fullSearch}
        const view = render(<ResetKeyHarness view='brief' searchByView={searchByView}/>)

        await waitFor(() => {
            expect(screen.getByText('Brief row')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', {name: 'Go to page three'}))
        await waitFor(() => {
            expect(screen.getByTestId('page').textContent).toBe('2')
        })
        fireEvent.click(screen.getByRole('button', {name: 'Change sort'}))
        await waitFor(() => {
            expect(screen.getByTestId('sort').textContent).toBe('9:desc')
        })

        briefSearch.mockClear()
        view.rerender(<ResetKeyHarness view='full' searchByView={searchByView}/>)

        expect(screen.queryByText('Brief row')).toBeNull()
        expect(screen.getByTestId('page').textContent).toBe('0')
        expect(screen.getByTestId('sort').textContent).toBe('7:asc')
        await waitFor(() => {
            expect(screen.getByTestId('external-data').textContent).toBe('')
            expect(fullSearch).toHaveBeenCalledTimes(1)
        })
        expect(fullSearch).toHaveBeenLastCalledWith(expect.objectContaining({
            page: 0,
            sortIndex: 7,
            order: 'asc',
        }))
        expect(briefSearch).not.toHaveBeenCalled()

        await act(async () => {
            fullResponse.resolve([{id: 'full', label: 'Full row'}])
            await fullResponse.promise
        })

        expect(screen.getByText('Full row')).toBeTruthy()
    })

    it('ignores an older identity response that resolves after the current view', async () => {
        const briefResponse = createDeferred<Row[]>()
        const fullResponse = createDeferred<Row[]>()
        const briefSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockReturnValue(briefResponse.promise)
        const fullSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockReturnValue(fullResponse.promise)
        const searchByView = {brief: briefSearch, full: fullSearch}
        const view = render(<ResetKeyHarness view='brief' searchByView={searchByView}/>)

        await waitFor(() => {
            expect(briefSearch).toHaveBeenCalledTimes(1)
        })
        view.rerender(<ResetKeyHarness view='full' searchByView={searchByView}/>)
        await waitFor(() => {
            expect(fullSearch).toHaveBeenCalledTimes(1)
        })

        await act(async () => {
            fullResponse.resolve([{id: 'full', label: 'Current full row'}])
            await fullResponse.promise
        })
        expect(screen.getByText('Current full row')).toBeTruthy()

        await act(async () => {
            briefResponse.resolve([{id: 'brief', label: 'Stale brief row'}])
            await briefResponse.promise
        })

        expect(screen.getByText('Current full row')).toBeTruthy()
        expect(screen.queryByText('Stale brief row')).toBeNull()
        expect(screen.getByTestId('external-data').textContent).toBe('Current full row')
    })

    it('preserves sort only when the destination explicitly opts in', async () => {
        const briefSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockResolvedValue([{id: 'brief', label: 'Brief row'}])
        const fullSearch = jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
            .mockResolvedValue([{id: 'full', label: 'Full row'}])
        const searchByView = {brief: briefSearch, full: fullSearch}
        const view = render(<ResetKeyHarness
            preserveSortOnReset
            searchByView={searchByView}
            view='brief'
        />)

        await waitFor(() => {
            expect(screen.getByText('Brief row')).toBeTruthy()
        })
        fireEvent.click(screen.getByRole('button', {name: 'Go to page three'}))
        fireEvent.click(screen.getByRole('button', {name: 'Change sort'}))
        await waitFor(() => {
            expect(screen.getByTestId('page').textContent).toBe('2')
            expect(screen.getByTestId('sort').textContent).toBe('9:desc')
        })

        fullSearch.mockClear()
        view.rerender(<ResetKeyHarness
            preserveSortOnReset
            searchByView={searchByView}
            view='full'
        />)

        expect(screen.getByTestId('page').textContent).toBe('0')
        expect(screen.getByTestId('sort').textContent).toBe('9:desc')
        await waitFor(() => {
            expect(fullSearch).toHaveBeenCalledTimes(1)
        })
        expect(fullSearch).toHaveBeenCalledWith(expect.objectContaining({
            order: 'desc',
            page: 0,
            sortIndex: 9,
        }))
    })

    it('keeps manual external data visible when resetKey has no fetch lifecycle', () => {
        const view = render(<ManualDataHarness view='brief'/>)

        expect(screen.getByTestId('manual-data').textContent).toBe('Manual row')
        view.rerender(<ManualDataHarness view='full'/>)
        expect(screen.getByTestId('manual-data').textContent).toBe('Manual row')
    })

    it('drops a pending pagination scroll when the request identity changes', async () => {
        const fullResponse = createDeferred<Row[]>()
        const searchByView = {
            brief: jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
                .mockResolvedValue([{id: 'brief', label: 'Brief row'}]),
            full: jest.fn<ReturnType<FetchData>, Parameters<FetchData>>()
                .mockReturnValue(fullResponse.promise),
        }
        const view = render(<ResetKeyHarness view='brief' searchByView={searchByView}/>)
        const scrollIntoView = jest.fn()
        Object.defineProperty(screen.getByTestId('pagination-target'), 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView,
        })

        await waitFor(() => {
            expect(screen.getByText('Brief row')).toBeTruthy()
        })
        fireEvent.click(screen.getByRole('button', {name: 'Request pagination scroll'}))
        view.rerender(<ResetKeyHarness view='full' searchByView={searchByView}/>)

        await act(async () => {
            fullResponse.resolve([{id: 'full', label: 'Full row'}])
            await fullResponse.promise
        })
        expect(screen.getByText('Full row')).toBeTruthy()
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150))
        })
        expect(scrollIntoView).not.toHaveBeenCalled()
    })
})
