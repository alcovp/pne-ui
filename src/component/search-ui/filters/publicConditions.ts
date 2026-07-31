import {
    DATE_RANGE_SPEC_TYPES,
    DateRangeSpec,
    DateRangeSpecType,
    SearchUIConditions,
    SearchUIConditionsInput,
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

    if (dateRangeSpec !== undefined) {
        stateConditions.dateRangeSpec = toDateRangeState(
            dateRangeSpec,
            `${source}.dateRangeSpec`,
        )
    }

    return stateConditions
}
