import {
    ExactCriterionSearchLabelEnum,
    Grouping,
    GroupingType,
    ProjectCurrency,
    SearchUIConditions,
    ThreeDCriterionEnum,
    UserDefinedCriterionEnum
} from '../types';
import {SearchUIState} from './type';
import {AbstractEntityAllableCollection} from '../../../..';
import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {initialSearchUIDefaults, SearchUIDefaults} from "../../SearchUIProvider";

dayjs.extend(utc)

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
        list: [],
    })

export const getSearchUIInitialSearchCriteria = (defaults: SearchUIDefaults): Readonly<SearchUIConditions> => {
    return Object.freeze<SearchUIConditions>({
        multigetCriteria: [],
        status: 'ANY',
        threeD: ThreeDCriterionEnum.ANY,
        exactSearchLabel: undefined,
        exactSearchValue: '',
        currencies: searchUIInitialAllableCollection,
        dateRangeSpec: {
            dateRangeSpecType: 'TODAY',
            dateFrom: searchUIInitialDateFrom.toDate(),
            dateTo: searchUIInitialDateTo.toDate(),
            beforeCount: 0,
        },
        cardTypes: searchUIInitialAllableCollection,
        transactionTypes: searchUIInitialAllableCollection,
        projectCurrency: getSearchUIInitialProjectCurrency(defaults),
        grouping: getSearchUIInitialGrouping(defaults),
        userDefined: UserDefinedCriterionEnum.TOTAL,
        recurrenceTypes: searchUIInitialAllableCollection,
        recurrenceStatuses: searchUIInitialAllableCollection,
        mfoConfigurationTypes: searchUIInitialAllableCollection,
        markerTypes: searchUIInitialAllableCollection,
        markerStatus: 'any',

        criteria: [],
    })
}

export const getSearchUIInitialState = (): SearchUIState => ({
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
