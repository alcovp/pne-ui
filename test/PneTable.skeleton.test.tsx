import * as React from 'react'
import {act, render} from '@testing-library/react'

import {PneTable} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type Row = {
    id: string
}

type Column = {
    label: string
    width: number
    left?: number
    /** Horizontal extent of the label text, as `left:right`. */
    labelBox?: string
    colSpan?: number
}

const BRIEF: Column[] = [
    {label: 'Date', width: 500},
    {label: 'ID', width: 300},
    {label: 'Amount', width: 200},
]

const DETAILED: Column[] = [
    {label: 'Date', width: 700},
    {label: 'Details', width: 300},
]

const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
}) as DOMRect

const renderTable = (
    columns: Column[],
    options: {loading: boolean, loadingKey?: string, rows: Row[], skeletonRowHeight?: number},
) => (
    <PneTable<Row>
        data={options.rows}
        loading={options.loading}
        loadingKey={options.loadingKey}
        skeletonRowHeight={options.skeletonRowHeight}
        tableAriaLabel='Orders'
        createTableHeader={() => (
            <tr>
                {columns.map(column => (
                    <th
                        key={column.label}
                        colSpan={column.colSpan}
                        data-left={column.left}
                        data-width={column.width}
                    >
                        <span data-label-box={column.labelBox}>{column.label}</span>
                    </th>
                ))}
            </tr>
        )}
        createRow={item => (
            <tr key={item.id}>
                {columns.map(column => <td key={column.label}>{item.id}</td>)}
            </tr>
        )}
    />
)

const getTable = (container: HTMLElement) => container.querySelector('table') as HTMLTableElement

const getColumnWidths = (container: HTMLElement) => Array.from(
    getTable(container).querySelectorAll(':scope > colgroup > col'),
).map(column => (column as HTMLElement).style.width)

const getFirstBodyRow = (container: HTMLElement) =>
    getTable(container).tBodies[0].rows[0]

const getBars = (container: HTMLElement) => Array.from(getFirstBodyRow(container).cells)
    .map(cell => cell.querySelector<HTMLElement>('.MuiSkeleton-root'))

