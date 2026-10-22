import {CriterionTypeEnum} from '../src/component/search-ui/filters/types'
import {getSearchUIFiltersInitialState} from '../src/component/search-ui/filters/state/initial'
import {createSearchUIFiltersStore} from '../src/component/search-ui/filters/state/store'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'
import {
    SEARCH_UI_DATE_RANGE_END_BEFORE_START,
    SEARCH_UI_DATE_RANGE_INVALID_DATE,
    SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED,
    validateSearchUIFiltersState,
} from '../src/component/search-ui/filters/validation'

const createDateOnlyState = (dateTo: string) => ({
    ...getSearchUIFiltersInitialState(),
    criteria: [CriterionTypeEnum.DATE_RANGE],
    config: {
        dateRange: {
            maxRangeSpanInDays: 93,
        },
    },
    dateRangeSpec: {
        dateRangeSpecType: 'EXACTLY' as const,
        dateFrom: new Date('2026-01-01T00:00:00.000Z'),
        dateTo: new Date(dateTo),
        beforeCount: 0,
    },
})

describe('SearchUI date range validation', () => {
    it('accepts exactly 93 inclusive calendar days', () => {
        expect(validateSearchUIFiltersState(
            createDateOnlyState('2026-04-03T00:00:00.000Z'),
        )).toEqual({
            isValid: true,
            errors: [],
        })
    })

    it('rejects 94 inclusive calendar days with a structured error', () => {
        expect(validateSearchUIFiltersState(
            createDateOnlyState('2026-04-04T00:00:00.000Z'),
        )).toEqual({
            isValid: false,
            errors: [{
                criterion: CriterionTypeEnum.DATE_RANGE,
                code: SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED,
                messageKey: 'react.searchUI.dateRange.maxRangeSpanExceeded',
                params: {maxRangeSpanInDays: 93},
            }],
        })
    })

    it('accepts 93 date-only calendar days across a fall DST transition', () => {
        const state = createDateOnlyState('2026-11-04T05:00:00.000Z')

        expect(validateSearchUIFiltersState({
            ...state,
            config: {
                dateRange: {
                    maxRangeSpanInDays: 93,
                    dateOnlyTimeZone: 'America/New_York',
                },
            },
            dateRangeSpec: {
                ...state.dateRangeSpec,
                dateFrom: new Date('2026-08-04T04:00:00.000Z'),
            },
        }).isValid).toBe(true)
    })

    it('still rejects 94 date-only calendar days across a fall DST transition', () => {
        const state = createDateOnlyState('2026-11-05T05:00:00.000Z')

        expect(validateSearchUIFiltersState({
            ...state,
            config: {
                dateRange: {
                    maxRangeSpanInDays: 93,
                    dateOnlyTimeZone: 'America/New_York',
                },
            },
            dateRangeSpec: {
                ...state.dateRangeSpec,
                dateFrom: new Date('2026-08-04T04:00:00.000Z'),
            },
        }).isValid).toBe(false)
    })

    it('does not validate an inactive or date-independent range', () => {
        expect(validateSearchUIFiltersState({
            ...createDateOnlyState('2026-04-04T00:00:00.000Z'),
            criteria: [],
        }).isValid).toBe(true)

        expect(validateSearchUIFiltersState({
            ...createDateOnlyState('2026-04-04T00:00:00.000Z'),
            dateRangeSpec: {
                dateRangeSpecType: 'DATE_INDEPENDENT',
                dateFrom: new Date('2000-01-01T00:00:00.000Z'),
                dateTo: new Date('2999-01-01T00:00:00.000Z'),
                beforeCount: 0,
            },
        }).isValid).toBe(true)
    })

    it('validates the resolved interval of counted ranges', () => {
        const base = createDateOnlyState('2026-04-04T00:00:00.000Z')

        expect(validateSearchUIFiltersState({
            ...base,
            dateRangeSpec: {
                dateRangeSpecType: 'DAYS_BEFORE',
                dateFrom: new Date('2026-01-01T00:00:00.000Z'),
                dateTo: new Date('2026-04-04T00:00:00.000Z'),
                beforeCount: 92,
            },
        }).isValid).toBe(true)

        expect(validateSearchUIFiltersState({
            ...base,
            dateRangeSpec: {
                dateRangeSpecType: 'DAYS_BEFORE',
                dateFrom: new Date('2026-01-01T00:00:00.000Z'),
                dateTo: new Date('2026-04-05T00:00:00.000Z'),
                beforeCount: 93,
            },
        }).isValid).toBe(false)
    })

    it.each([0, -1, 1.5, Number.NaN])(
        'rejects invalid maxRangeSpanInDays config %s',
        maxRangeSpanInDays => {
            expect(() => validateSearchUIFiltersState({
                ...createDateOnlyState('2026-01-01T00:00:00.000Z'),
                config: {dateRange: {maxRangeSpanInDays}},
            })).toThrow('expected a positive integer')
        },
    )

    it('suppresses invalid criteria and publishes once the range becomes valid', () => {
        const onFiltersUpdate = jest.fn()
        const onValidationChange = jest.fn()
        const store = createSearchUIFiltersStore()

        store.getState().setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'validation-test',
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
            criteria: [CriterionTypeEnum.DATE_RANGE],
            config: {
                dateRange: {maxRangeSpanInDays: 93},
            },
            dateRangeSpec: createDateOnlyState('2026-04-04T00:00:00.000Z').dateRangeSpec,
            onFiltersUpdate,
            onValidationChange,
        })

        expect(store.getState().validationResult.isValid).toBe(false)
        expect(store.getState().hasUnappliedFilters).toBe(true)
        expect(onValidationChange).toHaveBeenLastCalledWith(expect.objectContaining({isValid: false}))
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        store.getState().triggerSearch()
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        store.getState().setDateRangeCriterion(
            createDateOnlyState('2026-04-03T00:00:00.000Z').dateRangeSpec,
        )

        expect(store.getState().validationResult.isValid).toBe(true)
        expect(onValidationChange).toHaveBeenLastCalledWith({isValid: true, errors: []})
        expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
    })
})

