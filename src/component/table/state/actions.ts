import {PneTableActions, PneTableStore} from './type';
import {ZustandStoreGet, ZustandStoreImmerSet} from '../../../common';

export const getPneTableActions = (
    set: ZustandStoreImmerSet<PneTableStore>,
    get: ZustandStoreGet<PneTableStore>,
): PneTableActions => ({
    setNeedToScrollToPagination: (needToScrollToPagination: boolean) => {
        set((draft) => {
            draft.needToScrollToPagination = needToScrollToPagination
        })
    },
})