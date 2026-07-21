import React from 'react'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {
    PneButton,
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
    PneTableSelectionCell,
    PneTableSelectionControls,
    PneTableSelectionHeaderCell,
    PneTableSortLabel,
    SearchUI,
    type SearchParams,
    type SearchUITableSelectionConfig,
    type SearchUIView,
    type TableSelectionChangeDetails,
    type TableSelectionModel,
} from '../src'
import {CriterionTypeEnum} from '../src/component/search-ui/filters/types'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type Row = {
    id: number
    label: string
}

type ViewId = 'summary' | 'operations'

const rows: Row[] = [
    {id: 1, label: 'Gate 1'},
    {id: 2, label: 'Gate 2'},
]

type SelectionHarnessProps = {
    instanceId?: string
    manualSearch?: boolean
    onSelectionChange?: (
        selection: TableSelectionModel<number>,
        details: TableSelectionChangeDetails,
    ) => void
    searchData: (params: SearchParams) => Promise<Row[]>
}

const SelectionHarness = ({
    instanceId = 'gates',
    manualSearch = false,
    onSelectionChange,
    searchData,
}: SelectionHarnessProps) => {
    const [selection, setSelection] = React.useState<TableSelectionModel<number>>({
        mode: 'explicit',
        selectedIds: new Set(),
    })
    const tableSelection: SearchUITableSelectionConfig<Row, number> = {
        getRowId: row => row.id,
        onSelectionChange: (nextSelection, details) => {
            setSelection(nextSelection)
            onSelectionChange?.(nextSelection, details)
        },
        renderControls: ({selection: controller}) => (
            <PneTableSelectionControls
                actions={<>
                    <PneButton onClick={() => controller.selectAllMatching(rows.length)}>
                        Select all results
                    </PneButton>
                    <PneButton onClick={controller.clear}>Clear selection</PneButton>
                </>}
                summary={`${controller.selectedCount} selected (${controller.selection.mode})`}
            />
        ),
        renderFeedback: ({selection: controller}) => (
            <div data-testid={`${instanceId}-selection-feedback`}>
                {controller.selectedCount} selected feedback
            </div>
        ),
        selection,
        toolbarAriaLabel: 'Gate table controls',
    }

    return <SearchUI<Row, string, number>
        autoTestId={instanceId}
        config={{
            hideShowFiltersButton: true,
            hideTemplatesSelect: true,
            manualSearch,
        }}
        createTableHeader={({sortOptions}, {selection: controller} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!controller || controller.interactionDisabled}
                onChange={checked => controller?.setPageSelected(checked)}
                state={controller?.pageState ?? 'none'}
            />
            <PneHeaderTableCell sortIndex={1} sortOptions={sortOptions}>
                <PneTableSortLabel sortIndex={1} sortOptions={sortOptions}>Name</PneTableSortLabel>
            </PneHeaderTableCell>
        </PneTableRow>}
        createTableRow={(row, _index, _data, _setData, {selection: controller} = {
            appliedSearchCriteria: null,
        }) => (
            <PneTableRow
                aria-selected={controller?.isRowSelected(row) ?? false}
                key={row.id}
                selected={controller?.isRowSelected(row) ?? false}
            >
                <PneTableSelectionCell
                    aria-label={`Select ${row.label}`}
                    checked={controller?.isRowSelected(row) ?? false}
                    disabled={!controller || controller.interactionDisabled}
                    onChange={checked => controller?.setRowSelected(row, checked)}
                />
                <PneTableCell>{row.label}</PneTableCell>
            </PneTableRow>
        )}
        possibleCriteria={manualSearch ? [CriterionTypeEnum.STATUS] : []}
        predefinedCriteria={manualSearch ? [CriterionTypeEnum.STATUS] : []}
        searchData={searchData}
        settingsContextName={`${instanceId}-selection-test`}
        tableSelection={tableSelection}
    />
}

