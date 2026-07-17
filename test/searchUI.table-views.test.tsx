import React from 'react'
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {
    SearchUI,
    type SearchParams,
    type SearchUIView,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type ViewId = 'summary' | 'operations' | 'risk'

type Row = {
    id: string
    label: string
}

type SearchData = (params: SearchParams) => Promise<Row[]>

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const createDeferred = <T, >() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve
    })

    return {promise, resolve}
}

const createViews = (searchByView: Record<ViewId, SearchData>): readonly SearchUIView<Row, ViewId>[] => [
    {
        id: 'summary',
        label: 'Summary',
        searchData: searchByView.summary,
        createTableHeader: () => <tr><th>Summary header</th></tr>,
        createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
        actions: <button type='button'>View settings</button>,
        sortOnActivate: {sortColumnIndex: 2, sortAsc: false},
    },
    {
        id: 'operations',
        label: 'Operations',
        searchData: searchByView.operations,
        createTableHeader: () => <tr><th>Operations header</th></tr>,
        createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
        actions: <button type='button'>View settings</button>,
        sortOnActivate: {sortColumnIndex: 7, sortAsc: true},
    },
    {
        id: 'risk',
        label: 'Risk',
        searchData: searchByView.risk,
        actions: <button type='button'>View settings</button>,
        createTableHeader: () => <tr><th>Risk header</th></tr>,
        createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
    },
]

const TableViewsHarness = ({
    duplicatePagination = false,
    initialView = 'summary',
    instanceId,
    onSettings = () => undefined,
    searchByView,
}: {
    duplicatePagination?: boolean
    initialView?: ViewId
    instanceId: string
    onSettings?: () => void
    searchByView: Record<ViewId, SearchData>
}) => {
    const [value, setValue] = React.useState<ViewId>(initialView)

    return <section data-testid={instanceId}>
        <SearchUI<Row, ViewId>
            autoTestId={instanceId}
            config={filtersConfig}
            possibleCriteria={[]}
            settingsContextName={`${instanceId}-settings`}
            tableParams={{duplicatePagination}}
            tableViews={{
                'aria-label': `${instanceId} table view`,
                onChange: setValue,
                renderViewSelector: selector => (
                    <div data-autotest={`${instanceId}.legacy-view-control`}>{selector}</div>
                ),
                value,
                views: createViews(searchByView).map(view => ({
                    ...view,
                    actions: <button onClick={onSettings} type='button'>View settings</button>,
                })),
            }}
        />
    </section>
}

const resolvedSearch = (label: string) => jest.fn<Promise<Row[]>, [SearchParams]>()
    .mockResolvedValue([{id: label, label}])

