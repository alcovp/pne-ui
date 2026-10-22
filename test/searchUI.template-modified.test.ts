import {CriterionTypeEnum, type SearchUITemplate} from '../src/component/search-ui/filters/types'
import {createSearchUIFiltersStore} from '../src/component/search-ui/filters/state/store'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {isSearchUITemplateModified} from '../src/component/search-ui/filters/state/actions'
import {initialSearchUIDefaults, type SearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

const createTemplate = (
    name: string,
    conditions: Partial<SearchUITemplate['searchConditions']>,
): SearchUITemplate => ({
    name,
    searchConditions: {
        ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        ...conditions,
    },
})

const ENABLED_TODAY = createTemplate('Enabled today', {
    criteria: [CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.STATUS],
    status: 'ENABLED',
    dateRangeSpec: {
        dateRangeSpecType: 'TODAY',
        dateFrom: null,
        dateTo: null,
        beforeCount: 0,
    },
})

const createStore = (defaults: Partial<SearchUIDefaults> = {}, templates: SearchUITemplate[] = []) => {
    const store = createSearchUIFiltersStore()
    store.getState().setInitialState({
        defaults: {...initialSearchUIDefaults, ...defaults},
        settingsContextName: 'template-modified',
        possibleCriteria: [
            CriterionTypeEnum.STATUS,
            CriterionTypeEnum.TRANSACTION_SESSION_STATUS,
        ],
        predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
        criteria: [CriterionTypeEnum.DATE_RANGE],
        onFiltersUpdate: jest.fn(),
    }, undefined, {templates})
    return store
}

const modified = (store: ReturnType<typeof createStore>) => isSearchUITemplateModified(store.getState())

describe('SearchUI applied template changes', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('tells changed filters from the applied template and forgets a change taken back', () => {
        const store = createStore()
        expect(modified(store)).toBe(false)

        store.getState().setTemplate(ENABLED_TODAY)
        expect(modified(store)).toBe(false)

        store.getState().setStatusCriterion('DISABLED')
        expect(modified(store)).toBe(true)

        store.getState().setStatusCriterion('ENABLED')
        expect(modified(store)).toBe(false)

        store.getState().removeCriterion(CriterionTypeEnum.STATUS)
        expect(modified(store)).toBe(true)

        store.getState().setTemplate(store.getState().template as SearchUITemplate)
        expect(modified(store)).toBe(false)
        expect(store.getState().criteria).toContain(CriterionTypeEnum.STATUS)
    })

    it('does not count the clock moving a relative range', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-10-22T10:00:00.000Z'))
        const store = createStore()
        store.getState().setTemplate(ENABLED_TODAY)

        jest.setSystemTime(new Date('2026-10-23T10:00:00.000Z'))
        store.getState().triggerSearch()

        expect(modified(store)).toBe(false)
    })

    it('counts the template saved with the changes as unchanged again', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        const store = createStore({saveSearchTemplate}, [ENABLED_TODAY])
        store.getState().setTemplate(ENABLED_TODAY)
        store.getState().setStatusCriterion('DISABLED')

        store.getState().updateTemplate(ENABLED_TODAY.name)
        await Promise.resolve()
        await Promise.resolve()

        expect(saveSearchTemplate).toHaveBeenCalled()
        expect(modified(store)).toBe(false)
    })

    it('does not count statuses that load after the template as a change', async () => {
        let resolveStatuses: (value: Awaited<ReturnType<SearchUIDefaults['getTransactionSessionStatuses']>>) => void = () => undefined
        const getTransactionSessionStatuses = jest.fn(() => new Promise<Awaited<ReturnType<SearchUIDefaults['getTransactionSessionStatuses']>>>(resolve => {
            resolveStatuses = resolve
        }))
        const store = createStore({getTransactionSessionStatuses})
        store.getState().setTemplate(createTemplate('Sessions', {
            criteria: [CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.TRANSACTION_SESSION_STATUS],
            transactionSessionStatuses: [],
        }))
        expect(getTransactionSessionStatuses).toHaveBeenCalled()
        expect(modified(store)).toBe(false)

        resolveStatuses({
            ...(await initialSearchUIDefaults.getTransactionSessionStatuses()),
            APPROVED: [{displayName: 'approved', selected: true}],
        })
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(store.getState().transactionSessionStatuses).toEqual([{displayName: 'approved', selected: true}])
        expect(modified(store)).toBe(false)

        store.getState().setTransactionSessionStatusesCriterion([{displayName: 'approved', selected: false}])
        expect(modified(store)).toBe(true)
    })

    it('has nothing to compare without an applied template', () => {
        const store = createStore()
        store.getState().setStatusCriterion('DISABLED')

        expect(modified(store)).toBe(false)
    })
})
