import {SearchUIActions, SearchUIStore} from './type';
import {SearchCriteria} from '../filters/types';
import {ZustandStoreGet, ZustandStoreImmerSet} from '../../../common';

export const getSearchUIActions = (
    set: ZustandStoreImmerSet<SearchUIStore>,
    get: ZustandStoreGet<SearchUIStore>,
): SearchUIActions => ({
    setSearchCriteria: (searchCriteria: SearchCriteria) => {
        set((draft) => {
            draft.searchCriteria = searchCriteria
        })
    },
})