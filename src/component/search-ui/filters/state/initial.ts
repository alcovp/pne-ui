import {
    Grouping,
    GroupingType,
    ProjectCurrency,
    SearchUIConditions,
    ThreeDCriterionEnum,
} from '../types';
import {SearchUIFiltersState} from './type';
import {AbstractEntityAllableCollection} from '../../../..';
import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {initialSearchUIDefaults, SearchUIDefaults} from "../../SearchUIProvider";

dayjs.extend(utc)
dayjs.extend(timezone)

export const getSearchUIInitialProjectCurrency = (defaults: SearchUIDefaults): Readonly<ProjectCurrency> => {
    return Object.freeze<ProjectCurrency>({
        currency: defaults.getDefaultCurrency(),
        convertToUserCurrency: false,
    })
}

const getAvailableGroupingTypes = (defaults: SearchUIDefaults): GroupingType[] => {
    const types: GroupingType[] = [
        'CURRENCY',
        'ENDPOINT',
        'CARD_TYPE',
    ]

    if (defaults.showProjectCodeGrouping()) {
        types.push('PROJECT_CODE')
    }

    if (defaults.showManagerGrouping()) {
        types.push('MANAGER')
    }

    if (defaults.showGateRelatedGroupings()) {
        types.push('GATE')
        types.push('PROCESSOR')
        types.push('MID')
    }

    if (defaults.showCounterpartyGrouping()) {
        types.push('COUNTERPARTY')
    }

    return types
}

export const getSearchUIInitialGrouping = (defaults: SearchUIDefaults): Grouping => Object.freeze<Grouping>({
    dateType: 'DAY',
    availableGroupingTypes: getAvailableGroupingTypes(defaults),
    selectedGroupingTypes: [
        'MERCHANT',
        'PROJECT',
        'DATE',
    ],
})

export const searchUIInitialDateFrom: Dayjs = Object.freeze<Dayjs>(
    dayjs().utc().startOf('day')
)
export const searchUIInitialDateTo: Dayjs = Object.freeze<Dayjs>(
    dayjs().utc().startOf('day').add(1, 'day')
)

export const searchUIInitialAllableCollection: AbstractEntityAllableCollection =
    Object.freeze<AbstractEntityAllableCollection>({
        all: true,
        entities: [],
    })

export const getSearchUIInitialSearchCriteria = (defaults: SearchUIDefaults): Readonly<SearchUIConditions> => {
    return Object.freeze<SearchUIConditions>({
        multigetCriteria: [],
        status: 'ANY',
        threeD: ThreeDCriterionEnum.ANY,
        exactSearchLabel: undefined,
        exactSearchValue: '',
        ordersSearchLabel: 'merchant_invoice_id',
        ordersSearchValue: '',
        currencies: searchUIInitialAllableCollection,
        orderDateType: 'SESSION_STATUS_CHANGED',
        dateRangeSpec: {
            dateRangeSpecType: 'TODAY',
            dateFrom: searchUIInitialDateFrom.tz('Europe/Moscow', true).toDate(),
            dateTo: searchUIInitialDateTo.tz('Europe/Moscow', true).toDate(),
            beforeCount: 1,
        },
        cardTypes: searchUIInitialAllableCollection,
        transactionTypes: searchUIInitialAllableCollection,
        transactionStatuses: searchUIInitialAllableCollection,
        transactionSessionStatusGroup: 'APPROVED',
        transactionSessionStatuses: [],
        projectCurrency: getSearchUIInitialProjectCurrency(defaults),
        grouping: getSearchUIInitialGrouping(defaults),
        recurrenceTypes: searchUIInitialAllableCollection,
        recurrenceStatuses: searchUIInitialAllableCollection,
        mfoConfigurationTypes: searchUIInitialAllableCollection,
        markerTypes: searchUIInitialAllableCollection,
        markerStatus: 'any',
        processorLogEntryType: null,
        errorCode: null,

        criteria: [],
    })
}

export const getSearchUIFiltersInitialState = (): SearchUIFiltersState => ({
    ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),

    defaults: initialSearchUIDefaults,
    settingsContextName: '',
    possibleCriteria: [],
    predefinedCriteria: [],
    exactSearchLabels: [],
    template: null,
    templates: [],
    justAddedCriterion: null,
    prevSearchCriteria: null,

    onFiltersUpdate: () => {
        throw new Error('Function onFiltersUpdate is not provided')
    },
})
