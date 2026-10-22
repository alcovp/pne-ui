import {CriterionTypeEnum, type DateRangeSpec} from '../src/component/search-ui/filters/types'
import {createSearchUIFiltersStore} from '../src/component/search-ui/filters/state/store'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'
import type {SearchUIFiltersConfig} from '../src/component/search-ui/filters/SearchUIFilters'
import {SEARCH_UI_DATE_RANGE_INVALID_DATE} from '../src/component/search-ui/filters/validation'

const createStore = (
    dateRangeSpec: DateRangeSpec,
    options: {config?: SearchUIFiltersConfig, criterion?: CriterionTypeEnum} = {},
) => {
    const onFiltersUpdate = jest.fn()
    const onValidationChange = jest.fn()
    const criterion = options.criterion ?? CriterionTypeEnum.DATE_RANGE
    const store = createSearchUIFiltersStore()

    store.getState().setInitialState({
        defaults: initialSearchUIDefaults,
        settingsContextName: 'date-bounds',
        possibleCriteria: [criterion],
        predefinedCriteria: [criterion],
        criteria: [criterion],
        config: options.config,
        dateRangeSpec,
        onFiltersUpdate,
        onValidationChange,
    })

    return {store, onFiltersUpdate, onValidationChange}
}

const exactly = (dateFrom: Date | null, dateTo: Date | null): DateRangeSpec => ({
    dateRangeSpecType: 'EXACTLY',
    dateFrom,
    dateTo,
    beforeCount: 0,
})

const DATE_INDEPENDENT: DateRangeSpec = {
    dateRangeSpecType: 'DATE_INDEPENDENT',
    dateFrom: null,
    dateTo: null,
    beforeCount: 0,
}

describe('SearchUI date bounds', () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    it('searches DATE_INDEPENDENT between Wicket\'s fixed Moscow days, whenever it is pressed', () => {
        // The ticket's example: the old bounds followed the moment of the click.
        for (const now of ['2026-09-30T06:32:13.000Z', '2027-02-14T23:59:59.000Z']) {
            jest.useFakeTimers().setSystemTime(new Date(now))
            const {onFiltersUpdate} = createStore(DATE_INDEPENDENT)

            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: new Date('1999-12-31T21:00:00.000Z'),
                dateTo: new Date('2999-12-30T21:00:00.000Z'),
            }))
        }
    })

    it('takes DATE_INDEPENDENT days in the configured date-only timezone', () => {
        const {onFiltersUpdate} = createStore(DATE_INDEPENDENT, {
            config: {dateRange: {dateOnlyTimeZone: 'UTC'}},
        })

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2000-01-01T00:00:00.000Z'),
            dateTo: new Date('2999-12-31T00:00:00.000Z'),
        }))
    })

    it('opens an exact range on the side whose date is empty', () => {
        const config = {dateRange: {dateOnlyTimeZone: 'UTC'}}
        const openEnd = createStore(exactly(new Date('2026-07-01T00:00:00.000Z'), null), {config})
        const openStart = createStore(exactly(null, new Date('2026-07-01T00:00:00.000Z')), {config})

        expect(openEnd.onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2026-07-01T00:00:00.000Z'),
            dateTo: new Date('2999-12-31T00:00:00.000Z'),
        }))
        expect(openStart.onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2000-01-01T00:00:00.000Z'),
            dateTo: new Date('2026-07-02T00:00:00.000Z'),
        }))
    })

    it('opens an exact date-time range in the browser time, as its typed dates are', () => {
        const {onFiltersUpdate} = createStore(exactly(new Date(2026, 6, 1, 10, 20, 30), null), {
            criterion: CriterionTypeEnum.DATE_RANGE_ORDERS,
        })

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date(2026, 6, 1, 10, 20, 30),
            dateTo: new Date(2999, 11, 31),
        }))
    })

    it('never searches with a typed date that is unfinished or does not exist', () => {
        const {store, onFiltersUpdate, onValidationChange} = createStore(exactly(
            new Date('2026-07-01T00:00:00.000Z'),
            new Date('2026-07-02T00:00:00.000Z'),
        ))
        onFiltersUpdate.mockClear()

        store.getState().setDateRangeCriterion(exactly(
            new Date('2026-07-01T00:00:00.000Z'),
            new Date(Number.NaN),
        ))
        store.getState().triggerSearch()

        expect(onFiltersUpdate).not.toHaveBeenCalled()
        expect(store.getState().hasUnappliedFilters).toBe(true)
        expect(onValidationChange).toHaveBeenLastCalledWith({
            isValid: false,
            errors: [expect.objectContaining({
                code: SEARCH_UI_DATE_RANGE_INVALID_DATE,
                params: {boundary: 'to'},
            })],
        })
    })
})
