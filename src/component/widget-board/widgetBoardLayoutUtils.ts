import type { BoardProps } from '@cloudscape-design/board-components/board'
import type {
    BreakpointLayoutConfig,
    WidgetBoardItemData,
    WidgetBoardLayoutOption,
    WidgetBoardState,
    WidgetDefinition,
    WidgetLayoutConfig,
    WidgetLayoutMemory,
    WidgetLayoutSnapshot,
} from './types'

export type WidgetDefinitionWithLayout = WidgetDefinition & { layout: WidgetLayoutConfig }

const fallbackLayout: WidgetLayoutConfig = { defaultSize: { columnSpan: 1, rowSpan: 2 } }

export const DEFAULT_ROW_HEIGHT = 96
export const DEFAULT_ROW_GAP = 16
export const COLLAPSED_ROW_SPAN = 2
export type WidgetBoardItemDefinition = NonNullable<BoardProps.Item<WidgetBoardItemData>['definition']>

export const createBoardItemDefinition = (
    definition: WidgetDefinitionWithLayout,
    isCollapsed = false,
): WidgetBoardItemDefinition => {
    const defaultSize = definition.layout.defaultSize
    const limits = definition.layout.limits

    return {
        defaultColumnSpan: defaultSize.columnSpan,
        defaultRowSpan: isCollapsed ? COLLAPSED_ROW_SPAN : defaultSize.rowSpan,
        minColumnSpan: limits?.minColumnSpan,
        minRowSpan: isCollapsed ? COLLAPSED_ROW_SPAN : limits?.minRowSpan,
    }
}

export const createLayoutId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `layout-${Date.now()}`
}

export const withLayout = (definitions: WidgetDefinition[], layout: BreakpointLayoutConfig): WidgetDefinitionWithLayout[] =>
    definitions
        .map((definition, index) => ({
            definition: {
                ...definition,
                layout: layout.widgets[definition.id] ?? fallbackLayout,
            },
            index,
        }))
        .sort((left, right) => {
            if (!layout.widgetOrder?.length) return left.index - right.index
            const leftOrder = layout.widgetOrder.indexOf(left.definition.id)
            const rightOrder = layout.widgetOrder.indexOf(right.definition.id)
            const normalizedLeftOrder = leftOrder < 0 ? layout.widgetOrder.length + left.index : leftOrder
            const normalizedRightOrder = rightOrder < 0 ? layout.widgetOrder.length + right.index : rightOrder
            return normalizedLeftOrder - normalizedRightOrder || left.index - right.index
        })
        .map(({ definition }) => definition)

export const toBoardItem = (
    definition: WidgetDefinitionWithLayout,
    overrides?: Partial<Pick<BoardProps.Item<WidgetBoardItemData>, 'columnSpan' | 'rowSpan' | 'columnOffset'>>,
): BoardProps.Item<WidgetBoardItemData> => {
    const defaultSize = definition.layout.defaultSize

    return {
        id: definition.id,
        columnSpan: overrides?.columnSpan ?? defaultSize.columnSpan,
        rowSpan: overrides?.rowSpan ?? defaultSize.rowSpan,
        columnOffset: overrides?.columnOffset ?? defaultSize.columnOffset,
        data: { id: definition.id, title: definition.title },
        definition: createBoardItemDefinition(definition),
    }
}

const applyCollapsedState = (
    items: BoardProps.Item<WidgetBoardItemData>[],
    collapsed: string[],
    definitionsMap: Map<string, WidgetDefinitionWithLayout>,
    sizeMemory: Partial<Record<string, number>>,
) => {
    if (collapsed.length === 0) return items

    const collapsedSet = new Set(collapsed)
    return items.map(item => {
        const widgetId = item.id as string
        if (!collapsedSet.has(widgetId)) return item

        const definition = definitionsMap.get(widgetId)
        if (!definition) return item

        if (sizeMemory[widgetId] === undefined) {
            sizeMemory[widgetId] = item.rowSpan ?? definition.layout.defaultSize.rowSpan
        }

        return {
            ...item,
            rowSpan: COLLAPSED_ROW_SPAN,
            definition: createBoardItemDefinition(definition, true),
        }
    })
}

export const buildDefaultState = (definitions: WidgetDefinitionWithLayout[], breakpointKey: string): WidgetBoardState => {
    const hidden = definitions.filter(def => def.layout.initialState?.isHidden).map(def => def.id)
    const collapsed = definitions.filter(def => def.layout.initialState?.isCollapsed).map(def => def.id)
    const sizeMemory: Partial<Record<string, number>> = {}
    const definitionsMap = new Map<string, WidgetDefinitionWithLayout>(definitions.map(def => [def.id, def]))

    const items = definitions.filter(def => !hidden.includes(def.id)).map(def => toBoardItem(def))
    const collapsedItems = applyCollapsedState(items, collapsed, definitionsMap, sizeMemory)

    const hiddenSnapshots = Object.fromEntries(
        definitions
            .map((definition, order) => ({ definition, order }))
            .filter(({ definition }) => hidden.includes(definition.id))
            .map(({ definition, order }) => [
                definition.id,
                {
                    ...definition.layout.defaultSize,
                    order,
                },
            ]),
    )

    return {
        items: collapsedItems,
        hidden,
        collapsed,
        sizeMemory,
        layoutMemory: hidden.length > 0 ? { [breakpointKey]: hiddenSnapshots } : {},
    }
}

