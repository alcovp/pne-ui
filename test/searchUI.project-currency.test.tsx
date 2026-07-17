import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import {
    AutoCompleteChoiceWithStatus,
    CriterionTypeEnum,
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

const currencyChoices: AutoCompleteChoiceWithStatus[] = [
    {choiceId: 1, displayName: 'USD', status: 'E'},
    {choiceId: 2, displayName: 'RUB', status: 'E'},
    {choiceId: 99, displayName: 'BBB', status: 'E'},
]

const getProjectCurrencyCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.PROJECT_CURRENCY}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

describe('SearchUI project-currency Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('preserves restored state and scopes async currency options across instances', async () => {
        let resolveCurrencies!: (currencies: AutoCompleteChoiceWithStatus[]) => void
        const currenciesPromise = new Promise<AutoCompleteChoiceWithStatus[]>(resolve => {
            resolveCurrencies = resolve
        })
        const getProjectAvailableCurrencies = jest.fn(() => currenciesPromise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getDefaultCurrency: () => ({id: 99, displayName: 'BBB'}),
                    getProjectAvailableCurrencies,
                }}
            >
                <>
                    <SearchUIFilters
                        autoTestId="project-currency-first"
                        settingsContextName="project-currency-first-context"
                        possibleCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                        predefinedCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                        initialSearchConditions={{
                            projectCurrency: {
                                currency: {id: 1, displayName: 'USD'},
                                convertToUserCurrency: false,
                            },
                        }}
                        onFiltersUpdate={firstOnFiltersUpdate}
                        config={filtersConfig}
                    />
                    <SearchUIFilters
                        autoTestId="project-currency-second"
                        settingsContextName="project-currency-second-context"
                        possibleCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                        predefinedCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                        initialSearchConditions={{
                            projectCurrency: {
                                currency: {id: 2, displayName: 'RUB'},
                                convertToUserCurrency: true,
                            },
                        }}
                        onFiltersUpdate={secondOnFiltersUpdate}
                        config={filtersConfig}
                    />
                </>
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 1,
                projectCurrencyConvert: false,
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 2,
                projectCurrencyConvert: true,
            }))
            expect(getProjectAvailableCurrencies).toHaveBeenCalledTimes(2)
        })

        const firstCriterion = getProjectCurrencyCriterion(container, 'project-currency-first')
        const secondCriterion = getProjectCurrencyCriterion(container, 'project-currency-second')
        const firstTrigger = firstCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-project-currency"]',
        )
        const secondTrigger = secondCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-project-currency"]',
        )
        const firstCheckbox = firstCriterion.querySelector<HTMLInputElement>(
            'input[type="checkbox"][data-autotest="criterion-project-currency-convert"]',
        )
        const secondCheckbox = secondCriterion.querySelector<HTMLInputElement>(
            'input[type="checkbox"][data-autotest="criterion-project-currency-convert"]',
        )

        expect(firstTrigger?.getAttribute('aria-label')).toBe('Project currency')
        expect(firstTrigger?.getAttribute('data-autotest-value')).toBe('1')
        expect(firstTrigger?.getAttribute('aria-busy')).toBe('true')
        expect(firstTrigger?.getAttribute('aria-disabled')).toBe('true')
        expect(secondTrigger?.getAttribute('data-autotest-value')).toBe('2')
        expect(secondTrigger?.getAttribute('aria-busy')).toBe('true')
        expect(secondTrigger?.getAttribute('aria-disabled')).toBe('true')
        expect(firstCheckbox?.checked).toBe(false)
        expect(secondCheckbox?.checked).toBe(true)
        expect(firstCheckbox?.hasAttribute('data-autotest-value')).toBe(false)
        expect(secondCheckbox?.hasAttribute('data-autotest-value')).toBe(false)
        expect(firstCriterion.querySelector(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()
        expect(secondCriterion.querySelector(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()

        await act(async () => {
            resolveCurrencies(currencyChoices)
            await currenciesPromise
        })

        await waitFor(() => {
            expect(firstTrigger?.getAttribute('aria-busy')).toBe('false')
            expect(firstTrigger?.hasAttribute('aria-disabled')).toBe(false)
            expect(secondTrigger?.getAttribute('aria-busy')).toBe('false')
            expect(secondTrigger?.hasAttribute('aria-disabled')).toBe(false)
        })
        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )

        fireEvent.mouseDown(firstTrigger as HTMLElement)
        fireEvent.mouseDown(secondTrigger as HTMLElement)

        await waitFor(() => {
            expect(document.body.querySelectorAll(
                '[data-autotest="criterion-project-currency-options"]',
            )).toHaveLength(2)
        })

        for (const [scope, selectedId, criterion, trigger] of [
            ['project-currency-first', 1, firstCriterion, firstTrigger],
            ['project-currency-second', 2, secondCriterion, secondTrigger],
        ] as const) {
            const listboxId = trigger?.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(trigger?.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('data-autotest-criterion')).toBe(
                CriterionTypeEnum.PROJECT_CURRENCY,
            )
            expect(listbox && criterion.contains(listbox)).toBe(false)
            expect(listbox?.querySelectorAll(
                '[role="option"][data-autotest="criterion-project-currency-option"]',
            )).toHaveLength(currencyChoices.length)

            for (const choice of currencyChoices) {
                const option = listbox?.querySelector<HTMLElement>(
                    '[role="option"][data-autotest="criterion-project-currency-option"]'
                    + `[data-autotest-value="${choice.choiceId}"]`,
                )

                expect(option).not.toBeNull()
                expect(option?.getAttribute('aria-selected')).toBe(
                    String(choice.choiceId === selectedId),
                )
            }
        }

        const firstListboxId = firstTrigger?.getAttribute('aria-controls')
        const firstListbox = firstListboxId ? document.getElementById(firstListboxId) : null
        const bbbOption = firstListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-project-currency-option"]'
            + '[data-autotest-value="99"]',
        )

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(bbbOption as HTMLElement)

        await waitFor(() => {
            expect(firstTrigger?.getAttribute('data-autotest-value')).toBe('99')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 99,
                projectCurrencyConvert: false,
            }))
        })
        expect(secondTrigger?.getAttribute('data-autotest-value')).toBe('2')
        expect(secondCheckbox?.checked).toBe(true)
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(firstCheckbox as HTMLInputElement)

        await waitFor(() => {
            expect(firstCheckbox?.checked).toBe(true)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 99,
                projectCurrencyConvert: true,
            }))
        })
        expect(secondCheckbox?.checked).toBe(true)
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )
    })

    it('keeps an empty async selector disabled while the checkbox stays operable', async () => {
        let resolveCurrencies!: (currencies: AutoCompleteChoiceWithStatus[]) => void
        const currenciesPromise = new Promise<AutoCompleteChoiceWithStatus[]>(resolve => {
            resolveCurrencies = resolve
        })
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getDefaultCurrency: () => ({id: 99, displayName: 'BBB'}),
                    getProjectAvailableCurrencies: () => currenciesPromise,
                }}
            >
                <SearchUIFilters
                    autoTestId="project-currency-empty"
                    settingsContextName="project-currency-empty-context"
                    possibleCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                    predefinedCriteria={[CriterionTypeEnum.PROJECT_CURRENCY]}
                    initialSearchConditions={{
                        projectCurrency: {
                            currency: {id: 2, displayName: 'RUB'},
                            convertToUserCurrency: false,
                        },
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 2,
                projectCurrencyConvert: false,
            }))
        })

        const criterion = getProjectCurrencyCriterion(container, 'project-currency-empty')
        const trigger = criterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-project-currency"]',
        )
        const checkbox = criterion.querySelector<HTMLInputElement>(
            'input[type="checkbox"][data-autotest="criterion-project-currency-convert"]',
        )

        expect(trigger?.getAttribute('aria-busy')).toBe('true')
        expect(trigger?.getAttribute('aria-disabled')).toBe('true')

        await act(async () => {
            resolveCurrencies([])
            await currenciesPromise
        })

        await waitFor(() => {
            expect(trigger?.getAttribute('aria-busy')).toBe('false')
        })
        expect(trigger?.getAttribute('aria-disabled')).toBe('true')
        expect(trigger?.getAttribute('data-autotest-value')).toBe('2')

        fireEvent.mouseDown(trigger as HTMLElement)
        expect(document.body.querySelector(
            '[data-autotest="criterion-project-currency-options"]',
        )).toBeNull()

        onFiltersUpdate.mockClear()
        fireEvent.click(checkbox as HTMLInputElement)

        await waitFor(() => {
            expect(checkbox?.checked).toBe(true)
            expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                projectCurrencyId: 2,
                projectCurrencyConvert: true,
            }))
        })
    })
})
