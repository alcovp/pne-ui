import * as React from 'react'
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'

import {
    PneTable,
    useTable,
    type UseTableParams,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

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

const createRows = (prefix: string): Row[] => Array.from(
    {length: 11},
    (_, index) => ({id: `${prefix}-${index}`, label: `${prefix} ${index}`}),
)

const TableHarness = ({autoTestId, fetchData, fetchDataExtraDeps}: {
    autoTestId: string
    fetchData: FetchData
    fetchDataExtraDeps?: unknown[]
}) => {
    const table = useTable<Row>({
        duplicatePagination: true,
        fetchData,
        fetchDataExtraDeps,
        rowsPerPageOptions: [10],
    })

    return <PneTable<Row>
        autoTestId={autoTestId}
        data={table.data}
        paginator={table.paginator}
        createTableHeader={() => (
            <tr>
                <th>Name</th>
            </tr>
        )}
        createRow={row => (
            <tr key={row.id}>
                <td>{row.label}</td>
            </tr>
        )}
    />
}

const IsolationHarness = ({ordersFetch, transactionsFetch}: {
    ordersFetch: FetchData
    transactionsFetch: FetchData
}) => {
    const [transactionsVersion, setTransactionsVersion] = React.useState(0)

    return <>
        <TableHarness autoTestId="orders" fetchData={ordersFetch}/>
        <TableHarness
            autoTestId="transactions"
            fetchData={transactionsFetch}
            fetchDataExtraDeps={[transactionsVersion]}
        />
        <button
            type="button"
            onClick={() => setTransactionsVersion(version => version + 1)}
        >
            Refresh transactions
        </button>
    </>
}

const getPagination = (
    container: HTMLElement,
    tableId: string,
    position: 'top' | 'bottom',
): HTMLElement => {
    const pagination = container.querySelector(
        `[data-autotest="table"][data-autotest-value="${tableId}"] `
        + `[data-autotest="pagination"][data-autotest-value="${position}"]`,
    )

    if (!(pagination instanceof HTMLElement)) {
        throw new Error(`Missing ${position} pagination for ${tableId}`)
    }

    return pagination
}

describe('PneTable pagination isolation', () => {
    it('does not let another table consume a pending scroll request', async () => {
        const ordersNextPage = createDeferred<Row[]>()
        const transactionsRefresh = createDeferred<Row[]>()
        const ordersFetch: FetchData = ({page}) => page === 0
            ? Promise.resolve(createRows('order'))
            : ordersNextPage.promise
        let transactionsFetchCount = 0
        const transactionsFetch: FetchData = () => {
            transactionsFetchCount += 1
            return transactionsFetchCount === 1
                ? Promise.resolve(createRows('transaction'))
                : transactionsRefresh.promise
        }
        const scrolledElements: HTMLElement[] = []
        const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
            HTMLElement.prototype,
            'scrollIntoView',
        )
        const scrollIntoView = jest.fn(function (this: HTMLElement) {
            scrolledElements.push(this)
        })

        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView,
        })

        try {
            const {container} = render(
                <IsolationHarness
                    ordersFetch={ordersFetch}
                    transactionsFetch={transactionsFetch}
                />,
            )

            const ordersBottom = getPagination(container, 'orders', 'bottom')
            const getOrdersNext = () => within(
                getPagination(container, 'orders', 'bottom'),
            ).getByRole('button', {name: 'next page'}) as HTMLButtonElement

            await waitFor(() => {
                expect(getOrdersNext().disabled).toBe(false)
            })

            jest.useFakeTimers()
            try {
                fireEvent.click(getOrdersNext())
                fireEvent.click(screen.getByRole('button', {name: 'Refresh transactions'}))

                await act(async () => {
                    transactionsRefresh.resolve(createRows('transaction-next'))
                    await transactionsRefresh.promise
                })
                act(() => jest.advanceTimersByTime(100))

                expect(scrollIntoView).not.toHaveBeenCalled()

                await act(async () => {
                    ordersNextPage.resolve(createRows('order-next'))
                    await ordersNextPage.promise
                })
                act(() => jest.advanceTimersByTime(100))

                expect(scrollIntoView).toHaveBeenCalledTimes(1)

                expect(scrolledElements[0].getAttribute('data-autotest-value')).toBe('bottom')
                expect(
                    scrolledElements[0]
                        .closest('[data-autotest="table"]')
                        ?.getAttribute('data-autotest-value'),
                ).toBe('orders')
            } finally {
                jest.useRealTimers()
            }
        } finally {
            if (scrollIntoViewDescriptor) {
                Object.defineProperty(
                    HTMLElement.prototype,
                    'scrollIntoView',
                    scrollIntoViewDescriptor,
                )
            } else {
                Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
            }
        }
    })
})