export const upsertLayoutMemory = (
    layoutMemory: WidgetLayoutMemory,
    breakpoint: number | string,
    id: string,
    snapshot: WidgetLayoutSnapshot,
): WidgetLayoutMemory => {
    const key = String(breakpoint)
    const next = { ...layoutMemory }
    const bucket = { ...(next[key] ?? {}) }
    bucket[id] = snapshot
    next[key] = bucket
    return next
}

const resolveBreakpoint = (width: number | undefined, breakpoints: readonly number[]): number => {
    if (!width || Number.isNaN(width)) {
        return breakpoints[0]
    }

    let match: number = breakpoints[0]
    for (const breakpoint of breakpoints) {
        if (width >= breakpoint) {
            match = breakpoint
        } else {
            break
        }
    }

    return match
}

export const getLayoutConfigForWidth = (
    width: number | undefined,
    layoutMap: Record<number | string, BreakpointLayoutConfig>,
    breakpoints: readonly number[],
) => {
    const breakpoint = resolveBreakpoint(width, breakpoints)
    return { breakpoint, layout: layoutMap[breakpoint] }
}

export const getLayoutConfigForBreakpoint = (
    breakpoint: number | string,
    layoutMap: Record<number | string, BreakpointLayoutConfig>,
) => ({
    breakpoint,
    layout:
        layoutMap[breakpoint] ??
        layoutMap[String(breakpoint)] ??
        layoutMap[Number(breakpoint)] ??
        Object.values(layoutMap)[0],
})

const normalizeWidgetOrder = (order: readonly string[] | undefined, widgetIds: readonly string[]) => {
    if (!order) return undefined
    const widgetIdSet = new Set(widgetIds)
    const seen = new Set<string>()
    const normalized: string[] = []
    order.forEach(id => {
        if (!widgetIdSet.has(id) || seen.has(id)) return
        seen.add(id)
        normalized.push(id)
    })
    widgetIds.forEach(id => {
        if (!seen.has(id)) {
            seen.add(id)
            normalized.push(id)
        }
    })
    return normalized
}

const normalizeWidgetLayout = (
    saved: WidgetLayoutConfig | undefined,
    base: WidgetLayoutConfig | undefined,
): WidgetLayoutConfig => {
    const resolvedBase = base ?? fallbackLayout
    if (!saved) {
        return {
            ...resolvedBase,
            defaultSize: { ...resolvedBase.defaultSize },
            limits: resolvedBase.limits ? { ...resolvedBase.limits } : undefined,
            initialState: resolvedBase.initialState ? { ...resolvedBase.initialState } : undefined,
        }
    }

    return {
        ...resolvedBase,
        ...saved,
        defaultSize: {
            ...resolvedBase.defaultSize,
            ...saved.defaultSize,
            rowSpan: resolvedBase.defaultSize.rowSpan,
        },
        limits: resolvedBase.limits ? { ...resolvedBase.limits } : undefined,
        initialState: (resolvedBase.initialState || saved.initialState) && {
            ...resolvedBase.initialState,
            ...saved.initialState,
        },
        heightMode: resolvedBase.heightMode,
    }
}

export const normalizeLayoutByBreakpoint = (
    savedLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig> | undefined,
    defaultLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpointIds: readonly (number | string)[] = Object.keys(defaultLayoutByBreakpoint),
): Record<number | string, BreakpointLayoutConfig> => {
    const normalized: Record<number | string, BreakpointLayoutConfig> = {}
    const fallbackBase = Object.values(defaultLayoutByBreakpoint)[0]

    breakpointIds.forEach(breakpointId => {
        const base =
            defaultLayoutByBreakpoint[breakpointId] ??
            defaultLayoutByBreakpoint[String(breakpointId)] ??
            fallbackBase
        const saved =
            savedLayoutByBreakpoint?.[breakpointId] ??
            savedLayoutByBreakpoint?.[String(breakpointId)]
        if (!base && !saved) return

        const widgetIds = Object.keys(base?.widgets ?? saved?.widgets ?? {})
        const widgets = Object.fromEntries(
            widgetIds.map(id => [
                id,
                normalizeWidgetLayout(saved?.widgets[id], base?.widgets[id]),
            ]),
        )
        const selectedOrder = saved?.widgetOrder ?? base?.widgetOrder

        normalized[breakpointId] = {
            ...base,
            columns: base?.columns,
            rowHeight: base?.rowHeight,
            margin: base?.margin,
            containerPadding: base?.containerPadding,
            widgetOrder: normalizeWidgetOrder(selectedOrder, widgetIds),
            widgets,
        }
    })

    return normalized
}

export const buildLayoutOptions = (
    options: WidgetBoardLayoutOption[] | undefined,
    fallback: WidgetBoardLayoutOption,
    breakpointIds: readonly (number | string)[] = Object.keys(fallback.layoutByBreakpoint),
): WidgetBoardLayoutOption[] => {
    const normalizedOptions = (options ?? [])
        .filter(option => option.id !== fallback.id)
        .map(option => ({
            ...option,
            layoutByBreakpoint: normalizeLayoutByBreakpoint(
                option.layoutByBreakpoint,
                fallback.layoutByBreakpoint,
                breakpointIds,
            ),
        }))

    return [fallback, ...normalizedOptions]
}

export const layoutOptionsEqual = (a: WidgetBoardLayoutOption[], b: WidgetBoardLayoutOption[]) =>
    a.length === b.length &&
    a.every((option, index) => option.id === b[index]?.id && option.name === b[index]?.name && option.layoutByBreakpoint === b[index]?.layoutByBreakpoint)
