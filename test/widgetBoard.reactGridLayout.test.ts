import type { Layout } from 'react-grid-layout'
import {
    applyUserResizeMinWidths,
    getResizeMinColumnSpan,
} from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'

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
})
