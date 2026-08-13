import * as React from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUI } from '../src/component/search-ui/SearchUI'
import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    SearchCriteria,
    SearchUITemplate,
} from '../src/component/search-ui/filters/types'
import { getSearchUIInitialSearchCriteria } from '../src/component/search-ui/filters/state/initial'
import { resetSearchUIRetentionForTests } from '../src/component/search-ui/filters/state/retention'
import {
    initialSearchUIDefaults,
    SearchUIDefaultsContext,
} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}))

jest.mock('../src/component/table/PneTablePagination', () => ({
    __esModule: true,
    default: () => null,
}))

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason: unknown) => void
}

const createDeferred = <T,>(): Deferred<T> => {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve
        reject = innerReject
    })

    return {promise, resolve, reject}
}

const storedTemplate: SearchUITemplate = {
    name: 'stored',
    searchConditions: {
        ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        criteria: [CriterionTypeEnum.STATUS],
        status: 'DISABLED',
    },
}

type RenderFiltersOptions = {
    contextName?: string
    deferred: Deferred<SearchUITemplate[]>
    onFiltersUpdate?: (criteria: SearchCriteria) => void
    manualSearch?: boolean
    searchConditions?: React.ComponentProps<typeof SearchUIFilters>['searchConditions']
    strictMode?: boolean
}

const renderFilters = ({
    contextName = 'template-bootstrap',
    deferred,
    onFiltersUpdate = jest.fn(),
    manualSearch = false,
    searchConditions,
    strictMode = false,
}: RenderFiltersOptions) => {
    const getSearchTemplates = jest.fn(() => deferred.promise)
    const filters = <SearchUIDefaultsContext.Provider
        value={{
            ...initialSearchUIDefaults,
            getSearchTemplates,
        }}
    >
        <SearchUIFilters
            settingsContextName={contextName}
            possibleCriteria={[CriterionTypeEnum.STATUS]}
            predefinedCriteria={[CriterionTypeEnum.STATUS]}
            searchConditions={searchConditions}
            onFiltersUpdate={onFiltersUpdate}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                manualSearch,
            }}
        />
    </SearchUIDefaultsContext.Provider>

    return {
        getSearchTemplates,
        view: render(strictMode ? <React.StrictMode>{filters}</React.StrictMode> : filters),
    }
}

