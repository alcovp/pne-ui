import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
    ExactCriterionSearchLabelEnum,
    SearchUIFilters,
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

const exactSearchLabels = Object.values(ExactCriterionSearchLabelEnum)

const getExactCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const filterScope = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
    )
    const criterion = filterScope?.querySelector<HTMLElement>(
        `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.EXACT}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

describe('SearchUI exact-search Selenium contract', () => {
    it('scopes native inputs, label selectors, and detached options across instances', async () => {
        const ordersOnFiltersUpdate = jest.fn()
        const transactionsOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="exact-orders"
                    settingsContextName="exact-orders-context"
                    possibleCriteria={[CriterionTypeEnum.EXACT]}
                    predefinedCriteria={[CriterionTypeEnum.EXACT]}
                    exactSearchLabels={exactSearchLabels}
                    initialSearchConditions={{
                        exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                        exactSearchValue: 'initial order',
                    }}
                    onFiltersUpdate={ordersOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="exact-transactions"
                    settingsContextName="exact-transactions-context"
                    possibleCriteria={[CriterionTypeEnum.EXACT]}
                    predefinedCriteria={[CriterionTypeEnum.EXACT]}
                    exactSearchLabels={exactSearchLabels}
                    initialSearchConditions={{
                        exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                        exactSearchValue: 'initial transaction',
                    }}
                    onFiltersUpdate={transactionsOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                exactSearchValue: 'initial order',
            }))
            expect(transactionsOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                exactSearchValue: 'initial transaction',
            }))
        })

        const ordersCriterion = getExactCriterion(container, 'exact-orders')
        const transactionsCriterion = getExactCriterion(container, 'exact-transactions')
        const ordersInput = ordersCriterion.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-input"]',
        )
        const transactionsInput = transactionsCriterion.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-input"]',
        )
        const ordersLabel = ordersCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-label"]',
        )
        const transactionsLabel = transactionsCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-label"]',
        )

        expect(ordersInput?.getAttribute('aria-label')).toBe('Exact search value')
        expect(ordersInput?.tagName).toBe('INPUT')
        expect(ordersInput?.value).toBe('initial order')
        expect(ordersInput?.hasAttribute('data-autotest-value')).toBe(false)
        expect(transactionsInput?.getAttribute('aria-label')).toBe('Exact search value')
        expect(transactionsInput?.tagName).toBe('INPUT')
        expect(transactionsInput?.value).toBe('initial transaction')
        expect(transactionsInput?.hasAttribute('data-autotest-value')).toBe(false)
        expect(ordersLabel?.getAttribute('aria-label')).toBe('Exact search field')
        expect(ordersLabel?.getAttribute('data-autotest-value')).toBe(ExactCriterionSearchLabelEnum.NAME)
        expect(transactionsLabel?.getAttribute('aria-label')).toBe('Exact search field')
        expect(transactionsLabel?.getAttribute('data-autotest-value')).toBe(ExactCriterionSearchLabelEnum.NAME)
        expect(ordersCriterion.querySelector('[aria-hidden="true"][tabindex="-1"]')).not.toBeNull()
        expect(transactionsCriterion.querySelector('[aria-hidden="true"][tabindex="-1"]')).not.toBeNull()

        ordersOnFiltersUpdate.mockClear()
        transactionsOnFiltersUpdate.mockClear()
        fireEvent.change(ordersInput as HTMLInputElement, {target: {value: 'updated order'}})

        await waitFor(() => {
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                exactSearchValue: 'updated order',
            }))
        })
        expect(transactionsInput?.value).toBe('initial transaction')
        expect(transactionsOnFiltersUpdate).not.toHaveBeenCalledWith(expect.objectContaining({
            exactSearchValue: 'updated order',
        }))

        fireEvent.mouseDown(ordersLabel as HTMLElement)
        fireEvent.mouseDown(transactionsLabel as HTMLElement)

        await waitFor(() => {
            expect(document.body.querySelectorAll(
                '[data-autotest="criterion-label-options"]',
            )).toHaveLength(2)
        })

        for (const [scope, criterion, label] of [
            ['exact-orders', ordersCriterion, ordersLabel],
            ['exact-transactions', transactionsCriterion, transactionsLabel],
        ] as const) {
            const listboxId = label?.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(label?.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox?.getAttribute('data-autotest')).toBe('criterion-label-options')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('data-autotest-criterion')).toBe(CriterionTypeEnum.EXACT)
            expect(listbox && criterion.contains(listbox)).toBe(false)
            expect(listbox?.querySelectorAll(
                '[role="option"][data-autotest="criterion-label-option"]',
            )).toHaveLength(exactSearchLabels.length)
            for (const exactSearchLabel of exactSearchLabels) {
                expect(listbox?.querySelector(
                    `[role="option"][data-autotest="criterion-label-option"]`
                    + `[data-autotest-value="${exactSearchLabel}"]`,
                )).not.toBeNull()
            }
        }

        const ordersListboxId = ordersLabel?.getAttribute('aria-controls')
        const ordersListbox = ordersListboxId ? document.getElementById(ordersListboxId) : null
        const idOption = ordersListbox?.querySelector<HTMLElement>(
            `[role="option"][data-autotest="criterion-label-option"]`
            + `[data-autotest-value="${ExactCriterionSearchLabelEnum.ID}"]`,
        )
        const nameOption = ordersListbox?.querySelector<HTMLElement>(
            `[role="option"][data-autotest="criterion-label-option"]`
            + `[data-autotest-value="${ExactCriterionSearchLabelEnum.NAME}"]`,
        )

        expect(nameOption?.getAttribute('aria-selected')).toBe('true')
        expect(idOption?.getAttribute('aria-selected')).toBe('false')
        fireEvent.click(idOption as HTMLElement)

        await waitFor(() => {
            expect(ordersLabel?.getAttribute('data-autotest-value')).toBe(ExactCriterionSearchLabelEnum.ID)
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                exactSearchLabel: ExactCriterionSearchLabelEnum.ID,
                exactSearchValue: 'updated order',
            }))
        })
        expect(transactionsLabel?.getAttribute('data-autotest-value')).toBe(ExactCriterionSearchLabelEnum.NAME)
    })
})
