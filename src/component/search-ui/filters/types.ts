import {AbstractEntity, AbstractEntityAllableCollection, Status} from '../../..';

export enum CriterionTypeEnum {
    EXACT = 'EXACT',
    CURRENCY = 'CURRENCY',
    THREE_D = 'THREE_D',
    STATUS = 'STATUS',
    MERCHANT = 'MERCHANT',
    ENDPOINT = 'ENDPOINT',
    RESELLER = 'RESELLER',
    PROCESSOR = 'PROCESSOR',
    MANAGER = 'MANAGER',
    PROJECT = 'PROJECT',
    COMPANY = 'COMPANY',
    GATE = 'GATE',
    DEALER = 'DEALER',
    DATE_RANGE = 'DATE_RANGE',
    PROJECT_CURRENCY = 'PROJECT_CURRENCY',
    CARD_TYPES = 'CARD_TYPES',
    GROUPING = 'GROUPING',
    TRANSACTION_TYPES = 'TRANSACTION_TYPES',
    USER_DEFINED = 'USER_DEFINED',
    RECURRENCE_TYPE = 'RECURRENCE_TYPE',
    RECURRENCE_STATUS = 'RECURRENCE_STATUS',
    MFO_CONFIGURATION_TYPE = 'MFO_CONFIGURATION_TYPE',
    MARKER_TYPE = 'MARKER_TYPE',
    MARKER_STATUS = 'MARKER_STATUS',
}

export const DATE_RANGE_SPEC_TYPES = [
    'EXACTLY',
    'TODAY',
    'YESTERDAY',
    'THIS_WEEK',
    'LAST_WEEK',
    'THIS_MONTH',
    'LAST_MONTH',
    'DAYS_BEFORE',
    'HOURS_BEFORE',
    'DATE_INDEPENDENT',
] as const

export type DateRangeSpecType = typeof DATE_RANGE_SPEC_TYPES[number];

export type DateRangeSpec = {
    dateRangeSpecType: DateRangeSpecType
    dateFrom: Date | null
    dateTo: Date | null
    beforeCount: number
}

export type ProjectCurrency = {
    convertToUserCurrency: boolean
    currency: AbstractEntity
}

export const GROUPING_DATE_TYPES = [
    'MONTH',
    'DAY',
    'CLOSE_DAY',
    'SETTLEMENT_DAY',
    'SETTLEMENT_MONTH',
] as const
export type GroupingDateType = typeof GROUPING_DATE_TYPES[number];

export const GROUPING_TYPES = [
    'MERCHANT',
    'MANAGER',
    'PROJECT',
    'CURRENCY',
    'ENDPOINT',
    'CARD_TYPE',
    'GATE',
    'PROCESSOR',
    'MID',
    'COUNTERPARTY',
    'PROJECT_CODE',
    'DATE',

    ...GROUPING_DATE_TYPES,
] as const
export type GroupingType = typeof GROUPING_TYPES[number];

export type Grouping = {
    dateType: GroupingDateType
    availableGroupingTypes: GroupingType[]
    selectedGroupingTypes: GroupingType[]
}

export const STATUS_CRITERION_VALUES = [
    'ANY',
    'DISABLED',
    'ENABLED',
] as const
export type StatusCriterion = typeof STATUS_CRITERION_VALUES[number]

export const MARKER_STATUS_CRITERION_VALUES = [
    'any',
    'unprocessed',
    'processed'
] as const
export type MarkerStatusCriterion = typeof MARKER_STATUS_CRITERION_VALUES[number]

export enum ThreeDCriterionEnum {
    ANY = 'ANY',
    NO = 'NO',
    YES = 'YES',
}

//TODO эту херню удалить
export enum UserDefinedCriterionEnum {
    TOTAL = 'TOTAL',
    SECURE_3D = 'SECURE_3D',
    NONE_3D_SECURE = 'NONE_3D_SECURE',
    PAYOUT = 'PAYOUT'
}

