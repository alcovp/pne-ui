import { create } from 'zustand'
import type { WidgetLayoutAddInfo, WidgetLayoutOption } from './WidgetLayoutsPanel'
import type { WidgetBoardActionsState, WidgetBoardEditBehavior } from './types'

export type WidgetBoardVisibilityItem = {
    id: string
    title: string
    visible: boolean
    canHide: boolean
}

export type WidgetBoardFabPanelState = {
    items: WidgetLayoutOption[]
    visibilityItems: WidgetBoardVisibilityItem[]
    selectedId?: string
    onSelect?: (id: string) => void
    onDelete?: (id: string) => void
    onAdd?: (name: string) => void
    onSetWidgetVisibility?: (id: string, visible: boolean) => void
    addInfo?: WidgetLayoutAddInfo
    lockedIds: string[]
    actionsState?: WidgetBoardActionsState
    onResetLayout?: () => void
    onRestoreHidden?: () => void
    activeBreakpointId?: string
    editBehavior?: WidgetBoardEditBehavior
    isLoadingLayouts?: boolean
}

export type WidgetBoardFabStoreState = WidgetBoardFabPanelState & {
    setPanelState: (state: WidgetBoardFabPanelState) => void
    resetPanelState: () => void
}

const buildEmptyPanelState = (): WidgetBoardFabPanelState => ({
    items: [],
    visibilityItems: [],
    lockedIds: [],
})

export const createWidgetBoardFabStore = () =>
    create<WidgetBoardFabStoreState>(set => ({
        ...buildEmptyPanelState(),
        setPanelState: state => set(state),
        resetPanelState: () => set(buildEmptyPanelState()),
    }))

export type WidgetBoardFabStore = ReturnType<typeof createWidgetBoardFabStore>
