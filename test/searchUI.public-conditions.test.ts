import {
    toDateRangeState,
    toSearchUIConditionsState,
} from '../src/component/search-ui/filters/publicConditions'

describe('SearchUI public conditions boundary', () => {
    it('converts a declarative counted range to the existing internal state shape', () => {
        expect(toDateRangeState({
            dateRangeSpecType: 'DAYS_BEFORE',
            beforeCount: 30,
        }, 'searchConditions.dateRangeSpec')).toEqual({
            dateRangeSpecType: 'DAYS_BEFORE',
            dateFrom: null,
            dateTo: null,
            beforeCount: 30,
        })
    })

    it('copies exact boundaries without changing their instants', () => {
        const dateFrom = new Date('2026-01-01T00:00:00.123Z')
        const dateTo = new Date('2026-01-02T00:00:00.456Z')

        const result = toDateRangeState({
            dateRangeSpecType: 'EXACTLY',
            dateFrom,
            dateTo,
        }, 'initialSearchConditions.dateRangeSpec')

        expect(result).toEqual({
            dateRangeSpecType: 'EXACTLY',
            dateFrom,
            dateTo,
            beforeCount: 0,
        })
        expect(result.dateFrom).not.toBe(dateFrom)
        expect(result.dateTo).not.toBe(dateTo)
    })

    it.each([
        'TODAY',
        'YESTERDAY',
        'THIS_WEEK',
        'LAST_WEEK',
        'THIS_MONTH',
        'LAST_MONTH',
        'DATE_INDEPENDENT',
    ])('converts %s without inventing a public payload', dateRangeSpecType => {
        expect(toDateRangeState({dateRangeSpecType}, 'dateRangeSpec')).toEqual({
            dateRangeSpecType,
            dateFrom: null,
            dateTo: null,
            beforeCount: 0,
        })
    })

    it('rejects precomputed dates on a relative range passed through JavaScript or any', () => {
        expect(() => toDateRangeState({
            dateRangeSpecType: 'DAYS_BEFORE',
            beforeCount: 30,
            dateFrom: new Date(),
            dateTo: new Date(),
        }, 'searchConditions.dateRangeSpec')).toThrow(
            '[pne-ui] Invalid searchConditions.dateRangeSpec: field "dateFrom" is not allowed for DAYS_BEFORE',
        )
    })

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        'rejects invalid counted range value %s',
        beforeCount => {
            expect(() => toDateRangeState({
                dateRangeSpecType: 'HOURS_BEFORE',
                beforeCount,
            }, 'dateRangeSpec')).toThrow('HOURS_BEFORE requires beforeCount to be a positive integer')
        },
    )

    it('rejects incomplete or polluted exact ranges', () => {
        expect(() => toDateRangeState({
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date(),
        }, 'dateRangeSpec')).toThrow('EXACTLY requires both dateFrom and dateTo')

        expect(() => toDateRangeState({
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date(),
            dateTo: new Date(),
            beforeCount: 1,
        }, 'dateRangeSpec')).toThrow('field "beforeCount" is not allowed for EXACTLY')

        expect(() => toDateRangeState({
            dateRangeSpecType: 'EXACTLY',
            dateFrom: '2026-01-01',
            dateTo: new Date(),
        }, 'dateRangeSpec')).toThrow('dateRangeSpec.dateFrom: expected a valid Date')
    })

    it('rejects payload on calendar presets and unknown range types', () => {
        expect(() => toDateRangeState({
            dateRangeSpecType: 'THIS_MONTH',
            beforeCount: 1,
        }, 'dateRangeSpec')).toThrow('field "beforeCount" is not allowed for THIS_MONTH')

        expect(() => toDateRangeState({
            dateRangeSpecType: 'LAST_30_DAYS',
            beforeCount: 30,
        }, 'dateRangeSpec')).toThrow('unknown dateRangeSpecType "LAST_30_DAYS"')
    })

    it('enforces the initial conditions criteria boundary at runtime', () => {
        expect(() => toSearchUIConditionsState({
            criteria: [],
        } as never, 'initialSearchConditions', false)).toThrow(
            'criteria is not allowed; use predefinedCriteria instead',
        )

        expect(toSearchUIConditionsState({criteria: []}, 'searchConditions', true)).toEqual({
            criteria: [],
        })
    })

    it('accepts the transaction report wire fields', () => {
        expect(toSearchUIConditionsState({
            scope: 'SELECTED_BY_TX_RRN',
            transactionIds: 'rrn-1\nrrn-2',
            datesType: 'CREATED',
            recurrentFilter: 'NON_RECURRENTS_ONLY',
            timeZoneOffsetHours: -12,
            csvCharset: 'UTF-8-SIG',
        }, 'searchConditions', true)).toEqual({
            scope: 'SELECTED_BY_TX_RRN',
            transactionIds: 'rrn-1\nrrn-2',
            datesType: 'CREATED',
            recurrentFilter: 'NON_RECURRENTS_ONLY',
            timeZoneOffsetHours: -12,
            csvCharset: 'UTF-8-SIG',
        })
    })

    it('treats explicitly undefined optional report fields as omitted', () => {
        expect(toSearchUIConditionsState({
            scope: undefined,
            transactionIds: undefined,
            datesType: undefined,
            recurrentFilter: undefined,
            timeZoneOffsetHours: undefined,
            csvCharset: undefined,
        }, 'searchConditions', true)).toEqual({})
    })

    it.each([
        [{scope: 'SELECTED_BY_UNKNOWN'}, 'searchConditions.scope: unknown value'],
        [{datesType: 'BANK'}, 'searchConditions.datesType: unknown value'],
        [{recurrentFilter: 'RECURRENT'}, 'searchConditions.recurrentFilter: unknown value'],
        [{timeZoneOffsetHours: 13}, 'expected null or an integer from -12 through 12'],
        [{timeZoneOffsetHours: 1.5}, 'expected null or an integer from -12 through 12'],
        [{csvCharset: 'CP1251'}, 'searchConditions.csvCharset: unknown value'],
    ])('rejects invalid transaction report conditions %j', (conditions, expectedMessage) => {
        expect(() => toSearchUIConditionsState(
            conditions as never,
            'searchConditions',
            true,
        )).toThrow(expectedMessage as string)
    })
})
