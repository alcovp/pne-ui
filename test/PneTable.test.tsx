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
    const renderActionBand = () => {
        const {container} = render(createTable(
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

        return {
            actionBand,
            navigation: actionBand.querySelector(
                '[data-autotest="page-navigation"]',
            ) as HTMLElement,
            pageSizes: actionBand.querySelector(
                '[data-autotest="page-sizes"]',
            ) as HTMLElement,
            toolbar: actionBand.querySelector(
                '[data-autotest="pagination-toolbar"]',
            ) as HTMLElement,
        }
    }

    const paginationGroupOf = (actionBand: HTMLElement) =>
        actionBand.children[1] as HTMLElement

    it('keeps one DOM order and never observes the layout it produced', () => {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver')
        const constructed: unknown[] = []

        class ResizeObserverMock {
            constructor() {
                constructed.push(this)
            }

            observe = jest.fn()
            unobserve = jest.fn()
            disconnect = jest.fn()
        }

        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: ResizeObserverMock,
        })

        try {
            const {actionBand, navigation, pageSizes, toolbar} = renderActionBand()
            const paginationGroup = paginationGroupOf(actionBand)

            expect(constructed).toHaveLength(0)
            // Toolbar first, then the pagination as one group that cannot be split.
            expect(Array.from(actionBand.children)).toEqual([toolbar, paginationGroup])
            expect(Array.from(paginationGroup.children)).toEqual([navigation, pageSizes])
            expect(actionBand.hasAttribute('data-autotest-value')).toBe(false)
        } finally {
            if (descriptor) {
                Object.defineProperty(window, 'ResizeObserver', descriptor)
            } else {
                Reflect.deleteProperty(window, 'ResizeObserver')
            }
        }
    })

    /*
     * The rows themselves are placed by `@container` rules, which jsdom does not
     * evaluate, so the three resulting layouts are asserted on real geometry by
     * the GatesControls* stories. What is verifiable here is the widest layout and
     * the placement contract those rules switch between.
     */
    it('places the groups in named grid areas, pagination never split by the toolbar', () => {
        const {actionBand, navigation, pageSizes, toolbar} = renderActionBand()
        const bandStyle = window.getComputedStyle(actionBand)

        expect(bandStyle.display).toBe('grid')
        expect(bandStyle.gridTemplateAreas).toBe('"navigation toolbar sizes"')
        expect(window.getComputedStyle(navigation).gridArea).toBe('navigation')
        expect(window.getComputedStyle(toolbar).gridArea).toBe('toolbar')
        expect(window.getComputedStyle(pageSizes).gridArea).toBe('sizes')

        /*
         * Transparent in the single-row layout, so the halves take the outer
         * areas with the toolbar between them; the container query turns it into
         * a real row that wraps by content.
         */
        expect(window.getComputedStyle(paginationGroupOf(actionBand)).display).toBe('contents')

        /*
         * The band is wrapped in a stretched query container so the rows are
         * chosen from the band's own width rather than the viewport. jsdom does
         * not know `container-type`, so the story checks that property in Chrome;
         * here we can only pin the wrapper down.
         */
        expect(window.getComputedStyle(actionBand.parentElement as HTMLElement).width)
            .toBe('100%')
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
        const actionBand = topPagination.querySelector(
            '[data-autotest="pagination-actions"]',
        ) as HTMLElement
        const paginationGroup = navigation.parentElement as HTMLElement

        expect(toolbar).not.toBeNull()
        expect(topControls.getAttribute('data-autotest')).toBe('table-top-controls')
        expect(within(toolbar).getByRole('button', {name: 'Orders view'})).toBeTruthy()
        expect(bottomPagination.querySelector('[data-autotest="table-toolbar"]')).toBeNull()
        expect(Array.from(actionBand.children)).toEqual([paginationToolbar, paginationGroup])
        expect(Array.from(paginationGroup.children)).toEqual([navigation, pageSizes])
        expect(Array.from(paginationToolbar.children)).toEqual([toolbar])
        expect(actionBand.getAttribute('data-autotest')).toBe('pagination-actions')
        expect(window.getComputedStyle(actionBand).display).toBe('grid')
        expect(window.getComputedStyle(paginationToolbar).justifySelf).toBe('stretch')
        expect(window.getComputedStyle(paginationToolbar).justifyContent).toBe('flex-end')
        expect(window.getComputedStyle(pageSizes).justifyContent).toBe('flex-end')
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
        expect(actionBand).not.toBeNull()
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
