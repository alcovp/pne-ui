import {AbstractEntity, AbstractEntityAllableCollection, AutoCompleteChoice, Status} from '../../..';

export enum CriterionTypeEnum {
    EXACT = 'EXACT',
    ORDERS_SEARCH = 'ORDERS_SEARCH',
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
    DATE_RANGE_ORDERS = 'DATE_RANGE_ORDERS',
    PROJECT_CURRENCY = 'PROJECT_CURRENCY',
    CARD_TYPES = 'CARD_TYPES',
    GROUPING = 'GROUPING',
    TRANSACTION_TYPES = 'TRANSACTION_TYPES',
    TRANSACTION_STATUS = 'TRANSACTION_STATUS',
    RECURRENCE_TYPE = 'RECURRENCE_TYPE',
    RECURRENCE_STATUS = 'RECURRENCE_STATUS',
    MFO_CONFIGURATION_TYPE = 'MFO_CONFIGURATION_TYPE',
    MARKER_TYPE = 'MARKER_TYPE',
    MARKER_STATUS = 'MARKER_STATUS',
    PROCESSOR_LOG_ENTRY_TYPE = 'PROCESSOR_LOG_ENTRY_TYPE',
    ERROR_CODE = 'ERROR_CODE',
}

export const ORDER_DATE_TYPES = [
    'SESSION_CREATED',
    'SESSION_STATUS_CHANGED',
    'TX_CREATED',
    'BANK',
    'TX_SETTLED',
    'TX_UNSETTLED',
] as const
export type OrderDate = typeof ORDER_DATE_TYPES[number];

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

export const ORDER_SEARCH_LABELS = [
    'merchant_invoice_id',
    'order_id',
    'processor_order_id',
    'purpose',
    'transaction_amount',
    'session_token',

    'customer_phone',
    'customer_email',
    'customer_ip',
    'customer_ip_country',
    'customer_billing_country',
    'customer_dna_id',
    'customer_id',
    'batch_id',

    'source_bank_name',
    'source_country',
    'source_from_order_id',
    'source_bin',
    'source_bin_range_from_order_id',
    'source_last4',
    'source_bin_last4',
    'source_auth_code',
    'source_arn',
    'source_rrn',
    'source_card_holder',
    'source_card_ref_id',

    'dest_bank_name',
    'dest_country',
    'dest_from_order_id',
    'dest_bin',
    'dest_bin_range_from_order_id',
    'dest_last4',
    'dest_bin_last',
    'dest_auth_code',
    'dest_arn',
    'dest_rrn',
    'dest_card_ref_id',

    'account_number',
    'routing_number',

    'reader_key_serial_number',
    'reader_device_serial_number',

    'device_serial_number',
    'phone_serial_number',
    'phone_imei',

    'reader_id',
    'registration_info_id',
    'inn',
    'mtcn',
    'rebill',
    'swift_number',
    'webmoney_account',
    'yamoney_account',
    'wire_account',
    'card_number_hash_hash',
] as const
export type OrderSearchLabel = typeof ORDER_SEARCH_LABELS[number]

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
    EMAIL = 'EMAIL',
    LOGIN = 'LOGIN',
    PRINCIPAL_DEALER = 'PRINCIPAL_DEALER',
    PRINCIPAL_MANAGER = 'PRINCIPAL_MANAGER',
    PRINCIPAL_MERCHANT = 'PRINCIPAL_MERCHANT',
    PRINCIPAL_RESELLER = 'PRINCIPAL_RESELLER',
    PRINCIPAL_SUPERIOR = 'PRINCIPAL_SUPERIOR',
    END_POINT_IDENTIFIER = 'END_POINT_IDENTIFIER',
    END_POINT_GROUP_IDENTIFIER = 'END_POINT_GROUP_IDENTIFIER',
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
    initialized: boolean // это только для предотвращения лишнего вызова при загрузке страницы

    exactSearchLabel: string | null
    exactSearchValue: string | null
    ordersSearchLabel: string | null
    ordersSearchValue: string | null
    status: Status | null
    threeD: boolean | null
    currencies: number[]
    dateFrom: Date | null
    dateTo: Date | null
    orderDateType: OrderDate
    cardTypes: number[]
    transactionTypes: number[]
    transactionStatuses: number[]
    projectCurrencyId: number | null
    projectCurrencyConvert: boolean | null
    groupTypes: GroupingType[]
    multigetCriteria: MultigetCriterion[]
    recurrenceTypes: number[]
    recurrenceStatuses: number[]
    mfoConfigurationTypes: number[]
    markerTypes: number[]
    markerStatus: MarkerStatusCriterion | null
    processorLogEntryType: string | null
    errorCode: number | null
}

export type SearchUIConditions = {
    criteria: CriterionTypeEnum[]

    multigetCriteria: MultigetCriterion[]
    status: StatusCriterion
    threeD: ThreeDCriterionEnum
    exactSearchLabel: ExactCriterionSearchLabelEnum | undefined
    exactSearchValue: string
    ordersSearchLabel: OrderSearchLabel
    ordersSearchValue: string
    currencies: AbstractEntityAllableCollection
    orderDateType: OrderDate
    dateRangeSpec: DateRangeSpec
    cardTypes: AbstractEntityAllableCollection
    transactionTypes: AbstractEntityAllableCollection
    transactionStatuses: AbstractEntityAllableCollection
    projectCurrency: ProjectCurrency
    grouping: Grouping
    recurrenceTypes: AbstractEntityAllableCollection
    recurrenceStatuses: AbstractEntityAllableCollection
    mfoConfigurationTypes: AbstractEntityAllableCollection
    markerTypes: AbstractEntityAllableCollection
    markerStatus: MarkerStatusCriterion
    processorLogEntryType: AbstractEntity | null
    errorCode: AutoCompleteChoice | null
}

export type SearchUITemplate = {
    name: string
    searchConditions: SearchUIConditions
}