describe('PneTable skeleton geometry', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
            this: HTMLElement,
        ) {
            if (this.tagName === 'TABLE') {
                return rect(0, 0, 1000, 100)
            }
            if (this.tagName === 'THEAD') {
                return rect(0, 0, 1000, 40)
            }

            return rect(Number(this.dataset.left ?? 0), 0, Number(this.dataset.width ?? 0), 30)
        })
        // A two-column view has taller rows than a three-column one.
        jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
            this: HTMLElement,
        ) {
            if (!this.classList.contains('MuiTableContainer-root')) {
                return 0
            }

            return this.querySelectorAll('thead th').length === 2 ? 160 : 100
        })
        Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
            configurable: true,
            value: function (this: Range) {
                const box = this.startContainer.parentElement?.dataset.labelBox
                if (!box) {
                    return rect(0, 0, 0, 0)
                }

                const [left, right] = box.split(':').map(Number)
                return rect(left, 0, right - left, 16)
            },
        })
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
        delete (Range.prototype as Partial<Range>).getBoundingClientRect
    })

    const finishLoading = (
        view: ReturnType<typeof render>,
        columns: Column[],
        loadingKey: string,
    ) => {
        view.rerender(renderTable(columns, {loading: false, loadingKey, rows: [{id: loadingKey}]}))
        act(() => {
            jest.advanceTimersByTime(600)
        })
    }

    it('keeps the geometry of each view and never lends it to another view', () => {
        const view = render(renderTable(BRIEF, {loading: false, loadingKey: 'brief', rows: [{id: 'brief'}]}))

        view.rerender(renderTable(DETAILED, {loading: true, loadingKey: 'full', rows: []}))

        // Detailed has not been shown with rows yet: its columns follow its own header
        // across the full table, with as many skeleton cells as header columns.
        expect(getTable(view.container).getAttribute('aria-busy')).toBe('true')
        expect(getColumnWidths(view.container)).toEqual([])
        expect(getFirstBodyRow(view.container).cells).toHaveLength(2)
        expect(getBars(view.container).map(bar => bar?.style.height)).toEqual(['', ''])

        finishLoading(view, DETAILED, 'full')
        view.rerender(renderTable(BRIEF, {loading: true, loadingKey: 'brief', rows: []}))

        expect(getColumnWidths(view.container)).toEqual(['50%', '30%', '20%'])
        expect(getFirstBodyRow(view.container).cells).toHaveLength(3)
        // Brief rows are (100 - 40) / 1 = 60px high; bars keep 18px of padding and borders.
        expect(getBars(view.container).map(bar => bar?.style.height)).toEqual(['42px', '42px', '42px'])

        finishLoading(view, BRIEF, 'brief')
        view.rerender(renderTable(DETAILED, {loading: true, loadingKey: 'full', rows: []}))

        expect(getColumnWidths(view.container)).toEqual(['70%', '30%'])
        expect(getFirstBodyRow(view.container).cells).toHaveLength(2)
        expect(getBars(view.container).map(bar => bar?.style.height)).toEqual(['102px', '102px'])
    })

    it('starts a view from its preset row height and then follows its real rows', () => {
        const view = render(renderTable(BRIEF, {loading: false, loadingKey: 'brief', rows: [{id: 'brief'}]}))

        view.rerender(renderTable(DETAILED, {
            loading: true,
            loadingKey: 'full',
            rows: [],
            skeletonRowHeight: 90,
        }))

        expect(getBars(view.container).map(bar => bar?.style.height)).toEqual(['72px', '72px'])

        view.rerender(renderTable(DETAILED, {
            loading: false,
            loadingKey: 'full',
            rows: [{id: 'full'}],
            skeletonRowHeight: 90,
        }))
        act(() => {
            jest.advanceTimersByTime(600)
        })
        view.rerender(renderTable(BRIEF, {loading: true, loadingKey: 'brief', rows: []}))
        finishLoading(view, BRIEF, 'brief')
        view.rerender(renderTable(DETAILED, {
            loading: true,
            loadingKey: 'full',
            rows: [],
            skeletonRowHeight: 90,
        }))

        // Real Detailed rows were (160 - 40) / 1 = 120px high.
        expect(getBars(view.container).map(bar => bar?.style.height)).toEqual(['102px', '102px'])
    })

    it('drops a remembered geometry when the header no longer has as many columns', () => {
        const view = render(renderTable(BRIEF, {loading: false, rows: [{id: 'brief'}]}))

        view.rerender(renderTable(DETAILED, {loading: true, rows: []}))
        act(() => {
            jest.advanceTimersByTime(400)
        })

        expect(getTable(view.container).getAttribute('aria-busy')).toBe('true')
        expect(getColumnWidths(view.container)).toEqual([])
        expect(getFirstBodyRow(view.container).cells).toHaveLength(2)
    })

    it('places every bar where its header label sits', () => {
        const view = render(renderTable([
            {label: 'Date', left: 0, width: 300, labelBox: '0:60'},
            {label: 'Amount', left: 300, width: 200, labelBox: '440:500'},
            {label: 'Card', left: 500, width: 100, labelBox: '530:570'},
            {label: 'Flag', left: 600, width: 20, labelBox: '600:620'},
        ], {loading: true, rows: []}))

        const bars = getBars(view.container)

        expect(bars[0]?.style.marginLeft).toBe('')
        expect(bars[1]?.style.marginLeft).toBe('auto')
        expect(bars[1]?.style.marginRight).toBe('')
        expect(bars[2]?.style.marginLeft).toBe('auto')
        expect(bars[2]?.style.marginRight).toBe('auto')
        // Too narrow for a bar.
        expect(bars[3]).toBeNull()

        // Wide columns vary bars between 40% and 80%, narrow ones between 60% and 90%,
        // so a narrow bar never fills its cell and its alignment stays visible.
        const percent = (bar: HTMLElement | null) => Number.parseFloat(bar?.style.width ?? '')
        expect(percent(bars[0])).toBeGreaterThanOrEqual(40)
        expect(percent(bars[0])).toBeLessThan(80)
        expect(percent(bars[2])).toBeGreaterThanOrEqual(60)
        expect(percent(bars[2])).toBeLessThan(90)
    })

    it('gives spanned header columns their own skeleton and empty-state cells', () => {
        const columns: Column[] = [
            {label: 'Level', width: 400, colSpan: 2},
            {label: 'Name', width: 200},
        ]
        const view = render(renderTable(columns, {loading: true, rows: []}))

        expect(getFirstBodyRow(view.container).cells).toHaveLength(3)

        view.rerender(renderTable(columns, {loading: false, rows: []}))
        act(() => {
            jest.advanceTimersByTime(600)
        })

        const emptyState = view.container.querySelector<HTMLTableCellElement>(
            '[data-autotest="empty-state"] td',
        )
        expect(emptyState?.colSpan).toBe(3)
    })
})
