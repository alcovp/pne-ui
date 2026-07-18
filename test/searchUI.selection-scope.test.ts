import {createSearchUITableSelectionScopeKey} from '../src/component/search-ui/SearchUITableSelection'
import type {SearchCriteria} from '../src/component/search-ui/filters/types'

const createCriteria = (overrides: Partial<SearchCriteria> = {}): SearchCriteria => ({
    initialized: true,
    exactSearchLabel: 'ID',
    exactSearchValue: '42',
    ordersSearchLabel: 'order_id',
    ordersSearchValue: '7',
    customerLevelId: 15,
    status: 'E',
    threeD: true,
    currencies: [1, 2],
    countries: [11],
    dateFrom: new Date('2020-01-01T00:00:00.000Z'),
    dateTo: new Date('2020-01-02T00:00:00.000Z'),
    orderDateType: 'SESSION_CREATED',
    cardTypes: [3],
    transactionTypes: [4],
    transactionStatuses: [10],
    transactionSessionStatuses: 's1,s2',
    projectCurrencyId: 5,
    projectCurrencyConvert: true,
    groupTypes: ['MERCHANT'],
    multigetCriteria: [],
    recurrenceTypes: [6],
    recurrenceStatuses: [7],
    mfoConfigurationTypes: [8],
    markerTypes: [9],
    markerStatus: 'processed',
    processorLogEntryType: 'log',
    errorCode: 123,
    ...overrides,
})

describe('SearchUI table selection scope', () => {
    it('uses canonical applied-criteria values rather than object identity', () => {
        const first = createCriteria()
        const equivalent = createCriteria({
            currencies: [1, 2],
            dateFrom: new Date('2020-01-01T00:00:00.000Z'),
            dateTo: new Date('2020-01-02T00:00:00.000Z'),
        })

        expect(createSearchUITableSelectionScopeKey(first, undefined, false)).toBe(
            createSearchUITableSelectionScopeKey(equivalent, undefined, false),
        )
    })

    it('changes when an applied query value changes', () => {
        const enabled = createCriteria({status: 'E'})
        const disabled = createCriteria({status: 'D'})

        expect(createSearchUITableSelectionScopeKey(enabled, undefined, false)).not.toBe(
            createSearchUITableSelectionScopeKey(disabled, undefined, false),
        )
    })

    it('includes the resolved View by default', () => {
        const criteria = createCriteria()

        expect(createSearchUITableSelectionScopeKey(criteria, 'summary', false)).not.toBe(
            createSearchUITableSelectionScopeKey(criteria, 'operations', false),
        )
    })

    it('can preserve selection across explicitly compatible Views', () => {
        const criteria = createCriteria()

        expect(createSearchUITableSelectionScopeKey(criteria, 'summary', true)).toBe(
            createSearchUITableSelectionScopeKey(criteria, 'operations', true),
        )
    })
})
