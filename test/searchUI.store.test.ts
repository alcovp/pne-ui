import { useSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import { CriterionTypeEnum, SearchUITemplate } from '../src/component/search-ui/filters/types'
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
})
