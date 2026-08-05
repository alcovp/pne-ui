import type { Layout } from 'react-grid-layout'
import {
    applyUserResizeMinWidths,
    getResizeMinColumnSpan,
    resolveReactGridLayoutCompactor,
    toBoardItems,
    toReactGridLayout,
} from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'
import {
    DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING,
    type WidgetBoardItemData,
    type WidgetBoardReactGridLayoutCollisionBehavior,
    type WidgetBoardReactGridLayoutCompaction,
} from '../src/component/widget-board/types'
import type { BoardProps } from '@cloudscape-design/board-components/board'

describe('WidgetBoard React Grid Layout constraints', () => {
    it('uses vertical compaction with push behavior as the public default', () => {
        expect(DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING).toEqual({
            compaction: 'vertical',
            collisionBehavior: 'push',
        })
    })

    it.each([
        { compaction: 'none', collisionBehavior: 'push', type: null, preventCollision: undefined },
        { compaction: 'vertical', collisionBehavior: 'push', type: 'vertical', preventCollision: undefined },
        { compaction: 'none', collisionBehavior: 'prevent', type: null, preventCollision: true },
        { compaction: 'vertical', collisionBehavior: 'prevent', type: 'vertical', preventCollision: true },
    ] satisfies Array<{
        compaction: WidgetBoardReactGridLayoutCompaction
        collisionBehavior: WidgetBoardReactGridLayoutCollisionBehavior
        type: 'vertical' | null
        preventCollision: true | undefined
    }>)('maps $compaction + $collisionBehavior to the matching RGL compactor', ({
        compaction,
        collisionBehavior,
        type,
        preventCollision,
    }) => {
        const compactor = resolveReactGridLayoutCompactor(compaction, collisionBehavior)

        expect(compactor.type).toBe(type)
        expect(compactor.preventCollision).toBe(preventCollision)
        expect(compactor.allowOverlap).toBe(false)
    })

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

        expect(toReactGridLayout(items, 12, 'edit')[0]).toMatchObject({
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

})
