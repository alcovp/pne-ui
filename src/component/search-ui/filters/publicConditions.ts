import {
    CSV_CHARSETS,
    CsvCharset,
    DATE_RANGE_SPEC_TYPES,
    DateRangeSpec,
    DateRangeSpecType,
    SearchUIConditions,
    SearchUIConditionsInput,
    TIME_ZONE_OFFSET_HOURS,
    TimeZoneOffsetHours,
    TRANSACTION_DATE_TYPES,
    TRANSACTION_RECURRENT_FILTERS,
    TRANSACTION_REPORT_SCOPES,
    TransactionDateType,
    TransactionRecurrentFilter,
    TransactionReportScope,
} from './types'

const hasOwn = (value: object, key: PropertyKey): boolean => (
    Object.prototype.hasOwnProperty.call(value, key)
)

const fail = (source: string, message: string): never => {
    throw new Error(`[pne-ui] Invalid ${source}: ${message}`)
}

const assertObject = (value: unknown, source: string): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return fail(source, 'expected an object')
    }

    return value as Record<string, unknown>
}

const assertOnlyKeys = (
    value: Record<string, unknown>,
    allowedKeys: readonly string[],
    source: string,
): void => {
    const unsupportedKey = Object.keys(value).find(key => !allowedKeys.includes(key))
    if (unsupportedKey) {
        fail(source, `field "${unsupportedKey}" is not allowed for ${String(value.dateRangeSpecType)}`)
    }
}

const assertDate = (value: unknown, source: string): Date => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return fail(source, 'expected a valid Date')
    }

    return value
}

const assertDateRangeSpecType = (value: unknown, source: string): DateRangeSpecType => {
    if (typeof value !== 'string' || !DATE_RANGE_SPEC_TYPES.includes(value as DateRangeSpecType)) {
        return fail(source, `unknown dateRangeSpecType "${String(value)}"`)
    }

    return value as DateRangeSpecType
}

const assertString = (value: unknown, source: string): string => {
    if (typeof value !== 'string') {
        return fail(source, 'expected a string')
    }

    return value
}

const assertStringValue = <T extends string>(
    value: unknown,
    allowedValues: readonly T[],
    source: string,
): T => {
    if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
        return fail(source, `unknown value "${String(value)}"`)
    }

    return value as T
}

const assertTimeZoneOffsetHours = (value: unknown, source: string): TimeZoneOffsetHours | null => {
    if (value === null) {
        return null
    }

    if (
        typeof value !== 'number'
        || !Number.isInteger(value)
        || !(TIME_ZONE_OFFSET_HOURS as readonly number[]).includes(value)
    ) {
        return fail(source, 'expected null or an integer from -12 through 12')
    }

    return value as TimeZoneOffsetHours
}

const assertCsvCharset = (value: unknown, source: string): CsvCharset | null => {
    if (value === null) {
        return null
    }

    return assertStringValue(value, CSV_CHARSETS, source)
}

/**
 * Runtime counterpart of SearchUIDateRangeSpec for JavaScript and values widened
 * through `any`. This is deliberately used only at the public props boundary;
 * templates, retention and picker state keep their existing resolved format.
 */
