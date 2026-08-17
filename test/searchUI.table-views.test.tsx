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

type ConfigurableViewId = 'brief' | 'detailed'

type DetailedSearchData = (searchDataKey: string, params: SearchParams) => Promise<Row[]>

const ConfigurableDetailedViewHarness = ({briefSearch, detailedSearch}: {
    briefSearch: SearchData
    detailedSearch: DetailedSearchData
}) => {
    const [value, setValue] = React.useState<ConfigurableViewId>('brief')
    const [searchDataKey, setSearchDataKey] = React.useState('kpi-a')
    const [pickerOpen, setPickerOpen] = React.useState(false)
    const views: readonly SearchUIView<Row, ConfigurableViewId>[] = [
        {
            id: 'brief',
            label: 'Brief',
            searchData: briefSearch,
            createTableHeader: () => <tr><th>Brief header</th></tr>,
            createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
            sortOnActivate: {sortColumnIndex: 2, sortAsc: true},
            tableStateOnActivate: 'restore',
        },
        {
            id: 'detailed',
            label: 'Detailed',
            onClick: event => {
                event.preventDefault()
                setPickerOpen(true)
            },
            searchData: params => detailedSearch(searchDataKey, params),
            searchDataKey,
            createTableHeader: () => <tr><th>Detailed header</th></tr>,
            createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
            sortOnActivate: {sortColumnIndex: -100, sortAsc: true},
            tableStateOnActivate: 'restore',
        },
    ]
    const applyKpis = (nextSearchDataKey: string) => {
        setSearchDataKey(nextSearchDataKey)
        setValue('detailed')
        setPickerOpen(false)
    }

    return <section data-testid='configurable-detailed-view'>
        <SearchUI<Row, ConfigurableViewId>
            autoTestId='configurable-detailed-view'
            config={filtersConfig}
            possibleCriteria={[]}
            settingsContextName='configurable-detailed-view-settings'
            tableViews={{
                'aria-label': 'Configurable results view',
                onChange: setValue,
                value,
                views,
            }}
        />
        {pickerOpen ? <div aria-label='KPI picker' role='dialog'>
            <button onClick={() => applyKpis('kpi-a')} type='button'>Apply KPI A</button>
            <button onClick={() => applyKpis('kpi-b')} type='button'>Apply KPI B</button>
            <button onClick={() => applyKpis('kpi-c')} type='button'>Apply KPI C</button>
        </div> : null}
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

    it('gates activation with a view click, reopens the active picker, and invalidates keyed requests', async () => {
        const kpiBResponse = createDeferred<Row[]>()
        const kpiCResponse = createDeferred<Row[]>()
        const briefSearch = resolvedSearch('Brief row')
        const detailedSearch = jest.fn<Promise<Row[]>, [string, SearchParams]>()
            .mockImplementation(searchDataKey => {
                if (searchDataKey === 'kpi-b') {
                    return kpiBResponse.promise
                }
                if (searchDataKey === 'kpi-c') {
                    return kpiCResponse.promise
                }
                return Promise.resolve([{id: 'kpi-a', label: 'KPI A row'}])
            })
        const {container} = render(<ConfigurableDetailedViewHarness
            briefSearch={briefSearch}
            detailedSearch={detailedSearch}
        />)

        await waitFor(() => {
            expect(screen.getByText('Brief row')).toBeTruthy()
        })
        const filtersScope = container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="configurable-detailed-view"]',
        )
        const detailedButton = screen.getByRole('button', {name: 'Detailed'})

        fireEvent.click(detailedButton)

        expect(screen.getByRole('dialog', {name: 'KPI picker'})).toBeTruthy()
        expect(detailedSearch).not.toHaveBeenCalled()
        expect(screen.getByRole('button', {name: 'Brief'}).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByText('Brief row')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', {name: 'Apply KPI A'}))

        await waitFor(() => {
            expect(screen.getByText('KPI A row')).toBeTruthy()
        })
        expect(detailedSearch).toHaveBeenCalledTimes(1)
        expect(detailedSearch).toHaveBeenLastCalledWith('kpi-a', expect.objectContaining({
            orderBy: -100,
            sortOrder: 'asc',
            startNum: 0,
        }))
        expect(container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="configurable-detailed-view"]',
        )).toBe(filtersScope)

        fireEvent.click(screen.getByRole('button', {name: 'Detailed'}))

        expect(screen.getByRole('dialog', {name: 'KPI picker'})).toBeTruthy()
        expect(detailedSearch).toHaveBeenCalledTimes(1)
        expect(screen.getByRole('button', {name: 'Detailed'}).getAttribute('aria-pressed')).toBe('true')

        fireEvent.click(screen.getByRole('button', {name: 'Apply KPI B'}))

        expect(screen.queryByText('KPI A row')).toBeNull()
        await waitFor(() => {
            expect(detailedSearch).toHaveBeenCalledTimes(2)
        })
        expect(detailedSearch).toHaveBeenLastCalledWith('kpi-b', expect.objectContaining({
            orderBy: -100,
            startNum: 0,
        }))

        fireEvent.click(screen.getByRole('button', {name: 'Detailed'}))
        fireEvent.click(screen.getByRole('button', {name: 'Apply KPI C'}))
        await waitFor(() => {
            expect(detailedSearch).toHaveBeenCalledTimes(3)
        })

        await act(async () => {
            kpiCResponse.resolve([{id: 'kpi-c', label: 'Current KPI C row'}])
            await kpiCResponse.promise
        })
        await waitFor(() => {
            expect(screen.getByText('Current KPI C row')).toBeTruthy()
        })

        await act(async () => {
            kpiBResponse.resolve([{id: 'kpi-b', label: 'Stale KPI B row'}])
            await kpiBResponse.promise
        })

        expect(screen.getByText('Current KPI C row')).toBeTruthy()
        expect(screen.queryByText('Stale KPI B row')).toBeNull()
    })

    it('does not refetch the active view when only an inactive view data key changes', async () => {
        const summarySearch = resolvedSearch('Active summary row')
        const operationsSearch = resolvedSearch('Inactive operations row')
        const riskSearch = resolvedSearch('Inactive risk row')
        const InactiveKeyHarness = ({riskKey}: {riskKey: string}) => <SearchUI<Row, ViewId>
            config={filtersConfig}
            possibleCriteria={[]}
            settingsContextName='inactive-key-settings'
            tableViews={{
                'aria-label': 'Inactive key views',
                onChange: () => undefined,
                value: 'summary',
                views: createViews({
                    summary: summarySearch,
                    operations: operationsSearch,
                    risk: riskSearch,
                }).map(view => view.id === 'risk'
                    ? {...view, searchDataKey: riskKey}
                    : view),
            }}
        />
        const view = render(<InactiveKeyHarness riskKey='risk-a'/>)

        await waitFor(() => {
            expect(screen.getByText('Active summary row')).toBeTruthy()
        })
        expect(summarySearch).toHaveBeenCalledTimes(1)

        view.rerender(<InactiveKeyHarness riskKey='risk-b'/>)
        await act(async () => {
            await Promise.resolve()
        })

        expect(summarySearch).toHaveBeenCalledTimes(1)
        expect(operationsSearch).not.toHaveBeenCalled()
        expect(riskSearch).not.toHaveBeenCalled()
    })

    it('keeps reset identities distinct when view IDs and data keys contain the same separators', async () => {
        type CollisionViewId = 'a|b' | 'a'
        const firstSearch = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockImplementation(params => Promise.resolve(
                params.startNum === 0
                    ? Array.from({length: 51}, (_, index) => ({
                        id: `first-${index}`,
                        label: `First row ${index}`,
                    }))
                    : [{id: 'first-page-two', label: 'First page two row'}],
            ))
        const secondSearch = resolvedSearch('Second view row')
        const CollisionHarness = () => {
            const [value, setValue] = React.useState<CollisionViewId>('a|b')
            const views: readonly SearchUIView<Row, CollisionViewId>[] = [
                {
                    id: 'a|b',
                    label: 'First collision view',
                    searchData: firstSearch,
                    searchDataKey: 'c',
                    createTableHeader: () => <tr><th>First collision header</th></tr>,
                    createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
                    sortOnActivate: {sortColumnIndex: 2, sortAsc: true},
                },
                {
                    id: 'a',
                    label: 'Second collision view',
                    searchData: secondSearch,
                    searchDataKey: 'b|c',
                    createTableHeader: () => <tr><th>Second collision header</th></tr>,
                    createTableRow: row => <tr key={row.id}><td>{row.label}</td></tr>,
                    sortOnActivate: {sortColumnIndex: 7, sortAsc: false},
                },
            ]

            return <SearchUI<Row, CollisionViewId>
                config={filtersConfig}
                possibleCriteria={[]}
                settingsContextName='collision-safe-view-settings'
                tableViews={{
                    'aria-label': 'Collision-safe views',
                    onChange: setValue,
                    value,
                    views,
                }}
            />
        }
        const {container} = render(<CollisionHarness/>)

        await waitFor(() => {
            expect(screen.getByText('First row 0')).toBeTruthy()
        })
        const bottomPagination = container.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        fireEvent.click(within(bottomPagination).getByRole('button', {name: 'next page'}))
        await waitFor(() => {
            expect(screen.getByText('First page two row')).toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', {name: 'Second collision view'}))

        expect(screen.queryByText('First page two row')).toBeNull()
        await waitFor(() => {
            expect(screen.getByText('Second view row')).toBeTruthy()
        })
        expect(secondSearch).toHaveBeenCalledTimes(1)
        expect(secondSearch).toHaveBeenLastCalledWith(expect.objectContaining({
            orderBy: 7,
            sortOrder: 'desc',
            startNum: 0,
        }))
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
