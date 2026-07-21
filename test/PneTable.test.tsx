import * as React from 'react'
import {act, render, screen, within} from '@testing-library/react'

import {
    PneHeaderTableCell,
    PneTable,
    PneTableRow,
    PneTableSortLabel,
    type PaginatorProps,
    type TableCreateHeaderType,
    type TableSortOptions,
} from '../src'
import {resolvePneTablePaginationActionsLayout} from '../src/component/table/PneTablePaginationActions'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type Row = {
    id: string
    label: string
}

type TableOptions = {
    createTableHeader?: TableCreateHeaderType
    feedback?: React.ReactNode
    loading?: boolean
    loadingKey?: string | number
    noRowsMessage?: string
    paginator?: PaginatorProps
    tableAriaLabel?: string
    tableAriaLabelledBy?: string
    sortOptions?: TableSortOptions
    toolbar?: React.ReactNode
}

const createTable = (
    autoTestId: string | undefined,
    row: Row | null,
    options: TableOptions = {},
) => (
    <PneTable<Row>
        autoTestId={autoTestId}
        data={row ? [row] : []}
        feedback={options.feedback}
        loading={options.loading}
        loadingKey={options.loadingKey}
        noRowsMessage={options.noRowsMessage}
        paginator={options.paginator}
        sortOptions={options.sortOptions}
        tableAriaLabel={options.tableAriaLabel}
        tableAriaLabelledBy={options.tableAriaLabelledBy}
        toolbar={options.toolbar}
        createTableHeader={options.createTableHeader ?? (() => (
            <tr>
                <th>Name</th>
            </tr>
        ))}
        createRow={item => (
            <tr key={item.id}>
                <td>{item.label}</td>
            </tr>
        )}
    />
)

const createPaginator = (duplicatePagination: boolean): PaginatorProps => ({
    rowsPerPageOptions: [10, 25],
    rowsPerPage: 10,
    page: 0,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    hasNext: true,
    disableActions: false,
    displayedRowsLabel: '1 - 1',
    paginationRef: {current: null},
    duplicatePagination,
})