export const toDateRangeState = (input: unknown, source: string): DateRangeSpec => {
    const value = assertObject(input, source)
    const dateRangeSpecType = assertDateRangeSpecType(value.dateRangeSpecType, source)

    switch (dateRangeSpecType) {
        case 'EXACTLY': {
            assertOnlyKeys(value, ['dateRangeSpecType', 'dateFrom', 'dateTo'], source)
            if (!hasOwn(value, 'dateFrom') || !hasOwn(value, 'dateTo')) {
                return fail(source, 'EXACTLY requires both dateFrom and dateTo')
            }

            return {
                dateRangeSpecType,
                dateFrom: new Date(assertDate(value.dateFrom, `${source}.dateFrom`).getTime()),
                dateTo: new Date(assertDate(value.dateTo, `${source}.dateTo`).getTime()),
                beforeCount: 0,
            }
        }
        case 'DAYS_BEFORE':
        case 'HOURS_BEFORE': {
            assertOnlyKeys(value, ['dateRangeSpecType', 'beforeCount'], source)
            if (
                typeof value.beforeCount !== 'number'
                || !Number.isInteger(value.beforeCount)
                || value.beforeCount <= 0
            ) {
                return fail(source, `${dateRangeSpecType} requires beforeCount to be a positive integer`)
            }

            return {
                dateRangeSpecType,
                dateFrom: null,
                dateTo: null,
                beforeCount: value.beforeCount,
            }
        }
        case 'TODAY':
        case 'YESTERDAY':
        case 'THIS_WEEK':
        case 'LAST_WEEK':
        case 'THIS_MONTH':
        case 'LAST_MONTH':
        case 'DATE_INDEPENDENT':
            assertOnlyKeys(value, ['dateRangeSpecType'], source)
            return {
                dateRangeSpecType,
                dateFrom: null,
                dateTo: null,
                beforeCount: 0,
            }
    }
}

export const toSearchUIConditionsState = (
    input: Partial<SearchUIConditionsInput> | undefined,
    source: string,
    allowCriteria: boolean,
): Partial<SearchUIConditions> | undefined => {
    if (input === undefined) {
        return undefined
    }

    const value = assertObject(input, source)
    if (!allowCriteria && hasOwn(value, 'criteria')) {
        return fail(source, 'criteria is not allowed; use predefinedCriteria instead')
    }

    const {dateRangeSpec, ...rest} = input
    const stateConditions = rest as Partial<SearchUIConditions>

    // Partial<T> permits explicitly undefined properties unless consumers opt
    // into exactOptionalPropertyTypes. Treat those properties as omitted instead
    // of allowing them to overwrite initialized store defaults.
    delete stateConditions.scope
    delete stateConditions.transactionIds
    delete stateConditions.datesType
    delete stateConditions.recurrentFilter
    delete stateConditions.timeZoneOffsetHours
    delete stateConditions.csvCharset

    if (dateRangeSpec !== undefined) {
        stateConditions.dateRangeSpec = toDateRangeState(
            dateRangeSpec,
            `${source}.dateRangeSpec`,
        )
    }

    if (hasOwn(value, 'scope') && value.scope !== undefined) {
        stateConditions.scope = assertStringValue<TransactionReportScope>(
            value.scope,
            TRANSACTION_REPORT_SCOPES,
            `${source}.scope`,
        )
    }

    if (hasOwn(value, 'transactionIds') && value.transactionIds !== undefined) {
        stateConditions.transactionIds = assertString(value.transactionIds, `${source}.transactionIds`)
    }

    if (hasOwn(value, 'datesType') && value.datesType !== undefined) {
        stateConditions.datesType = assertStringValue<TransactionDateType>(
            value.datesType,
            TRANSACTION_DATE_TYPES,
            `${source}.datesType`,
        )
    }

    if (hasOwn(value, 'recurrentFilter') && value.recurrentFilter !== undefined) {
        stateConditions.recurrentFilter = assertStringValue<TransactionRecurrentFilter>(
            value.recurrentFilter,
            TRANSACTION_RECURRENT_FILTERS,
            `${source}.recurrentFilter`,
        )
    }

    if (hasOwn(value, 'timeZoneOffsetHours') && value.timeZoneOffsetHours !== undefined) {
        stateConditions.timeZoneOffsetHours = assertTimeZoneOffsetHours(
            value.timeZoneOffsetHours,
            `${source}.timeZoneOffsetHours`,
        )
    }

    if (hasOwn(value, 'csvCharset') && value.csvCharset !== undefined) {
        stateConditions.csvCharset = assertCsvCharset(value.csvCharset, `${source}.csvCharset`)
    }

    return stateConditions
}
