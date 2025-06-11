import {
    CriterionTypeEnum,
    DateRangeSpec,
    ExactCriterionSearchLabelEnum,
    GroupingDateType,
    GroupingType,
    MarkerStatusCriterion,
    MultigetCriterion,
    OrderDate, OrderSearchLabel,
    SearchCriteria,
    SearchUIConditions,
    SearchUITemplate,
    StatusCriterion,
    ThreeDCriterionEnum,
} from '../types';
import {AbstractEntity, AbstractEntityAllableCollection} from '../../../..';
import {SearchUIFiltersConfig} from '../SearchUIFilters';
import {SearchUIDefaults} from '../../SearchUIProvider';

export type SearchUIFiltersStore = SearchUIFiltersState & SearchUIFiltersActions

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
}

export type SearchUIFiltersActions = {
    setInitialState: (state: Partial<SearchUIFiltersState> & Pick<SearchUIFiltersState, 'defaults'>) => void
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
    setDateRangeCriterionOrderDateType: (orderDateType: OrderDate) => void
    setDateRangeCriterion: (dateRangeSpec: DateRangeSpec) => void
    setProjectCurrencyCriterionCurrency: (currency: AbstractEntity) => void
    setProjectCurrencyCriterionConvertFlag: (convertToUserCurrency: boolean) => void
    setCardTypesCriterion: (cardTypes: AbstractEntityAllableCollection) => void
    setTransactionTypesCriterion: (transactionTypes: AbstractEntityAllableCollection) => void
    setGroupingCriterionGroups: (available: GroupingType[], selected: GroupingType[]) => void
    setGroupingCriterionDateType: (dateType: GroupingDateType) => void
    setRecurrenceTypesCriterion: (recurrenceTypes: AbstractEntityAllableCollection) => void
    setRecurrenceStatusesCriterion: (recurrenceStatuses: AbstractEntityAllableCollection) => void
    setMfoConfigurationTypesCriterion: (mfoConfigurationTypes: AbstractEntityAllableCollection) => void
    setMarkerTypesCriterion: (markerTypes: AbstractEntityAllableCollection) => void
    setMarkerStatusCriterion: (markerStatus: MarkerStatusCriterion) => void
    setProcessorLogEntryType: (entryType: AbstractEntity) => void
}