describe('responsive pagination action layout', () => {
    const baseWidths = {
        hasToolbar: true,
        navigationMinimumWidth: 160,
        navigationPreferredWidth: 200,
        pageSizesWidth: 120,
        toolbarPreferredWidth: 240,
    }

    it('keeps all controls inline when their preferred widths fit', () => {
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 576,
        })).toBe('inline')
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 575,
        })).toBe('toolbar-stacked')
    })

    it('places the toolbar above a pagination row when only pagination fits', () => {
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 328,
        })).toBe('toolbar-stacked')
    })

    it('splits pagination only when its minimum width does not fit', () => {
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 280,
        })).toBe('pagination-stacked')
    })

    it('does not reserve a toolbar row when no toolbar exists', () => {
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 328,
            hasToolbar: false,
            toolbarPreferredWidth: 0,
        })).toBe('inline')
        expect(resolvePneTablePaginationActionsLayout({
            ...baseWidths,
            availableWidth: 280,
            hasToolbar: false,
            toolbarPreferredWidth: 0,
        })).toBe('pagination-stacked')
    })

    it('reacts to measured width changes while keeping DOM order aligned with visual order', () => {
        const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver')
        const resizeObservers: ResizeObserverMock[] = []

        class ResizeObserverMock {
            readonly observedElements: Element[] = []
            readonly callback: ResizeObserverCallback

            constructor(callback: ResizeObserverCallback) {
                this.callback = callback
                resizeObservers.push(this)
            }

            observe = jest.fn((element: Element) => {
                this.observedElements.push(element)
            })
            unobserve = jest.fn()
            disconnect = jest.fn()
        }

        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: ResizeObserverMock,
        })

        try {
            const {container, rerender} = render(createTable(
                'orders',
                {id: 'order-1', label: 'Order'},
                {
                    paginator: createPaginator(true),
                    toolbar: <button type='button'>Orders view</button>,
                },
            ))
            const actionBand = container.querySelector(
                '[data-autotest="pagination-actions"]',
            ) as HTMLElement
            const navigation = actionBand.querySelector(
                '[data-autotest="page-navigation"]',
            ) as HTMLElement
            const toolbar = actionBand.querySelector(
                '[data-autotest="pagination-toolbar"]',
            ) as HTMLElement
            const tableToolbar = toolbar.firstElementChild as HTMLElement
            const toolbarControl = tableToolbar.firstElementChild as HTMLElement
            const pageSizes = actionBand.querySelector(
                '[data-autotest="page-sizes"]',
            ) as HTMLElement
            const currentPage = actionBand.querySelector(
                '[data-autotest="current-page"]',
            ) as HTMLElement
            let availableWidth = 328
            let measuredPageSizesWidth = 120

            Object.defineProperties(actionBand, {
                clientWidth: {configurable: true, get: () => availableWidth},
            })
            Object.defineProperties(currentPage, {
                scrollWidth: {configurable: true, get: () => 80},
            })
            Object.defineProperties(toolbar, {
                scrollWidth: {configurable: true, get: () => availableWidth},
            })
            Object.defineProperties(tableToolbar, {
                scrollWidth: {configurable: true, get: () => availableWidth},
            })
            Object.defineProperties(toolbarControl, {
                scrollWidth: {configurable: true, get: () => 240},
            })
            Object.defineProperties(pageSizes, {
                scrollWidth: {configurable: true, get: () => measuredPageSizesWidth},
            })
            const topObserver = resizeObservers.find(observer => (
                observer.observedElements.includes(actionBand)
            ))

            const triggerResize = () => act(() => {
                topObserver?.callback([], topObserver as unknown as ResizeObserver)
            })

            triggerResize()

            expect(actionBand.dataset.autotestValue).toBe('toolbar-stacked')
            expect(Array.from(actionBand.children)).toEqual([toolbar, navigation, pageSizes])
            expect(window.getComputedStyle(toolbar).width).toBe('100%')

            availableWidth = 700
            triggerResize()

            expect(actionBand.dataset.autotestValue).toBe('inline')
            expect(Array.from(actionBand.children)).toEqual([navigation, toolbar, pageSizes])
            expect(actionBand.querySelector('[data-autotest="pagination-toolbar"]')).toBe(toolbar)

            measuredPageSizesWidth = 360
            availableWidth = 328
            triggerResize()

            expect(actionBand.dataset.autotestValue).toBe('pagination-stacked')
            expect(Array.from(actionBand.children)).toEqual([toolbar, navigation, pageSizes])
            expect(window.getComputedStyle(pageSizes).flexWrap).toBe('wrap')

            rerender(createTable(
                'orders',
                {id: 'order-1', label: 'Order'},
                {
                    paginator: createPaginator(true),
                    toolbar: <div data-testid='replacement-toolbar'>Selection controls</div>,
                },
            ))
            const replacementToolbar = screen.getByTestId('replacement-toolbar')

            expect(resizeObservers.some(observer => (
                observer.observedElements.includes(replacementToolbar)
            ))).toBe(true)
        } finally {
            if (resizeObserverDescriptor) {
                Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor)
            } else {
                Reflect.deleteProperty(window, 'ResizeObserver')
            }
        }
    })
})

