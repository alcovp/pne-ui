import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {SearchUIFiltersStore} from './type';
import {getSearchUIFiltersActions} from './actions';
import {getSearchUIFiltersInitialState} from './initial';

export const useSearchUIFiltersStore = create<SearchUIFiltersStore>()(
    immer(
        (set, get) => ({
            ...getSearchUIFiltersInitialState(),
            ...getSearchUIFiltersActions(set, get),
        })
    )
)
