import {
    CriterionTypeEnum,
} from './types'
import type {SearchUIFiltersState} from './state/type'
import {resolveDateOnlyTimeZone} from './dateRangeTimeZone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED = 'DATE_RANGE_MAX_SPAN_EXCEEDED' as const

export type SearchUIValidationError = {
    criterion: CriterionTypeEnum.DATE_RANGE | CriterionTypeEnum.DATE_RANGE_ORDERS
    code: typeof SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED
    messageKey: 'react.searchUI.dateRange.maxRangeSpanExceeded'
    params: {
        maxRangeSpanInDays: number
    }
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
        maxRangeSpanInDays === undefined
        || criterion === null
        || state.dateRangeSpec.dateRangeSpecType === 'DATE_INDEPENDENT'
    ) {
        return createValidResult()
    }

    const [dateFrom, dateTo] = [state.dateRangeSpec.dateFrom, state.dateRangeSpec.dateTo]
    if (dateFrom === null || dateTo === null) {
        return createValidResult()
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

    return {
        isValid: false,
        errors: [{
            criterion,
            code: SEARCH_UI_DATE_RANGE_MAX_SPAN_EXCEEDED,
            messageKey: 'react.searchUI.dateRange.maxRangeSpanExceeded',
            params: {maxRangeSpanInDays},
        }],
    }
}

const createValidResult = (): SearchUIValidationResult => ({
    isValid: true,
    errors: [],
})

const getActiveDateRangeCriterion = (
    criteria: CriterionTypeEnum[],
): SearchUIValidationError['criterion'] | null => {
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
