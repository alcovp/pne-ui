import {
    CountryAllableCollection,
    CriterionTypeEnum,
    DateRangeSpec,
    ExactCriterionSearchLabelEnum,
    GroupingDateType,
    GroupingType,
    MarkerStatusCriterion,
    MultigetCriterion,
    OrderDate,
    OrderSearchLabel,
    SearchCriteria,
    SearchUIConditions,
    SearchUITemplate,
    StatusCriterion,
    ThreeDCriterionEnum,
    TransactionSessionGroup,
} from '../types';
import {AbstractEntity, AbstractEntityAllableCollection, AutoCompleteChoice} from '../../../..';
import {SearchUIFiltersConfig} from '../SearchUIFilters';
import {SearchUIDefaults} from '../../SearchUIProvider';

export type SearchUIFiltersStore = SearchUIFiltersState & SearchUIFiltersActions

export type SearchUIPrefetchedTransactionSessionStatuses = Map<TransactionSessionGroup, string[]>

export type SearchUIPrefetchedData = {
    transactionSessionStatuses?: SearchUIPrefetchedTransactionSessionStatuses
}

export type SearchUIPrefetchedDataLoading = {
    transactionSessionStatuses: boolean
}

export type SearchUIPrefetchedDataMeta = {
    transactionSessionStatusesPrefilled: boolean
}

export type SearchUIFiltersState = SearchUIConditions & {
    defaults: SearchUIDefaults
    settingsContextName: string
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria: CriterionTypeEnum[]
    exactSearchLabels: ExactCriterionSearchLabelEnum[]
    template: SearchUITemplate | null
    templates: SearchUITemplate[]
    justAddedCriterion: CriterionTypeEnum | null
    config?: SearchUIFiltersConfig
    prevSearchCriteria: SearchCriteria | null
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
    prefetchedData: SearchUIPrefetchedData
    prefetchedDataLoading: SearchUIPrefetchedDataLoading
    prefetchedDataMeta: SearchUIPrefetchedDataMeta
}

export type SearchUIFiltersActions = {
    setInitialState: (state: Partial<SearchUIFiltersState> & Pick<SearchUIFiltersState, 'defaults'>) => void
    updateConditions: (conditions: Partial<SearchUIConditions>) => void
    clearCriteria: () => void
    clearCriterion: (criterionType: CriterionTypeEnum) => void
    addCriterion: (criterionType: CriterionTypeEnum) => void
    removeCriterion: (criterionType: CriterionTypeEnum) => void
    createTemplate: (templateName: string) => void
    updateTemplate: (templateName: string) => void
    removeTemplate: (template: SearchUITemplate) => void
    setTemplate: (template: SearchUITemplate) => void
    loadTemplates: () => void
    setJustAddedCriterion: (criterion: CriterionTypeEnum | null) => void
    setMultigetCriterion: (criterion: MultigetCriterion) => void
    set3DCriterion: (threeD: ThreeDCriterionEnum) => void
    setStatusCriterion: (status: StatusCriterion) => void
    setExactCriterionSearchLabel: (searchLabel: ExactCriterionSearchLabelEnum) => void
    setExactCriterionSearchValue: (searchValue: string) => void
    setOrderSearchCriterionLabel: (searchLabel: OrderSearchLabel) => void
    setOrderSearchCriterionValue: (searchValue: string) => void
    setCurrenciesCriterion: (currencies: AbstractEntityAllableCollection) => void
    setCountriesCriterion: (countries: CountryAllableCollection) => void
    setDateRangeCriterionOrderDateType: (orderDateType: OrderDate) => void
    setDateRangeCriterion: (dateRangeSpec: DateRangeSpec) => void
    setProjectCurrencyCriterionCurrency: (currency: AbstractEntity) => void
    setProjectCurrencyCriterionConvertFlag: (convertToUserCurrency: boolean) => void
    setCardTypesCriterion: (cardTypes: AbstractEntityAllableCollection) => void
    setTransactionTypesCriterion: (transactionTypes: AbstractEntityAllableCollection) => void
    setTransactionStatusesCriterion: (transactionStatuses: AbstractEntityAllableCollection) => void
    setTransactionSessionStatusGroupCriterion: (transactionSessionStatusGroup: TransactionSessionGroup) => void
    setTransactionSessionStatusesCriterion: (transactionSessionStatuses: string[]) => void
    setGroupingCriterionGroups: (available: GroupingType[], selected: GroupingType[]) => void
    setGroupingCriterionDateType: (dateType: GroupingDateType) => void
    setRecurrenceTypesCriterion: (recurrenceTypes: AbstractEntityAllableCollection) => void
    setRecurrenceStatusesCriterion: (recurrenceStatuses: AbstractEntityAllableCollection) => void
    setMfoConfigurationTypesCriterion: (mfoConfigurationTypes: AbstractEntityAllableCollection) => void
    setMarkerTypesCriterion: (markerTypes: AbstractEntityAllableCollection) => void
    setMarkerStatusCriterion: (markerStatus: MarkerStatusCriterion) => void
    setProcessorLogEntryType: (entryType: AbstractEntity) => void
    setErrorCodeCriterion: (errorCode: AutoCompleteChoice | null) => void
}
