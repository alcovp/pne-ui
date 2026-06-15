import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE = 'Europe/Moscow'
export const SEARCH_UI_DATE_ONLY_LOCAL_TIME_ZONE = 'local'

export type SearchUIDateOnlyTimeZone = string

/**
 * SearchUI has two different date contracts:
 * - time-aware filters pass exact instants through without reinterpretation;
 * - date-only EXACTLY filters keep the legacy browser-local behavior unless a
 *   business timezone is configured explicitly.
 *
 * Paynet backend aggregates date-only reports by Moscow days, but changing the
 * library default would affect existing screens that historically expected
 * browser-local EXACTLY dates. Screens that need Moscow business days must opt
 * in with config.dateRange.dateOnlyTimeZone = "Europe/Moscow".
 *
 * Consumers can also set "local" explicitly, but leaving the option undefined
 * already preserves the old browser-local behavior.
 */
export const resolveDateOnlyTimeZone = (dateOnlyTimeZone?: SearchUIDateOnlyTimeZone): string | null => {
    if (!dateOnlyTimeZone || dateOnlyTimeZone === SEARCH_UI_DATE_ONLY_LOCAL_TIME_ZONE) {
        return null
    }

    return dateOnlyTimeZone
}

/**
 * Re-anchor existing calendar fields to a timezone without changing the visible
 * year/month/day. This is the same keep-local-time operation that non-exact
 * presets already used for Moscow business days.
 */
export const applyDateOnlyTimeZone = (date: Dayjs, timeZone: string | null): Dayjs => {
    if (!timeZone) {
        return date
    }

    return date.tz(timeZone, true)
}

/**
 * Converts a day selected by MUI DateRangePicker into SearchUI state. The picker
 * gives us a local Dayjs value; for date-only filters we store the same calendar
 * day at midnight in the configured business timezone.
 */
export const createDateOnlyPickerDate = (date: Dayjs | Date, timeZone: string | null): Date => {
    return applyDateOnlyTimeZone(dayjs(date).startOf('day'), timeZone).toDate()
}

/**
 * Converts the stored date-only value to an inclusive lower search boundary.
 * For configured business timezones the stored instant is interpreted in that
 * timezone, not in the browser timezone.
 */
export const createDateOnlySearchDate = (date: Date, timeZone: string | null): Date => {
    if (!timeZone) {
        return dayjs(date).startOf('day').toDate()
    }

    return dayjs(date)
        .tz(timeZone)
        .startOf('day')
        .toDate()
}

/**
 * SearchCriteria uses an exclusive upper boundary for date-only ranges. EXACTLY
 * therefore sends the start of the next business day as dateTo.
 */
export const createDateOnlySearchEndExclusiveDate = (date: Date | null, timeZone: string | null): Date => {
    if (!timeZone) {
        return dayjs(date)
            .startOf('day')
            .add(1, 'day')
            .toDate()
    }

    return dayjs(date)
        .tz(timeZone)
        .startOf('day')
        .add(1, 'day')
        .toDate()
}

/**
 * Converts a stored business-day Date back to the picker value. The picker should
 * display the business calendar day, even when the browser timezone would render
 * the same instant as the previous or next local day.
 */
export const createDateOnlyPickerValue = (date: Date | null, timeZone: string | null): Dayjs | null => {
    if (!date) {
        return null
    }

    if (!timeZone) {
        return dayjs(date)
    }

    return dayjs(dayjs(date).tz(timeZone).format('YYYY-MM-DD'))
}
