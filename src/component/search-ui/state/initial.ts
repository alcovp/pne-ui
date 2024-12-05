import {SearchUIState} from './type';

export const getSearchUIInitialState = (): SearchUIState => ({
    searchCriteria: {
        initialized: false,
        exactSearchLabel: null,
        exactSearchValue: '',
        status: null,
        threeD: null,
        currencies: [],
        dateFrom: null,
        dateTo: null,
        cardTypes: [],
        transactionTypes: [],
        projectCurrencyId: null,
        projectCurrencyConvert: null,
        groupTypes: [],
        multigetCriteria: [],
        recurrenceTypes: [],
        recurrenceStatuses: [],
        mfoConfigurationTypes: [],
        markerTypes: [],
        markerStatus: null,
    }
})
