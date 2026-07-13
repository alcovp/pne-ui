import React, {useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {
    createSearchUIFiltersStore,
    SearchUIFiltersStoreContext,
} from './store'
import {
    registerSearchUIInstance,
    retainSearchUIState,
} from './retention'

type Props = {
    settingsContextName: string
    children: React.ReactNode
}

export const SearchUIFiltersStoreProvider = ({settingsContextName, children}: Props) => {
    const store = useMemo(createSearchUIFiltersStore, [settingsContextName])
    const instanceIdRef = useRef(Symbol(settingsContextName))

    useStoreLifecycleEffect(() => {
        const unregister = registerSearchUIInstance(settingsContextName, instanceIdRef.current)
        const persistState = () => retainSearchUIState(settingsContextName, store.getState())
        const unsubscribe = store.subscribe(persistState)

        persistState()

        return () => {
            persistState()
            unsubscribe()
            unregister()
        }
    }, [settingsContextName, store])

    const contextValue = useMemo(() => ({
        store,
        instanceId: instanceIdRef.current,
    }), [store])

    return <SearchUIFiltersStoreContext.Provider value={contextValue}>
        {children}
    </SearchUIFiltersStoreContext.Provider>
}

const useStoreLifecycleEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
