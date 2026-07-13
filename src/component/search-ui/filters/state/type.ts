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
    TransactionSessionStatus,
} from '../types';
import {AbstractEntity, AbstractEntityAllableCollection, AutoCompleteChoice} from '../../../..';
import {SearchUIFiltersConfig} from '../SearchUIFilters';
import {SearchUIDefaults} from '../../SearchUIProvider';

export type SearchUIFiltersStore = SearchUIFiltersState & SearchUIFiltersActions

export type SearchUIRetentionSnapshot = {
    searchConditions: SearchUIConditions
    appliedSearchCriteria: SearchCriteria | null
    activeTemplateName: string | null
    hasUnappliedFilters: boolean
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria: CriterionTypeEnum[]
    exactSearchLabels: ExactCriterionSearchLabelEnum[]
    manualSearch: boolean
}

export type SearchUIPrefetchedTransactionSessionStatuses = Map<TransactionSessionGroup, TransactionSessionStatus[]>

export type SearchUIPrefetchedData = {
    transactionSessionStatuses?: SearchUIPrefetchedTransactionSessionStatuses
}

export type SearchUIPrefetchedDataLoading = {
    transactionSessionStatuses: boolean
}

export type SearchUIPrefetchedDataMeta = {
    transactionSessionStatusesPrefilled: boolean
}

export type SearchUIClearCriteriaUndoSnapshot = SearchUIConditions & {
    template: SearchUITemplate | null
    hasUnappliedFilters: boolean
}

export type SearchUIFiltersState = SearchUIConditions & {
    initialized: boolean
    defaults: SearchUIDefaults
    settingsContextName: string
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria: CriterionTypeEnum[]
    exactSearchLabels: ExactCriterionSearchLabelEnum[]
    template: SearchUITemplate | null
    activeTemplateName: string | null
    templates: SearchUITemplate[]
    justAddedCriterion: CriterionTypeEnum | null
    config?: SearchUIFiltersConfig
    prevSearchCriteria: SearchCriteria | null
    appliedSearchCriteria: SearchCriteria | null
    hasUnappliedFilters: boolean
    restoredFromRetention: boolean
    skipLastTemplateAutoApply: boolean
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
    prefetchedData: SearchUIPrefetchedData
    prefetchedDataLoading: SearchUIPrefetchedDataLoading
    prefetchedDataMeta: SearchUIPrefetchedDataMeta
}

export type SearchUIFiltersActions = {
    setInitialState: (
        state: Partial<SearchUIFiltersState> & Pick<SearchUIFiltersState, 'defaults'>,
        retainedSnapshot?: SearchUIRetentionSnapshot,
    ) => void
    updateConditions: (
        conditions: Partial<SearchUIConditions>,
        options?: {
            forceSearch?: boolean
            resetTemplate?: boolean
        },
    ) => void
    restoreClearCriteriaSnapshot: (snapshot: SearchUIClearCriteriaUndoSnapshot) => void
    clearCriteria: () => void
    clearCriterion: (criterionType: CriterionTypeEnum) => void
    addCriterion: (criterionType: CriterionTypeEnum) => void
    removeCriterion: (criterionType: CriterionTypeEnum) => void
    createTemplate: (templateName: string) => void
    updateTemplate: (templateName: string) => void
    removeTemplate: (template: SearchUITemplate) => void
    setTemplate: (
        template: SearchUITemplate,
        options?: {
            forceSearch?: boolean
        },
    ) => void
    loadTemplates: () => void
    setJustAddedCriterion: (criterion: CriterionTypeEnum | null) => void
    setMultigetCriterion: (criterion: MultigetCriterion) => void
    set3DCriterion: (threeD: ThreeDCriterionEnum) => void
    setStatusCriterion: (status: StatusCriterion) => void
    setExactCriterionSearchLabel: (searchLabel: ExactCriterionSearchLabelEnum) => void
    setExactCriterionSearchValue: (searchValue: string) => void
    setOrderSearchCriterionLabel: (searchLabel: OrderSearchLabel) => void
    setOrderSearchCriterionValue: (searchValue: string) => void
    setCustomerLevelCriterion: (customerLevel: AbstractEntity | null) => void
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
    setTransactionSessionStatusesCriterion: (transactionSessionStatuses: TransactionSessionStatus[]) => void
    setGroupingCriterionGroups: (available: GroupingType[], selected: GroupingType[]) => void
    setGroupingCriterionDateType: (dateType: GroupingDateType) => void
    setRecurrenceTypesCriterion: (recurrenceTypes: AbstractEntityAllableCollection) => void
    setRecurrenceStatusesCriterion: (recurrenceStatuses: AbstractEntityAllableCollection) => void
    setMfoConfigurationTypesCriterion: (mfoConfigurationTypes: AbstractEntityAllableCollection) => void
    setMarkerTypesCriterion: (markerTypes: AbstractEntityAllableCollection) => void
    setMarkerStatusCriterion: (markerStatus: MarkerStatusCriterion) => void
    setProcessorLogEntryType: (entryType: AbstractEntity) => void
    setErrorCodeCriterion: (errorCode: AutoCompleteChoice | null) => void
    triggerSearch: () => void
}
