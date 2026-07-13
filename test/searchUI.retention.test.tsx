import * as React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUI } from '../src/component/search-ui/SearchUI'
import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import { SearchUIFiltersStoreProvider } from '../src/component/search-ui/filters/state/SearchUIFiltersStoreProvider'
import {
    useSearchUIFiltersStore,
    useSearchUIFiltersStoreContext,
} from '../src/component/search-ui/filters/state/store'
import {
    getRetainedSearchUIState,
    resetSearchUIRetentionForTests,
} from '../src/component/search-ui/filters/state/retention'
import { CriterionTypeEnum, SearchCriteria } from '../src/component/search-ui/filters/types'
import { initialSearchUIDefaults, SearchUIDefaultsContext } from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock('../src/component/table/PneTablePagination', () => ({
    __esModule: true,
    default: () => null,
}))

type RetentionHarnessProps = {
    settingsContextName: string
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
    manualSearch?: boolean
}

const RetentionHarness = (props: RetentionHarnessProps): React.ReactElement => (
    <SearchUIFiltersStoreProvider
        key={props.settingsContextName}
        settingsContextName={props.settingsContextName}
    >
        <RetentionHarnessContent {...props}/>
    </SearchUIFiltersStoreProvider>
)

const RetentionHarnessContent = ({
    settingsContextName,
    onFiltersUpdate,
    manualSearch = false,
}: RetentionHarnessProps): React.ReactElement => {
    const { store, instanceId } = useSearchUIFiltersStoreContext()
    const initialized = useSearchUIFiltersStore(state => state.initialized)
    const restoredFromRetention = useSearchUIFiltersStore(state => state.restoredFromRetention)
    const status = useSearchUIFiltersStore(state => state.status)
    const appliedStatus = useSearchUIFiltersStore(state => state.appliedSearchCriteria?.status ?? null)
    const hasUnappliedFilters = useSearchUIFiltersStore(state => state.hasUnappliedFilters)
    const setStatusCriterion = useSearchUIFiltersStore(state => state.setStatusCriterion)
    const triggerSearch = useSearchUIFiltersStore(state => state.triggerSearch)

    React.useEffect(() => {
        store.getState().setInitialState({
            defaults: initialSearchUIDefaults,
            settingsContextName,
            possibleCriteria: [CriterionTypeEnum.STATUS],
            predefinedCriteria: [CriterionTypeEnum.STATUS],
            exactSearchLabels: [],
            config: { manualSearch },
            onFiltersUpdate,
        }, getRetainedSearchUIState(settingsContextName, instanceId))
    }, [instanceId, manualSearch, onFiltersUpdate, settingsContextName, store])

    return <>
        <output data-testid="context">{settingsContextName}</output>
        <output data-testid="initialized">{String(initialized)}</output>
        <output data-testid="restored">{String(restoredFromRetention)}</output>
        <output data-testid="draft-status">{status}</output>
        <output data-testid="applied-status">{appliedStatus ?? 'null'}</output>
        <output data-testid="dirty">{String(hasUnappliedFilters)}</output>
        <button type="button" onClick={() => setStatusCriterion('ENABLED')}>Set enabled</button>
        <button type="button" onClick={triggerSearch}>Search</button>
    </>
}

