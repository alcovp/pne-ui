import { buildPresetFromState } from '../src/component/widget-board/layoutPersistence'
import type {
    BreakpointLayoutConfig,
    WidgetBoardState,
    WidgetDefinition,
} from '../src/component/widget-board/types'
import {
    buildDefaultState,
    buildLayoutOptions,
    normalizeLayoutByBreakpoint,
    withLayout,
} from '../src/component/widget-board/widgetBoardLayoutUtils'

const defaultLayouts: Record<string, BreakpointLayoutConfig> = {
    narrow: {
        columns: 2,
        rowHeight: 16,
        margin: [4, 6],
        containerPadding: [8, 10],
        widgetOrder: ['a', 'b'],
        widgets: {
            a: {
                defaultSize: { columnSpan: 2, rowSpan: 3 },
                limits: { minColumnSpan: 2, minRowSpan: 2 },
                heightMode: 'auto',
            },
            b: {
                defaultSize: { columnSpan: 1, rowSpan: 2 },
                limits: { minColumnSpan: 1, minRowSpan: 2 },
            },
        },
    },
    wide: {
        columns: 12,
        rowHeight: 24,
        margin: [0, 0],
        containerPadding: null,
        widgetOrder: ['b', 'a'],
        widgets: {
            a: {
                defaultSize: { columnSpan: 9, rowSpan: 4 },
                limits: { minColumnSpan: 4, minRowSpan: 2 },
            },
            b: {
                defaultSize: { columnSpan: 3, rowSpan: 4 },
                limits: { minColumnSpan: 2, minRowSpan: 2 },
            },
        },
    },
}

describe('WidgetBoard layout normalization', () => {
    it('layers user-owned width and state over code-owned engine geometry, height, and limits', () => {
        const normalized = normalizeLayoutByBreakpoint(
            {
                narrow: {
                    columns: 99,
                    rowHeight: 999,
                    margin: [99, 99],
                    containerPadding: [99, 99],
                    widgetOrder: ['b'],
                    widgets: {
                        a: {
                            defaultSize: {
                                columnSpan: 1,
                                rowSpan: 7,
                                columnOffset: { 2: 1 },
                            },
                            limits: { minColumnSpan: 1, minRowSpan: 1 },
                            initialState: { isHidden: true, isCollapsed: true },
                            heightMode: 'fixed',
                        },
                    },
                },
                640: {
                    columns: 1,
                    widgets: {},
                },
            },
            defaultLayouts,
            ['narrow', 'wide'],
        )

        expect(Object.keys(normalized)).toEqual(['narrow', 'wide'])
        expect(normalized.narrow).toMatchObject({
            columns: 2,
            rowHeight: 16,
            margin: [4, 6],
            containerPadding: [8, 10],
            widgetOrder: ['b', 'a'],
        })
        expect(normalized.narrow.widgets.a).toEqual({
            defaultSize: {
                columnSpan: 1,
                rowSpan: 3,
                columnOffset: { 2: 1 },
            },
            limits: { minColumnSpan: 2, minRowSpan: 2 },
            initialState: { isHidden: true, isCollapsed: true },
            heightMode: 'auto',
        })
        expect(normalized.narrow.widgets.b).toEqual(defaultLayouts.narrow.widgets.b)
        expect(normalized.wide).toEqual(defaultLayouts.wide)
    })

    it('normalizes every loaded custom option against current code defaults', () => {
        const options = buildLayoutOptions(
            [
                {
                    id: 'custom',
                    name: 'Custom',
                    layoutByBreakpoint: {
                        narrow: {
                            columns: 1,
                            widgets: {
                                a: { defaultSize: { columnSpan: 1, rowSpan: 5 } },
                            },
                        },
                    },
                },
            ],
            {
                id: 'default',
                name: 'Default',
                layoutByBreakpoint: defaultLayouts,
            },
            ['narrow', 'wide'],
        )

        expect(options.map(option => option.id)).toEqual(['default', 'custom'])
        expect(options[1].layoutByBreakpoint.narrow.columns).toBe(2)
        expect(options[1].layoutByBreakpoint.narrow.widgets.b).toEqual(
            defaultLayouts.narrow.widgets.b,
        )
        expect(options[1].layoutByBreakpoint.wide).toEqual(defaultLayouts.wide)
    })

    it('drops stale saved engine geometry and limits when code defaults leave them unset', () => {
        const normalized = normalizeLayoutByBreakpoint(
            {
                compact: {
                    columns: 99,
                    rowHeight: 999,
                    margin: [99, 99],
                    containerPadding: [99, 99],
                    widgets: {
                        a: {
                            defaultSize: { columnSpan: 1, rowSpan: 7 },
                            limits: { minColumnSpan: 9, minRowSpan: 9 },
                        },
                    },
                },
            },
            {
                compact: {
                    widgets: {
                        a: {
                            defaultSize: { columnSpan: 2, rowSpan: 3 },
                        },
                    },
                },
            },
            ['compact'],
        )

        expect(normalized.compact).toMatchObject({
            columns: undefined,
            rowHeight: undefined,
            margin: undefined,
            containerPadding: undefined,
        })
        expect(normalized.compact.widgets.a).toEqual({
            defaultSize: { columnSpan: 1, rowSpan: 3 },
            limits: undefined,
            initialState: undefined,
            heightMode: undefined,
        })
    })
})

