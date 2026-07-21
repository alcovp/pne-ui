import * as React from 'react'
import {fireEvent, render, waitFor, within} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    AbstractEntity,
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const createCriterion = (
    filterType: MultichoiceFilterTypeEnum,
    options: Partial<MultigetCriterion>,
): MultigetCriterion => ({
    entityType: LinkedEntityTypeEnum.GATE,
    filterType,
    searchString: '',
    selectedItems: '',
    selectedItemNames: '',
    deselectedItems: '',
    deselectedItemNames: '',
    ...options,
})

const getCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.GATE}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getTrigger = (criterion: HTMLElement): HTMLButtonElement => {
    const trigger = criterion.querySelector<HTMLButtonElement>(
        'button[data-autotest="criterion-multiget-trigger"]',
    )

    expect(trigger).not.toBeNull()

    return trigger as HTMLButtonElement
}

const getSummaryValues = (criterion: HTMLElement): string[] => Array.from(
    criterion.querySelectorAll<HTMLElement>('[data-autotest="criterion-multiget-value"]'),
    chip => chip.getAttribute('data-autotest-value') ?? '',
)

const getOwnedPanel = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="dialog"][data-autotest="criterion-multiget-panel"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.GATE}"]`,
)

const getColumn = (panel: HTMLElement, autoTestId: string): HTMLElement => {
    const column = panel.querySelector<HTMLElement>(
        `[role="group"][data-autotest="${autoTestId}"]`,
    )

    expect(column).not.toBeNull()

    return column as HTMLElement
}

const getEntityAction = (
    column: HTMLElement,
    autoTestId: string,
    entityId: number,
): HTMLButtonElement | null => column.querySelector<HTMLButtonElement>(
    `button[data-autotest="${autoTestId}"][data-autotest-value="${entityId}"]`,
)

const getControlButton = (
    panel: HTMLElement,
    autoTestId: string,
    value?: string,
): HTMLButtonElement => {
    const valueSelector = value === undefined ? '' : `[data-autotest-value="${value}"]`
    const button = panel.querySelector<HTMLButtonElement>(
        `button[data-autotest="${autoTestId}"]${valueSelector}`,
    )

    expect(button).not.toBeNull()

    return button as HTMLButtonElement
}

const getControlInput = (panel: HTMLElement, autoTestId: string): HTMLInputElement => {
    const input = panel.querySelector<HTMLInputElement>(
        `input[data-autotest="${autoTestId}"]`,
    )

    expect(input).not.toBeNull()

    return input as HTMLInputElement
}

const getModalAction = (
    panel: HTMLElement,
    placement: 'primary' | 'secondary',
): HTMLButtonElement => {
    const button = panel.querySelector<HTMLButtonElement>(
        `[data-pne-modal-action="${placement}"] button`,
    )

    expect(button).not.toBeNull()

    return button as HTMLButtonElement
}