describe('PneTable autotest scope', () => {
    it('gives multiple tables independent caller-supplied scopes', () => {
        const {container} = render(
            <>
                {createTable('orders', {id: 'order-1', label: 'Order'})}
                {createTable('transactions', {id: 'transaction-1', label: 'Transaction'})}
            </>,
        )

        const tableScopes = Array.from(
            container.querySelectorAll('[data-autotest="table"]'),
        )

        expect(tableScopes).toHaveLength(2)
        expect(tableScopes.map(scope => scope.getAttribute('data-autotest-value'))).toEqual([
            'orders',
            'transactions',
        ])
        expect(tableScopes.every(scope => scope.querySelector('table') !== null)).toBe(true)

        const [ordersScope, transactionsScope] = tableScopes as HTMLElement[]
        expect(within(ordersScope).getByText('Order').textContent).toBe('Order')
        expect(within(ordersScope).queryByText('Transaction')).toBeNull()
        expect(within(transactionsScope).getByText('Transaction').textContent).toBe('Transaction')
        expect(within(transactionsScope).queryByText('Order')).toBeNull()
    })

    it('keeps a generic table root when an instance identifier is omitted', () => {
        const {container} = render(
            createTable(undefined, {id: 'order-1', label: 'Order'}),
        )

        const tableScope = container.querySelector('[data-autotest="table"]')

        expect(tableScope).not.toBeNull()
        expect(tableScope?.hasAttribute('data-autotest-value')).toBe(false)
    })

    it('renders caller controls at the right edge when top pagination is absent', () => {
        const {container} = render(<>
            {createTable('orders', {id: 'order-1', label: 'Order'}, {
                toolbar: <button type='button'>Orders view</button>,
            })}
            {createTable('transactions', {id: 'transaction-1', label: 'Transaction'})}
        </>)

        const ordersScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        )
        const transactionsScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="transactions"]',
        )
        const toolbar = ordersScope?.querySelector('[data-autotest="table-toolbar"]')
        const topControls = toolbar?.parentElement

        expect(toolbar).not.toBeNull()
        expect(within(toolbar as HTMLElement).getByRole('button', {name: 'Orders view'})).toBeTruthy()
        expect(topControls?.getAttribute('data-autotest')).toBe('table-top-controls')
        expect(topControls?.nextElementSibling?.tagName).toBe('DIV')
        expect(ordersScope?.querySelector(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        )).toBeNull()
        expect(window.getComputedStyle(toolbar as HTMLElement).justifyContent).toBe('flex-end')
        expect(transactionsScope?.querySelector('[data-autotest="table-toolbar"]')).toBeNull()
    })

    it('merges caller controls into the responsive top pagination action band', () => {
        const {container} = render(createTable(
            'orders',
            {id: 'order-1', label: 'Order'},
            {
                paginator: createPaginator(true),
                toolbar: <button type='button'>Orders view</button>,
            },
        ))

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        ) as HTMLElement
        const topPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        ) as HTMLElement
        const topControls = topPagination.parentElement as HTMLElement
        const bottomPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        const toolbar = topPagination.querySelector(
            '[data-autotest="table-toolbar"]',
        ) as HTMLElement
        const pageSizes = topPagination.querySelector(
            '[data-autotest="page-sizes"]',
        ) as HTMLElement
        const navigation = topPagination.querySelector(
            '[data-autotest="page-navigation"]',
        ) as HTMLElement
        const paginationToolbar = topPagination.querySelector(
            '[data-autotest="pagination-toolbar"]',
        ) as HTMLElement
        const actionBand = navigation.parentElement as HTMLElement

        expect(toolbar).not.toBeNull()
        expect(topControls.getAttribute('data-autotest')).toBe('table-top-controls')
        expect(within(toolbar).getByRole('button', {name: 'Orders view'})).toBeTruthy()
        expect(bottomPagination.querySelector('[data-autotest="table-toolbar"]')).toBeNull()
        expect(Array.from(actionBand.children)).toEqual([
            navigation,
            paginationToolbar,
            pageSizes,
        ])
        expect(Array.from(paginationToolbar.children)).toEqual([toolbar])
        expect(actionBand.getAttribute('data-autotest')).toBe('pagination-actions')
        expect(actionBand.getAttribute('data-autotest-value')).toBe('inline')
        expect(window.getComputedStyle(actionBand).display).toBe('grid')
        expect(window.getComputedStyle(paginationToolbar).justifySelf).toBe('stretch')
        expect(window.getComputedStyle(paginationToolbar).width).toBe('100%')
        expect(window.getComputedStyle(pageSizes).justifySelf).toBe('end')
    })

    it('renders full-width feedback above and independently from top controls and pagination', () => {
        const {container} = render(createTable(
            'orders',
            {id: 'order-1', label: 'Order'},
            {
                feedback: <div role='alert'>A deliberately long table feedback message</div>,
                paginator: createPaginator(true),
                toolbar: <button type='button'>Orders view</button>,
            },
        ))

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        ) as HTMLElement
        const feedback = tableScope.querySelector(
            ':scope > [data-autotest="table-feedback"]',
        ) as HTMLElement
        const topControls = tableScope.querySelector(
            ':scope > [data-autotest="table-top-controls"]',
        ) as HTMLElement
        const topPagination = topControls.querySelector(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        ) as HTMLElement
        const bottomPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        const actionBand = topPagination.querySelector(
            '[data-autotest="pagination-actions"]',
        ) as HTMLElement

        expect(feedback).not.toBeNull()
        expect(feedback.nextElementSibling).toBe(topControls)
        expect(topControls.contains(feedback)).toBe(false)
        expect(topPagination.contains(feedback)).toBe(false)
        expect(bottomPagination.contains(feedback)).toBe(false)
        expect(window.getComputedStyle(feedback).width).toBe('100%')
        expect(actionBand.dataset.autotestValue).toBe('inline')
        expect(within(feedback).getByRole('alert').textContent).toBe(
            'A deliberately long table feedback message',
        )
    })

    it('keeps feedback above the table when only bottom pagination exists', () => {
        const {container} = render(createTable(
            'orders',
            {id: 'order-1', label: 'Order'},
            {
                feedback: 'Orders feedback',
                paginator: createPaginator(false),
            },
        ))
        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        ) as HTMLElement
        const feedback = tableScope.querySelector(
            ':scope > [data-autotest="table-feedback"]',
        ) as HTMLElement
        const tableContainer = feedback.nextElementSibling as HTMLElement
        const paginations = tableScope.querySelectorAll('[data-autotest="pagination"]')

        expect(tableScope.querySelector('[data-autotest="table-top-controls"]')).toBeNull()
        expect(tableContainer.querySelector('table')).not.toBeNull()
        expect(paginations).toHaveLength(1)
        expect(paginations[0].getAttribute('data-autotest-value')).toBe('bottom')
    })

    it('wraps primitive toolbar content in an element that can be measured', () => {
        const {container} = render(createTable(
            'orders',
            {id: 'order-1', label: 'Order'},
            {
                paginator: createPaginator(true),
                toolbar: 'Orders controls',
            },
        ))
        const toolbar = container.querySelector(
            '[data-autotest="table-toolbar"]',
        ) as HTMLElement

        expect(toolbar.firstElementChild).not.toBeNull()
        expect(toolbar.firstElementChild?.textContent).toBe('Orders controls')
    })

    it('separates top and bottom pagination within one table scope', () => {
        const {container} = render(
            createTable(
                'orders',
                {id: 'order-1', label: 'Order'},
                {paginator: createPaginator(true)},
            ),
        )

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"]',
        )
        const paginationScopes = Array.from(
            tableScope?.querySelectorAll('[data-autotest="pagination"]') ?? [],
        )

        expect(paginationScopes.map(scope => scope.getAttribute('data-autotest-value'))).toEqual([
            'top',
            'bottom',
        ])
        expect(paginationScopes.every(
            scope => scope.querySelectorAll('[data-autotest="next-page"]').length === 1,
        )).toBe(true)

        const topPagination = paginationScopes[0] as HTMLElement
        expect(
            (within(topPagination).getByRole('button', {name: 'first page'}) as HTMLButtonElement)
                .disabled,
        ).toBe(true)
        expect(
            (within(topPagination).getByRole('button', {name: 'previous page'}) as HTMLButtonElement)
                .disabled,
        ).toBe(true)
        expect(
            (within(topPagination).getByRole('button', {name: 'next page'}) as HTMLButtonElement)
                .disabled,
        ).toBe(false)
    })

    it('forwards accessible names to the semantic tables', () => {
        render(
            <>
                <h2 id="transactions-heading">Transactions</h2>
                {createTable(
                    'orders',
                    {id: 'order-1', label: 'Order'},
                    {tableAriaLabel: 'Orders'},
                )}
                {createTable(
                    'transactions',
                    {id: 'transaction-1', label: 'Transaction'},
                    {tableAriaLabelledBy: 'transactions-heading'},
                )}
            </>,
        )

        expect(
            screen.getByRole('table', {name: 'Orders'})
                .closest('[data-autotest="table"]')
                ?.getAttribute('data-autotest-value'),
        ).toBe('orders')
        expect(
            screen.getByRole('table', {name: 'Transactions'})
                .closest('[data-autotest="table"]')
                ?.getAttribute('data-autotest-value'),
        ).toBe('transactions')
    })

    it('exposes loading through aria-busy on the semantic table', () => {
        render(
            <>
                {createTable(
                    'orders',
                    {id: 'order-1', label: 'Order'},
                    {loading: true, tableAriaLabel: 'Orders'},
                )}
                {createTable(
                    'transactions',
                    {id: 'transaction-1', label: 'Transaction'},
                    {tableAriaLabel: 'Transactions'},
                )}
            </>,
        )

        expect(screen.getByRole('table', {name: 'Orders'}).getAttribute('aria-busy')).toBe('true')
        expect(
            screen.getByRole('table', {name: 'Transactions'}).getAttribute('aria-busy'),
        ).toBe('false')
    })

    it('shows structural loading immediately when the loading identity changes', () => {
        const view = render(createTable('orders', null, {
            loading: false,
            loadingKey: 'summary',
            tableAriaLabel: 'Orders',
        }))

        expect(view.container.querySelector('[data-autotest="empty-state"]')).not.toBeNull()

        view.rerender(createTable('orders', null, {
            loading: false,
            loadingKey: 'operations',
            tableAriaLabel: 'Orders',
        }))
        expect(view.container.querySelector('[data-autotest="empty-state"]')).not.toBeNull()

        view.rerender(createTable('orders', null, {
            loading: true,
            loadingKey: 'operations',
            tableAriaLabel: 'Orders',
        }))

        expect(screen.getByRole('table', {name: 'Orders'}).getAttribute('aria-busy')).toBe('true')
        expect(view.container.querySelector('[data-autotest="empty-state"]')).toBeNull()
    })

    it('marks the existing empty-result row within its table scope', () => {
        const {container} = render(
            createTable(
                'orders',
                null,
                {noRowsMessage: 'No orders', tableAriaLabel: 'Orders'},
            ),
        )

        const emptyState = container.querySelector(
            '[data-autotest="table"][data-autotest-value="orders"] '
            + '[data-autotest="empty-state"]',
        )

        expect(emptyState?.tagName).toBe('TR')
        expect(emptyState?.textContent).toBe('No orders')
    })

    it.each(['asc', 'desc'] as const)(
        'exposes only the active header as %s sorted',
        order => {
            const sortOptions: TableSortOptions = {
                order,
                sortIndex: 2,
                setOrder: jest.fn(),
                setSortIndex: jest.fn(),
                onSortChange: jest.fn(),
            }

            render(
                createTable(
                    'orders',
                    {id: 'order-1', label: 'Order'},
                    {
                        sortOptions,
                        tableAriaLabel: 'Orders',
                        createTableHeader: headerParams => (
                            <PneTableRow>
                                <PneHeaderTableCell>Static</PneHeaderTableCell>
                                <PneHeaderTableCell
                                    sortIndex={1}
                                    sortOptions={headerParams.sortOptions}
                                >
                                    <PneTableSortLabel
                                        sortIndex={1}
                                        sortOptions={headerParams.sortOptions}
                                    >
                                        ID
                                    </PneTableSortLabel>
                                </PneHeaderTableCell>
                                <PneHeaderTableCell
                                    sortIndex={2}
                                    sortOptions={headerParams.sortOptions}
                                >
                                    <PneTableSortLabel
                                        sortIndex={2}
                                        sortOptions={headerParams.sortOptions}
                                    >
                                        Name
                                    </PneTableSortLabel>
                                </PneHeaderTableCell>
                            </PneTableRow>
                        ),
                    },
                ),
            )

            const table = screen.getByRole('table', {name: 'Orders'})
            const headers = within(table).getAllByRole('columnheader')
            const sortedElements = table.querySelectorAll('[aria-sort]')

            expect(headers).toHaveLength(3)
            expect(headers[0].hasAttribute('aria-sort')).toBe(false)
            expect(headers[1].hasAttribute('aria-sort')).toBe(false)
            expect(headers[2].getAttribute('aria-sort')).toBe(
                order === 'asc' ? 'ascending' : 'descending',
            )
            expect(sortedElements).toHaveLength(1)
            expect(sortedElements[0].tagName).toBe('TH')
        },
    )
})