describe('WidgetBoard per-breakpoint persistence', () => {
    const persistenceBase: Record<string, BreakpointLayoutConfig> = {
        narrow: {
            columns: 3,
            rowHeight: 16,
            margin: [0, 0],
            containerPadding: [0, 0],
            widgetOrder: ['a', 'b', 'c'],
            widgets: {
                a: {
                    defaultSize: { columnSpan: 1, rowSpan: 4, columnOffset: { 3: 0 } },
                    limits: { minColumnSpan: 1, minRowSpan: 2 },
                    heightMode: 'fixed',
                },
                b: {
                    defaultSize: { columnSpan: 1, rowSpan: 4, columnOffset: { 3: 1 } },
                    limits: { minColumnSpan: 1, minRowSpan: 2 },
                    heightMode: 'fixed',
                },
                c: {
                    defaultSize: { columnSpan: 1, rowSpan: 4, columnOffset: { 3: 2 } },
                    limits: { minColumnSpan: 1, minRowSpan: 2 },
                },
            },
        },
        wide: {
            columns: 12,
            rowHeight: 24,
            margin: [2, 2],
            containerPadding: [4, 4],
            widgetOrder: ['b', 'a', 'c'],
            widgets: {
                a: {
                    defaultSize: { columnSpan: 8, rowSpan: 5, columnOffset: { 12: 0 } },
                    limits: { minColumnSpan: 4, minRowSpan: 2 },
                    initialState: { isCollapsed: false },
                },
                b: {
                    defaultSize: { columnSpan: 4, rowSpan: 5, columnOffset: { 12: 8 } },
                    limits: { minColumnSpan: 2, minRowSpan: 2 },
                    initialState: { isHidden: false },
                },
                c: {
                    defaultSize: { columnSpan: 12, rowSpan: 6, columnOffset: { 12: 0 } },
                    limits: { minColumnSpan: 4, minRowSpan: 3 },
                },
            },
        },
    }

    it('updates only the active band and persists width, offset, visibility, collapse, and order', () => {
        const state: WidgetBoardState = {
            items: [
                {
                    id: 'c',
                    columnSpan: 2,
                    rowSpan: 6,
                    columnOffset: { 3: 0 },
                    data: { id: 'c', title: 'C' },
                },
                {
                    id: 'a',
                    columnSpan: 1,
                    rowSpan: 2,
                    columnOffset: { 3: 2 },
                    data: { id: 'a', title: 'A' },
                },
            ],
            hidden: ['b'],
            collapsed: ['a'],
            sizeMemory: { a: 8 },
            layoutMemory: {
                narrow: {
                    b: {
                        columnSpan: 1,
                        rowSpan: 7,
                        columnOffset: { 3: 1 },
                        order: 1,
                    },
                },
            },
        }

        const result = buildPresetFromState(
            state,
            persistenceBase,
            ['narrow', 'wide'],
            'narrow',
        )

        expect(result.wide).toEqual(persistenceBase.wide)
        expect(result.narrow.widgetOrder).toEqual(['c', 'b', 'a'])
        expect(result.narrow.widgets.a).toMatchObject({
            defaultSize: {
                columnSpan: 1,
                rowSpan: 4,
                columnOffset: { 3: 2 },
            },
            initialState: { isCollapsed: true, isHidden: false },
            heightMode: 'fixed',
        })
        expect(result.narrow.widgets.b).toMatchObject({
            defaultSize: {
                columnSpan: 1,
                rowSpan: 4,
                columnOffset: { 3: 1 },
            },
            initialState: { isCollapsed: false, isHidden: true },
            heightMode: 'fixed',
        })
        expect(result.narrow.widgets.c).toMatchObject({
            defaultSize: {
                columnSpan: 2,
                rowSpan: 4,
                columnOffset: { 3: 0 },
            },
            initialState: { isCollapsed: false, isHidden: false },
        })
    })

    it('uses widgetOrder to build state and remembers the position of initially hidden widgets', () => {
        const definitions: WidgetDefinition[] = ['a', 'b', 'c'].map(id => ({
            id,
            title: id.toUpperCase(),
            render: () => id,
        }))
        const layout: BreakpointLayoutConfig = {
            columns: 3,
            widgetOrder: ['c', 'b', 'a'],
            widgets: {
                a: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
                b: {
                    defaultSize: { columnSpan: 1, rowSpan: 2 },
                    initialState: { isHidden: true },
                },
                c: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
            },
        }

        const state = buildDefaultState(withLayout(definitions, layout), 'compact')

        expect(state.items.map(item => item.id)).toEqual(['c', 'a'])
        expect(state.hidden).toEqual(['b'])
        expect(state.layoutMemory.compact.b.order).toBe(1)
    })
})
