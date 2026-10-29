import { createSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import {
    CriterionTypeEnum,
    DateRangeSpec,
    ExactCriterionSearchLabelEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    SearchUIConditions,
    SearchUITemplate,
    TransactionSessionGroup,
    TransactionSessionStatus,
    TransactionSessionStatuses,
} from '../src/component/search-ui/filters/types'
import type { SearchUIFiltersState, SearchUIRetentionSnapshot } from '../src/component/search-ui/filters/state/type'
import {
    applyDateOnlyTimeZone,
    createDateOnlyPickerDate,
    createDateOnlyPickerValue,
    SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE,
} from '../src/component/search-ui/filters/dateRangeTimeZone'
import {
    createClearCriteriaUndoSnapshot,
} from '../src/component/search-ui/filters/state/undo'
import {
    getRetainedSearchUIState,
    resetSearchUIRetentionForTests,
    retainSearchUIState,
} from '../src/component/search-ui/filters/state/retention'
import {
    getSearchUIFiltersInitialState,
    getSearchUIInitialDateFrom,
    getSearchUIInitialDateTo,
    getSearchUIInitialSearchCriteria,
} from '../src/component/search-ui/filters/state/initial'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const REPORT_CRITERIA: CriterionTypeEnum[] = [
    CriterionTypeEnum.TRANSACTION_REPORT_SCOPE,
    CriterionTypeEnum.TRANSACTION_DATE_TYPE,
    CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER,
    CriterionTypeEnum.TIME_ZONE,
    CriterionTypeEnum.CSV_CHARSET,
]

const REPORT_CONDITIONS = {
    scope: 'SELECTED_BY_TX_RRN',
    transactionIds: 'rrn-1\nrrn-2',
    datesType: 'CREATED',
    recurrentFilter: 'NON_RECURRENTS_ONLY',
    timeZoneOffsetHours: -5,
    csvCharset: 'windows-1251',
} as const

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

    afterEach(() => {
        jest.useRealTimers()
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

    it('round-trips transaction report fields through templates and clear-all undo', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        store.setState({
            defaults: {
                ...initialSearchUIDefaults,
                saveSearchTemplate,
            },
            possibleCriteria: REPORT_CRITERIA,
            criteria: REPORT_CRITERIA,
            ...REPORT_CONDITIONS,
        })

        store.getState().createTemplate('transaction-report-template')
        await flushPromises()

        const savedTemplate = saveSearchTemplate.mock.calls[0][0].template as SearchUITemplate
        expect(savedTemplate.searchConditions).toEqual(expect.objectContaining(REPORT_CONDITIONS))

        const undoSnapshot = createClearCriteriaUndoSnapshot(store.getState())
        store.getState().clearCriteria()
        expect(store.getState()).toEqual(expect.objectContaining({
            scope: 'ALL',
            transactionIds: '',
            datesType: 'CREATED',
            recurrentFilter: 'ALL',
            timeZoneOffsetHours: null,
            csvCharset: null,
        }))

        store.getState().restoreClearCriteriaSnapshot(undoSnapshot)
        expect(store.getState()).toEqual(expect.objectContaining(REPORT_CONDITIONS))
        expect(store.getState().criteria).toEqual(REPORT_CRITERIA)

        store.getState().clearCriteria()
        store.getState().setTemplate(savedTemplate)
        expect(store.getState()).toEqual(expect.objectContaining(REPORT_CONDITIONS))
        expect(store.getState().criteria).toEqual(REPORT_CRITERIA)
    })

    it('restores transaction report fields from in-memory retention', () => {
        resetSearchUIRetentionForTests()
        try {
            store.setState({
                initialized: true,
                possibleCriteria: REPORT_CRITERIA,
                predefinedCriteria: REPORT_CRITERIA,
                criteria: REPORT_CRITERIA,
                ...REPORT_CONDITIONS,
            })
            retainSearchUIState('transaction-report-retention', store.getState())

            const snapshot = getRetainedSearchUIState('transaction-report-retention')
            expect(snapshot?.searchConditions).toEqual(expect.objectContaining(REPORT_CONDITIONS))

            const restoredStore = createSearchUIFiltersStore()
            restoredStore.getState().setInitialState({
                defaults: initialSearchUIDefaults,
                settingsContextName: 'transaction-report-retention',
                possibleCriteria: REPORT_CRITERIA,
                predefinedCriteria: REPORT_CRITERIA,
                criteria: REPORT_CRITERIA,
                onFiltersUpdate: jest.fn(),
            }, snapshot)

            expect(restoredStore.getState()).toEqual(expect.objectContaining(REPORT_CONDITIONS))
            expect(restoredStore.getState().restoredFromRetention).toBe(true)
        } finally {
            resetSearchUIRetentionForTests()
        }
    })

    it('resets transaction report fields when criteria are removed and re-added', () => {
        store.setState({
            possibleCriteria: REPORT_CRITERIA,
            criteria: REPORT_CRITERIA,
            ...REPORT_CONDITIONS,
        })

        store.getState().removeCriterion(CriterionTypeEnum.TRANSACTION_REPORT_SCOPE)
        expect(store.getState()).toEqual(expect.objectContaining({scope: 'ALL', transactionIds: ''}))
        store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_REPORT_SCOPE)

        store.getState().removeCriterion(CriterionTypeEnum.TRANSACTION_DATE_TYPE)
        expect(store.getState().datesType).toBe('CREATED')
        store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_DATE_TYPE)

        store.getState().removeCriterion(CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER)
        expect(store.getState().recurrentFilter).toBe('ALL')
        store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER)

        store.getState().removeCriterion(CriterionTypeEnum.TIME_ZONE)
        expect(store.getState().timeZoneOffsetHours).toBeNull()
        store.getState().addCriterion(CriterionTypeEnum.TIME_ZONE)

        store.getState().removeCriterion(CriterionTypeEnum.CSV_CHARSET)
        expect(store.getState().csvCharset).toBeNull()
        store.getState().addCriterion(CriterionTypeEnum.CSV_CHARSET)

        expect(store.getState().criteria).toEqual(REPORT_CRITERIA)
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

    describe('reorderTemplates', () => {
        const templateNames = (state = store.getState()) => state.templates.map(template => template.name)
        const setUpTemplates = (reorderSearchTemplates?: jest.Mock) => {
            store.setState({
                defaults: {...initialSearchUIDefaults, reorderSearchTemplates},
                templates: ['alpha', 'bravo', 'charlie'].map(name => ({
                    name,
                    searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                })),
            })
        }

        it('applies the order at once and persists every name of the context', async () => {
            const reorderSearchTemplates = jest.fn().mockResolvedValue(undefined)
            setUpTemplates(reorderSearchTemplates)

            const saved = store.getState().reorderTemplates(['charlie', 'alpha'])

            // Unlisted templates keep their relative order after the listed ones.
            expect(templateNames()).toEqual(['charlie', 'alpha', 'bravo'])
            await expect(saved).resolves.toBeUndefined()
            expect(reorderSearchTemplates).toHaveBeenCalledWith({
                contextName: 'ctx',
                templateNames: ['charlie', 'alpha', 'bravo'],
            })
        })

        it('skips the host call when the order does not change', async () => {
            const reorderSearchTemplates = jest.fn().mockResolvedValue(undefined)
            setUpTemplates(reorderSearchTemplates)
            const before = store.getState().templates

            await store.getState().reorderTemplates(['alpha', 'bravo', 'charlie'])

            expect(reorderSearchTemplates).not.toHaveBeenCalled()
            expect(store.getState().templates).toBe(before)
        })

        it('restores the previous order and rejects when saving fails', async () => {
            const failure = new Error('storage down')
            setUpTemplates(jest.fn().mockRejectedValue(failure))

            const saved = store.getState().reorderTemplates(['bravo', 'alpha', 'charlie'])
            expect(templateNames()).toEqual(['bravo', 'alpha', 'charlie'])

            await expect(saved).rejects.toBe(failure)
            expect(templateNames()).toEqual(['alpha', 'bravo', 'charlie'])
        })

        it('keeps a newer list when an earlier save fails', async () => {
            let rejectFirst: (error: Error) => void = () => undefined
            const reorderSearchTemplates = jest.fn()
                .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
                    rejectFirst = reject
                }))
                .mockResolvedValue(undefined)
            setUpTemplates(reorderSearchTemplates)

            const first = store.getState().reorderTemplates(['bravo', 'alpha', 'charlie'])
            await store.getState().reorderTemplates(['charlie', 'bravo', 'alpha'])
            rejectFirst(new Error('late failure'))

            await expect(first).rejects.toThrow('late failure')
            expect(templateNames()).toEqual(['charlie', 'bravo', 'alpha'])
        })

        it('rejects without changing the list when the host cannot persist an order', async () => {
            setUpTemplates()
            const before = store.getState().templates

            await expect(store.getState().reorderTemplates(['charlie', 'bravo', 'alpha'])).rejects.toThrow()
            expect(store.getState().templates).toBe(before)
        })
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

    it('keeps the legacy resolved relative range in user templates and recalculates it on apply', () => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))

        const legacyDateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'DAYS_BEFORE',
            dateFrom: new Date('2020-01-01T00:00:00.000Z'),
            dateTo: new Date('2020-01-31T00:00:00.000Z'),
            beforeCount: 30,
        }
        const template: SearchUITemplate = {
            name: 'legacy-relative-range',
            searchConditions: {
                ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
                criteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
                dateRangeSpec: legacyDateRangeSpec,
            },
        }

        store.setState({
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            onFiltersUpdate: jest.fn(),
        })
        store.getState().setTemplate(template)

        const firstResolvedDateFrom = store.getState().dateRangeSpec.dateFrom
        expect(firstResolvedDateFrom).not.toEqual(legacyDateRangeSpec.dateFrom)
        expect(store.getState().dateRangeSpec.dateRangeSpecType).toBe('DAYS_BEFORE')
        expect(store.getState().dateRangeSpec.beforeCount).toBe(30)
        expect(template.searchConditions.dateRangeSpec).toBe(legacyDateRangeSpec)
        expect(template.searchConditions.dateRangeSpec).toEqual({
            dateRangeSpecType: 'DAYS_BEFORE',
            dateFrom: new Date('2020-01-01T00:00:00.000Z'),
            dateTo: new Date('2020-01-31T00:00:00.000Z'),
            beforeCount: 30,
        })

        jest.setSystemTime(new Date('2026-07-16T12:00:00.000Z'))
        store.getState().triggerSearch()

        expect(store.getState().dateRangeSpec.dateFrom).not.toEqual(firstResolvedDateFrom)
        expect(template.searchConditions.dateRangeSpec).toBe(legacyDateRangeSpec)
        expect(template.searchConditions.dateRangeSpec.dateFrom).toEqual(
            new Date('2020-01-01T00:00:00.000Z'),
        )
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
            transactionTypesRestriction: null,
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

    it('normalizes external DAYS_BEFORE conditions and recalculates them on repeated Search', () => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))

        const onFiltersUpdate = jest.fn()
        const staleDateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'DAYS_BEFORE',
            dateFrom: new Date('2020-01-01T00:00:00.000Z'),
            dateTo: new Date('2020-01-31T00:00:00.000Z'),
            beforeCount: 30,
        }

        store.setState(getSearchUIFiltersInitialState())
        store.getState().setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            criteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            config: {
                manualSearch: true,
            },
        })
        onFiltersUpdate.mockClear()

        store.getState().updateConditions({
            dateRangeSpec: staleDateRangeSpec,
        }, {
            forceSearch: true,
        })

        const firstDateFrom = applyDateOnlyTimeZone(
            dayjs().startOf('day').subtract(30, 'day'),
            'Europe/Moscow',
        ).toDate()
        const firstDateTo = applyDateOnlyTimeZone(
            dayjs().startOf('day').add(1, 'day'),
            'Europe/Moscow',
        ).toDate()
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: firstDateFrom,
            dateTo: firstDateTo,
        }))

        jest.setSystemTime(new Date('2026-07-16T12:00:00.000Z'))
        store.getState().triggerSearch()

        const nextDateFrom = applyDateOnlyTimeZone(
            dayjs().startOf('day').subtract(30, 'day'),
            'Europe/Moscow',
        ).toDate()
        const nextDateTo = applyDateOnlyTimeZone(
            dayjs().startOf('day').add(1, 'day'),
            'Europe/Moscow',
        ).toDate()
        const state = store.getState()

        expect(onFiltersUpdate).toHaveBeenCalledTimes(2)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: nextDateFrom,
            dateTo: nextDateTo,
        }))
        expect(nextDateFrom).not.toEqual(firstDateFrom)
        expect(nextDateTo).not.toEqual(firstDateTo)
        expect(state.dateRangeSpec.dateFrom).toEqual(nextDateFrom)
        expect(state.dateRangeSpec.dateTo).toEqual(nextDateTo)
        expect(state.prevSearchCriteria).toEqual(expect.objectContaining({
            dateFrom: nextDateFrom,
            dateTo: nextDateTo,
        }))
        expect(state.appliedSearchCriteria).toEqual(expect.objectContaining({
            dateFrom: nextDateFrom,
            dateTo: nextDateTo,
        }))
        expect(state.hasUnappliedFilters).toBe(false)
    })

    it('resolves an explicitly declarative initial relative range before the first search', () => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))

        const onFiltersUpdate = jest.fn()
        store.setState(getSearchUIFiltersInitialState())
        store.getState().setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            criteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
            dateRangeSpec: {
                dateRangeSpecType: 'DAYS_BEFORE',
                dateFrom: null,
                dateTo: null,
                beforeCount: 30,
            },
        })

        expect(store.getState().dateRangeSpec).toMatchObject({
            dateRangeSpecType: 'DAYS_BEFORE',
            beforeCount: 30,
        })
        expect(store.getState().dateRangeSpec.dateFrom).toBeInstanceOf(Date)
        expect(store.getState().dateRangeSpec.dateTo).toBeInstanceOf(Date)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: store.getState().dateRangeSpec.dateFrom,
            dateTo: store.getState().dateRangeSpec.dateTo,
        }))
    })

    it('does not reinterpret DATE_INDEPENDENT service dates', () => {
        const onFiltersUpdate = jest.fn()
        const dateRangeSpec: DateRangeSpec = {
            dateRangeSpecType: 'DATE_INDEPENDENT',
            dateFrom: new Date('2020-01-01T00:00:00.000Z'),
            dateTo: new Date('2020-01-31T00:00:00.000Z'),
            beforeCount: 0,
        }

        store.setState(getSearchUIFiltersInitialState())
        store.getState().setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            config: {
                manualSearch: true,
            },
        })

        store.getState().updateConditions({dateRangeSpec}, {forceSearch: true})
        store.getState().triggerSearch()

        expect(store.getState().dateRangeSpec).toEqual(dateRangeSpec)
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

    describe('reset to the page defaults', () => {
        const merchantSelection = {
            entityType: LinkedEntityTypeEnum.MERCHANT,
            filterType: MultichoiceFilterTypeEnum.NONE,
            searchString: '',
            selectedItems: '7',
            selectedItemNames: 'Merchant 7',
            deselectedItems: '',
            deselectedItemNames: '',
        }
        const thisMonth: DateRangeSpec = {dateRangeSpecType: 'THIS_MONTH', dateFrom: null, dateTo: null, beforeCount: 1}
        const today: DateRangeSpec = {dateRangeSpecType: 'TODAY', dateFrom: null, dateTo: null, beforeCount: 1}
        const approvedStatuses = () => [createTransactionSessionStatus('A1'), createTransactionSessionStatus('A2')]
        const prefetchedStatuses = () => ({
            transactionSessionStatuses: new Map<TransactionSessionGroup, TransactionSessionStatus[]>([
                ['APPROVED', approvedStatuses()],
            ]),
        })

        const initialize = (
            predefinedCriteria: CriterionTypeEnum[],
            pageDefaults: Partial<SearchUIConditions> = {},
            state: Partial<SearchUIFiltersState> = {},
        ) => {
            store.getState().setInitialState({
                defaults: initialSearchUIDefaults,
                settingsContextName: 'ctx',
                possibleCriteria: [CriterionTypeEnum.PROJECT, CriterionTypeEnum.MERCHANT, CriterionTypeEnum.CURRENCY],
                predefinedCriteria,
                criteria: predefinedCriteria,
                exactSearchLabels: [ExactCriterionSearchLabelEnum.ALL, ExactCriterionSearchLabelEnum.NAME],
                exactSearchLabel: ExactCriterionSearchLabelEnum.ALL,
                pageDefaults,
                ...pageDefaults,
                onFiltersUpdate: () => undefined,
                ...state,
            })
        }

        describe.each([
            ['Default', async () => {
                store.getState().clearCriteria()
            }],
            ['deleting the active template', async () => {
                const template: SearchUITemplate = {
                    name: 'active',
                    searchConditions: {} as SearchUITemplate['searchConditions'],
                }
                store.setState({templates: [template], template, activeTemplateName: template.name})
                store.getState().removeTemplate(template)
                await flushPromises()
            }],
        ] as const)('via %s', (_name, reset) => {
            it('brings back the page conditions, the predefined selection and the first exact label', async () => {
                initialize([CriterionTypeEnum.MERCHANT, CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.EXACT], {
                    dateRangeSpec: thisMonth,
                    multigetCriteria: [merchantSelection],
                })
                store.getState().addCriterion(CriterionTypeEnum.PROJECT)
                store.getState().setDateRangeCriterion(today)
                store.getState().setExactCriterionSearchLabel(ExactCriterionSearchLabelEnum.NAME)
                store.getState().setMultigetCriterion({...merchantSelection, selectedItems: '8', selectedItemNames: 'Merchant 8'})

                await reset()

                const state = store.getState()
                expect(state.criteria).toEqual([CriterionTypeEnum.MERCHANT, CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.EXACT])
                expect(state.multigetCriteria).toEqual([merchantSelection])
                expect(state.dateRangeSpec).toEqual({
                    ...thisMonth,
                    dateFrom: dayjs().startOf('month').tz(SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE, true).toDate(),
                    dateTo: dayjs().endOf('month').add(1, 'day').startOf('day').tz(SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE, true).toDate(),
                })
                expect(state.exactSearchLabel).toBe(ExactCriterionSearchLabelEnum.ALL)
                expect(state.template).toBeNull()
                expect(state.activeTemplateName).toBeNull()
            })

            it('re-creates the entry of a predefined multiget criterion the page gave no selection for', async () => {
                initialize([CriterionTypeEnum.MERCHANT])
                store.getState().addCriterion(CriterionTypeEnum.PROJECT)
                store.getState().setMultigetCriterion(merchantSelection)

                await reset()

                expect(store.getState().criteria).toEqual([CriterionTypeEnum.MERCHANT])
                expect(store.getState().multigetCriteria).toEqual([expect.objectContaining({
                    entityType: LinkedEntityTypeEnum.MERCHANT,
                    selectedItems: '',
                })])
            })

            it('keeps the customer level dependencies out of the predefined criteria', async () => {
                initialize([CriterionTypeEnum.CUSTOMER_LEVEL])

                await reset()

                expect(store.getState().predefinedCriteria).toEqual([CriterionTypeEnum.CUSTOMER_LEVEL])
                expect(store.getState().criteria).toEqual([
                    CriterionTypeEnum.CUSTOMER_LEVEL,
                    CriterionTypeEnum.MERCHANT,
                    CriterionTypeEnum.CURRENCY,
                ])
            })

            it('fills the predefined transaction session statuses again', async () => {
                initialize([CriterionTypeEnum.TRANSACTION_SESSION_STATUS], {}, {prefetchedData: prefetchedStatuses()})
                expect(store.getState().transactionSessionStatuses).toEqual(approvedStatuses())
                store.getState().setTransactionSessionStatusesCriterion([
                    createTransactionSessionStatus('A1', false),
                    createTransactionSessionStatus('A2'),
                ])

                await reset()

                expect(store.getState().transactionSessionStatuses).toEqual(approvedStatuses())
            })
        })

        it('fills the statuses of the session status criterion added again after Default', () => {
            initialize([], {}, {
                possibleCriteria: [CriterionTypeEnum.TRANSACTION_SESSION_STATUS],
                prefetchedData: prefetchedStatuses(),
            })
            store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_SESSION_STATUS)
            expect(store.getState().transactionSessionStatuses).toEqual(approvedStatuses())

            store.getState().clearCriteria()
            store.getState().addCriterion(CriterionTypeEnum.TRANSACTION_SESSION_STATUS)

            expect(store.getState().transactionSessionStatuses).toEqual(approvedStatuses())
        })

        it('keeps the host array and the predefined criteria apart from the active criteria at initialization', () => {
            const predefinedCriteria = [CriterionTypeEnum.CUSTOMER_LEVEL]
            initialize(predefinedCriteria)

            expect(predefinedCriteria).toEqual([CriterionTypeEnum.CUSTOMER_LEVEL])
            expect(Object.isFrozen(predefinedCriteria)).toBe(false)
            expect(store.getState().predefinedCriteria).toEqual([CriterionTypeEnum.CUSTOMER_LEVEL])
            expect(store.getState().criteria).toEqual([
                CriterionTypeEnum.CUSTOMER_LEVEL,
                CriterionTypeEnum.MERCHANT,
                CriterionTypeEnum.CURRENCY,
            ])
        })
    })

    describe('the default TODAY range', () => {
        const expectedToday = () => ({
            dateRangeSpecType: 'TODAY',
            dateFrom: dayjs().startOf('day').tz(SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE, true).toDate(),
            dateTo: dayjs().startOf('day').add(1, 'day').tz(SEARCH_UI_NON_EXACT_DEFAULT_TIME_ZONE, true).toDate(),
        })

        it('is computed when asked for, not once at module load', () => {
            jest.useFakeTimers().setSystemTime(new Date('2030-01-15T12:00:00.000Z'))

            expect(getSearchUIInitialSearchCriteria(initialSearchUIDefaults).dateRangeSpec)
                .toEqual(expect.objectContaining(expectedToday()))
        })

        it('comes back as the current day after Default', () => {
            jest.useFakeTimers().setSystemTime(new Date('2030-01-15T12:00:00.000Z'))

            store.getState().clearCriteria()

            expect(store.getState().dateRangeSpec).toEqual(expect.objectContaining(expectedToday()))
        })

        it('takes the day in the browser zone, not in UTC', () => {
            // Jest cannot switch the zone; the mode of the value says which day it is taken in.
            jest.useFakeTimers().setSystemTime(new Date('2030-07-16T02:30:00.000Z'))

            const from = getSearchUIInitialDateFrom()
            expect(from.isUTC()).toBe(false)
            expect(from.format('YYYY-MM-DD HH:mm')).toBe(`${dayjs().format('YYYY-MM-DD')} 00:00`)
            expect(getSearchUIInitialDateTo().diff(from, 'day')).toBe(1)
        })

        it('is normalized by the configured date-only time zone at initialization', () => {
            store.getState().setInitialState({
                defaults: initialSearchUIDefaults,
                settingsContextName: 'ctx',
                possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
                predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
                criteria: [CriterionTypeEnum.DATE_RANGE],
                config: {dateRange: {dateOnlyTimeZone: 'local'}},
                onFiltersUpdate: () => undefined,
            })

            expect(store.getState().dateRangeSpec).toEqual(expect.objectContaining({
                dateRangeSpecType: 'TODAY',
                dateFrom: dayjs().startOf('day').toDate(),
                dateTo: dayjs().startOf('day').add(1, 'day').toDate(),
            }))
        })
    })
})

describe('setDefaults', () => {
    it('keeps the stored defaults when every member is the same and replaces them otherwise', () => {
        const store = createSearchUIFiltersStore()
        store.getState().setInitialState({defaults: initialSearchUIDefaults, onFiltersUpdate: jest.fn()})
        const stored = store.getState().defaults

        store.getState().setDefaults({...initialSearchUIDefaults})
        expect(store.getState().defaults).toBe(stored)

        const reorderSearchTemplates = jest.fn().mockResolvedValue(undefined)
        store.getState().setDefaults({...initialSearchUIDefaults, reorderSearchTemplates})
        expect(store.getState().defaults).not.toBe(stored)
        expect(store.getState().defaults.reorderSearchTemplates).toBe(reorderSearchTemplates)

        store.getState().setDefaults({...initialSearchUIDefaults})
        expect(store.getState().defaults.reorderSearchTemplates).toBeUndefined()
    })
})
