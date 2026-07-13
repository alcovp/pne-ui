import { createSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import {
    CriterionTypeEnum,
    DateRangeSpec,
    ExactCriterionSearchLabelEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    SearchUITemplate,
    TransactionSessionStatus,
    TransactionSessionStatuses,
} from '../src/component/search-ui/filters/types'
import type { SearchUIRetentionSnapshot } from '../src/component/search-ui/filters/state/type'
import {
    createDateOnlyPickerDate,
    createDateOnlyPickerValue,
} from '../src/component/search-ui/filters/dateRangeTimeZone'
import {
    createClearCriteriaUndoSnapshot,
} from '../src/component/search-ui/filters/state/undo'
import {
    getSearchUIFiltersInitialState,
    getSearchUIInitialSearchCriteria,
} from '../src/component/search-ui/filters/state/initial'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'
import dayjs from 'dayjs'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('SearchUIFilters Zustand store', () => {
    let store: ReturnType<typeof createSearchUIFiltersStore>

    const createTransactionSessionStatus = (displayName: string, selected = true): TransactionSessionStatus => ({
        displayName,
        selected,
    })

    beforeEach(() => {
        localStorage.clear()
        store = createSearchUIFiltersStore()
        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate: () => {
            },
        })
    })

    it('adds criterion', () => {
        const { addCriterion } = store.getState()
        addCriterion(CriterionTypeEnum.CURRENCY)
        const state = store.getState()
        expect(state.criteria).toContain(CriterionTypeEnum.CURRENCY)
        expect(state.justAddedCriterion).toBe(CriterionTypeEnum.CURRENCY)
    })

    it('adds customer level together with merchant and currency dependencies', () => {
        store.setState({
            possibleCriteria: [
                CriterionTypeEnum.CUSTOMER_LEVEL,
                CriterionTypeEnum.MERCHANT,
                CriterionTypeEnum.CURRENCY,
            ],
        })

        store.getState().addCriterion(CriterionTypeEnum.CUSTOMER_LEVEL)

        const state = store.getState()
        expect(state.criteria).toEqual([
            CriterionTypeEnum.MERCHANT,
            CriterionTypeEnum.CURRENCY,
            CriterionTypeEnum.CUSTOMER_LEVEL,
        ])
        expect(state.multigetCriteria).toEqual([
            expect.objectContaining({
                entityType: LinkedEntityTypeEnum.MERCHANT,
                filterType: MultichoiceFilterTypeEnum.NONE,
            }),
        ])

        state.setCustomerLevelCriterion({ id: 20, displayName: 'VIP' })
        expect(store.getState().customerLevel).toBeNull()
    })

    it('extracts customer level and clears it when merchant or currency changes', () => {
        const onFiltersUpdate = jest.fn()
        const merchantCriterion = {
            entityType: LinkedEntityTypeEnum.MERCHANT,
            filterType: MultichoiceFilterTypeEnum.NONE,
            searchString: '',
            selectedItems: '10',
            selectedItemNames: 'Merchant 10',
            deselectedItems: '',
            deselectedItemNames: '',
        }
        store.setState({
            criteria: [
                CriterionTypeEnum.MERCHANT,
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.CUSTOMER_LEVEL,
            ],
            multigetCriteria: [merchantCriterion],
            onFiltersUpdate,
        })

        store.getState().setCustomerLevelCriterion({ id: 20, displayName: 'VIP' })
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            customerLevelId: 20,
        }))

        store.getState().setCurrenciesCriterion({
            all: false,
            entities: [{ id: 840, displayName: 'USD' }],
        })
        expect(store.getState().customerLevel).toBeNull()

        store.getState().setCustomerLevelCriterion({ id: 20, displayName: 'VIP' })
        store.getState().setMultigetCriterion({
            ...merchantCriterion,
            selectedItems: '11',
            selectedItemNames: 'Merchant 11',
        })
        expect(store.getState().customerLevel).toBeNull()
    })

    it('preserves customer level in templates and clear-all undo snapshots', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        const customerLevel = { id: 20, displayName: 'VIP' }
        const merchantCriterion = {
            entityType: LinkedEntityTypeEnum.MERCHANT,
            filterType: MultichoiceFilterTypeEnum.NONE,
            searchString: '',
            selectedItems: '10',
            selectedItemNames: 'Merchant 10',
            deselectedItems: '',
            deselectedItemNames: '',
        }
        store.setState({
            defaults: {
                ...initialSearchUIDefaults,
                saveSearchTemplate,
            },
            possibleCriteria: [
                CriterionTypeEnum.MERCHANT,
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.CUSTOMER_LEVEL,
            ],
            criteria: [
                CriterionTypeEnum.MERCHANT,
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.CUSTOMER_LEVEL,
            ],
            multigetCriteria: [merchantCriterion],
            customerLevel,
        })

        store.getState().createTemplate('customer-level-template')
        await flushPromises()

        expect(saveSearchTemplate).toHaveBeenCalledWith(expect.objectContaining({
            template: expect.objectContaining({
                searchConditions: expect.objectContaining({ customerLevel }),
            }),
        }))

        const snapshot = createClearCriteriaUndoSnapshot(store.getState())
        store.getState().clearCriteria()
        expect(store.getState().customerLevel).toBeNull()

        store.getState().restoreClearCriteriaSnapshot(snapshot)
        expect(store.getState().customerLevel).toEqual(customerLevel)
        expect(store.getState().criteria).toEqual([
            CriterionTypeEnum.MERCHANT,
            CriterionTypeEnum.CURRENCY,
            CriterionTypeEnum.CUSTOMER_LEVEL,
        ])
    })

    it('removes criterion', () => {
        store.setState({ criteria: [CriterionTypeEnum.CURRENCY, CriterionTypeEnum.STATUS] })
        const { removeCriterion } = store.getState()
        removeCriterion(CriterionTypeEnum.CURRENCY)
        const state = store.getState()
        expect(state.criteria).toEqual([CriterionTypeEnum.STATUS])
    })

    it('saves template', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        const defaults = { ...initialSearchUIDefaults, saveSearchTemplate }
        const initial = getSearchUIFiltersInitialState()
        store.setState(initial)
        store.setState({
            defaults,
            settingsContextName: 'ctx',
            criteria: [CriterionTypeEnum.STATUS],
            onFiltersUpdate: () => {
            },
        })

        const { createTemplate } = store.getState()
        createTemplate('tmpl')
        await flushPromises()
        await flushPromises()
        expect(saveSearchTemplate).toHaveBeenCalled()
        const state = store.getState()
        expect(state.templates.map(t => t.name)).toContain('tmpl')
        expect(state.template?.name).toBe('tmpl')
        expect(localStorage.getItem('last_template_namectx')).toBe('tmpl')
    })

    it('loads templates', async () => {
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }
        const getSearchTemplates = jest.fn().mockResolvedValue([template])
        const defaults = { ...initialSearchUIDefaults, getSearchTemplates }
        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults,
            settingsContextName: 'ctx',
            onFiltersUpdate: () => {
            },
        })

        const { loadTemplates } = store.getState()
        loadTemplates()
        await flushPromises()
        await flushPromises()
        const state = store.getState()
        expect(state.templates).toEqual([template])
        expect(getSearchTemplates).toHaveBeenCalledWith('ctx')
    })

    it('normalizes loaded templates with legacy empty multiget criteria', async () => {
        const template: SearchUITemplate = {
            name: 'migrated',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.MERCHANT],
                multigetCriteria: [{
                    entityType: LinkedEntityTypeEnum.MERCHANT,
                    filterType: MultichoiceFilterTypeEnum.NONE,
                } as SearchUITemplate['searchConditions']['multigetCriteria'][number]],
            },
        }
        const getSearchTemplates = jest.fn().mockResolvedValue([template])
        const defaults = { ...initialSearchUIDefaults, getSearchTemplates }
        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults,
            settingsContextName: 'ctx',
            possibleCriteria: [CriterionTypeEnum.MERCHANT],
            onFiltersUpdate: () => {
            },
        })

        const { loadTemplates } = store.getState()
        loadTemplates()
        await flushPromises()
        await flushPromises()

        const state = store.getState()
        const normalizedCriterion = state.templates[0].searchConditions.multigetCriteria[0]
        expect(normalizedCriterion).toMatchObject({
            entityType: LinkedEntityTypeEnum.MERCHANT,
            filterType: MultichoiceFilterTypeEnum.NONE,
            searchString: '',
            selectedItems: '',
            selectedItemNames: '',
            deselectedItems: '',
            deselectedItemNames: '',
        })

        state.setTemplate(state.templates[0])
        expect(store.getState().multigetCriteria[0]).toMatchObject({
            selectedItems: '',
            selectedItemNames: '',
            deselectedItems: '',
            deselectedItemNames: '',
        })
    })

    it('auto-applies the last template in manual search mode', async () => {
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.STATUS],
                status: 'ENABLED',
            },
        }
        const getSearchTemplates = jest.fn().mockResolvedValue([template])
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: {
                ...initialSearchUIDefaults,
                getSearchTemplates,
            },
            settingsContextName: 'ctx',
            onFiltersUpdate,
            config: {
                manualSearch: true,
            },
        })

        localStorage.setItem('last_template_namectx', 'stored')

        const { loadTemplates } = store.getState()
        loadTemplates()
        await flushPromises()
        await flushPromises()

        const state = store.getState()
        expect(getSearchTemplates).toHaveBeenCalledWith('ctx')
        expect(state.template?.name).toBe('stored')
        expect(state.hasUnappliedFilters).toBe(false)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            status: 'E',
        }))
    })

    it('loads templates without overwriting retained filter conditions', async () => {
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.STATUS],
                status: 'DISABLED',
            },
        }
        const getSearchTemplates = jest.fn().mockResolvedValue([template])
        const onFiltersUpdate = jest.fn()
        const retainedSnapshot: SearchUIRetentionSnapshot = {
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.STATUS],
                status: 'ENABLED',
            },
            appliedSearchCriteria: null,
            activeTemplateName: 'stored',
            hasUnappliedFilters: false,
            possibleCriteria: [CriterionTypeEnum.STATUS],
            predefinedCriteria: [],
            exactSearchLabels: [],
            manualSearch: false,
        }

        const { setInitialState } = store.getState()
        setInitialState({
            defaults: {
                ...initialSearchUIDefaults,
                getSearchTemplates,
            },
            settingsContextName: 'ctx',
            possibleCriteria: [CriterionTypeEnum.STATUS],
            predefinedCriteria: [],
            exactSearchLabels: [],
            onFiltersUpdate,
        }, retainedSnapshot)

        localStorage.setItem('last_template_namectx', 'stored')
        store.getState().loadTemplates()
        await flushPromises()
        await flushPromises()

        const state = store.getState()
        expect(state.restoredFromRetention).toBe(true)
        expect(state.status).toBe('ENABLED')
        expect(state.template?.name).toBe('stored')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        expect(onFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'D' }))
    })

    it('does not auto-apply the last template when external conditions are provided', async () => {
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.STATUS],
                status: 'DISABLED',
            },
        }
        const getSearchTemplates = jest.fn().mockResolvedValue([template])
        const onFiltersUpdate = jest.fn()

        store.getState().setInitialState({
            defaults: {
                ...initialSearchUIDefaults,
                getSearchTemplates,
            },
            settingsContextName: 'ctx',
            possibleCriteria: [CriterionTypeEnum.STATUS],
            predefinedCriteria: [],
            exactSearchLabels: [],
            onFiltersUpdate,
        })
        store.getState().updateConditions({
            criteria: [CriterionTypeEnum.STATUS],
            status: 'ENABLED',
        }, {
            forceSearch: true,
            resetTemplate: true,
        })

        localStorage.setItem('last_template_namectx', 'stored')
        store.getState().loadTemplates()
        await flushPromises()
        await flushPromises()

        const state = store.getState()
        expect(state.status).toBe('ENABLED')
        expect(state.template).toBeNull()
        expect(onFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'D' }))
    })

    it('initializes a new context without leaking previous filter values', () => {
        const oldTemplate: SearchUITemplate = {
            name: 'old',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }
        const onFiltersUpdate = jest.fn()

        store.setState({
            settingsContextName: 'GatesListPage',
            possibleCriteria: [
                CriterionTypeEnum.EXACT,
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.STATUS,
            ],
            predefinedCriteria: [CriterionTypeEnum.EXACT],
            exactSearchLabels: [
                ExactCriterionSearchLabelEnum.ALL,
                ExactCriterionSearchLabelEnum.NAME,
            ],
            criteria: [
                CriterionTypeEnum.EXACT,
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.STATUS,
            ],
            exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
            exactSearchValue: 'stale-gate',
            status: 'ENABLED',
            currencies: {
                all: false,
                entities: [{ id: 840, displayName: 'USD' }],
            },
            template: oldTemplate,
            templates: [oldTemplate],
            hasUnappliedFilters: true,
        })

        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ProjectsListPage',
            possibleCriteria: [
                CriterionTypeEnum.CURRENCY,
                CriterionTypeEnum.STATUS,
            ],
            predefinedCriteria: [],
            exactSearchLabels: [
                ExactCriterionSearchLabelEnum.ALL,
                ExactCriterionSearchLabelEnum.IDENTIFIER,
            ],
            exactSearchLabel: ExactCriterionSearchLabelEnum.ALL,
            onFiltersUpdate,
        })

        const state = store.getState()
        expect(state.settingsContextName).toBe('ProjectsListPage')
        expect(state.criteria).toEqual([])
        expect(state.currencies).toEqual({ all: true, entities: [] })
        expect(state.status).toBe('ANY')
        expect(state.exactSearchLabel).toBe(ExactCriterionSearchLabelEnum.ALL)
        expect(state.exactSearchValue).toBe('')
        expect(state.template).toBeNull()
        expect(state.templates).toEqual([])
        expect(state.hasUnappliedFilters).toBe(false)
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            currencies: [],
            exactSearchLabel: null,
            exactSearchValue: '',
            status: null,
        }))
    })

    it('applies external searchConditions without breaking possible criteria', () => {
        store.setState(getSearchUIFiltersInitialState())
        const onFiltersUpdate = jest.fn()
        const visaCard = { id: 1, displayName: 'VISA' }
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.STATUS, CriterionTypeEnum.PROJECT, CriterionTypeEnum.CARD_TYPES],
            predefinedCriteria: [CriterionTypeEnum.STATUS],
            criteria: [CriterionTypeEnum.STATUS],
            multigetCriteria: [],
        })

        const { updateConditions, setCardTypesCriterion } = store.getState()
        updateConditions({
            criteria: [CriterionTypeEnum.MERCHANT, CriterionTypeEnum.PROJECT, CriterionTypeEnum.CARD_TYPES],
            cardTypes: { all: false, entities: [visaCard] },
        })

        const state = store.getState()
        expect(state.criteria).toEqual([CriterionTypeEnum.STATUS, CriterionTypeEnum.PROJECT, CriterionTypeEnum.CARD_TYPES])
        expect(state.multigetCriteria).toHaveLength(1)
        expect(state.multigetCriteria[0].entityType).toBe(LinkedEntityTypeEnum.PROJECT)
        expect(state.cardTypes).toEqual({ all: false, entities: [visaCard] })
        expect(state.possibleCriteria).toEqual([
            CriterionTypeEnum.STATUS,
            CriterionTypeEnum.PROJECT,
            CriterionTypeEnum.CARD_TYPES,
        ])
        expect(onFiltersUpdate).toHaveBeenCalled()

        setCardTypesCriterion({ all: true, entities: [] })
        const afterRemoval = store.getState()
        expect(afterRemoval.cardTypes).toEqual({ all: true, entities: [] })
    })

    it('applies external searchConditions immediately in manual search mode and clears the active template', () => {
        const onFiltersUpdate = jest.fn()
        const visaCard = { id: 1, displayName: 'VISA' }
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.CARD_TYPES],
            config: {
                manualSearch: true,
            },
        })
        store.setState({ template })
        onFiltersUpdate.mockClear()

        const { updateConditions } = store.getState()
        updateConditions({
            criteria: [CriterionTypeEnum.CARD_TYPES],
            cardTypes: { all: false, entities: [visaCard] },
        }, {
            forceSearch: true,
            resetTemplate: true,
        })

        const state = store.getState()
        expect(state.template).toBeNull()
        expect(state.hasUnappliedFilters).toBe(false)
        expect(state.cardTypes).toEqual({ all: false, entities: [visaCard] })
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            cardTypes: [visaCard.id],
        }))
    })

    it('keeps legacy browser-local timezone for date-only EXACTLY dates by default', () => {
        const onFiltersUpdate = jest.fn()
        const dateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date('2025-05-13T21:00:00.000Z'),
            dateTo: new Date('2025-05-15T21:00:00.000Z'),
            beforeCount: 1,
        }

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
            criteria: [CriterionTypeEnum.DATE_RANGE],
            dateRangeSpec,
        })

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: dayjs(dateRangeSpec.dateFrom).startOf('day').toDate(),
            dateTo: dayjs(dateRangeSpec.dateTo).startOf('day').add(1, 'day').toDate(),
        }))
    })

    it('can opt date-only EXACTLY dates into Moscow timezone', () => {
        const onFiltersUpdate = jest.fn()
        const dateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date('2025-05-13T21:00:00.000Z'),
            dateTo: new Date('2025-05-15T21:00:00.000Z'),
            beforeCount: 1,
        }

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
            criteria: [CriterionTypeEnum.DATE_RANGE],
            dateRangeSpec,
            config: {
                dateRange: {
                    dateOnlyTimeZone: 'Europe/Moscow',
                },
            },
        })

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2025-05-13T21:00:00.000Z'),
            dateTo: new Date('2025-05-16T21:00:00.000Z'),
        }))
    })

    it('preserves exact instants when time selection is enabled', () => {
        const onFiltersUpdate = jest.fn()
        const dateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date('2025-05-14T10:20:30.000Z'),
            dateTo: new Date('2025-05-16T11:21:31.000Z'),
            beforeCount: 1,
        }

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
            criteria: [CriterionTypeEnum.DATE_RANGE],
            dateRangeSpec,
            config: {
                dateRange: {
                    enableTimeSelection: true,
                },
            },
        })

        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: dateRangeSpec.dateFrom,
            dateTo: dateRangeSpec.dateTo,
        }))
    })

    it('anchors date-only picker values to the configured day timezone', () => {
        const selectedDay = dayjs('2025-05-14T15:30:00')
        const anchoredDate = createDateOnlyPickerDate(selectedDay, 'Europe/Moscow')

        expect(anchoredDate.toISOString()).toBe('2025-05-13T21:00:00.000Z')
        expect(
            createDateOnlyPickerValue(anchoredDate, 'Europe/Moscow')?.format('YYYY-MM-DD'),
        ).toBe('2025-05-14')
    })

    it('reruns search with current filters when manual filters are already applied', () => {
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            config: {
                manualSearch: true,
            },
            criteria: [CriterionTypeEnum.STATUS],
            status: 'ENABLED',
            hasUnappliedFilters: false,
        })

        const { triggerSearch } = store.getState()
        triggerSearch()

        const state = store.getState()
        expect(state.hasUnappliedFilters).toBe(false)
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            initialized: true,
            status: 'E',
        }))
    })

    it('removes unavailable predefined criteria and restores them when they become available', () => {
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [
                CriterionTypeEnum.DATE_RANGE_ORDERS,
                CriterionTypeEnum.ORDERS_SEARCH,
            ],
            predefinedCriteria: [
                CriterionTypeEnum.DATE_RANGE_ORDERS,
                CriterionTypeEnum.ORDERS_SEARCH,
            ],
            criteria: [
                CriterionTypeEnum.DATE_RANGE_ORDERS,
                CriterionTypeEnum.ORDERS_SEARCH,
            ],
            ordersSearchValue: 'invoice-1',
            config: {
                criterionAvailabilityRules: [{
                    criterion: CriterionTypeEnum.ORDERS_SEARCH,
                    isAvailable: conditions => conditions.orderDateType === 'SESSION_STATUS_CHANGED',
                }],
            },
        })

        onFiltersUpdate.mockClear()
        const { setDateRangeCriterionOrderDateType } = store.getState()
        setDateRangeCriterionOrderDateType('BANK')

        const unavailableState = store.getState()
        expect(unavailableState.criteria).toEqual([CriterionTypeEnum.DATE_RANGE_ORDERS])
        expect(unavailableState.ordersSearchLabel).toBe('merchant_invoice_id')
        expect(unavailableState.ordersSearchValue).toBe('')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            orderDateType: 'BANK',
            ordersSearchValue: '',
        }))

        setDateRangeCriterionOrderDateType('SESSION_STATUS_CHANGED')

        const availableState = store.getState()
        expect(availableState.criteria).toEqual([
            CriterionTypeEnum.DATE_RANGE_ORDERS,
            CriterionTypeEnum.ORDERS_SEARCH,
        ])
    })

    it('does not apply unavailable criteria from external searchConditions', () => {
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = store.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.ORDERS_SEARCH],
            orderDateType: 'BANK',
            config: {
                criterionAvailabilityRules: [{
                    criterion: CriterionTypeEnum.ORDERS_SEARCH,
                    isAvailable: conditions => conditions.orderDateType === 'SESSION_STATUS_CHANGED',
                }],
            },
        })

        const { updateConditions } = store.getState()
        updateConditions({
            criteria: [CriterionTypeEnum.ORDERS_SEARCH],
            ordersSearchValue: 'invoice-2',
            orderDateType: 'BANK',
        })

        const state = store.getState()
        expect(state.criteria).toEqual([])
        expect(state.ordersSearchValue).toBe('')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            orderDateType: 'BANK',
            ordersSearchValue: '',
        }))
    })

    it('restores a clear-all snapshot and re-runs search when filters were previously applied', () => {
        const onFiltersUpdate = jest.fn()
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }

        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            criteria: [CriterionTypeEnum.STATUS],
            status: 'ENABLED',
            template,
            hasUnappliedFilters: false,
        })
        localStorage.setItem('last_template_namectx', 'stored')

        const snapshot = createClearCriteriaUndoSnapshot(store.getState())
        const { clearCriteria, restoreClearCriteriaSnapshot } = store.getState()

        clearCriteria()
        onFiltersUpdate.mockClear()
        restoreClearCriteriaSnapshot(snapshot)

        const state = store.getState()
        expect(state.criteria).toEqual([CriterionTypeEnum.STATUS])
        expect(state.status).toBe('ENABLED')
        expect(state.template?.name).toBe('stored')
        expect(state.hasUnappliedFilters).toBe(false)
        expect(localStorage.getItem('last_template_namectx')).toBe('stored')
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'E',
        }))
    })

    it('restores a clear-all snapshot without searching when manual changes were unapplied', () => {
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            config: {
                manualSearch: true,
            },
            criteria: [CriterionTypeEnum.STATUS],
            status: 'ENABLED',
            hasUnappliedFilters: true,
        })

        const snapshot = createClearCriteriaUndoSnapshot(store.getState())
        const { clearCriteria, restoreClearCriteriaSnapshot } = store.getState()

        clearCriteria()
        onFiltersUpdate.mockClear()
        restoreClearCriteriaSnapshot(snapshot)

        const state = store.getState()
        expect(state.criteria).toEqual([CriterionTypeEnum.STATUS])
        expect(state.status).toBe('ENABLED')
        expect(state.hasUnappliedFilters).toBe(true)
        expect(onFiltersUpdate).not.toHaveBeenCalled()
    })

    it('accepts transaction session statuses returned as backend objects', async () => {
        const transactionSessionStatuses: TransactionSessionStatuses = {
            APPROVED: [
                createTransactionSessionStatus('AUTHORIZED'),
                createTransactionSessionStatus('CHARGED'),
            ],
            PROCESSING: [],
            UNKNOWN: [],
            FILTERED: [],
            ERROR: [],
            PENDING_RETURNS: [],
            VALIDATING_3D: [],
            VERIFICATING_PHONE: [],
            INVOICED: [],
            SENT: [],
            ALL: [],
        }
        const getTransactionSessionStatuses = jest.fn().mockResolvedValue(transactionSessionStatuses)
        const onFiltersUpdate = jest.fn()

        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: {
                ...initialSearchUIDefaults,
                getTransactionSessionStatuses,
            },
            settingsContextName: 'ctx',
            onFiltersUpdate,
        })

        const { addCriterion } = store.getState()
        addCriterion(CriterionTypeEnum.TRANSACTION_SESSION_STATUS)
        await flushPromises()
        await flushPromises()

        const state = store.getState()
        expect(getTransactionSessionStatuses).toHaveBeenCalled()
        expect(state.prefetchedData.transactionSessionStatuses).toBeInstanceOf(Map)
        expect(state.prefetchedData.transactionSessionStatuses?.get('APPROVED')).toEqual(transactionSessionStatuses.APPROVED)
        expect(state.transactionSessionStatuses).toEqual(transactionSessionStatuses.APPROVED)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionSessionStatuses: 'AUTHORIZED,CHARGED',
        }))
    })
})