describe('SearchUI automatic in-memory state retention', () => {
    beforeEach(() => {
        resetSearchUIRetentionForTests()
    })

    afterEach(() => {
        cleanup()
        resetSearchUIRetentionForTests()
    })

    it('isolates a new context and restores the previous context after A -> B -> A navigation', async () => {
        const onFiltersUpdateA = jest.fn()
        const onFiltersUpdateB = jest.fn()
        const view = render(
            <RetentionHarness
                settingsContextName="retention-context-a"
                onFiltersUpdate={onFiltersUpdateA}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('initialized').textContent).toBe('true')
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set enabled' }))
        expect(screen.getByTestId('draft-status').textContent).toBe('ENABLED')

        view.rerender(
            <RetentionHarness
                settingsContextName="retention-context-b"
                onFiltersUpdate={onFiltersUpdateB}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('context').textContent).toBe('retention-context-b')
            expect(screen.getByTestId('initialized').textContent).toBe('true')
        })
        expect(screen.getByTestId('draft-status').textContent).toBe('ANY')
        expect(screen.getByTestId('restored').textContent).toBe('false')

        view.rerender(
            <RetentionHarness
                settingsContextName="retention-context-a"
                onFiltersUpdate={onFiltersUpdateA}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('context').textContent).toBe('retention-context-a')
            expect(screen.getByTestId('restored').textContent).toBe('true')
        })
        expect(screen.getByTestId('draft-status').textContent).toBe('ENABLED')
        expect(onFiltersUpdateA).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
    })

    it('restores state when the same context is replaced in one React commit', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const restoredOnFiltersUpdate = jest.fn()
        const view = render(
            <RetentionHarness
                key="first-instance"
                settingsContextName="same-commit-context"
                onFiltersUpdate={firstOnFiltersUpdate}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('initialized').textContent).toBe('true')
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set enabled' }))

        view.rerender(
            <RetentionHarness
                key="replacement-instance"
                settingsContextName="same-commit-context"
                onFiltersUpdate={restoredOnFiltersUpdate}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('restored').textContent).toBe('true')
            expect(restoredOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        })
        expect(screen.getByTestId('draft-status').textContent).toBe('ENABLED')
    })

    it('keeps simultaneously mounted SearchUI stores isolated', async () => {
        render(<>
            <section data-testid="instance-a">
                <RetentionHarness
                    settingsContextName="concurrent-context-a"
                    onFiltersUpdate={jest.fn()}
                />
            </section>
            <section data-testid="instance-b">
                <RetentionHarness
                    settingsContextName="concurrent-context-b"
                    onFiltersUpdate={jest.fn()}
                />
            </section>
        </>)

        const instanceA = within(screen.getByTestId('instance-a'))
        const instanceB = within(screen.getByTestId('instance-b'))

        await waitFor(() => {
            expect(instanceA.getByTestId('initialized').textContent).toBe('true')
            expect(instanceB.getByTestId('initialized').textContent).toBe('true')
        })

        fireEvent.click(instanceA.getByRole('button', { name: 'Set enabled' }))

        expect(instanceA.getByTestId('draft-status').textContent).toBe('ENABLED')
        expect(instanceB.getByTestId('draft-status').textContent).toBe('ANY')
    })

    it('does not hydrate a second active instance that uses the same context key', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        try {
            const onFiltersUpdateA = jest.fn()
            const onFiltersUpdateB = jest.fn()
            const view = render(
                <div>
                    <section data-testid="duplicate-instance-a">
                        <RetentionHarness
                            settingsContextName="duplicate-context"
                            onFiltersUpdate={onFiltersUpdateA}
                        />
                    </section>
                </div>,
            )
            const instanceA = within(screen.getByTestId('duplicate-instance-a'))

            await waitFor(() => {
                expect(instanceA.getByTestId('initialized').textContent).toBe('true')
            })
            fireEvent.click(instanceA.getByRole('button', { name: 'Set enabled' }))

            view.rerender(
                <div>
                    <section data-testid="duplicate-instance-a">
                        <RetentionHarness
                            settingsContextName="duplicate-context"
                            onFiltersUpdate={onFiltersUpdateA}
                        />
                    </section>
                    <section data-testid="duplicate-instance-b">
                        <RetentionHarness
                            settingsContextName="duplicate-context"
                            onFiltersUpdate={onFiltersUpdateB}
                        />
                    </section>
                </div>,
            )

            const instanceB = within(screen.getByTestId('duplicate-instance-b'))
            await waitFor(() => {
                expect(instanceB.getByTestId('initialized').textContent).toBe('true')
            })

            expect(instanceA.getByTestId('draft-status').textContent).toBe('ENABLED')
            expect(instanceB.getByTestId('draft-status').textContent).toBe('ANY')
            expect(consoleWarnSpy).toHaveBeenCalled()
        } finally {
            consoleWarnSpy.mockRestore()
        }
    })

    it('does not hydrate either duplicate when same-key instances mount together', async () => {
        const seedView = render(
            <RetentionHarness
                settingsContextName="simultaneous-duplicate-context"
                onFiltersUpdate={jest.fn()}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('initialized').textContent).toBe('true')
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set enabled' }))
        seedView.unmount()

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        try {
            render(<>
                <section data-testid="simultaneous-duplicate-a">
                    <RetentionHarness
                        settingsContextName="simultaneous-duplicate-context"
                        onFiltersUpdate={jest.fn()}
                    />
                </section>
                <section data-testid="simultaneous-duplicate-b">
                    <RetentionHarness
                        settingsContextName="simultaneous-duplicate-context"
                        onFiltersUpdate={jest.fn()}
                    />
                </section>
            </>)

            const instanceA = within(screen.getByTestId('simultaneous-duplicate-a'))
            const instanceB = within(screen.getByTestId('simultaneous-duplicate-b'))
            await waitFor(() => {
                expect(instanceA.getByTestId('initialized').textContent).toBe('true')
                expect(instanceB.getByTestId('initialized').textContent).toBe('true')
            })

            expect(instanceA.getByTestId('restored').textContent).toBe('false')
            expect(instanceB.getByTestId('restored').textContent).toBe('false')
            expect(instanceA.getByTestId('draft-status').textContent).toBe('ANY')
            expect(instanceB.getByTestId('draft-status').textContent).toBe('ANY')
            expect(consoleWarnSpy).toHaveBeenCalled()
        } finally {
            consoleWarnSpy.mockRestore()
        }
    })

    it('restores a manual-search draft without treating it as the applied criteria', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const firstView = render(
            <RetentionHarness
                settingsContextName="manual-retention-context"
                manualSearch
                onFiltersUpdate={firstOnFiltersUpdate}
            />,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: null }))
        })
        firstOnFiltersUpdate.mockClear()

        fireEvent.click(screen.getByRole('button', { name: 'Set enabled' }))

        expect(screen.getByTestId('draft-status').textContent).toBe('ENABLED')
        expect(screen.getByTestId('applied-status').textContent).toBe('null')
        expect(screen.getByTestId('dirty').textContent).toBe('true')
        expect(firstOnFiltersUpdate).not.toHaveBeenCalled()

        firstView.unmount()

        const restoredOnFiltersUpdate = jest.fn()
        render(
            <RetentionHarness
                settingsContextName="manual-retention-context"
                manualSearch
                onFiltersUpdate={restoredOnFiltersUpdate}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('restored').textContent).toBe('true')
            expect(restoredOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: null }))
        })
        expect(screen.getByTestId('draft-status').textContent).toBe('ENABLED')
        expect(screen.getByTestId('applied-status').textContent).toBe('null')
        expect(screen.getByTestId('dirty').textContent).toBe('true')
        expect(restoredOnFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'E' }))

        fireEvent.click(screen.getByRole('button', { name: 'Search' }))

        expect(restoredOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        expect(screen.getByTestId('applied-status').textContent).toBe('E')
        expect(screen.getByTestId('dirty').textContent).toBe('false')
    })

    it('retains filters when an empty external searchConditions object is present', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const firstView = render(
            <SearchUIFilters
                settingsContextName="empty-external-conditions"
                possibleCriteria={[CriterionTypeEnum.STATUS]}
                predefinedCriteria={[CriterionTypeEnum.STATUS]}
                searchConditions={{}}
                onFiltersUpdate={firstOnFiltersUpdate}
                config={{
                    hideShowFiltersButton: true,
                    hideTemplatesSelect: true,
                }}
            />,
        )

        fireEvent.click(await screen.findByText('ENABLED'))
        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        })
        firstView.unmount()

        const restoredOnFiltersUpdate = jest.fn()
        render(
            <SearchUIFilters
                settingsContextName="empty-external-conditions"
                possibleCriteria={[CriterionTypeEnum.STATUS]}
                predefinedCriteria={[CriterionTypeEnum.STATUS]}
                searchConditions={{}}
                onFiltersUpdate={restoredOnFiltersUpdate}
                config={{
                    hideShowFiltersButton: true,
                    hideTemplatesSelect: true,
                }}
            />,
        )

        await waitFor(() => {
            expect(restoredOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        })
    })

    it('refetches SearchUI table data with the restored applied criteria', async () => {
        const firstSearchData = jest.fn().mockResolvedValue([])
        const createTableHeader = () => <tr><th>Result</th></tr>
        const createTableRow = () => <tr><td>Result</td></tr>
        const firstView = render(
            <SearchUI
                settingsContextName="search-ui-table-retention"
                possibleCriteria={[CriterionTypeEnum.STATUS]}
                predefinedCriteria={[CriterionTypeEnum.STATUS]}
                searchData={firstSearchData}
                createTableHeader={createTableHeader}
                createTableRow={createTableRow}
                config={{
                    hideShowFiltersButton: true,
                    hideTemplatesSelect: true,
                }}
            />,
        )

        await waitFor(() => {
            expect(firstSearchData).toHaveBeenCalledWith(expect.objectContaining({ status: null }))
        })
        fireEvent.click(screen.getByText('ENABLED'))
        await waitFor(() => {
            expect(firstSearchData).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'E' }))
        })
        firstView.unmount()

        const restoredSearchData = jest.fn().mockResolvedValue([])
        render(
            <SearchUI
                settingsContextName="search-ui-table-retention"
                possibleCriteria={[CriterionTypeEnum.STATUS]}
                predefinedCriteria={[CriterionTypeEnum.STATUS]}
                searchData={restoredSearchData}
                createTableHeader={createTableHeader}
                createTableRow={createTableRow}
                config={{
                    hideShowFiltersButton: true,
                    hideTemplatesSelect: true,
                }}
            />,
        )

        await waitFor(() => {
            expect(restoredSearchData).toHaveBeenCalledWith(expect.objectContaining({ status: 'E' }))
        })
    })

    it('initializes filters and loads templates once in StrictMode', async () => {
        const getSearchTemplates = jest.fn().mockResolvedValue([])
        const onFiltersUpdate = jest.fn()

        render(
            <React.StrictMode>
                <SearchUIDefaultsContext.Provider
                    value={{
                        ...initialSearchUIDefaults,
                        getSearchTemplates,
                    }}
                >
                    <SearchUIFilters
                        settingsContextName="strict-mode-context"
                        possibleCriteria={[]}
                        onFiltersUpdate={onFiltersUpdate}
                        config={{
                            hideShowFiltersButton: true,
                            hideTemplatesSelect: true,
                        }}
                    />
                </SearchUIDefaultsContext.Provider>
            </React.StrictMode>,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(getSearchTemplates).toHaveBeenCalledTimes(1)
        })
    })
})