const createViews = (
    searchData: (params: SearchParams) => Promise<Row[]>,
): readonly SearchUIView<Row, ViewId, number>[] => [
    {
        id: 'summary',
        label: 'Summary',
        searchData,
        createTableHeader: (_params, {selection} = {appliedSearchCriteria: null}) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setPageSelected(checked)}
                state={selection?.pageState ?? 'none'}
            />
            <PneHeaderTableCell>Summary</PneHeaderTableCell>
        </PneTableRow>,
        createTableRow: (row, _index, _data, _setData, {selection} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow
            aria-selected={selection?.isRowSelected(row) ?? false}
            key={row.id}
            selected={selection?.isRowSelected(row) ?? false}
        >
            <PneTableSelectionCell
                aria-label={`Select ${row.label}`}
                checked={selection?.isRowSelected(row) ?? false}
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setRowSelected(row, checked)}
            />
            <PneTableCell>{row.label}</PneTableCell>
        </PneTableRow>,
    },
    {
        id: 'operations',
        label: 'Operations',
        searchData,
        createTableHeader: (_params, {selection} = {appliedSearchCriteria: null}) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setPageSelected(checked)}
                state={selection?.pageState ?? 'none'}
            />
            <PneHeaderTableCell>Operations</PneHeaderTableCell>
        </PneTableRow>,
        createTableRow: (row, _index, _data, _setData, {selection} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow
            aria-selected={selection?.isRowSelected(row) ?? false}
            key={row.id}
            selected={selection?.isRowSelected(row) ?? false}
        >
            <PneTableSelectionCell
                aria-label={`Select ${row.label}`}
                checked={selection?.isRowSelected(row) ?? false}
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setRowSelected(row, checked)}
            />
            <PneTableCell>{row.label}</PneTableCell>
        </PneTableRow>,
    },
]

const ViewsSelectionHarness = ({
    onSelectionChange,
    preserveAcrossViews,
    searchData,
}: {
    onSelectionChange: (
        selection: TableSelectionModel<number>,
        details: TableSelectionChangeDetails,
    ) => void
    preserveAcrossViews: boolean
    searchData: (params: SearchParams) => Promise<Row[]>
}) => {
    const [view, setView] = React.useState<ViewId>('summary')
    const [selection, setSelection] = React.useState<TableSelectionModel<number>>({
        mode: 'explicit',
        selectedIds: new Set(),
    })

    return <SearchUI<Row, ViewId, number>
        autoTestId='view-gates'
        config={{hideShowFiltersButton: true, hideTemplatesSelect: true}}
        possibleCriteria={[]}
        settingsContextName={`view-gates-${preserveAcrossViews}`}
        tableSelection={{
            getRowId: row => row.id,
            onSelectionChange: (nextSelection, details) => {
                setSelection(nextSelection)
                onSelectionChange(nextSelection, details)
            },
            preserveAcrossViews,
            renderControls: ({selection: controller}) => (
                <PneTableSelectionControls summary={`${controller.selectedCount} selected`}/>
            ),
            selection,
            toolbarAriaLabel: 'Gate table controls',
        }}
        tableViews={{
            'aria-label': 'Gate view',
            onChange: setView,
            value: view,
            views: createViews(searchData),
        }}
    />
}

const UncontrolledRemountHarness = ({
    searchData,
}: {
    searchData: (params: SearchParams) => Promise<Row[]>
}) => {
    const [mounted, setMounted] = React.useState(true)

    return <>
        <button onClick={() => setMounted(current => !current)} type='button'>
            {mounted ? 'Unmount table' : 'Mount table'}
        </button>
        {mounted && <SearchUI<Row, string, number>
            autoTestId='remount-gates'
            config={{hideShowFiltersButton: true, hideTemplatesSelect: true}}
            createTableHeader={(_params, {selection} = {
                appliedSearchCriteria: null,
            }) => <PneTableRow>
                <PneTableSelectionHeaderCell
                    aria-label='Select current page'
                    disabled={!selection || selection.interactionDisabled}
                    onChange={checked => selection?.setPageSelected(checked)}
                    state={selection?.pageState ?? 'none'}
                />
                <PneHeaderTableCell>Name</PneHeaderTableCell>
            </PneTableRow>}
            createTableRow={(row, _index, _data, _setData, {selection} = {
                appliedSearchCriteria: null,
            }) => <PneTableRow
                aria-selected={selection?.isRowSelected(row) ?? false}
                key={row.id}
                selected={selection?.isRowSelected(row) ?? false}
            >
                <PneTableSelectionCell
                    aria-label={`Select ${row.label}`}
                    checked={selection?.isRowSelected(row) ?? false}
                    disabled={!selection || selection.interactionDisabled}
                    onChange={checked => selection?.setRowSelected(row, checked)}
                />
                <PneTableCell>{row.label}</PneTableCell>
            </PneTableRow>}
            possibleCriteria={[CriterionTypeEnum.STATUS]}
            predefinedCriteria={[CriterionTypeEnum.STATUS]}
            searchData={searchData}
            settingsContextName='remount-gates-selection-test'
            tableSelection={{
                getRowId: row => row.id,
                renderControls: ({selection}) => (
                    <PneTableSelectionControls summary={`${selection.selectedCount} selected`}/>
                ),
                toolbarAriaLabel: 'Remount gate table controls',
            }}
        />}
    </>
}

