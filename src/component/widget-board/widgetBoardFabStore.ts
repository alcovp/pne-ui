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
    onSelect?: (id: string) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    onAdd?: (name: string) => Promise<string>
    onSetWidgetVisibility?: (id: string, visible: boolean) => void
    addInfo?: WidgetLayoutAddInfo
    lockedIds: string[]
    actionsState?: WidgetBoardActionsState
    onResetLayout?: () => void
    onRestoreHidden?: () => void
    onFlushLayoutSave?: () => Promise<void>
    onDiscardLayoutChanges?: () => Promise<void>
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
