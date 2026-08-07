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

export type WidgetBoardBreakpoint = {
    id: string
    minWidth: number
    editBehavior?: WidgetBoardEditBehavior
}

export type WidgetBoardBreakpointSource = 'viewport' | 'container'

export type WidgetLayoutSize = {
    columnSpan: number
    rowSpan: number
    columnOffset?: BoardProps.Item['columnOffset']
}

export type WidgetLayoutLimits = {
    minColumnSpan?: number
    minRowSpan?: number
}

export type WidgetHeightMode = 'auto' | 'fixed'
export type WidgetBoardEditBehavior = 'grid' | 'order-only'

/**
 * React Grid Layout is the default engine. `cloudscape` is retained only as an explicit
 * deprecated compatibility path while downstream consumers finish migrating.
 */
export type WidgetBoardEngine = 'react-grid-layout' | 'cloudscape'
export type WidgetBoardInteractionMode = 'view' | 'edit'
export type WidgetBoardReactGridLayoutCompaction = 'none' | 'vertical'
export type WidgetBoardReactGridLayoutCollisionBehavior = 'push' | 'prevent'

export type WidgetBoardReactGridLayoutTuning = {
    compaction: WidgetBoardReactGridLayoutCompaction
    collisionBehavior: WidgetBoardReactGridLayoutCollisionBehavior
}

export const DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING: WidgetBoardReactGridLayoutTuning = {
    compaction: 'vertical',
    collisionBehavior: 'push',
}

export type WidgetLayoutInitialState = {
    isHidden?: boolean
    isCollapsed?: boolean
}

export type WidgetLayoutConfig = {
    defaultSize: WidgetLayoutSize
    limits?: WidgetLayoutLimits
    initialState?: WidgetLayoutInitialState
    heightMode?: WidgetHeightMode
}

export type BreakpointLayoutConfig = {
    columns?: number
    rowHeight?: number
    margin?: readonly [number, number]
    containerPadding?: readonly [number, number] | null
    widgetOrder?: WidgetId[]
    widgets: Record<WidgetId, WidgetLayoutConfig>
}

export type WidgetDefinition = {
    id: WidgetId
    title: string
    render: () => React.ReactNode
    settingsActions?: React.ReactNode
    contentFullHeight?: boolean
    minWidthPx?: number
    /** Whether the user may hide this widget. Defaults to `true`. */
    canHide?: boolean
}

export type WidgetBoardItemData = {
    id: WidgetId
    title: string
}

export type WidgetBoardState = {
    items: Array<BoardProps.Item<WidgetBoardItemData>>
    /** Complete current order, including hidden widgets. */
    widgetOrder: WidgetId[]
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

export type WidgetBoardPersistenceStatus = 'idle' | 'pending' | 'saving' | 'error'

export type WidgetBoardActionsState = {
    hasHiddenWidgets: boolean
    canResetLayout: boolean
    isDefaultLayoutSelected: boolean
    selectedLayoutId?: string
    defaultLayoutId: string
    /** Whether the selected layout is immutable and cannot be autosaved in place. */
    isSelectedLayoutLocked: boolean
    /** Whether the selected layout has local changes that are not durable yet. */
    hasDraftChanges: boolean
    /** Breakpoint ids with local draft changes for the selected layout. */
    dirtyBreakpointIds: string[]
    persistenceStatus: WidgetBoardPersistenceStatus
    persistenceError?: string
}

export type WidgetBoardReactGridLayoutOptions = {
    columns?: number
    rowHeight?: number
    margin?: readonly [number, number]
    containerPadding?: readonly [number, number] | null
    useCSSTransforms?: boolean
    /** `none` preserves free gaps; `vertical` pulls widgets upward after a move. */
    compaction?: WidgetBoardReactGridLayoutCompaction
    /** `push` moves an occupied widget away; `prevent` blocks dropping onto it. */
    collisionBehavior?: WidgetBoardReactGridLayoutCollisionBehavior
}

export type WidgetBoardProps = {
    widgets: WidgetDefinition[]
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    loadLayouts: () => Promise<WidgetBoardLoadLayoutsResult | null>
    saveLayouts: (options: WidgetBoardLayoutOption[], selectedId?: string) => Promise<void>
    onActionsStateChange?: (state: WidgetBoardActionsState) => void
    autoHeightEnabled?: boolean
    engine?: WidgetBoardEngine
    interactionMode?: WidgetBoardInteractionMode
    reactGridLayoutOptions?: WidgetBoardReactGridLayoutOptions
    breakpoints?: readonly WidgetBoardBreakpoint[]
    breakpointSource?: WidgetBoardBreakpointSource
    /** Show an undo snackbar after the inline widget-header hide action. */
    showHideUndo?: boolean
}
