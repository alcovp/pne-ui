import {MultigetSelectState} from './type';
import {MultichoiceFilterTypeEnum} from "../../filters/types";

export const getMultigetSelectInitialState = (): MultigetSelectState => ({
    filterType: MultichoiceFilterTypeEnum.NONE,
    onlyEnabledStatus: false,
    searchString: '',
    searchLabel: 'all',
    availableItems: [],
    selectedItems: [],
    currentPage: 1,
    hasNextPage: false,
})
