import React, { useContext, useRef } from 'react'
import { createWidgetBoardFabStore, type WidgetBoardFabStore } from './widgetBoardFabStore'

const WidgetBoardScopeContext = React.createContext<WidgetBoardFabStore | null>(null)

const missingScopeError =
    'WidgetBoard scope is missing. Wrap components with <WidgetBoardScopeProvider>.'

export const useWidgetBoardScopeStore = (): WidgetBoardFabStore => {
    const store = useContext(WidgetBoardScopeContext)
    if (!store) {
        throw new Error(missingScopeError)
    }
    return store
}

export type WidgetBoardScopeProviderProps = {
    children?: React.ReactNode
}

export const WidgetBoardScopeProvider: React.FC<WidgetBoardScopeProviderProps> = ({ children }) => {
    const storeRef = useRef<WidgetBoardFabStore | undefined>(undefined)
    const resolvedStore = storeRef.current ?? (storeRef.current = createWidgetBoardFabStore())

    return (
        <WidgetBoardScopeContext.Provider value={resolvedStore}>
            {children}
        </WidgetBoardScopeContext.Provider>
    )
}
