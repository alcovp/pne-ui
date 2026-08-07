import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useWidgetBoardStateActions } from '../src/component/widget-board/useWidgetBoardStateActions'
import {
    buildDefaultState,
    withLayout,
    type WidgetDefinitionWithLayout,
} from '../src/component/widget-board/widgetBoardLayoutUtils'
import type { BreakpointLayoutConfig, WidgetDefinition } from '../src/component/widget-board/types'

const definitions: WidgetDefinition[] = [
    { id: 'a', title: 'A', render: () => 'A' },
    { id: 'b', title: 'B', render: () => 'B' },
    { id: 'c', title: 'C', render: () => 'C' },
]

const defaultLayout: BreakpointLayoutConfig = {
    widgetOrder: ['a', 'b', 'c'],
    widgets: {
        a: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
        b: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
        c: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
    },
}

const customLayout: BreakpointLayoutConfig = {
    widgetOrder: ['c', 'b', 'a'],
    widgets: {
        a: { defaultSize: { columnSpan: 1, rowSpan: 3 } },
        b: {
            defaultSize: { columnSpan: 1, rowSpan: 4 },
            initialState: { isHidden: true },
        },
        c: { defaultSize: { columnSpan: 1, rowSpan: 5 } },
    },
}

const makeMap = (items: WidgetDefinitionWithLayout[]) =>
    new Map(items.map(item => [item.id, item]))

describe('WidgetBoard full-order state actions', () => {
    it('resets a custom hidden-row reorder to default full order while preserving visibility', () => {
        const defaultDefinitions = withLayout(definitions, defaultLayout)
        const currentDefinitions = withLayout(definitions, customLayout)
        const { result } = renderHook(() => {
            const [state, setState] = useState(() => buildDefaultState(currentDefinitions, 'narrow'))
            const actions = useWidgetBoardStateActions({
                currentBreakpointKey: 'narrow',
                defaultDefinitionsWithLayout: defaultDefinitions,
                definitionsMap: makeMap(currentDefinitions),
                definitionsWithLayout: currentDefinitions,
                isDefaultLayoutSelected: false,
                setLayoutState: setState,
            })

            return { actions, state }
        })

        act(() => result.current.actions.reorderAllItems(['c', 'a', 'b']))
        expect(result.current.state.widgetOrder).toEqual(['c', 'a', 'b'])
        expect(result.current.state.hidden).toEqual(['b'])

        act(() => result.current.actions.resetLayout())
        expect(result.current.state.widgetOrder).toEqual(['a', 'b', 'c'])
        expect(result.current.state.items.map(item => item.id)).toEqual(['a', 'c'])
        expect(result.current.state.hidden).toEqual(['b'])
        expect(result.current.state.layoutMemory.narrow.b.order).toBe(1)
    })

    it('never hides a required widget, including an initially hidden definition', () => {
        const requiredDefinitions: WidgetDefinition[] = [
            { id: 'required', title: 'Required', canHide: false, render: () => 'Required' },
        ]
        const requiredLayout: BreakpointLayoutConfig = {
            widgets: {
                required: {
                    defaultSize: { columnSpan: 1, rowSpan: 2 },
                    initialState: { isHidden: true },
                },
            },
        }
        const definitionsWithLayout = withLayout(requiredDefinitions, requiredLayout)
        const { result } = renderHook(() => {
            const [state, setState] = useState(() => buildDefaultState(definitionsWithLayout, 'desktop'))
            const actions = useWidgetBoardStateActions({
                currentBreakpointKey: 'desktop',
                defaultDefinitionsWithLayout: definitionsWithLayout,
                definitionsMap: makeMap(definitionsWithLayout),
                definitionsWithLayout,
                isDefaultLayoutSelected: true,
                setLayoutState: setState,
            })

            return { actions, state }
        })

        expect(result.current.state.hidden).toEqual([])
        expect(result.current.state.items.map(item => item.id)).toEqual(['required'])
        act(() => result.current.actions.setWidgetVisibility('required', false))
        expect(result.current.state.hidden).toEqual([])
        expect(result.current.state.items.map(item => item.id)).toEqual(['required'])
    })
})
