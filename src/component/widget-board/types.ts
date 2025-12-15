import type { BoardProps } from '@cloudscape-design/board-components/board'
import type { PneLayoutOption } from './PneLayoutsPanel'

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
    columns: number
    widgets: Record<WidgetId, WidgetLayoutConfig>
}

export type WidgetLayoutPresetSource = 'static' | 'remote-live' | 'remote-cache'

export type WidgetLayoutPreset = {
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    source: WidgetLayoutPresetSource
    version?: string
}

export type WidgetDefinition = {
    id: WidgetId
    title: string
    render: () => React.ReactNode
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

export type WidgetBoardLayoutOption = PneLayoutOption & {
    preset: WidgetLayoutPreset
}

export type WidgetBoardLayouts = {
    options?: WidgetBoardLayoutOption[]
    selectedId?: string
    initialSelectedId?: string
    onSelect?: (id: string) => void
}

export type WidgetBoardLoadLayoutsResult = {
    options: WidgetBoardLayoutOption[]
    selectedId?: string
}

export type WidgetBoardProps = {
    widgets: WidgetDefinition[]
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    breakpoints?: readonly number[]
    storageKey?: string
    loadLayouts?: () => Promise<WidgetBoardLoadLayoutsResult | null>
    layouts?: WidgetBoardLayouts
    empty?: React.ReactNode
    hideNavigationArrows?: boolean
    onLayoutPersist?: (state: WidgetBoardState) => void
    isWidgetEnabled?: (definition: WidgetDefinition) => boolean
    className?: string
}
