import {MultigetSelectState} from './type';
import {MultichoiceFilterTypeEnum} from "../../filters/types";

export const getMultigetSelectInitialState = (): MultigetSelectState => ({
    filterType: MultichoiceFilterTypeEnum.NONE,
    onlyEnabledStatus: true,
    searchString: '',
    searchLabel: 'all',
    availableItems: [],
    selectedItems: [],
    currentPage: 1,
    hasNextPage: false,
    // The panel asks for its first page as it opens: until the answer the list shows its skeleton.
    isLoading: true,
})
