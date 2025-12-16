type PanelBridge = {
    items: import('./WidgetLayoutsPanel').WidgetLayoutOption[]
    selectedId?: string
    onSelect?: (id: string) => void
    onDelete?: (id: string) => void
    onUpdate?: (id: string) => void
    onAdd?: (name: string) => void
    lockedIds?: string[]
}

type Listener = (state: PanelBridge | null) => void

let state: PanelBridge | null = null
const listeners = new Set<Listener>()

const emit = () => {
    listeners.forEach(listener => listener(state))
}

export const setWidgetLayoutsPanelBridge = (panel: PanelBridge | null) => {
    state = panel
    emit()
}

export const subscribeWidgetLayoutsPanelBridge = (listener: Listener) => {
    listeners.add(listener)
    listener(state)
    return () => listeners.delete(listener)
}

export const getWidgetLayoutsPanelBridge = () => state
