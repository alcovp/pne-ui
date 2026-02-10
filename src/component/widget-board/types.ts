import type { BoardProps } from '@cloudscape-design/board-components/board'
import type { WidgetLayoutOption } from './WidgetLayoutsPanel'

export type WidgetId = string

export type WidgetLayoutSnapshot = {
    columnSpan?: number
    rowSpan?: number
    columnOffset?: BoardProps.Item['columnOffset']
    order: number
}

export type WidgetLayoutMemory = Record<string, Record<WidgetId, WidgetLayoutSnapshot>>

export type WidgetLayoutSize = {
    columnSpan: number
    rowSpan: number
    columnOffset?: BoardProps.Item['columnOffset']
}

export type WidgetLayoutLimits = {
    minColumnSpan?: number
    minRowSpan?: number
}

export type WidgetLayoutInitialState = {
    isHidden?: boolean
    isCollapsed?: boolean
}

export type WidgetLayoutConfig = {
    defaultSize: WidgetLayoutSize
    limits?: WidgetLayoutLimits
    initialState?: WidgetLayoutInitialState
}

export type BreakpointLayoutConfig = {
    widgets: Record<WidgetId, WidgetLayoutConfig>
}

export type WidgetDefinition = {
    id: WidgetId
    title: string
    render: () => React.ReactNode
    settingsActions?: React.ReactNode
}

export type WidgetBoardItemData = {
    id: WidgetId
    title: string
}

export type WidgetBoardState = {
    items: Array<BoardProps.Item<WidgetBoardItemData>>
    hidden: WidgetId[]
    collapsed: WidgetId[]
    sizeMemory: Partial<Record<WidgetId, number>>
    layoutMemory: WidgetLayoutMemory
}

export type WidgetBoardLayoutOption = WidgetLayoutOption & {
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
}

export type WidgetBoardLoadLayoutsResult = {
    options: WidgetBoardLayoutOption[]
    selectedId?: string
}

export type WidgetBoardProps = {
    widgets: WidgetDefinition[]
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    loadLayouts: () => Promise<WidgetBoardLoadLayoutsResult | null>
    saveLayouts: (options: WidgetBoardLayoutOption[], selectedId?: string) => Promise<void>
}
