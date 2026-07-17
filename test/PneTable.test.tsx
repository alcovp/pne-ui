import * as React from 'react'
import {render, screen, within} from '@testing-library/react'

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
        const navigation = within(topPagination)
            .getByRole('button', {name: 'first page'})
            .parentElement as HTMLElement
        const actionBand = navigation.parentElement as HTMLElement
        const endBand = pageSizes.parentElement as HTMLElement

        expect(toolbar).not.toBeNull()
        expect(topControls.getAttribute('data-autotest')).toBe('table-top-controls')
        expect(within(toolbar).getByRole('button', {name: 'Orders view'})).toBeTruthy()
        expect(bottomPagination.querySelector('[data-autotest="table-toolbar"]')).toBeNull()
        expect(Array.from(actionBand.children)).toEqual([navigation, endBand])
        expect(Array.from(endBand.children)).toEqual([toolbar, pageSizes])
        expect(window.getComputedStyle(actionBand).flexWrap).toBe('wrap')
        expect(window.getComputedStyle(endBand).flexWrap).toBe('wrap')
        expect(window.getComputedStyle(endBand).marginLeft).toBe('auto')
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
