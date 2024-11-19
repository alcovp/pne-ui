import {useState} from 'react';
import {SearchCriteria, UserDefinedCriterionEnum} from './types';

export const useSearchCriteria = () => {
    return useState<SearchCriteria>({
        initialized: false,
        exactSearchLabel: null,
        exactSearchValue: null,
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
        userDefined: UserDefinedCriterionEnum.TOTAL,
        recurrenceTypes: [],
        recurrenceStatuses: [],
        mfoConfigurationTypes: [],
        markerTypes: [],
        markerStatus: null,
    })
}
