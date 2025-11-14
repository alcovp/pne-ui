import { createSearchParams } from '../src/component/search-ui/SearchUI'
import { filterAvailableCriteria } from '../src/component/search-ui/filters/SearchUIFilters'
import { CriterionTypeEnum, GroupingType, SearchCriteria } from '../src/component/search-ui/filters/types'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

describe('SearchUI helpers', () => {
    it('creates search params from criteria', () => {
        const criteria: SearchCriteria = {
            initialized: true,
            exactSearchLabel: 'ID',
            exactSearchValue: '42',
            ordersSearchLabel: 'order_id',
            ordersSearchValue: '7',
            status: 'E',
            threeD: true,
            currencies: [1, 2],
            countries: [11],
            dateFrom: new Date('2020-01-01'),
            dateTo: new Date('2020-01-02'),
            orderDateType: 'SESSION_CREATED',
            cardTypes: [3],
            transactionTypes: [4],
            transactionStatuses: [10],
            transactionSessionStatuses: 's1,s2',
            projectCurrencyId: 5,
            projectCurrencyConvert: true,
            groupTypes: ['MERCHANT' as GroupingType],
            multigetCriteria: [],
            recurrenceTypes: [6],
            recurrenceStatuses: [7],
            mfoConfigurationTypes: [8],
            markerTypes: [9],
            markerStatus: 'processed',
            processorLogEntryType: 'log',
            errorCode: 123,
        }

        const params = createSearchParams(criteria, { page: 2, pageSize: 10, order: 'asc', sortIndex: 3 })
        expect(params.startNum).toBe(20)
        expect(params.rowCount).toBe(11)
        expect(params.orderBy).toBe(3)
        expect(params.sortOrder).toBe('asc')
        expect(params.exactSearchLabel).toBe('ID')
        expect(params.markerStatus).toBe('processed')
        expect(params.transactionStatuses).toEqual([10])
        expect(params.transactionSessionStatuses).toBe('s1,s2')
        expect(params.countries).toEqual([11])
        expect(params.errorCode).toBe(123)
    })

    it('filters available criteria based on defaults', () => {
        const defaults = {
            ...initialSearchUIDefaults,
            showProjectCurrencyCriterion: () => false,
            showManagersCriterion: () => false,
        }
        const result = filterAvailableCriteria(defaults, [
            CriterionTypeEnum.PROJECT_CURRENCY,
            CriterionTypeEnum.MANAGER,
            CriterionTypeEnum.CURRENCY,
        ])
        expect(result).toEqual([CriterionTypeEnum.CURRENCY])
    })
})
