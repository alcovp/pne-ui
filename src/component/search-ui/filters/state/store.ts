import {createContext, useContext} from 'react'
import {useStore} from 'zustand'
import {createStore, StoreApi} from 'zustand/vanilla'
import {immer} from 'zustand/middleware/immer'
import {enableMapSet} from 'immer'
import {SearchUIFiltersStore} from './type';
import {getSearchUIFiltersActions} from './actions';
import {getSearchUIFiltersInitialState} from './initial';

enableMapSet()

export type SearchUIFiltersStoreApi = StoreApi<SearchUIFiltersStore>

export const createSearchUIFiltersStore = (): SearchUIFiltersStoreApi => createStore<SearchUIFiltersStore>()(
    immer(
        (set, get) => ({
            ...getSearchUIFiltersInitialState(),
            ...getSearchUIFiltersActions(set, get),
        })
    )
)

export type SearchUIFiltersStoreContextValue = {
    store: SearchUIFiltersStoreApi
    instanceId: symbol
}

export const SearchUIFiltersStoreContext = createContext<SearchUIFiltersStoreContextValue | null>(null)

export const useSearchUIFiltersStoreContext = (): SearchUIFiltersStoreContextValue => {
    const context = useContext(SearchUIFiltersStoreContext)
    if (!context) {
        throw new Error('SearchUI store is missing. Render SearchUI components inside their store scope.')
    }
    return context
}

export const useSearchUIFiltersStoreApi = (): SearchUIFiltersStoreApi => {
    return useSearchUIFiltersStoreContext().store
}

export const useSearchUIFiltersStore = <T, >(selector: (state: SearchUIFiltersStore) => T): T => {
    return useStore(useSearchUIFiltersStoreApi(), selector)
}
