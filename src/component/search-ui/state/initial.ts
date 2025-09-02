import {SearchUIState} from './type';

export const getSearchUIInitialState = (): SearchUIState => ({
    searchCriteria: {
        initialized: false,
        exactSearchLabel: null,
        exactSearchValue: '',
        ordersSearchLabel: null,
        ordersSearchValue: '',
        status: null,
        threeD: null,
        currencies: [],
        dateFrom: null,
        dateTo: null,
        orderDateType: 'SESSION_STATUS_CHANGED',
        cardTypes: [],
        transactionTypes: [],
        transactionStatuses: [],
        transactionSessionStatuses: null,
        projectCurrencyId: null,
        projectCurrencyConvert: null,
        groupTypes: [],
        multigetCriteria: [],
        recurrenceTypes: [],
        recurrenceStatuses: [],
        mfoConfigurationTypes: [],
        markerTypes: [],
        markerStatus: null,
        processorLogEntryType: null,
        errorCode: null,
    }
})
