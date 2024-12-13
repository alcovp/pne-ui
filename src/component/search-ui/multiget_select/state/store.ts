import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {MultigetSelectStore} from './type';
import {getMultigetSelectActions} from './actions';
import {getMultigetSelectInitialState} from './initial';
import {createContext, useContext} from 'react';

export const createIsolatedMultigetSelectStore = () => {
    console.log('createIsolatedMultigetSelectStore')

    return create<MultigetSelectStore>()(
        immer(
            (set, get) => ({
                ...getMultigetSelectInitialState(),
                ...getMultigetSelectActions(set, get),
            })
        )
    )
}

type MultigetSelectStoreContextType = ReturnType<typeof createIsolatedMultigetSelectStore> | null
export const MultigetSelectStoreContext = createContext<MultigetSelectStoreContextType>(null)

export const useMultigetSelectStore = () => {
    const context = useContext(MultigetSelectStoreContext);
    if (!context) {
        throw new Error("useMultigetSelectStore must be used within a StoreProvider")
    }
    return context
}