describe('SearchUI table selection', () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: jest.fn(),
        })
    })

    afterAll(() => {
        if (originalScrollIntoView) {
            Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
                configurable: true,
                value: originalScrollIntoView,
            })
        } else {
            delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
        }
    })

    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        resetSearchUIRetentionForTests()
    })

    it('shares one controller across controls, header, and rows', async () => {
        const {container} = render(
            <SelectionHarness searchData={jest.fn().mockResolvedValue(rows)}/>,
        )

        const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
        const controls = screen.getByRole('group', {name: 'Gate table controls'})
        const feedback = container.querySelector(
            '[data-autotest="table-feedback"]',
        ) as HTMLElement
        const topControls = container.querySelector(
            '[data-autotest="table-top-controls"]',
        ) as HTMLElement

        expect(feedback).not.toBeNull()
        expect(feedback.nextElementSibling).toBe(topControls)
        expect(topControls.contains(feedback)).toBe(false)
        expect(controls.contains(feedback)).toBe(false)
        expect(within(feedback).getByText('0 selected feedback')).toBeTruthy()

        fireEvent.click(firstRowCheckbox)
        expect(within(controls).getByText('1 selected (explicit)')).toBeTruthy()
        expect(within(feedback).getByText('1 selected feedback')).toBeTruthy()
        expect((firstRowCheckbox as HTMLInputElement).checked).toBe(true)
        expect(firstRowCheckbox.closest('tr')?.getAttribute('aria-selected')).toBe('true')

        fireEvent.click(screen.getByRole('checkbox', {name: 'Select current page'}))
        expect(within(controls).getByText('2 selected (explicit)')).toBeTruthy()

        fireEvent.click(within(controls).getByRole('button', {name: 'Select all results'}))
        expect(within(controls).getByText('2 selected (allMatching)')).toBeTruthy()
        fireEvent.click(firstRowCheckbox)
        expect(within(controls).getByText('1 selected (allMatching)')).toBeTruthy()

        fireEvent.click(within(controls).getByRole('button', {name: 'Clear selection'}))
        expect(within(controls).getByText('0 selected (explicit)')).toBeTruthy()
    })

    it('keeps selection for manual draft edits and same-value refresh, then resets on apply', async () => {
        const onSelectionChange = jest.fn()
        const searchData = jest.fn<Promise<Row[]>, [SearchParams]>().mockResolvedValue(rows)
        const {container} = render(<SelectionHarness
            manualSearch
            onSelectionChange={onSelectionChange}
            searchData={searchData}
        />)
        const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))

        fireEvent.click(firstRowCheckbox)
        onSelectionChange.mockClear()
        const filterScope = container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="gates"]',
        ) as HTMLElement
        const enabledStatus = filterScope.querySelector(
            '[data-autotest="criterion-option"][data-autotest-value="ENABLED"]',
        ) as HTMLElement
        fireEvent.click(enabledStatus)

        expect((firstRowCheckbox as HTMLInputElement).checked).toBe(true)
        expect(onSelectionChange).not.toHaveBeenCalled()

        fireEvent.click(within(filterScope).getByRole('button', {name: 'react.searchUI.search'}))
        await waitFor(() => {
            expect(searchData).toHaveBeenLastCalledWith(expect.objectContaining({status: 'E'}))
            expect(onSelectionChange).toHaveBeenCalledWith(
                {mode: 'explicit', selectedIds: new Set()},
                {reason: 'scope'},
            )
        })
        await waitFor(() => expect(screen.getByText('0 selected (explicit)')).toBeTruthy())

        const refreshedCheckbox = screen.getByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((refreshedCheckbox as HTMLInputElement).disabled).toBe(false))
        fireEvent.click(refreshedCheckbox)
        onSelectionChange.mockClear()
        const requestsBeforeRefresh = searchData.mock.calls.length
        fireEvent.click(within(filterScope).getByRole('button', {name: 'react.searchUI.search'}))

        await waitFor(() => expect(searchData.mock.calls.length).toBe(requestsBeforeRefresh + 1))
        await waitFor(() => expect((refreshedCheckbox as HTMLInputElement).disabled).toBe(false))
        expect((refreshedCheckbox as HTMLInputElement).checked).toBe(true)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('preserves selection through pagination, page-size, and sort requests', async () => {
        const firstPage = Array.from({length: 51}, (_, index) => ({
            id: index + 1,
            label: `Gate ${index + 1}`,
        }))
        const searchData = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockImplementation(params => Promise.resolve(
                params.startNum === 0
                    ? firstPage
                    : [{id: 51, label: 'Gate 51'}],
            ))
        const {container} = render(<SelectionHarness searchData={searchData}/>)
        const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
        fireEvent.click(firstRowCheckbox)

        const tableScope = container.querySelector(
            '[data-autotest="table"][data-autotest-value="gates"]',
        ) as HTMLElement
        const bottomPagination = tableScope.querySelector(
            '[data-autotest="pagination"][data-autotest-value="bottom"]',
        ) as HTMLElement
        fireEvent.click(within(bottomPagination).getByRole('button', {name: 'next page'}))
        await screen.findByText('Gate 51')
        expect(screen.getByText('1 selected (explicit)')).toBeTruthy()

        fireEvent.click(within(bottomPagination).getByRole('button', {name: 'previous page'}))
        const returnedCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((returnedCheckbox as HTMLInputElement).disabled).toBe(false))
        expect((returnedCheckbox as HTMLInputElement).checked).toBe(true)

        const requestsBeforePageSize = searchData.mock.calls.length
        fireEvent.click(within(bottomPagination).getByRole('button', {name: '25'}))
        await waitFor(() => expect(searchData.mock.calls.length).toBe(requestsBeforePageSize + 1))
        await waitFor(() => expect((returnedCheckbox as HTMLInputElement).disabled).toBe(false))
        expect((returnedCheckbox as HTMLInputElement).checked).toBe(true)

        const requestsBeforeSort = searchData.mock.calls.length
        fireEvent.click(screen.getByRole('button', {name: 'Name'}))
        await waitFor(() => expect(searchData.mock.calls.length).toBe(requestsBeforeSort + 1))
        await waitFor(() => expect((returnedCheckbox as HTMLInputElement).disabled).toBe(false))
        expect(searchData).toHaveBeenLastCalledWith(expect.objectContaining({orderBy: 1}))
        expect((returnedCheckbox as HTMLInputElement).checked).toBe(true)
        expect(screen.getByText('1 selected (explicit)')).toBeTruthy()
    })

    it('disables retained old rows while changed applied criteria are loading', async () => {
        let resolveChangedSearch!: (value: Row[]) => void
        const changedSearch = new Promise<Row[]>(resolve => {
            resolveChangedSearch = resolve
        })
        const searchData = jest.fn<Promise<Row[]>, [SearchParams]>()
            .mockResolvedValueOnce(rows)
            .mockReturnValueOnce(changedSearch)
        const onSelectionChange = jest.fn()
        const {container} = render(<SelectionHarness
            manualSearch
            onSelectionChange={onSelectionChange}
            searchData={searchData}
        />)
        const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
        fireEvent.click(firstRowCheckbox)
        onSelectionChange.mockClear()

        const filterScope = container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="gates"]',
        ) as HTMLElement
        fireEvent.click(filterScope.querySelector(
            '[data-autotest="criterion-option"][data-autotest-value="ENABLED"]',
        ) as HTMLElement)
        fireEvent.click(within(filterScope).getByRole('button', {name: 'react.searchUI.search'}))

        await waitFor(() => expect(searchData).toHaveBeenCalledTimes(2))
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(true))
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()
        fireEvent.click(firstRowCheckbox)
        expect(screen.getByText('0 selected (explicit)')).toBeTruthy()
        expect(onSelectionChange.mock.calls.filter(
            ([, details]) => details.reason === 'scope',
        )).toHaveLength(1)

        resolveChangedSearch(rows)
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
    })

    it('keeps retained applied filters but not uncontrolled selection after remount', async () => {
        const searchData = jest.fn<Promise<Row[]>, [SearchParams]>().mockResolvedValue(rows)
        const {container} = render(<UncontrolledRemountHarness searchData={searchData}/>)
        const filterScope = container.querySelector(
            '[data-autotest="search-filters"][data-autotest-value="remount-gates"]',
        ) as HTMLElement
        fireEvent.click(filterScope.querySelector(
            '[data-autotest="criterion-option"][data-autotest-value="ENABLED"]',
        ) as HTMLElement)
        await waitFor(() => expect(searchData).toHaveBeenLastCalledWith(
            expect.objectContaining({status: 'E'}),
        ))

        const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
        fireEvent.click(firstRowCheckbox)
        expect(screen.getByText('1 selected')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', {name: 'Unmount table'}))
        expect(screen.queryByText('1 selected')).toBeNull()
        const requestsBeforeRemount = searchData.mock.calls.length
        fireEvent.click(screen.getByRole('button', {name: 'Mount table'}))

        await waitFor(() => expect(searchData.mock.calls.length).toBeGreaterThan(requestsBeforeRemount))
        expect(searchData).toHaveBeenLastCalledWith(expect.objectContaining({status: 'E'}))
        expect(await screen.findByText('0 selected')).toBeTruthy()
        const remountedCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => expect((remountedCheckbox as HTMLInputElement).disabled).toBe(false))
        expect((remountedCheckbox as HTMLInputElement).checked).toBe(false)
    })

    it('keeps simultaneous SearchUI selection instances isolated', async () => {
        render(<>
            <section aria-label='First gates'>
                <SelectionHarness
                    instanceId='first-gates'
                    searchData={jest.fn().mockResolvedValue(rows)}
                />
            </section>
            <section aria-label='Second gates'>
                <SelectionHarness
                    instanceId='second-gates'
                    searchData={jest.fn().mockResolvedValue(rows)}
                />
            </section>
        </>)
        const first = screen.getByRole('region', {name: 'First gates'})
        const second = screen.getByRole('region', {name: 'Second gates'})
        const firstCheckbox = await within(first).findByRole('checkbox', {name: 'Select Gate 1'})
        const secondCheckbox = await within(second).findByRole('checkbox', {name: 'Select Gate 1'})
        await waitFor(() => {
            expect((firstCheckbox as HTMLInputElement).disabled).toBe(false)
            expect((secondCheckbox as HTMLInputElement).disabled).toBe(false)
        })

        fireEvent.click(firstCheckbox)
        expect(within(first).getByText('1 selected (explicit)')).toBeTruthy()
        expect(within(second).getByText('0 selected (explicit)')).toBeTruthy()
        expect((firstCheckbox as HTMLInputElement).checked).toBe(true)
        expect((secondCheckbox as HTMLInputElement).checked).toBe(false)
    })

    it.each([
        {preserveAcrossViews: false, expectedCount: '0 selected', expectedScopeChanges: 1},
        {preserveAcrossViews: true, expectedCount: '1 selected', expectedScopeChanges: 0},
    ])(
        'handles View changes with preserveAcrossViews=$preserveAcrossViews',
        async ({preserveAcrossViews, expectedCount, expectedScopeChanges}) => {
            const onSelectionChange = jest.fn()
            render(<ViewsSelectionHarness
                onSelectionChange={onSelectionChange}
                preserveAcrossViews={preserveAcrossViews}
                searchData={jest.fn().mockResolvedValue(rows)}
            />)
            const firstRowCheckbox = await screen.findByRole('checkbox', {name: 'Select Gate 1'})
            await waitFor(() => expect((firstRowCheckbox as HTMLInputElement).disabled).toBe(false))
            fireEvent.click(firstRowCheckbox)
            onSelectionChange.mockClear()

            fireEvent.click(screen.getByRole('button', {name: 'Operations'}))
            await screen.findByRole('columnheader', {name: 'Operations'})
            await waitFor(() => expect(screen.getByText(expectedCount)).toBeTruthy())
            await waitFor(() => {
                const currentCheckbox = screen.getByRole('checkbox', {name: 'Select Gate 1'})
                expect((currentCheckbox as HTMLInputElement).disabled).toBe(false)
            })

            expect(onSelectionChange.mock.calls.filter(
                ([, details]) => details.reason === 'scope',
            )).toHaveLength(expectedScopeChanges)
        },
    )
})
