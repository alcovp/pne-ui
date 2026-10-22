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

const JUSTIFY_ALIGN: Readonly<Record<string, SkeletonAlign>> = {
    center: 'center',
    end: 'right',
    'flex-end': 'right',
    right: 'right',
}

const TEXT_ALIGN: Readonly<Record<string, SkeletonAlign>> = {
    '-webkit-center': 'center',
    '-webkit-right': 'right',
    center: 'center',
    end: 'right',
    right: 'right',
}

const isFlex = (display: string): boolean => display === 'flex' || display === 'inline-flex'

/**
 * Alignment that the header styles ask for, from the label up to the cell: a flex
 * row that centres or right-aligns it, or the text alignment of the first block
 * that places it. Flex items and inline boxes, a sort label among them, are
 * placed by their container, so the walk goes on to it.
 */
const styledLabelAlign = (cell: HTMLTableCellElement, label: Node, view: Window): SkeletonAlign => {
    for (let element = label.parentElement; element && cell.contains(element); element = element.parentElement) {
        const style = view.getComputedStyle(element)
        if (isFlex(style.display) && !style.flexDirection.startsWith('column')) {
            const align = JUSTIFY_ALIGN[style.justifyContent]
            if (align) {
                return align
            }
        }

        const parent = element === cell ? null : element.parentElement
        const placedByParent = parent !== null
            && (isFlex(view.getComputedStyle(parent).display) || style.display.startsWith('inline'))
        if (!placedByParent) {
            return isFlex(style.display) ? 'left' : TEXT_ALIGN[style.textAlign] ?? 'left'
        }
    }

    return 'left'
}

/**
 * Where the label of a header cell sits in the cell's content box. The visible
 * text is measured rather than the styles that place it: headers align their
 * labels through `text-align`, flex wrappers or sort labels alike. A label that
 * fills its narrow cell sits everywhere at once; its styles decide then, so that
 * a centred Card header keeps a centred bar in a 55px column.
 */
export const measureLabelAlign = (cell: HTMLTableCellElement): SkeletonAlign => {
    const document = cell.ownerDocument
    const view = document.defaultView
    const range = document.createRange()

    if (!view || typeof range.getBoundingClientRect !== 'function') {
        return 'left'
    }

    let label: Node | undefined
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
            label = label ?? node
            labelLeft = Math.min(labelLeft, rect.left)
            labelRight = Math.max(labelRight, rect.right)
        }
    }

    if (!label) {
        return 'left'
    }

    const style = view.getComputedStyle(cell)
    const box = cell.getBoundingClientRect()
    const leftGap = labelLeft - box.left - toPixels(style.borderLeftWidth) - toPixels(style.paddingLeft)
    const rightGap = box.right - toPixels(style.borderRightWidth) - toPixels(style.paddingRight) - labelRight

    if (leftGap <= ALIGN_TOLERANCE && rightGap <= ALIGN_TOLERANCE) {
        return styledLabelAlign(cell, label, view)
    }

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
