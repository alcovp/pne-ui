import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {SearchUIStore} from './type';
import {getSearchUIActions} from './actions';
import {getSearchUIInitialState} from './initial';

export const useSearchUIStore = create<SearchUIStore>()(
    immer(
        (set, get) => ({
            ...getSearchUIInitialState(),
            ...getSearchUIActions(set, get),
        })
    )
)