describe('SearchUI multiget outer Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })
    })

    it('scopes raw summaries and two detached Gate dialogs with the same entity ID', async () => {
        const firstCriterionState = createCriterion(MultichoiceFilterTypeEnum.NONE, {
            selectedItems: '7,11',
            selectedItemNames: 'Shared Gate,Secondary Gate',
        })
        const secondCriterionState = createCriterion(MultichoiceFilterTypeEnum.ALL, {
            deselectedItems: '7',
            deselectedItemNames: 'Shared Gate',
        })
        const availableEntities: AbstractEntity[] = [
            {id: 7, displayName: 'Shared Gate'},
            {id: 22, displayName: 'Available Gate'},
            ...Array.from({length: 9}, (_, index) => ({
                id: 30 + index,
                displayName: `Gate ${30 + index}`,
            })),
        ]
        let resolveAvailableEntities!: (entities: AbstractEntity[]) => void
        const availableEntitiesPromise = new Promise<AbstractEntity[]>(resolve => {
            resolveAvailableEntities = resolve
        })
        const getMatchLinkedItems = jest.fn(() => availableEntitiesPromise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getMatchLinkedItems,
                }}
            >
                <SearchUIFilters
                    autoTestId="multiget-first"
                    settingsContextName="multiget-first-context"
                    possibleCriteria={[CriterionTypeEnum.GATE]}
                    predefinedCriteria={[CriterionTypeEnum.GATE]}
                    initialSearchConditions={{multigetCriteria: [firstCriterionState]}}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="multiget-second"
                    settingsContextName="multiget-second-context"
                    possibleCriteria={[CriterionTypeEnum.GATE]}
                    predefinedCriteria={[CriterionTypeEnum.GATE]}
                    initialSearchConditions={{multigetCriteria: [secondCriterionState]}}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [firstCriterionState],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [secondCriterionState],
            }))
        })

        const firstCriterion = getCriterion(container, 'multiget-first')
        const secondCriterion = getCriterion(container, 'multiget-second')
        const firstTrigger = getTrigger(firstCriterion)
        const secondTrigger = getTrigger(secondCriterion)

        expect(firstTrigger.type).toBe('button')
        expect(firstTrigger.getAttribute('aria-label')).toBe(
            'Edit filter: react.CriterionTypeEnum.GATE',
        )
        expect(firstTrigger.getAttribute('aria-haspopup')).toBe('dialog')
        expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(firstTrigger.getAttribute('data-autotest-value')).toBe('NONE')
        expect(secondTrigger.getAttribute('data-autotest-value')).toBe('ALL')
        expect(firstTrigger.querySelectorAll('button')).toHaveLength(0)
        expect(getSummaryValues(firstCriterion)).toEqual(['7', '11'])
        expect(getSummaryValues(secondCriterion)).toEqual(['7'])

        fireEvent.click(firstTrigger)
        fireEvent.click(secondTrigger)

        await waitFor(() => {
            expect(getOwnedPanel('multiget-first')).not.toBeNull()
            expect(getOwnedPanel('multiget-second')).not.toBeNull()
        })

        const firstPanel = getOwnedPanel('multiget-first') as HTMLElement
        const secondPanel = getOwnedPanel('multiget-second') as HTMLElement

        expect(firstTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(firstTrigger.getAttribute('aria-controls')).toBe(firstPanel.id)
        expect(secondTrigger.getAttribute('aria-controls')).toBe(secondPanel.id)
        expect(firstPanel.id).not.toBe(secondPanel.id)
        expect(firstPanel.getAttribute('aria-label')).toBeNull()
        expect(secondPanel.getAttribute('aria-label')).toBeNull()
        expect(document.getElementById(firstPanel.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('advancedSearch.addCriteria')
        expect(document.getElementById(secondPanel.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('advancedSearch.addCriteria')
        expect(firstPanel.getAttribute('aria-modal')).toBe('true')
        expect(firstCriterion.contains(firstPanel)).toBe(false)
        expect(secondCriterion.contains(secondPanel)).toBe(false)

        const firstAvailable = getColumn(firstPanel, 'criterion-multiget-available')
        const firstSelected = getColumn(firstPanel, 'criterion-multiget-selected')
        const secondAvailable = getColumn(secondPanel, 'criterion-multiget-available')
        const secondSelected = getColumn(secondPanel, 'criterion-multiget-selected')
        const firstPagination = firstPanel.querySelector<HTMLElement>(
            'nav[aria-label="pagination navigation"]',
        )
        const secondPagination = secondPanel.querySelector<HTMLElement>(
            'nav[aria-label="pagination navigation"]',
        )

        expect(firstAvailable.getAttribute('aria-busy')).toBe('true')
        expect(secondAvailable.getAttribute('aria-busy')).toBe('true')
        expect(firstPagination).not.toBeNull()
        expect(secondPagination).not.toBeNull()
        expect(Array.from(firstPagination?.querySelectorAll('button') ?? []).every(
            button => button.disabled,
        )).toBe(true)
        expect(Array.from(secondPagination?.querySelectorAll('button') ?? []).every(
            button => button.disabled,
        )).toBe(true)

        resolveAvailableEntities(availableEntities)

        await waitFor(() => {
            expect(firstAvailable.getAttribute('aria-busy')).toBe('false')
            expect(secondAvailable.getAttribute('aria-busy')).toBe('false')
            expect(getEntityAction(firstAvailable, 'criterion-multiget-add', 22)).not.toBeNull()
            expect(getEntityAction(secondAvailable, 'criterion-multiget-add', 22)).not.toBeNull()
        })

        expect(firstAvailable.getAttribute('aria-label')).toBe('react.searchUI.available')
        expect(secondAvailable.getAttribute('aria-label')).toBe('react.searchUI.available')
        expect(firstSelected.getAttribute('aria-label')).toBe('react.searchUI.selected')
        expect(secondSelected.getAttribute('aria-label')).toBe('react.searchUI.excluded')
        expect(firstPagination?.querySelector('[aria-current="page"]')?.textContent).toBe('1')
        expect(secondPagination?.querySelector('[aria-current="page"]')?.textContent).toBe('1')
        expect(Array.from(firstPagination?.querySelectorAll('button') ?? []).some(
            button => !button.disabled,
        )).toBe(true)

        const firstInclude = getControlButton(firstPanel, 'criterion-multiget-mode', 'NONE')
        const firstExclude = getControlButton(firstPanel, 'criterion-multiget-mode', 'ALL')
        const secondInclude = getControlButton(secondPanel, 'criterion-multiget-mode', 'NONE')
        const secondExclude = getControlButton(secondPanel, 'criterion-multiget-mode', 'ALL')
        const firstEnabledOnly = getControlInput(firstPanel, 'criterion-multiget-only-enabled')
        const secondEnabledOnly = getControlInput(secondPanel, 'criterion-multiget-only-enabled')
        const firstSearch = getControlInput(firstPanel, 'criterion-multiget-search')
        const secondSearch = getControlInput(secondPanel, 'criterion-multiget-search')
        const firstAllLabel = getControlButton(firstPanel, 'criterion-multiget-search-label', 'all')
        const firstMidLabel = getControlButton(firstPanel, 'criterion-multiget-search-label', 'mid')
        const firstDescriptorLabel = getControlButton(
            firstPanel,
            'criterion-multiget-search-label',
            'descriptor',
        )
        const secondAllLabel = getControlButton(secondPanel, 'criterion-multiget-search-label', 'all')
        const secondClear = within(secondSelected).getByRole('button', {name: 'clear'}) as HTMLButtonElement
        const secondCancel = within(secondPanel).getByRole('button', {name: 'cancel'}) as HTMLButtonElement
        const secondSave = within(secondPanel).getByRole('button', {name: 'save'}) as HTMLButtonElement

        expect(firstInclude.getAttribute('aria-pressed')).toBe('true')
        expect(firstExclude.getAttribute('aria-pressed')).toBe('false')
        expect(secondInclude.getAttribute('aria-pressed')).toBe('false')
        expect(secondExclude.getAttribute('aria-pressed')).toBe('true')
        expect(firstEnabledOnly.type).toBe('checkbox')
        expect(firstEnabledOnly.checked).toBe(true)
        expect(secondEnabledOnly.checked).toBe(true)
        expect(firstSearch.type).toBe('text')
        expect(firstSearch.value).toBe('')
        expect(secondSearch.value).toBe('')
        expect(firstSearch.getAttribute('aria-label')).toBe('search')
        expect(firstAllLabel.getAttribute('aria-pressed')).toBe('true')
        expect(firstMidLabel.getAttribute('aria-pressed')).toBe('false')
        expect(firstDescriptorLabel.getAttribute('aria-pressed')).toBe('false')
        expect(secondAllLabel.getAttribute('aria-pressed')).toBe('true')
        expect(secondClear.type).toBe('button')
        expect(secondCancel.type).toBe('button')
        expect(secondSave.type).toBe('button')

        fireEvent.click(firstEnabledOnly)
        fireEvent.change(firstSearch, {target: {value: 'Shared'}})
        fireEvent.click(firstMidLabel)

        await waitFor(() => {
            expect(firstEnabledOnly.checked).toBe(false)
            expect(firstSearch.value).toBe('Shared')
            expect(firstAllLabel.getAttribute('aria-pressed')).toBe('false')
            expect(firstMidLabel.getAttribute('aria-pressed')).toBe('true')
            expect(getMatchLinkedItems).toHaveBeenCalledWith(expect.objectContaining({
                type: LinkedEntityTypeEnum.GATE,
                searchString: 'mid:Shared',
                status: null,
            }))
        })
        expect(secondEnabledOnly.checked).toBe(true)
        expect(secondSearch.value).toBe('')
        expect(secondAllLabel.getAttribute('aria-pressed')).toBe('true')

        const firstSecondPage = Array.from(
            firstPagination?.querySelectorAll<HTMLButtonElement>('button') ?? [],
        ).find(button => button.textContent === '2')

        expect(firstSecondPage).not.toBeUndefined()
        fireEvent.click(firstSecondPage as HTMLButtonElement)

        await waitFor(() => {
            expect(firstPagination?.querySelector('[aria-current="page"]')?.textContent).toBe('2')
            expect(getMatchLinkedItems).toHaveBeenCalledWith(expect.objectContaining({
                startRow: 10,
                numRows: 10,
            }))
        })
        expect(secondPagination?.querySelector('[aria-current="page"]')?.textContent).toBe('1')

        const firstAddShared = getEntityAction(firstAvailable, 'criterion-multiget-add', 7)
        const firstAddAvailable = getEntityAction(firstAvailable, 'criterion-multiget-add', 22)
        const firstRemoveShared = getEntityAction(firstSelected, 'criterion-multiget-remove', 7)
        const secondAddShared = getEntityAction(secondAvailable, 'criterion-multiget-add', 7)
        const secondAddAvailable = getEntityAction(secondAvailable, 'criterion-multiget-add', 22)
        const secondRemoveShared = getEntityAction(secondSelected, 'criterion-multiget-remove', 7)

        expect(firstAddShared).not.toBeNull()
        expect(firstAddAvailable).not.toBeNull()
        expect(firstRemoveShared).not.toBeNull()
        expect(secondAddShared).not.toBeNull()
        expect(secondAddAvailable).not.toBeNull()
        expect(secondRemoveShared).not.toBeNull()
        expect(firstAddAvailable?.type).toBe('button')
        expect(firstAddAvailable?.tabIndex).toBe(0)
        expect(firstAddAvailable?.getAttribute('aria-label')).toBe('Select entity: Available Gate')
        expect(secondAddAvailable?.getAttribute('aria-label')).toBe('Exclude entity: Available Gate')
        expect(window.getComputedStyle(firstAddShared as HTMLButtonElement).visibility).toBe('hidden')
        expect(window.getComputedStyle(firstAddAvailable as HTMLButtonElement).visibility).toBe('visible')
        expect(window.getComputedStyle(secondAddShared as HTMLButtonElement).visibility).toBe('hidden')
        expect(window.getComputedStyle(secondAddAvailable as HTMLButtonElement).visibility).toBe('visible')

        fireEvent.click(firstAddAvailable as HTMLButtonElement)

        await waitFor(() => {
            expect(window.getComputedStyle(
                getEntityAction(firstAvailable, 'criterion-multiget-add', 22) as HTMLButtonElement,
            ).visibility).toBe('hidden')
            expect(getEntityAction(firstSelected, 'criterion-multiget-remove', 22)).not.toBeNull()
        })
        expect(window.getComputedStyle(
            getEntityAction(secondAvailable, 'criterion-multiget-add', 22) as HTMLButtonElement,
        ).visibility).toBe('visible')
        expect(getEntityAction(secondSelected, 'criterion-multiget-remove', 22)).toBeNull()

        fireEvent.click(firstRemoveShared as HTMLButtonElement)

        await waitFor(() => {
            expect(getEntityAction(firstSelected, 'criterion-multiget-remove', 7)).toBeNull()
            expect(window.getComputedStyle(
                getEntityAction(firstAvailable, 'criterion-multiget-add', 7) as HTMLButtonElement,
            ).visibility).toBe('visible')
        })
        expect(getEntityAction(secondSelected, 'criterion-multiget-remove', 7)).not.toBeNull()
        expect(window.getComputedStyle(
            getEntityAction(secondAvailable, 'criterion-multiget-add', 7) as HTMLButtonElement,
        ).visibility).toBe('hidden')

        fireEvent.click(secondClear)

        await waitFor(() => {
            expect(secondSelected.querySelectorAll(
                'button[data-autotest="criterion-multiget-remove"]',
            )).toHaveLength(0)
        })
        expect(getEntityAction(firstSelected, 'criterion-multiget-remove', 11)).not.toBeNull()
        expect(getEntityAction(firstSelected, 'criterion-multiget-remove', 22)).not.toBeNull()

        fireEvent.click(firstExclude)

        await waitFor(() => {
            expect(firstInclude.getAttribute('aria-pressed')).toBe('false')
            expect(firstExclude.getAttribute('aria-pressed')).toBe('true')
            expect(firstSelected.getAttribute('aria-label')).toBe('react.searchUI.excluded')
        })
        expect(secondExclude.getAttribute('aria-pressed')).toBe('true')

        const firstClose = firstPanel.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-multiget-close"][aria-label="Close"]',
        )
        const secondClose = secondPanel.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-multiget-close"][aria-label="Close"]',
        )

        expect(firstClose).not.toBeNull()
        expect(secondClose).not.toBeNull()
        fireEvent.click(firstClose as HTMLButtonElement)

        await waitFor(() => {
            expect(getOwnedPanel('multiget-first')).toBeNull()
            expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        })
        expect(getOwnedPanel('multiget-second')).toBe(secondPanel)
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(getSummaryValues(secondCriterion)).toEqual(['7'])
    })

    it('commits NONE and ALL values while Cancel preserves both scoped criteria', async () => {
        const firstCriterionState = createCriterion(MultichoiceFilterTypeEnum.NONE, {})
        const secondCriterionState = createCriterion(MultichoiceFilterTypeEnum.ALL, {})
        const availableEntities: AbstractEntity[] = [{id: 101, displayName: 'Shared Gate'}]
        const getMatchLinkedItems = jest.fn(async () => availableEntities)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getMatchLinkedItems,
                }}
            >
                <SearchUIFilters
                    autoTestId="multiget-commit-first"
                    settingsContextName="multiget-commit-first-context"
                    possibleCriteria={[CriterionTypeEnum.GATE]}
                    predefinedCriteria={[CriterionTypeEnum.GATE]}
                    initialSearchConditions={{multigetCriteria: [firstCriterionState]}}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="multiget-commit-second"
                    settingsContextName="multiget-commit-second-context"
                    possibleCriteria={[CriterionTypeEnum.GATE]}
                    predefinedCriteria={[CriterionTypeEnum.GATE]}
                    initialSearchConditions={{multigetCriteria: [secondCriterionState]}}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [firstCriterionState],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [secondCriterionState],
            }))
        })

        const firstCriterion = getCriterion(container, 'multiget-commit-first')
        const secondCriterion = getCriterion(container, 'multiget-commit-second')
        const firstTrigger = getTrigger(firstCriterion)
        const secondTrigger = getTrigger(secondCriterion)

        fireEvent.click(firstTrigger)
        fireEvent.click(secondTrigger)

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-first')).not.toBeNull()
            expect(getOwnedPanel('multiget-commit-second')).not.toBeNull()
        })

        const firstPanel = getOwnedPanel('multiget-commit-first') as HTMLElement
        const secondPanel = getOwnedPanel('multiget-commit-second') as HTMLElement
        const firstAvailable = getColumn(firstPanel, 'criterion-multiget-available')
        const secondAvailable = getColumn(secondPanel, 'criterion-multiget-available')
        const firstSelected = getColumn(firstPanel, 'criterion-multiget-selected')
        const secondSelected = getColumn(secondPanel, 'criterion-multiget-selected')

        await waitFor(() => {
            expect(getEntityAction(firstAvailable, 'criterion-multiget-add', 101)).not.toBeNull()
            expect(getEntityAction(secondAvailable, 'criterion-multiget-add', 101)).not.toBeNull()
        })

        fireEvent.click(getEntityAction(firstAvailable, 'criterion-multiget-add', 101) as HTMLButtonElement)
        fireEvent.click(getEntityAction(secondAvailable, 'criterion-multiget-add', 101) as HTMLButtonElement)

        await waitFor(() => {
            expect(getEntityAction(firstSelected, 'criterion-multiget-remove', 101)).not.toBeNull()
            expect(getEntityAction(secondSelected, 'criterion-multiget-remove', 101)).not.toBeNull()
        })

        fireEvent.click(getModalAction(firstPanel, 'primary'))

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-first')).toBeNull()
            expect(getSummaryValues(firstCriterion)).toEqual(['101'])
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [expect.objectContaining({
                    entityType: LinkedEntityTypeEnum.GATE,
                    filterType: MultichoiceFilterTypeEnum.NONE,
                    selectedItems: '101',
                    selectedItemNames: 'Shared Gate',
                    deselectedItems: '',
                    deselectedItemNames: '',
                })],
            }))
        })
        expect(getOwnedPanel('multiget-commit-second')).toBe(secondPanel)
        expect(getSummaryValues(secondCriterion)).toEqual([])

        fireEvent.click(getModalAction(secondPanel, 'primary'))

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-second')).toBeNull()
            expect(getSummaryValues(secondCriterion)).toEqual(['101'])
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: [expect.objectContaining({
                    entityType: LinkedEntityTypeEnum.GATE,
                    filterType: MultichoiceFilterTypeEnum.ALL,
                    selectedItems: '',
                    selectedItemNames: '',
                    deselectedItems: '101',
                    deselectedItemNames: 'Shared Gate',
                })],
            }))
        })

        const firstCommittedCallCount = firstOnFiltersUpdate.mock.calls.length
        const secondCommittedCallCount = secondOnFiltersUpdate.mock.calls.length

        fireEvent.click(firstTrigger)
        fireEvent.click(secondTrigger)

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-first')).not.toBeNull()
            expect(getOwnedPanel('multiget-commit-second')).not.toBeNull()
        })

        const reopenedFirstPanel = getOwnedPanel('multiget-commit-first') as HTMLElement
        const reopenedSecondPanel = getOwnedPanel('multiget-commit-second') as HTMLElement
        const reopenedFirstSelected = getColumn(reopenedFirstPanel, 'criterion-multiget-selected')
        const reopenedSecondSelected = getColumn(reopenedSecondPanel, 'criterion-multiget-selected')

        await waitFor(() => {
            expect(getEntityAction(
                reopenedFirstSelected,
                'criterion-multiget-remove',
                101,
            )).not.toBeNull()
            expect(getEntityAction(
                reopenedSecondSelected,
                'criterion-multiget-remove',
                101,
            )).not.toBeNull()
        })

        fireEvent.click(getEntityAction(
            reopenedFirstSelected,
            'criterion-multiget-remove',
            101,
        ) as HTMLButtonElement)
        fireEvent.click(getEntityAction(
            reopenedSecondSelected,
            'criterion-multiget-remove',
            101,
        ) as HTMLButtonElement)

        await waitFor(() => {
            expect(reopenedFirstSelected.querySelector(
                'button[data-autotest="criterion-multiget-remove"]',
            )).toBeNull()
            expect(reopenedSecondSelected.querySelector(
                'button[data-autotest="criterion-multiget-remove"]',
            )).toBeNull()
        })
        expect(getSummaryValues(firstCriterion)).toEqual(['101'])
        expect(getSummaryValues(secondCriterion)).toEqual(['101'])

        fireEvent.click(getModalAction(reopenedFirstPanel, 'secondary'))

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-first')).toBeNull()
        })
        expect(getOwnedPanel('multiget-commit-second')).toBe(reopenedSecondPanel)
        expect(firstOnFiltersUpdate).toHaveBeenCalledTimes(firstCommittedCallCount)
        expect(secondOnFiltersUpdate).toHaveBeenCalledTimes(secondCommittedCallCount)
        expect(getSummaryValues(firstCriterion)).toEqual(['101'])
        expect(getSummaryValues(secondCriterion)).toEqual(['101'])

        fireEvent.click(getModalAction(reopenedSecondPanel, 'secondary'))

        await waitFor(() => {
            expect(getOwnedPanel('multiget-commit-second')).toBeNull()
        })
        expect(secondOnFiltersUpdate).toHaveBeenCalledTimes(secondCommittedCallCount)
        expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('false')
    })
})
