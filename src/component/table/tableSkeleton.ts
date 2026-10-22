/**
 * Shape a loading skeleton takes from the table it stands in for.
 *
 * A skeleton convinces only when the rows replacing it keep its shape, so the
 * table remembers the shape of its last real rows: column widths, row height,
 * header height. That shape belongs to one column structure. Rows of one table
 * view say nothing about a view with other columns: Brief order widths forced
 * on the four Detailed columns squeezed them into a third of the table, beside
 * six columns that had no cells at all. The table therefore keeps one geometry
 * per loading identity and uses it only while the header still has as many
 * columns. Without one the skeleton follows the header it has, across the full
 * table width.
 */

export type SkeletonGeometry = {
    /** Columns of the header the geometry was measured with. */
    columnCount: number
    /** Column widths in percent of the table width; absent when no row has one cell per column. */
    columnPercents?: number[]
    /** Average height of a real row. */
    rowHeight?: number
    headerHeight: number
}

export type SkeletonAlign = 'left' | 'center' | 'right'

export type SkeletonColumn = {
    /** Where the header label sits; the bar below it sits there too. */
    align: SkeletonAlign
    /** Too narrow for a bar. */
    hidden: boolean
    /** Narrow columns get longer bars, so that a bar does not shrink to a dot. */
    narrow: boolean
}

const HIDDEN_COLUMN_WIDTH = 30
const NARROW_COLUMN_WIDTH = 120
const ALIGN_TOLERANCE = 2

const toPixels = (value: string): number => Number.parseFloat(value) || 0

const spanOf = (cell: HTMLTableCellElement): number => Math.max(1, cell.colSpan)

/** Number of columns a header row covers, spanned cells included. */
export const countRowColumns = (row: HTMLTableRowElement): number =>
    Array.from(row.cells).reduce((count, cell) => count + spanOf(cell), 0)

/**
 * Column widths read from the first row that has one cell per column. A spanned
 * cell cannot tell its columns apart, so rows with spans are skipped.
 */
export const measureColumnWidths = (
    table: HTMLTableElement,
    columnCount: number,
): number[] | undefined => {
    for (const row of Array.from(table.rows)) {
        const cells = Array.from(row.cells)
        if (cells.length === columnCount && cells.every(cell => spanOf(cell) === 1)) {
            return cells.map(cell => cell.getBoundingClientRect().width)
        }
    }

    return undefined
}

/**
 * Where the label of a header cell sits in the cell's content box. The visible
 * text is measured rather than the styles that place it: headers align their
 * labels through `text-align`, flex wrappers or sort labels alike.
 */
export const measureLabelAlign = (cell: HTMLTableCellElement): SkeletonAlign => {
    const document = cell.ownerDocument
    const view = document.defaultView
    const range = document.createRange()

    if (!view || typeof range.getBoundingClientRect !== 'function') {
        return 'left'
    }

    let labelLeft = Infinity
    let labelRight = -Infinity
    const walker = document.createTreeWalker(cell, view.NodeFilter.SHOW_TEXT)

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) {
            continue
        }

        range.selectNodeContents(node)
        const rect = range.getBoundingClientRect()
        if (rect.width > 0) {
            labelLeft = Math.min(labelLeft, rect.left)
            labelRight = Math.max(labelRight, rect.right)
        }
    }

    if (labelLeft > labelRight) {
        return 'left'
    }

    const style = view.getComputedStyle(cell)
    const box = cell.getBoundingClientRect()
    const leftGap = labelLeft - box.left - toPixels(style.borderLeftWidth) - toPixels(style.paddingLeft)
    const rightGap = box.right - toPixels(style.borderRightWidth) - toPixels(style.paddingRight) - labelRight

    if (leftGap <= ALIGN_TOLERANCE) {
        return 'left'
    }

    if (Math.abs(leftGap - rightGap) <= ALIGN_TOLERANCE) {
        return 'center'
    }

    return leftGap > rightGap ? 'right' : 'left'
}

/**
 * Bar placement for every column under the header row, spanned cells included.
 * A header that is not laid out (a hidden table) has no widths yet; its columns
 * keep their bars instead of being taken for too narrow ones.
 */
export const measureSkeletonColumns = (row: HTMLTableRowElement): SkeletonColumn[] =>
    Array.from(row.cells).flatMap(cell => {
        const span = spanOf(cell)
        const width = cell.getBoundingClientRect().width / span
        const column: SkeletonColumn = {
            align: measureLabelAlign(cell),
            hidden: width > 0 && width < HIDDEN_COLUMN_WIDTH,
            narrow: width > 0 && width < NARROW_COLUMN_WIDTH,
        }

        return Array.from({length: span}, () => column)
    })

export const isSameSkeletonColumns = (
    left: readonly SkeletonColumn[],
    right: readonly SkeletonColumn[],
): boolean => left.length === right.length && left.every((column, index) => (
    column.align === right[index].align
    && column.hidden === right[index].hidden
    && column.narrow === right[index].narrow
))
