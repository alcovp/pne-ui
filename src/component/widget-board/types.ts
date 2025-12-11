import type { BoardProps } from '@cloudscape-design/board-components/board'

export type WidgetId = string

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
}

export type WidgetBoardControls = {
    title?: React.ReactNode
    resetLabel?: React.ReactNode
    restoreLabel?: React.ReactNode
    hideReset?: boolean
    hideRestore?: boolean
}

export type WidgetBoardProps = {
    widgets: WidgetDefinition[]
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    breakpoints?: readonly number[]
    storageKey?: string
    loadRemoteLayout?: () => Promise<WidgetLayoutPreset | null>
    controls?: WidgetBoardControls
    empty?: React.ReactNode
    hideNavigationArrows?: boolean
    onLayoutPersist?: (state: WidgetBoardState) => void
    isWidgetEnabled?: (definition: WidgetDefinition) => boolean
    className?: string
}
