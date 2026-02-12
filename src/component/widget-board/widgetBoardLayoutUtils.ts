import type { BoardProps } from '@cloudscape-design/board-components/board'
import type {
    BreakpointLayoutConfig,
    WidgetBoardItemData,
    WidgetBoardLayoutOption,
    WidgetBoardState,
    WidgetDefinition,
    WidgetHeightMode,
    WidgetHeightModeMemory,
    WidgetLayoutConfig,
    WidgetLayoutMemory,
    WidgetLayoutSnapshot,
} from './types'

export type WidgetDefinitionWithLayout = WidgetDefinition & { layout: WidgetLayoutConfig }

const fallbackLayout: WidgetLayoutConfig = { defaultSize: { columnSpan: 1, rowSpan: 2 } }

export const DEFAULT_ROW_HEIGHT = 96
export const DEFAULT_ROW_GAP = 20

export const createLayoutId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `layout-${Date.now()}`
}

export const withLayout = (definitions: WidgetDefinition[], layout: BreakpointLayoutConfig): WidgetDefinitionWithLayout[] =>
    definitions.map(definition => ({
        ...definition,
        layout: layout.widgets[definition.id] ?? fallbackLayout,
    }))

export const toBoardItem = (
    definition: WidgetDefinitionWithLayout,
    overrides?: Partial<Pick<BoardProps.Item<WidgetBoardItemData>, 'columnSpan' | 'rowSpan' | 'columnOffset'>>,
): BoardProps.Item<WidgetBoardItemData> => {
    const defaultSize = definition.layout.defaultSize
    const limits = definition.layout.limits

    return {
        id: definition.id,
        columnSpan: overrides?.columnSpan ?? defaultSize.columnSpan,
        rowSpan: overrides?.rowSpan ?? defaultSize.rowSpan,
        columnOffset: overrides?.columnOffset ?? defaultSize.columnOffset,
        data: { id: definition.id, title: definition.title },
        definition: {
            defaultColumnSpan: defaultSize.columnSpan,
            defaultRowSpan: defaultSize.rowSpan,
            minColumnSpan: limits?.minColumnSpan,
            minRowSpan: limits?.minRowSpan,
        },
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

        const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
        return { ...item, rowSpan: minRows }
    })
}

export const buildDefaultState = (definitions: WidgetDefinitionWithLayout[], breakpointKey: string): WidgetBoardState => {
    const hidden = definitions.filter(def => def.layout.initialState?.isHidden).map(def => def.id)
    const collapsed = definitions.filter(def => def.layout.initialState?.isCollapsed).map(def => def.id)
    const sizeMemory: Partial<Record<string, number>> = {}
    const definitionsMap = new Map<string, WidgetDefinitionWithLayout>(definitions.map(def => [def.id, def]))
    const heightModeById: Partial<Record<string, WidgetHeightMode>> = Object.fromEntries(
        definitions.map(def => [def.id, def.layout.heightMode ?? 'auto']),
    )
    const heightModeMemory: WidgetHeightModeMemory = { [breakpointKey]: heightModeById }

    const items = definitions.filter(def => !hidden.includes(def.id)).map(def => toBoardItem(def))
    const collapsedItems = applyCollapsedState(items, collapsed, definitionsMap, sizeMemory)

    return {
        items: collapsedItems,
        hidden,
        collapsed,
        sizeMemory,
        layoutMemory: {},
        heightModeMemory,
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

export const buildLayoutOptions = (
    options: WidgetBoardLayoutOption[] | undefined,
    fallback: WidgetBoardLayoutOption,
): WidgetBoardLayoutOption[] => {
    const normalizedOptions = (options ?? [])
        .filter(option => option.id !== fallback.id)
        .map(option => ({
            ...option,
            layoutByBreakpoint: option.layoutByBreakpoint ?? fallback.layoutByBreakpoint,
        }))

    return [fallback, ...normalizedOptions]
}

export const layoutOptionsEqual = (a: WidgetBoardLayoutOption[], b: WidgetBoardLayoutOption[]) =>
    a.length === b.length &&
    a.every((option, index) => option.id === b[index]?.id && option.name === b[index]?.name && option.layoutByBreakpoint === b[index]?.layoutByBreakpoint)