describe('SearchUI table views', () => {
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
        sessionStorage.clear()
    })

    it('renders the selected descriptor in the table toolbar and switches with one reset fetch', async () => {
        const onSettings = jest.fn()
        const summarySearch = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockImplementation(params => Promise.resolve(
                params.startNum === 0
                    ? Array.from({length: 51}, (_, index) => ({
                        id: `summary-${index}`,
                        label: `Summary row ${index}`,
                    }))
                    : [{id: 'summary-page-two', label: 'Summary page two row'}],
            ))
        const operationsSearch = resolvedSearch('Operations row')
        const riskSearch = resolvedSearch('Risk row')
        const {container} = render(<TableViewsHarness
            instanceId='orders'
            onSettings={onSettings}
            searchByView={{
                summary: summarySearch,
                operations: operationsSearch,
                risk: riskSearch,
            }}
        />)

        await waitFor(() => {
            expect(screen.getByText('Summary row 0')).toBeTruthy()
        })
        expect(summarySearch).toHaveBeenCalledTimes(1)
        expect(summarySearch).toHaveBeenLastCalledWith(expect.objectContaining({
            orderBy: 2,
            sortOrder: 'desc',
            startNum: 0,
        }))

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        ) as HTMLElement
        const toolbar = tableScope.querySelector('[data-autotest="table-toolbar"]') as HTMLElement
        const selector = toolbar.querySelector(
            '[data-autotest="table-views"][data-autotest-value="orders"]',
        )

        expect(selector).not.toBeNull()
        expect(toolbar.querySelector('[data-autotest="orders.legacy-view-control"]')).not.toBeNull()
        expect(tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        )).toBeNull()
        const filtersScope = container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="orders"]',
        )

        const bottomPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        fireEvent.click(within(bottomPagination).getByRole('button', {name: 'next page'}))
        await waitFor(() => {
            expect(screen.getByText('Summary page two row')).toBeTruthy()
        })
        expect(summarySearch).toHaveBeenCalledTimes(2)
        expect(summarySearch).toHaveBeenLastCalledWith(expect.objectContaining({startNum: 50}))

        const group = within(toolbar).getByRole('group', {name: 'orders table view'})
        const operationsButton = within(group).getByRole('button', {name: 'Operations'})
        operationsButton.focus()
        fireEvent.click(operationsButton)

        expect(screen.queryByText('Summary page two row')).toBeNull()
        expect(screen.getByText('Operations header')).toBeTruthy()
        const switchedTableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        ) as HTMLElement
        expect(switchedTableScope.querySelector('[data-autotest="empty-state"]')).toBeNull()
        expect(within(switchedTableScope).getByRole('table').getAttribute('aria-busy')).toBe('true')
        expect(container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="orders"]',
        )).toBe(filtersScope)
        expect(document.activeElement).toBe(operationsButton)

        await waitFor(() => {
            expect(screen.getByText('Operations row')).toBeTruthy()
        })
        expect(operationsSearch).toHaveBeenCalledTimes(1)
        expect(operationsSearch).toHaveBeenLastCalledWith(expect.objectContaining({
            orderBy: 7,
            sortOrder: 'asc',
            startNum: 0,
        }))
        expect(summarySearch).toHaveBeenCalledTimes(2)
        expect(riskSearch).not.toHaveBeenCalled()

        const switchedToolbar = switchedTableScope.querySelector(
            '[data-autotest="table-toolbar"]',
        ) as HTMLElement
        fireEvent.click(within(switchedToolbar).getByRole('button', {name: 'View settings'}))
        expect(onSettings).toHaveBeenCalledTimes(1)
        expect(operationsSearch).toHaveBeenCalledTimes(1)
    })

    it('composes the selector into the responsive top pagination band when enabled', async () => {
        const onSettings = jest.fn()
        const {container} = render(<TableViewsHarness
            duplicatePagination
            instanceId='orders-with-top-pagination'
            onSettings={onSettings}
            searchByView={{
                summary: resolvedSearch('Summary row'),
                operations: resolvedSearch('Operations row'),
                risk: resolvedSearch('Risk row'),
            }}
        />)

        await waitFor(() => {
            expect(screen.getByText('Summary row')).toBeTruthy()
        })

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders-with-top-pagination"]',
        ) as HTMLElement
        const topControls = tableScope.querySelector(
            '[data-autotest="table-top-controls"]',
        ) as HTMLElement
        const topPagination = topControls.querySelector(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        ) as HTMLElement
        const bottomPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        const toolbar = topPagination.querySelector(
            '[data-autotest="table-toolbar"]',
        ) as HTMLElement

        expect(toolbar).not.toBeNull()
        expect(toolbar.querySelector(
            '[data-autotest="table-views"][data-autotest-value="orders-with-top-pagination"]',
        )).not.toBeNull()
        expect(bottomPagination.querySelector('[data-autotest="table-toolbar"]')).toBeNull()

        fireEvent.click(within(toolbar).getByRole('button', {name: 'View settings'}))
        expect(onSettings).toHaveBeenCalledTimes(1)
    })

    it('suppresses a stale view completion and never renders its rows under the new header', async () => {
        const summaryResponse = createDeferred<Row[]>()
        const operationsResponse = createDeferred<Row[]>()
        const summarySearch = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockReturnValue(summaryResponse.promise)
        const operationsSearch = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockReturnValue(operationsResponse.promise)
        const {container} = render(<TableViewsHarness
            instanceId='stale-orders'
            searchByView={{
                summary: summarySearch,
                operations: operationsSearch,
                risk: resolvedSearch('Risk row'),
            }}
        />)

        await waitFor(() => {
            expect(summarySearch).toHaveBeenCalledTimes(1)
        })
        const group = screen.getByRole('group', {name: 'stale-orders table view'})
        fireEvent.click(within(group).getByRole('button', {name: 'Operations'}))
        await waitFor(() => {
            expect(operationsSearch).toHaveBeenCalledTimes(1)
        })

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="stale-orders"]',
        ) as HTMLElement
        expect(within(tableScope).getByText('Operations header')).toBeTruthy()
        expect(tableScope.querySelector('[data-autotest="empty-state"]')).toBeNull()

        await act(async () => {
            operationsResponse.resolve([{id: 'operations', label: 'Current operations row'}])
            await operationsResponse.promise
        })
        await waitFor(() => {
            expect(screen.getByText('Current operations row')).toBeTruthy()
        })

        await act(async () => {
            summaryResponse.resolve([{id: 'summary', label: 'Stale summary row'}])
            await summaryResponse.promise
        })

        expect(screen.getByText('Current operations row')).toBeTruthy()
        expect(screen.queryByText('Stale summary row')).toBeNull()
    })

    it('finishes the active loading state after a view request fails', async () => {
        const failure = new Error('Operations unavailable')
        const operationsSearch = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockRejectedValue(failure)
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const {container} = render(<TableViewsHarness
            instanceId='failed-orders'
            searchByView={{
                summary: resolvedSearch('Summary row'),
                operations: operationsSearch,
                risk: resolvedSearch('Risk row'),
            }}
        />)

        try {
            await waitFor(() => {
                expect(screen.getByText('Summary row')).toBeTruthy()
            })
            const group = screen.getByRole('group', {name: 'failed-orders table view'})
            fireEvent.click(within(group).getByRole('button', {name: 'Operations'}))

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(failure)
            })
            await waitFor(() => {
                const tableScope = container.querySelector(
                    '[data-autotest="table"][data-autotest-value="failed-orders"]',
                ) as HTMLElement
                expect(within(tableScope).getByRole('table').getAttribute('aria-busy')).toBe('false')
                expect(tableScope.querySelector('[data-autotest="empty-state"]')).not.toBeNull()
            }, {timeout: 2000})
            expect(operationsSearch).toHaveBeenCalledTimes(1)
        } finally {
            consoleError.mockRestore()
        }
    })

    it('keeps two controlled SearchUI view instances isolated', async () => {
        const firstSummary = resolvedSearch('First summary row')
        const firstOperations = resolvedSearch('First operations row')
        const secondSummary = resolvedSearch('Second summary row')
        const secondOperations = resolvedSearch('Second operations row')

        render(<>
            <TableViewsHarness
                instanceId='first'
                searchByView={{
                    summary: firstSummary,
                    operations: firstOperations,
                    risk: resolvedSearch('First risk row'),
                }}
            />
            <TableViewsHarness
                instanceId='second'
                searchByView={{
                    summary: secondSummary,
                    operations: secondOperations,
                    risk: resolvedSearch('Second risk row'),
                }}
            />
        </>)

        await waitFor(() => {
            expect(screen.getByText('First summary row')).toBeTruthy()
            expect(screen.getByText('Second summary row')).toBeTruthy()
        })
        const first = within(screen.getByTestId('first'))
        fireEvent.click(first.getByRole('button', {name: 'Operations'}))

        await waitFor(() => {
            expect(first.getByText('First operations row')).toBeTruthy()
        })
        expect(within(screen.getByTestId('second')).getByText('Second summary row')).toBeTruthy()
        expect(firstOperations).toHaveBeenCalledTimes(1)
        expect(secondOperations).not.toHaveBeenCalled()
    })

    it('uses the first configured view as a production fallback for an unknown persisted ID', async () => {
        const originalNodeEnv = process.env.NODE_ENV
        const summarySearch = resolvedSearch('Fallback summary row')
        const operationsSearch = resolvedSearch('Operations row')
        const riskSearch = resolvedSearch('Risk row')
        process.env.NODE_ENV = 'production'

        try {
            render(<SearchUI<Row, ViewId>
                config={filtersConfig}
                possibleCriteria={[]}
                settingsContextName='production-fallback'
                tableViews={{
                    'aria-label': 'Production fallback views',
                    onChange: () => undefined,
                    value: 'risk',
                    views: createViews({
                        summary: summarySearch,
                        operations: operationsSearch,
                        risk: riskSearch,
                    }).slice(0, 2),
                }}
            />)

            await waitFor(() => {
                expect(screen.getByText('Fallback summary row')).toBeTruthy()
            })
            expect(screen.getByRole('button', {name: 'Summary'}).getAttribute('aria-pressed')).toBe('true')
            expect(summarySearch).toHaveBeenCalledTimes(1)
            expect(operationsSearch).not.toHaveBeenCalled()
            expect(riskSearch).not.toHaveBeenCalled()
        } finally {
            process.env.NODE_ENV = originalNodeEnv
        }
    })

    it('rejects empty, duplicate, and missing selected view IDs before fetching', () => {
        const searchByView = {
            summary: resolvedSearch('Summary row'),
            operations: resolvedSearch('Operations row'),
            risk: resolvedSearch('Risk row'),
        }
        const validViews = createViews(searchByView)
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)

        try {
            expect(() => render(<SearchUI<Row, ViewId>
                config={filtersConfig}
                possibleCriteria={[]}
                settingsContextName='empty-views'
                tableViews={{
                    'aria-label': 'Empty views',
                    onChange: () => undefined,
                    value: 'summary',
                    views: [],
                }}
            />)).toThrow('SearchUI: table views must not be empty')

            expect(() => render(<SearchUI<Row, ViewId>
                config={filtersConfig}
                possibleCriteria={[]}
                settingsContextName='duplicate-views'
                tableViews={{
                    'aria-label': 'Duplicate views',
                    onChange: () => undefined,
                    value: 'summary',
                    views: [validViews[0], validViews[0]],
                }}
            />)).toThrow('SearchUI: duplicate table view ID "summary"')

            expect(() => render(<SearchUI<Row, ViewId>
                config={filtersConfig}
                possibleCriteria={[]}
                settingsContextName='missing-view'
                tableViews={{
                    'aria-label': 'Missing view',
                    onChange: () => undefined,
                    value: 'risk',
                    views: validViews.slice(0, 2),
                }}
            />)).toThrow('SearchUI: selected table view "risk" is not configured')
        } finally {
            consoleError.mockRestore()
        }
    })
})
