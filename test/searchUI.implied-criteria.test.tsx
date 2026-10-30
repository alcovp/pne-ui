import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'
import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIFilters,
    SearchUIFiltersProps,
    SearchUIProvider,
} from '../src'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const CONTEXT_NAME = 'implied-criteria'

const selection = (entityType: LinkedEntityTypeEnum, id: string, name: string): MultigetCriterion => ({
    entityType,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems: id,
    selectedItemNames: name,
    deselectedItems: '',
    deselectedItemNames: '',
})

const merchant = selection(LinkedEntityTypeEnum.MERCHANT, '7', 'Merchant 7')
const project = selection(LinkedEntityTypeEnum.PROJECT, '3', 'Project 3')

const renderFilters = (props: Partial<SearchUIFiltersProps> = {}) => {
    const onFiltersUpdate = jest.fn()
    render(<SearchUIProvider defaults={{getSearchTemplates: jest.fn().mockResolvedValue([])}}>
        <SearchUIFilters
            autoTestId="implied"
            settingsContextName={CONTEXT_NAME}
            possibleCriteria={[CriterionTypeEnum.PROJECT]}
            predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
            initialSearchConditions={{multigetCriteria: [merchant, project]}}
            onFiltersUpdate={onFiltersUpdate}
            config={{hideShowFiltersButton: true}}
            {...props}
        />
    </SearchUIProvider>)
    return onFiltersUpdate
}

const criterion = (type: CriterionTypeEnum) => document.body.querySelector<HTMLElement>(
    `[data-autotest="criterion"][data-autotest-value="${type}"]`,
)
const sentSelections = (onFiltersUpdate: jest.Mock) => (onFiltersUpdate.mock.calls.at(-1)?.[0].multigetCriteria ?? [])
    .map((item: MultigetCriterion) => [item.entityType, item.selectedItems])

describe('SearchUI criteria implied by the initial selections', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
        localStorage.clear()
        resetSearchUIRetentionForTests()
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
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

    afterEach(() => {
        consoleError.mockRestore()
    })

    it('shows the criteria of the selections and sends the selections with the first search', async () => {
        const onFiltersUpdate = renderFilters()

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        expect(sentSelections(onFiltersUpdate)).toEqual([
            [LinkedEntityTypeEnum.MERCHANT, '7'],
            [LinkedEntityTypeEnum.PROJECT, '3'],
        ])
        // Declared nowhere: predefined, so it stays. Possible: removable.
        const merchantCriterion = criterion(CriterionTypeEnum.MERCHANT)!
        expect(merchantCriterion.textContent).toContain('Merchant 7')
        expect(merchantCriterion.querySelector('[data-autotest="remove-criterion"]')).toBeNull()
        const projectCriterion = criterion(CriterionTypeEnum.PROJECT)!
        expect(projectCriterion.textContent).toContain('Project 3')
        expect(projectCriterion.querySelector('[data-autotest="remove-criterion"]')).not.toBeNull()
    })

    it('reports a selection whose criterion the page declared nowhere, and only that', async () => {
        const onFiltersUpdate = renderFilters()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        expect(consoleError).toHaveBeenCalledTimes(1)
        expect(consoleError.mock.calls[0][0]).toContain(`SearchUI "${CONTEXT_NAME}"`)
        expect(consoleError.mock.calls[0][0]).toContain(CriterionTypeEnum.MERCHANT)
        expect(consoleError.mock.calls[0][0]).not.toContain(CriterionTypeEnum.PROJECT)
    })

    it('stays quiet when the page declares the criterion', async () => {
        const onFiltersUpdate = renderFilters({
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.MERCHANT],
        })
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        expect(consoleError).not.toHaveBeenCalled()
        expect(criterion(CriterionTypeEnum.MERCHANT)?.textContent).toContain('Merchant 7')
    })

    it('brings a removed implied criterion back with its selection on Default', async () => {
        const onFiltersUpdate = renderFilters()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        fireEvent.click(criterion(CriterionTypeEnum.PROJECT)!.querySelector('[data-autotest="remove-criterion"]')!)
        await waitFor(() => expect(sentSelections(onFiltersUpdate)).toEqual([[LinkedEntityTypeEnum.MERCHANT, '7']]))
        expect(criterion(CriterionTypeEnum.PROJECT)).toBeNull()

        fireEvent.click(document.body.querySelector('[data-autotest="templates"]')!)
        const defaultItem = await waitFor(() => {
            const item = document.body.querySelector<HTMLButtonElement>('[data-autotest="select-default-template"]')
            expect(item).not.toBeNull()
            return item!
        })
        fireEvent.click(defaultItem)

        await waitFor(() => expect(sentSelections(onFiltersUpdate)).toEqual([
            [LinkedEntityTypeEnum.MERCHANT, '7'],
            [LinkedEntityTypeEnum.PROJECT, '3'],
        ]))
        expect(criterion(CriterionTypeEnum.PROJECT)?.textContent).toContain('Project 3')
    })
})
