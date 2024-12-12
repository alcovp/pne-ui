import {MultigetSearchLabel, MultigetSelectActions, MultigetSelectStore} from './type';
import {AbstractEntity, ZustandStoreGet, ZustandStoreImmerSet} from "../../../../common";
import {MultichoiceFilterTypeEnum} from "../../filters/types";

export const getMultigetSelectActions = (
    set: ZustandStoreImmerSet<MultigetSelectStore>,
    get: ZustandStoreGet<MultigetSelectStore>,
): MultigetSelectActions => ({
    setFilterType: (searchType: MultichoiceFilterTypeEnum) => {
        set((draft) => {
            draft.filterType = searchType
        })
    },
    setOnlyEnabledStatus: (onlyEnabledStatus: boolean) => {
        set((draft) => {
            draft.onlyEnabledStatus = onlyEnabledStatus
            draft.currentPage = 1
        })
    },
    setSearchString: (searchString: string) => {
        set((draft) => {
            draft.searchString = searchString
        })
    },
    setSearchLabel: (searchLabel: MultigetSearchLabel) => {
        set((draft) => {
            draft.searchLabel = searchLabel
        })
    },
    setAvailableItems: (items: AbstractEntity[]) => {
        set((draft) => {
            draft.availableItems = items
        })
    },
    setSelectedItems: (items: AbstractEntity[]) => {
        set((draft) => {
            draft.selectedItems = items
        })
    },
    setCurrentPage: currentPage => {
        set((draft) => {
            draft.currentPage = currentPage
        })
    },
    setHasNextPage: hasNextPage => {
        set((draft) => {
            draft.hasNextPage = hasNextPage
        })
    }
})