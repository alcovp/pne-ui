import type { Layout } from 'react-grid-layout'
import {
    applyUserResizeMinWidths,
    getResizeMinColumnSpan,
    toBoardItems,
    toReactGridLayout,
} from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'
import type { WidgetBoardItemData } from '../src/component/widget-board/types'
import type { BoardProps } from '@cloudscape-design/board-components/board'

describe('WidgetBoard React Grid Layout constraints', () => {
    it('converts a pixel minimum to grid units using the measured grid geometry', () => {
        expect(
            getResizeMinColumnSpan({
                columns: 12,
                containerPadding: [0, 0],
                containerWidth: 1200,
                margin: [0, 0],
                minWidthPx: 350,
            }),
        ).toBe(4)

        expect(
            getResizeMinColumnSpan({
                columns: 4,
                containerPadding: [10, 0],
                containerWidth: 1000,
                margin: [20, 0],
                minWidthPx: 470,
            }),
        ).toBe(2)
    })

    it('adds a dynamic minW only in edit mode without clamping the current span', () => {
        const layout: Layout = [
            {
                i: 'payment',
                x: 0,
                y: 0,
                w: 2,
                h: 2,
                minW: 1,
            },
        ]

        const wide = applyUserResizeMinWidths({
            columns: 6,
            containerPadding: [0, 0],
            containerWidth: 1200,
            interactionMode: 'edit',
            layout,
            margin: [0, 0],
            minWidthPxByWidgetId: { payment: 500 },
        })
        const narrow = applyUserResizeMinWidths({
            columns: 6,
            containerPadding: [0, 0],
            containerWidth: 600,
            interactionMode: 'edit',
            layout,
            margin: [0, 0],
            minWidthPxByWidgetId: { payment: 500 },
        })

        expect(wide[0]).toMatchObject({ w: 2, minW: 3 })
        expect(narrow[0]).toMatchObject({ w: 2, minW: 5 })
        expect(layout[0]).toMatchObject({ w: 2, minW: 1 })
    })

    it('does not apply the pixel minimum in view mode and keeps static minW authoritative', () => {
        const layout: Layout = [
            { i: 'status', x: 0, y: 0, w: 2, h: 2, minW: 4 },
        ]

        expect(
            applyUserResizeMinWidths({
                columns: 12,
                containerPadding: [0, 0],
                containerWidth: 1200,
                interactionMode: 'view',
                layout,
                margin: [0, 0],
                minWidthPxByWidgetId: { status: 800 },
            }),
        ).toBe(layout)

        expect(
            applyUserResizeMinWidths({
                columns: 12,
                containerPadding: [0, 0],
                containerWidth: 1200,
                interactionMode: 'edit',
                layout,
                margin: [0, 0],
                minWidthPxByWidgetId: { status: 250 },
            })[0],
        ).toMatchObject({ w: 2, minW: 4 })
    })

    it('locks the RGL height to the autosized source height while grid edit stays horizontally resizable', () => {
        const items: BoardProps.Item<WidgetBoardItemData>[] = [
            {
                id: 'payment',
                columnSpan: 4,
                rowSpan: 9,
                columnOffset: { 12: 2 },
                definition: {
                    defaultColumnSpan: 4,
                    defaultRowSpan: 3,
                    minColumnSpan: 2,
                    minRowSpan: 2,
                },
                data: { id: 'payment', title: 'Payment' },
            },
        ]

        expect(toReactGridLayout(items, 12, 'edit', 'grid')[0]).toMatchObject({
            i: 'payment',
            x: 2,
            w: 4,
            h: 9,
            minH: 9,
            maxH: 9,
            isDraggable: true,
            isResizable: true,
        })

        const resized = toBoardItems(
            [{ i: 'payment', x: 1, y: 0, w: 6, h: 2 }],
            items,
            12,
        )
        expect(resized[0]).toMatchObject({
            columnSpan: 6,
            rowSpan: 9,
            columnOffset: { 12: 1 },
        })
    })

    it('uses full-width synthetic rows in order-only edit and reorders without changing geometry', () => {
        const items: BoardProps.Item<WidgetBoardItemData>[] = [
            {
                id: 'a',
                columnSpan: 3,
                rowSpan: 7,
                columnOffset: { 6: 1 },
                data: { id: 'a', title: 'A' },
            },
            {
                id: 'b',
                columnSpan: 2,
                rowSpan: 11,
                columnOffset: { 6: 4 },
                data: { id: 'b', title: 'B' },
            },
        ]

        expect(toReactGridLayout(items, 6, 'edit', 'order-only')).toEqual([
            expect.objectContaining({
                i: 'a',
                x: 0,
                y: 0,
                w: 6,
                h: 1,
                minW: 6,
                maxW: 6,
                minH: 1,
                maxH: 1,
                isDraggable: true,
                isResizable: false,
            }),
            expect.objectContaining({ i: 'b', x: 0, y: 1, w: 6, h: 1 }),
        ])

        const reordered = toBoardItems(
            [
                { i: 'a', x: 0, y: 1, w: 6, h: 1 },
                { i: 'b', x: 0, y: 0, w: 6, h: 1 },
            ],
            items,
            6,
            true,
        )

        expect(reordered).toEqual([items[1], items[0]])
        expect(reordered[0]).toBe(items[1])
        expect(reordered[1]).toBe(items[0])
    })
})
