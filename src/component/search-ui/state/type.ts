import {SearchCriteria} from "../filters/types";

export type SearchUIStore = SearchUIState & SearchUIActions

export type SearchUIState = {
    searchCriteria: SearchCriteria
}

export type SearchUIActions = {
    setSearchCriteria: (searchCriteria: SearchCriteria) => void
}
