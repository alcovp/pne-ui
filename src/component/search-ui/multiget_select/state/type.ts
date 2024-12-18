import {MultichoiceFilterTypeEnum} from "../../filters/types";
import {AbstractEntity} from "../../../../common";

export type MultigetSelectStore = MultigetSelectState & MultigetSelectActions

export type MultigetSelectState = {
    filterType: MultichoiceFilterTypeEnum
    onlyEnabledStatus: boolean
    searchString: string
    searchLabel: MultigetSearchLabel
    availableItems: AbstractEntity[]
    selectedItems: AbstractEntity[]
    currentPage: number
    hasNextPage: boolean
    isLoading: boolean
}

export type MultigetSelectActions = {
    setFilterType: (searchType: MultichoiceFilterTypeEnum) => void
    setOnlyEnabledStatus: (onlyEnabledStatus: boolean) => void
    setSearchString: (searchString: string) => void
    setSearchLabel: (searchLabel: MultigetSearchLabel) => void
    setAvailableItems: (items: AbstractEntity[]) => void
    setSelectedItems: (items: AbstractEntity[]) => void
    setCurrentPage: (currentPage: number) => void
    setHasNextPage: (hasNextPage: boolean) => void
    setLoading: (isLoading: boolean) => void
}

export type MultigetSearchLabel = 'all' | 'mid' | 'descriptor'