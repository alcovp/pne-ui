import { create } from 'zustand'
import type { WidgetLayoutAddInfo, WidgetLayoutOption } from './WidgetLayoutsPanel'
import type { WidgetBoardActionsState } from './types'

export type WidgetBoardFabPanelState = {
    items: WidgetLayoutOption[]
    selectedId?: string
    onSelect?: (id: string) => void
    onDelete?: (id: string) => void
    onAdd?: (name: string) => void
    addInfo?: WidgetLayoutAddInfo
    lockedIds: string[]
    actionsState?: WidgetBoardActionsState
    onResetLayout?: () => void
    onRestoreHidden?: () => void
}

export type WidgetBoardFabStoreState = WidgetBoardFabPanelState & {
    setPanelState: (state: WidgetBoardFabPanelState) => void
    resetPanelState: () => void
}

const buildEmptyPanelState = (): WidgetBoardFabPanelState => ({
    items: [],
    lockedIds: [],
})

export const createWidgetBoardFabStore = () =>
    create<WidgetBoardFabStoreState>(set => ({
        ...buildEmptyPanelState(),
        setPanelState: state => set(state),
        resetPanelState: () => set(buildEmptyPanelState()),
    }))

export type WidgetBoardFabStore = ReturnType<typeof createWidgetBoardFabStore>