describe('SearchUI template bootstrap', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        resetSearchUIRetentionForTests()
    })

    afterEach(() => {
        cleanup()
        resetSearchUIRetentionForTests()
        jest.restoreAllMocks()
    })

    it('calls high-level SearchUI searchData once with the saved template', async () => {
        const contextName = 'template-bootstrap-search-ui'
        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const getSearchTemplates = jest.fn(() => deferred.promise)
        const searchData = jest.fn().mockResolvedValue([])

        render(
            <SearchUIDefaultsContext.Provider
                value={{...initialSearchUIDefaults, getSearchTemplates}}
            >
                <SearchUI
                    settingsContextName={contextName}
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    searchData={searchData}
                    createTableHeader={() => <tr><th>Result</th></tr>}
                    createTableRow={() => <tr><td>Result</td></tr>}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        await waitFor(() => expect(getSearchTemplates).toHaveBeenCalledTimes(1))
        expect(searchData).not.toHaveBeenCalled()

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        await waitFor(() => {
            expect(searchData).toHaveBeenCalledTimes(1)
            expect(searchData).toHaveBeenLastCalledWith(expect.objectContaining({status: 'D'}))
        })
        expect(searchData).not.toHaveBeenCalledWith(expect.objectContaining({status: null}))
    })

    it('publishes defaults immediately when no last template is saved', async () => {
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        const {getSearchTemplates} = renderFilters({deferred, onFiltersUpdate})

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: null}))
            expect(getSearchTemplates).toHaveBeenCalledTimes(1)
        })

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
    })

    it('falls back once to defaults and removes a stale saved template name', async () => {
        const contextName = 'template-bootstrap-stale'
        localStorage.setItem(`last_template_name${contextName}`, 'missing')
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        renderFilters({contextName, deferred, onFiltersUpdate})

        await waitFor(() => expect(onFiltersUpdate).not.toHaveBeenCalled())

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: null}))
        })
        expect(localStorage.getItem(`last_template_name${contextName}`)).toBeNull()
    })

    it('falls back once to defaults when loading the saved template fails', async () => {
        const contextName = 'template-bootstrap-reject'
        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        const error = new Error('templates unavailable')
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        renderFilters({contextName, deferred, onFiltersUpdate})

        await waitFor(() => expect(onFiltersUpdate).not.toHaveBeenCalled())

        await act(async () => {
            deferred.reject(error)
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: null}))
        })
        expect(consoleError).toHaveBeenCalledWith(error)
        expect(localStorage.getItem(`last_template_name${contextName}`)).toBe(storedTemplate.name)
    })

    it('publishes initial external conditions once and never auto-applies the saved template', async () => {
        const contextName = 'template-bootstrap-external'
        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        renderFilters({
            contextName,
            deferred,
            onFiltersUpdate,
            searchConditions: {
                criteria: [CriterionTypeEnum.STATUS, CriterionTypeEnum.MERCHANT],
                status: 'ENABLED',
                multigetCriteria: [{
                    entityType: LinkedEntityTypeEnum.MERCHANT,
                    filterType: MultichoiceFilterTypeEnum.SEARCH,
                    searchString: '',
                    selectedItems: '777',
                    selectedItemNames: 'Merchant',
                    deselectedItems: '',
                    deselectedItemNames: '',
                }],
            },
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                multigetCriteria: [],
                status: 'E',
            }))
        })

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
        expect(onFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({status: 'D'}))
    })

    it('publishes an initial external relative range only once', async () => {
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        renderFilters({
            contextName: 'template-bootstrap-external-relative-range',
            deferred,
            onFiltersUpdate,
            searchConditions: {
                criteria: [CriterionTypeEnum.DATE_RANGE_ORDERS],
                dateRangeSpec: {
                    dateRangeSpecType: 'HOURS_BEFORE',
                    beforeCount: 6,
                },
            },
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: expect.any(Date),
                dateTo: expect.any(Date),
            }))
        })

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
    })

    it('publishes the saved template once in manual search mode', async () => {
        const contextName = 'template-bootstrap-manual'
        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        renderFilters({contextName, deferred, onFiltersUpdate, manualSearch: true})

        expect(onFiltersUpdate).not.toHaveBeenCalled()

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: 'D'}))
        })
    })

    it('restores compatible retained criteria immediately without waiting for templates', async () => {
        const contextName = 'template-bootstrap-retention'
        const firstOnFiltersUpdate = jest.fn()
        const firstView = render(
            <SearchUIDefaultsContext.Provider
                value={{
                    ...initialSearchUIDefaults,
                    getSearchTemplates: jest.fn().mockResolvedValue([]),
                }}
            >
                <SearchUIFilters
                    settingsContextName={contextName}
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    initialSearchConditions={{status: 'ENABLED'}}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: 'E'}))
        })
        firstView.unmount()

        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const restoredOnFiltersUpdate = jest.fn()
        const {getSearchTemplates} = renderFilters({
            contextName,
            deferred,
            onFiltersUpdate: restoredOnFiltersUpdate,
        })

        await waitFor(() => {
            expect(restoredOnFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(restoredOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: 'E'}))
            expect(getSearchTemplates).toHaveBeenCalledTimes(1)
        })

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        expect(restoredOnFiltersUpdate).toHaveBeenCalledTimes(1)
        expect(restoredOnFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({status: 'D'}))
    })

    it('loads and applies the saved template once in StrictMode', async () => {
        const contextName = 'template-bootstrap-strict'
        localStorage.setItem(`last_template_name${contextName}`, storedTemplate.name)
        const deferred = createDeferred<SearchUITemplate[]>()
        const onFiltersUpdate = jest.fn()
        const {getSearchTemplates} = renderFilters({
            contextName,
            deferred,
            onFiltersUpdate,
            strictMode: true,
        })

        await waitFor(() => expect(getSearchTemplates).toHaveBeenCalledTimes(1))
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        await act(async () => {
            deferred.resolve([storedTemplate])
            await deferred.promise
        })

        await waitFor(() => {
            expect(getSearchTemplates).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({status: 'D'}))
        })
    })
})
