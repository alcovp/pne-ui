import { useSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    SearchUITemplate,
    TransactionSessionStatus,
    TransactionSessionStatuses,
} from '../src/component/search-ui/filters/types'
import {
    createClearCriteriaUndoSnapshot,
} from '../src/component/search-ui/filters/state/undo'
import {
    getSearchUIFiltersInitialState,
    getSearchUIInitialSearchCriteria,
} from '../src/component/search-ui/filters/state/initial'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('SearchUIFilters Zustand store', () => {
    const createTransactionSessionStatus = (displayName: string, selected = true): TransactionSessionStatus => ({
        displayName,
        selected,
    })

    beforeEach(() => {
        localStorage.clear()
        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        useSearchUIFiltersStore.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate: () => {
            },
        })
    })

    it('adds criterion', () => {
        const { addCriterion } = useSearchUIFiltersStore.getState()
        addCriterion(CriterionTypeEnum.CURRENCY)
        const state = useSearchUIFiltersStore.getState()
        expect(state.criteria).toContain(CriterionTypeEnum.CURRENCY)
        expect(state.justAddedCriterion).toBe(CriterionTypeEnum.CURRENCY)
    })

    it('removes criterion', () => {
        useSearchUIFiltersStore.setState({ criteria: [CriterionTypeEnum.CURRENCY, CriterionTypeEnum.STATUS] })
        const { removeCriterion } = useSearchUIFiltersStore.getState()
        removeCriterion(CriterionTypeEnum.CURRENCY)
        const state = useSearchUIFiltersStore.getState()
        expect(state.criteria).toEqual([CriterionTypeEnum.STATUS])
    })

    it('saves template', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        const defaults = { ...initialSearchUIDefaults, saveSearchTemplate }
        const initial = getSearchUIFiltersInitialState()
        useSearchUIFiltersStore.setState(initial)
        useSearchUIFiltersStore.setState({
            defaults,
            settingsContextName: 'ctx',
            criteria: [CriterionTypeEnum.STATUS],
            onFiltersUpdate: () => {
            },
        })

        const { createTemplate } = useSearchUIFiltersStore.getState()
        createTemplate('tmpl')
        await flushPromises()
        await flushPromises()
        expect(saveSearchTemplate).toHaveBeenCalled()
        const state = useSearchUIFiltersStore.getState()
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
        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        useSearchUIFiltersStore.setState({
            defaults,
            settingsContextName: 'ctx',
            onFiltersUpdate: () => {
            },
        })

        const { loadTemplates } = useSearchUIFiltersStore.getState()
        loadTemplates()
        await flushPromises()
        await flushPromises()
        const state = useSearchUIFiltersStore.getState()
        expect(state.templates).toEqual([template])
        expect(getSearchTemplates).toHaveBeenCalledWith('ctx')
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

        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = useSearchUIFiltersStore.getState()
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

        const { loadTemplates } = useSearchUIFiltersStore.getState()
        loadTemplates()
        await flushPromises()
        await flushPromises()

        const state = useSearchUIFiltersStore.getState()
        expect(getSearchTemplates).toHaveBeenCalledWith('ctx')
        expect(state.template?.name).toBe('stored')
        expect(state.hasUnappliedFilters).toBe(false)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            status: 'E',
        }))
    })

    it('applies external searchConditions without breaking possible criteria', () => {
        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        const onFiltersUpdate = jest.fn()
        const visaCard = { id: 1, displayName: 'VISA' }
        useSearchUIFiltersStore.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.STATUS, CriterionTypeEnum.PROJECT, CriterionTypeEnum.CARD_TYPES],
            predefinedCriteria: [CriterionTypeEnum.STATUS],
            criteria: [CriterionTypeEnum.STATUS],
            multigetCriteria: [],
        })

        const { updateConditions, setCardTypesCriterion } = useSearchUIFiltersStore.getState()
        updateConditions({
            criteria: [CriterionTypeEnum.MERCHANT, CriterionTypeEnum.PROJECT, CriterionTypeEnum.CARD_TYPES],
            cardTypes: { all: false, entities: [visaCard] },
        })

        const state = useSearchUIFiltersStore.getState()
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
        const afterRemoval = useSearchUIFiltersStore.getState()
        expect(afterRemoval.cardTypes).toEqual({ all: true, entities: [] })
    })

    it('applies external searchConditions immediately in manual search mode and clears the active template', () => {
        const onFiltersUpdate = jest.fn()
        const visaCard = { id: 1, displayName: 'VISA' }
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }

        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        const { setInitialState } = useSearchUIFiltersStore.getState()
        setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            possibleCriteria: [CriterionTypeEnum.CARD_TYPES],
            config: {
                manualSearch: true,
            },
        })
        useSearchUIFiltersStore.setState({ template })
        onFiltersUpdate.mockClear()

        const { updateConditions } = useSearchUIFiltersStore.getState()
        updateConditions({
            criteria: [CriterionTypeEnum.CARD_TYPES],
            cardTypes: { all: false, entities: [visaCard] },
        }, {
            forceSearch: true,
            resetTemplate: true,
        })

        const state = useSearchUIFiltersStore.getState()
        expect(state.template).toBeNull()
        expect(state.hasUnappliedFilters).toBe(false)
        expect(state.cardTypes).toEqual({ all: false, entities: [visaCard] })
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            cardTypes: [visaCard.id],
        }))
    })

    it('restores a clear-all snapshot and re-runs search when filters were previously applied', () => {
        const onFiltersUpdate = jest.fn()
        const template: SearchUITemplate = {
            name: 'stored',
            searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        }

        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        useSearchUIFiltersStore.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            onFiltersUpdate,
            criteria: [CriterionTypeEnum.STATUS],
            status: 'ENABLED',
            template,
            hasUnappliedFilters: false,
        })
        localStorage.setItem('last_template_namectx', 'stored')

        const snapshot = createClearCriteriaUndoSnapshot(useSearchUIFiltersStore.getState())
        const { clearCriteria, restoreClearCriteriaSnapshot } = useSearchUIFiltersStore.getState()

        clearCriteria()
        onFiltersUpdate.mockClear()
        restoreClearCriteriaSnapshot(snapshot)

        const state = useSearchUIFiltersStore.getState()
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

        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        useSearchUIFiltersStore.setState({
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

        const snapshot = createClearCriteriaUndoSnapshot(useSearchUIFiltersStore.getState())
        const { clearCriteria, restoreClearCriteriaSnapshot } = useSearchUIFiltersStore.getState()

        clearCriteria()
        onFiltersUpdate.mockClear()
        restoreClearCriteriaSnapshot(snapshot)

        const state = useSearchUIFiltersStore.getState()
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

        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
        useSearchUIFiltersStore.setState({
            defaults: {
                ...initialSearchUIDefaults,
                getTransactionSessionStatuses,
            },
            settingsContextName: 'ctx',
            onFiltersUpdate,
        })

        const { addCriterion } = useSearchUIFiltersStore.getState()
        addCriterion(CriterionTypeEnum.TRANSACTION_SESSION_STATUS)
        await flushPromises()
        await flushPromises()

        const state = useSearchUIFiltersStore.getState()
        expect(getTransactionSessionStatuses).toHaveBeenCalled()
        expect(state.prefetchedData.transactionSessionStatuses).toBeInstanceOf(Map)
        expect(state.prefetchedData.transactionSessionStatuses?.get('APPROVED')).toEqual(transactionSessionStatuses.APPROVED)
        expect(state.transactionSessionStatuses).toEqual(transactionSessionStatuses.APPROVED)
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionSessionStatuses: 'AUTHORIZED,CHARGED',
        }))
    })
})
