import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {MultigetSelectStore} from './type';
import {getMultigetSelectActions} from './actions';
import {getMultigetSelectInitialState} from './initial';

export const useMultigetSelectStore = create<MultigetSelectStore>()(
    immer(
        (set, get) => ({
            ...getMultigetSelectInitialState(),
            ...getMultigetSelectActions(set, get),
        })
    )
)
