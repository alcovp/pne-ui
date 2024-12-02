import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {PneTableStore} from './type';
import {getPneTableActions} from './actions';
import {getPneTableInitialState} from './initial';

export const usePneTableStore = create<PneTableStore>()(
    immer(
        (set, get) => ({
            ...getPneTableInitialState(),
            ...getPneTableActions(set, get),
        })
    )
)
