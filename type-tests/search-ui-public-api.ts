import {
    CriterionTypeEnum,
    SearchUIConditionsInput,
    SearchUIDateRangeSpec,
    SearchUIFiltersConfig,
    SearchUIFiltersProps,
    SearchUIProps,
    SearchUITemplate,
} from '../src'

type Row = {
    id: number
}

const acceptsDateRange = (_value: SearchUIDateRangeSpec): void => undefined
const acceptsConditions = (_value: Partial<SearchUIConditionsInput>): void => undefined
const acceptsInitialSearchUIConditions = (
    _value: NonNullable<SearchUIProps<Row>['initialSearchConditions']>,
): void => undefined
const acceptsInitialFiltersConditions = (
    _value: NonNullable<SearchUIFiltersProps['initialSearchConditions']>,
): void => undefined
const acceptsPersistedTemplateDateRange = (
    _value: SearchUITemplate['searchConditions']['dateRangeSpec'],
): void => undefined
const acceptsFiltersConfig = (_value: SearchUIFiltersConfig): void => undefined

acceptsDateRange({
    dateRangeSpecType: 'EXACTLY',
    dateFrom: new Date('2026-01-01T00:00:00.000Z'),
    dateTo: new Date('2026-01-02T00:00:00.000Z'),
})
acceptsDateRange({dateRangeSpecType: 'TODAY'})
acceptsDateRange({dateRangeSpecType: 'LAST_MONTH'})
acceptsDateRange({dateRangeSpecType: 'DAYS_BEFORE', beforeCount: 30})
acceptsDateRange({dateRangeSpecType: 'HOURS_BEFORE', beforeCount: 12})
acceptsDateRange({dateRangeSpecType: 'DATE_INDEPENDENT'})
acceptsPersistedTemplateDateRange({
    dateRangeSpecType: 'DAYS_BEFORE',
    dateFrom: new Date('2020-01-01T00:00:00.000Z'),
    dateTo: new Date('2020-01-31T00:00:00.000Z'),
    beforeCount: 30,
})

acceptsConditions({
    criteria: [CriterionTypeEnum.DATE_RANGE],
    dateRangeSpec: {dateRangeSpecType: 'DAYS_BEFORE', beforeCount: 30},
})
acceptsInitialSearchUIConditions({
    dateRangeSpec: {dateRangeSpecType: 'TODAY'},
})
acceptsInitialFiltersConditions({
    dateRangeSpec: {
        dateRangeSpecType: 'EXACTLY',
        dateFrom: new Date('2026-01-01T00:00:00.000Z'),
        dateTo: new Date('2026-01-02T00:00:00.000Z'),
    },
})
acceptsFiltersConfig({
    transactionTypes: {
        allowedNames: ['chargeback', 'fraud'],
    },
})

// @ts-expect-error Relative ranges are declarative and must not contain resolved dates.
acceptsDateRange({dateRangeSpecType: 'DAYS_BEFORE', beforeCount: 30, dateFrom: null, dateTo: null})
// @ts-expect-error Counted ranges require beforeCount.
acceptsDateRange({dateRangeSpecType: 'HOURS_BEFORE'})
// @ts-expect-error EXACTLY requires both boundaries.
acceptsDateRange({dateRangeSpecType: 'EXACTLY', dateFrom: new Date()})
// @ts-expect-error EXACTLY has no relative beforeCount parameter.
acceptsDateRange({dateRangeSpecType: 'EXACTLY', dateFrom: new Date(), dateTo: new Date(), beforeCount: 1})
// @ts-expect-error Calendar presets have no count or precomputed boundaries.
acceptsDateRange({dateRangeSpecType: 'THIS_WEEK', beforeCount: 1})
// @ts-expect-error DATE_INDEPENDENT carries no date payload.
acceptsDateRange({dateRangeSpecType: 'DATE_INDEPENDENT', dateFrom: new Date()})
// @ts-expect-error Unknown range types are rejected by the public union.
acceptsDateRange({dateRangeSpecType: 'LAST_30_DAYS', beforeCount: 30})
// @ts-expect-error initialSearchConditions cannot replace the configured criteria list.
acceptsInitialSearchUIConditions({criteria: [CriterionTypeEnum.STATUS]})
// @ts-expect-error SearchUIFilters enforces the same strict date-range contract as SearchUI.
acceptsInitialFiltersConditions({dateRangeSpec: {dateRangeSpecType: 'TODAY', dateFrom: null, dateTo: null, beforeCount: 0}})
// @ts-expect-error A transaction-types restriction must declare its allowed system names.
acceptsFiltersConfig({transactionTypes: {}})
// @ts-expect-error Transaction-type database IDs are instance-specific and are not accepted by this config.
acceptsFiltersConfig({transactionTypes: {allowedIds: [6, 7]}})