const createExactState = (
    dateFrom: Date | null,
    dateTo: Date | null,
    options: {maxRangeSpanInDays?: number, enableTimeSelection?: boolean} = {},
) => ({
    ...getSearchUIFiltersInitialState(),
    criteria: [CriterionTypeEnum.DATE_RANGE],
    config: {
        dateRange: {
            maxRangeSpanInDays: options.maxRangeSpanInDays,
            enableTimeSelection: options.enableTimeSelection,
        },
    },
    dateRangeSpec: {
        dateRangeSpecType: 'EXACTLY' as const,
        dateFrom,
        dateTo,
        beforeCount: 0,
    },
})

describe('SearchUI typed exact dates', () => {
    const invalidDate = new Date(Number.NaN)

    it('reports each end that is unfinished or does not exist', () => {
        expect(validateSearchUIFiltersState(
            createExactState(invalidDate, new Date('2026-07-02T00:00:00.000Z')),
        )).toEqual({
            isValid: false,
            errors: [{
                criterion: CriterionTypeEnum.DATE_RANGE,
                code: SEARCH_UI_DATE_RANGE_INVALID_DATE,
                messageKey: 'react.searchUI.dateRange.invalidDate',
                params: {boundary: 'from'},
            }],
        })
        expect(validateSearchUIFiltersState(
            createExactState(invalidDate, invalidDate),
        ).errors.map(error => error.params)).toEqual([{boundary: 'from'}, {boundary: 'to'}])
    })

    it('rejects an end before the start and accepts equal ends', () => {
        expect(validateSearchUIFiltersState(createExactState(
            new Date('2026-07-02T00:00:00.000Z'),
            new Date('2026-07-01T00:00:00.000Z'),
        ))).toEqual({
            isValid: false,
            errors: [{
                criterion: CriterionTypeEnum.DATE_RANGE,
                code: SEARCH_UI_DATE_RANGE_END_BEFORE_START,
                messageKey: 'react.searchUI.dateRange.endBeforeStart',
                params: {},
            }],
        })
        expect(validateSearchUIFiltersState(createExactState(
            new Date('2026-07-02T00:00:00.000Z'),
            new Date('2026-07-02T00:00:00.000Z'),
        )).isValid).toBe(true)
        expect(validateSearchUIFiltersState(createExactState(
            new Date('2026-07-02T10:00:00.000Z'),
            new Date('2026-07-02T09:59:59.000Z'),
            {enableTimeSelection: true},
        )).errors.map(error => error.code)).toEqual([SEARCH_UI_DATE_RANGE_END_BEFORE_START])
    })

    it('takes a far year for a date', () => {
        expect(validateSearchUIFiltersState(createExactState(
            new Date('1800-01-01T00:00:00.000Z'),
            new Date('3000-01-01T00:00:00.000Z'),
        ))).toEqual({isValid: true, errors: []})
    })

    it('accepts an empty end as an open range unless the range has a maximum', () => {
        expect(validateSearchUIFiltersState(
            createExactState(new Date('2026-07-01T00:00:00.000Z'), null),
        ).isValid).toBe(true)
        expect(validateSearchUIFiltersState(
            createExactState(null, new Date('2026-07-01T00:00:00.000Z')),
        ).isValid).toBe(true)
        expect(validateSearchUIFiltersState(
            createExactState(new Date('2026-07-01T00:00:00.000Z'), null, {maxRangeSpanInDays: 93}),
        ).errors.map(error => error.code)).toEqual([SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED])
    })
})
