import { createSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import {
    CriterionTypeEnum,
    SearchCriteria,
    SearchUITemplate,
} from '../src/component/search-ui/filters/types'
import {
    getSearchUIFiltersInitialState,
    getSearchUIInitialSearchCriteria,
} from '../src/component/search-ui/filters/state/initial'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'
import { resolveAllowedEntityOptions } from '../src/component/search-ui/filters/entityOptionRestriction'
import {
    getRetainedSearchUIState,
    resetSearchUIRetentionForTests,
    retainSearchUIState,
} from '../src/component/search-ui/filters/state/retention'
import type { SearchUIRetentionSnapshot } from '../src/component/search-ui/filters/state/type'

const allowedTransactionTypes = [
    {id: 611, displayName: 'chargeback'},
    {id: 722, displayName: 'fraud'},
]

type InitializedStoreOptions = {
    allowedOptions?: typeof allowedTransactionTypes
    manualSearch?: boolean
    retainedSnapshot?: SearchUIRetentionSnapshot
}

const createInitializedStore = (
    onFiltersUpdate: (criteria: SearchCriteria) => void,
    {
        allowedOptions = allowedTransactionTypes,
        manualSearch = false,
        retainedSnapshot,
    }: InitializedStoreOptions = {},
) => {
    const store = createSearchUIFiltersStore()
    store.setState(getSearchUIFiltersInitialState())
    store.getState().setInitialState({
        defaults: initialSearchUIDefaults,
        settingsContextName: 'restricted-transaction-types-store-test',
        possibleCriteria: [CriterionTypeEnum.TRANSACTION_TYPES],
        predefinedCriteria: [CriterionTypeEnum.TRANSACTION_TYPES],
        criteria: [CriterionTypeEnum.TRANSACTION_TYPES],
        config: {
            manualSearch,
            transactionTypes: {
                allowedNames: ['chargeback', 'fraud'],
            },
        },
        prefetchedData: {allowedTransactionTypes: allowedOptions},
        onFiltersUpdate,
    }, retainedSnapshot)

    return store
}

describe('SearchUIFilters restricted transaction types store', () => {
    beforeEach(() => {
        localStorage.clear()
        resetSearchUIRetentionForTests()
    })

    afterEach(() => {
        resetSearchUIRetentionForTests()
    })

    it('rejects an empty or unresolved allowlist instead of falling back to unrestricted search', () => {
        expect(() => resolveAllowedEntityOptions(
            allowedTransactionTypes,
            [],
            'config.transactionTypes.allowedNames',
        )).toThrow('config.transactionTypes.allowedNames must contain at least one name')

        expect(() => resolveAllowedEntityOptions(
            allowedTransactionTypes,
            ['chargeback', 'sale'],
            'config.transactionTypes.allowedNames',
        )).toThrow('contains names missing from the available options: sale')

        expect(() => resolveAllowedEntityOptions(
            [
                ...allowedTransactionTypes,
                {id: 733, displayName: 'fraud'},
            ],
            ['fraud'],
            'config.transactionTypes.allowedNames',
        )).toThrow('contains names matching multiple available options: fraud')
    })

    it('keeps reset, remove, and add semantics inside the allowed dictionary', () => {
        const onFiltersUpdate = jest.fn()
        const store = createInitializedStore(onFiltersUpdate)

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611, 722],
        }))

        store.getState().setTransactionTypesCriterion({
            all: false,
            entities: [{id: 100, displayName: 'chargeback'}],
        })
        expect(store.getState().transactionTypes.entities).toEqual([
            {id: 611, displayName: 'chargeback'},
        ])

        store.getState().clearCriterion(CriterionTypeEnum.TRANSACTION_TYPES)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611, 722],
        }))

        store.getState().removeCriterion(CriterionTypeEnum.TRANSACTION_TYPES)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [],
        }))

        store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_TYPES)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611, 722],
        }))

        store.getState().clearCriteria()
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611, 722],
        }))
    })

    it('sanitizes templates without mutating their source values', () => {
        const onFiltersUpdate = jest.fn()
        const store = createInitializedStore(onFiltersUpdate)
        const template: SearchUITemplate = {
            name: 'restricted-types',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.TRANSACTION_TYPES],
                transactionTypes: {
                    all: false,
                    entities: [
                        {id: 1, displayName: 'chargeback'},
                        {id: 2, displayName: 'sale'},
                    ],
                },
            },
        }

        store.getState().setTemplate(template)

        expect(store.getState().transactionTypes).toEqual({
            all: false,
            entities: [{id: 611, displayName: 'chargeback'}],
        })
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611],
        }))
        expect(template.searchConditions.transactionTypes).toEqual({
            all: false,
            entities: [
                {id: 1, displayName: 'chargeback'},
                {id: 2, displayName: 'sale'},
            ],
        })

        const allTemplate: SearchUITemplate = {
            ...template,
            name: 'all-restricted-types',
            searchConditions: {
                ...template.searchConditions,
                transactionTypes: {all: true, entities: []},
            },
        }
        store.getState().setTemplate(allTemplate)

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [611, 722],
        }))
    })

    it('rejects retained manual criteria when the name-to-ID mapping changes', () => {
        const sourceStore = createInitializedStore(jest.fn(), {manualSearch: true})
        sourceStore.getState().setTransactionTypesCriterion({
            all: false,
            entities: [{id: 611, displayName: 'chargeback'}],
        })
        sourceStore.getState().triggerSearch()
        retainSearchUIState(
            'restricted-transaction-types-store-test',
            sourceStore.getState(),
        )

        const retainedSnapshot = getRetainedSearchUIState(
            'restricted-transaction-types-store-test',
        )
        expect(retainedSnapshot).toBeDefined()

        const onFiltersUpdate = jest.fn()
        const store = createInitializedStore(onFiltersUpdate, {
            manualSearch: true,
            retainedSnapshot,
            allowedOptions: [
                {id: 722, displayName: 'chargeback'},
                {id: 611, displayName: 'fraud'},
            ],
        })

        expect(store.getState().restoredFromRetention).toBe(false)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionTypes: [722, 611],
        }))
    })
})
