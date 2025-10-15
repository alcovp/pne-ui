import { useSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import { CriterionTypeEnum, LinkedEntityTypeEnum, SearchUITemplate } from '../src/component/search-ui/filters/types'
import {
    getSearchUIFiltersInitialState,
    getSearchUIInitialSearchCriteria,
} from '../src/component/search-ui/filters/state/initial'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('SearchUIFilters Zustand store', () => {
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
        const state = useSearchUIFiltersStore.getState()
        expect(state.templates).toEqual([template])
        expect(getSearchTemplates).toHaveBeenCalledWith('ctx')
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
})
