import {
    CriterionTypeEnum,
} from './types'
import type {SearchUIFiltersState} from './state/type'
import {
    isValidSearchUIDate,
    resolveDateOnlyTimeZone,
    type SearchUIDateRangeBoundary,
} from './dateRangeTimeZone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED = 'DATE_RANGE_MAX_SPAN_EXCEEDED' as const
export const SEARCH_UI_DATE_RANGE_INVALID_DATE = 'DATE_RANGE_INVALID_DATE' as const
export const SEARCH_UI_DATE_RANGE_END_BEFORE_START = 'DATE_RANGE_END_BEFORE_START' as const

type SearchUIDateRangeCriterion = CriterionTypeEnum.DATE_RANGE | CriterionTypeEnum.DATE_RANGE_ORDERS

export type SearchUIValidationError =
    | {
        criterion: SearchUIDateRangeCriterion
        code: typeof SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED
        messageKey: 'react.searchUI.dateRange.maxRangeSpanExceeded'
        params: {
            maxRangeSpanInDays: number
        }
    }
    | {
        criterion: SearchUIDateRangeCriterion
        /** A typed exact date is unfinished or does not exist, such as 31.02. */
        code: typeof SEARCH_UI_DATE_RANGE_INVALID_DATE
        messageKey: 'react.searchUI.dateRange.invalidDate'
        params: {
            boundary: SearchUIDateRangeBoundary
        }
    }
    | {
        criterion: SearchUIDateRangeCriterion
        /** The exact end lies before the start; equal ends are a valid range. */
        code: typeof SEARCH_UI_DATE_RANGE_END_BEFORE_START
        messageKey: 'react.searchUI.dateRange.endBeforeStart'
        params: Record<string, never>
    }

export type SearchUIValidationResult = {
    isValid: boolean
    errors: SearchUIValidationError[]
}

export const assertValidMaxRangeSpanInDays = (value: number | undefined): void => {
    if (value === undefined) {
        return
    }

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(
            '[pne-ui] Invalid SearchUIFiltersConfig.dateRange.maxRangeSpanInDays: '
            + 'expected a positive integer',
        )
    }
}

export const validateSearchUIFiltersState = (
    state: Pick<SearchUIFiltersState, 'criteria' | 'config' | 'dateRangeSpec'>,
): SearchUIValidationResult => {
    const maxRangeSpanInDays = state.config?.dateRange?.maxRangeSpanInDays
    assertValidMaxRangeSpanInDays(maxRangeSpanInDays)

    const criterion = getActiveDateRangeCriterion(state.criteria)
    if (
        criterion === null
        || state.dateRangeSpec.dateRangeSpecType === 'DATE_INDEPENDENT'
    ) {
        return createValidResult()
    }

    const [dateFrom, dateTo] = [state.dateRangeSpec.dateFrom, state.dateRangeSpec.dateTo]
    const exact = state.dateRangeSpec.dateRangeSpecType === 'EXACTLY'

    if (exact) {
        // Only a typed date can be unfinished or impossible; an empty end is an open range.
        const invalidBoundaries = ([['from', dateFrom], ['to', dateTo]] as const)
            .filter(([, date]) => date !== null && !isValidSearchUIDate(date))
            .map(([boundary]) => boundary)
        if (invalidBoundaries.length > 0) {
            return createInvalidResult(invalidBoundaries.map(boundary => ({
                criterion,
                code: SEARCH_UI_DATE_RANGE_INVALID_DATE,
                messageKey: 'react.searchUI.dateRange.invalidDate',
                params: {boundary},
            })))
        }

        if (dateFrom !== null && dateTo !== null && dateTo.getTime() < dateFrom.getTime()) {
            return createInvalidResult([{
                criterion,
                code: SEARCH_UI_DATE_RANGE_END_BEFORE_START,
                messageKey: 'react.searchUI.dateRange.endBeforeStart',
                params: {},
            }])
        }
    }

    if (maxRangeSpanInDays === undefined) {
        return createValidResult()
    }

    if (dateFrom === null || dateTo === null) {
        // An empty exact end reaches the DATE_INDEPENDENT bound, far beyond any maximum.
        return exact
            ? createMaxRangeSpanExceededResult(criterion, maxRangeSpanInDays)
            : createValidResult()
    }

    const exceedsMaximum = isDateOnlyExactRange(state)
        ? getInclusiveCalendarSpanInDays(
            dateFrom,
            dateTo,
            resolveDateOnlyTimeZone(state.config?.dateRange?.dateOnlyTimeZone),
        ) > maxRangeSpanInDays
        : dateTo.getTime() - dateFrom.getTime() > maxRangeSpanInDays * MILLISECONDS_PER_DAY

    if (!exceedsMaximum) {
        return createValidResult()
    }

    return createMaxRangeSpanExceededResult(criterion, maxRangeSpanInDays)
}

const createValidResult = (): SearchUIValidationResult => ({
    isValid: true,
    errors: [],
})

const createInvalidResult = (errors: SearchUIValidationError[]): SearchUIValidationResult => ({
    isValid: false,
    errors,
})

const createMaxRangeSpanExceededResult = (
    criterion: SearchUIDateRangeCriterion,
    maxRangeSpanInDays: number,
): SearchUIValidationResult => createInvalidResult([{
    criterion,
    code: SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED,
    messageKey: 'react.searchUI.dateRange.maxRangeSpanExceeded',
    params: {maxRangeSpanInDays},
}])

const getActiveDateRangeCriterion = (
    criteria: CriterionTypeEnum[],
): SearchUIDateRangeCriterion | null => {
    if (criteria.includes(CriterionTypeEnum.DATE_RANGE)) {
        return CriterionTypeEnum.DATE_RANGE
    }

    if (criteria.includes(CriterionTypeEnum.DATE_RANGE_ORDERS)) {
        return CriterionTypeEnum.DATE_RANGE_ORDERS
    }

    return null
}

const isDateOnlyExactRange = (
    state: Pick<SearchUIFiltersState, 'criteria' | 'config' | 'dateRangeSpec'>,
): boolean => {
    const useTime = state.criteria.includes(CriterionTypeEnum.DATE_RANGE_ORDERS)
        || !!state.config?.dateRange?.enableTimeSelection

    return state.dateRangeSpec.dateRangeSpecType === 'EXACTLY' && !useTime
}

const getInclusiveCalendarSpanInDays = (
    dateFrom: Date,
    dateTo: Date,
    timeZone: string | null,
): number => {
    const fromCalendarDay = getCalendarDayNumber(dateFrom, timeZone)
    const toCalendarDay = getCalendarDayNumber(dateTo, timeZone)

    return toCalendarDay - fromCalendarDay + 1
}

const getCalendarDayNumber = (date: Date, timeZone: string | null): number => {
    const calendarDate = timeZone ? dayjs(date).tz(timeZone) : dayjs(date)

    return Date.UTC(
        calendarDate.year(),
        calendarDate.month(),
        calendarDate.date(),
    ) / MILLISECONDS_PER_DAY
}