export enum ExactCriterionSearchLabelEnum {
    ALL = 'ALL',
    NAME = 'NAME',
    DESCRIPTION = 'DESCRIPTION',
    TAGS = 'TAGS',
    IDENTIFIER = 'IDENTIFIER',
    BEAN = 'BEAN',
    END_POINT_GROUP_ID = 'END_POINT_GROUP_ID',
    ID = "ID",
    AMOUNT = "AMOUNT",
    FINAL_CLEARING_DATE = "FINAL_CLEARING_DATE",
    MANAGER = "MANAGER",
    SERIAL_NUMBER = "SERIAL_NUMBER",
    INVOICE = "INVOICE",
    CARD_FROM_RECURRENCE_NUMBER = "CARD_FROM_RECURRENCE_NUMBER",
    FIRST_6 = "FIRST_6",
    LAST_4 = "LAST_4",
    FIRST_6_LAST_4 = "FIRST_6_LAST_4",
    ORDER_IDENTIFIER = "ORDER_IDENTIFIER",
}

// DO NOT EXTEND
export enum MultichoiceFilterTypeEnum {
    ALL = 'ALL',
    NONE = 'NONE',
    SEARCH = 'SEARCH',
}

export enum LinkedEntityTypeEnum {
    PROCESSOR = 'PROCESSOR',
    GATE = 'GATE',
    PROJECT = 'PROJECT',
    ENDPOINT = 'ENDPOINT',
    MERCHANT = 'MERCHANT',
    MANAGER = 'MANAGER',
    RESELLER = 'RESELLER',
    DEALER = 'DEALER',
    COMPANY = 'COMPANY',
    SUPERIOR = 'SUPERIOR',
    FORM_TEMPLATE_PAYMENT = 'FORM_TEMPLATE_PAYMENT',
    FORM_TEMPLATE_WAIT = 'FORM_TEMPLATE_WAIT',
    FORM_TEMPLATE_FINISH = 'FORM_TEMPLATE_FINISH',
    FORM_TEMPLATE_TDS_METHOD = 'FORM_TEMPLATE_TDS_METHOD'
}

export type MultigetCriterion = {
    entityType: LinkedEntityTypeEnum
    filterType: MultichoiceFilterTypeEnum
    searchString: string
    selectedItems: string
    deselectedItems: string
    selectedItemNames: string
    deselectedItemNames: string
}

export type SearchCriteria = {
    exactSearchLabel: string | null
    exactSearchValue: string | null
    status: Status | null
    threeD: boolean | null
    currencies: number[]
    dateFrom: Date | null
    dateTo: Date | null
    cardTypes: number[]
    transactionTypes: number[]
    projectCurrencyId: number | null
    projectCurrencyConvert: boolean | null
    groupTypes: GroupingType[]
    multigetCriteria: MultigetCriterion[]
    userDefined: UserDefinedCriterionEnum
    recurrenceTypes: number[]
    recurrenceStatuses: number[]
    mfoConfigurationTypes: number[]
    markerTypes: number[]
    markerStatus: MarkerStatusCriterion | null
}

export type SearchUIConditions = {
    criteria: CriterionTypeEnum[]

    multigetCriteria: MultigetCriterion[]
    status: StatusCriterion
    threeD: ThreeDCriterionEnum
    exactSearchLabel: ExactCriterionSearchLabelEnum
    exactSearchValue: string
    currencies: AbstractEntityAllableCollection
    dateRangeSpec: DateRangeSpec
    cardTypes: AbstractEntityAllableCollection
    transactionTypes: AbstractEntityAllableCollection
    projectCurrency: ProjectCurrency
    grouping: Grouping
    userDefined: UserDefinedCriterionEnum
    recurrenceTypes: AbstractEntityAllableCollection
    recurrenceStatuses: AbstractEntityAllableCollection
    mfoConfigurationTypes: AbstractEntityAllableCollection
    markerTypes: AbstractEntityAllableCollection
    markerStatus: MarkerStatusCriterion
}

export type SearchUITemplate = {
    name: string
    searchConditions: SearchUIConditions
}
