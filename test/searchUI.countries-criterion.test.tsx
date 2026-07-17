import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    Country,
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

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const country: Country = {
    id: 840,
    displayName: 'United States',
    theCode: 'US',
    theCode3: 'USA',
}

const getCountriesCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.COUNTRIES}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getCollectionInput = (criterion: HTMLElement): HTMLInputElement => {
    const input = criterion.querySelector<HTMLInputElement>(
        'input[role="combobox"][data-autotest="criterion-collection"]',
    )

    expect(input).not.toBeNull()

    return input as HTMLInputElement
}

const getSelectedValue = (
    criterion: HTMLElement,
    value: string | number,
): HTMLElement | null => criterion.querySelector<HTMLElement>(
    '[data-autotest="criterion-collection-value"]'
    + `[data-autotest-value="${value}"]`,
)

const getOwnedPanel = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[data-autotest="criterion-collection-panel"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.COUNTRIES}"]`,
)

const getOwnedOptions = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="listbox"][data-autotest="criterion-collection-options"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.COUNTRIES}"]`,
)

const getOption = (listbox: HTMLElement, value: string | number): HTMLElement | null => (
    listbox.querySelector<HTMLElement>(
        '[role="option"][data-autotest="criterion-collection-option"]'
        + `[data-autotest-value="${value}"]`,
    )
)

const openCollection = (input: HTMLInputElement) => {
    fireEvent.focus(input)
    fireEvent.mouseDown(input)
    fireEvent.keyDown(input, {key: 'ArrowDown'})
}

describe('SearchUI countries collection Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('keeps All truthful and owner-scopes country options across two instances', async () => {
        let resolveCountries!: (countries: Country[]) => void
        const countriesPromise = new Promise<Country[]>(resolve => {
            resolveCountries = resolve
        })
        const getCountries = jest.fn(() => countriesPromise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getCountries,
                }}
            >
                <SearchUIFilters
                    autoTestId="countries-all"
                    settingsContextName="countries-all-context"
                    possibleCriteria={[CriterionTypeEnum.COUNTRIES]}
                    predefinedCriteria={[CriterionTypeEnum.COUNTRIES]}
                    initialSearchConditions={{
                        countries: {
                            all: true,
                            entities: [],
                        },
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="countries-entity"
                    settingsContextName="countries-entity-context"
                    possibleCriteria={[CriterionTypeEnum.COUNTRIES]}
                    predefinedCriteria={[CriterionTypeEnum.COUNTRIES]}
                    initialSearchConditions={{
                        countries: {
                            all: false,
                            entities: [country],
                        },
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getCountries).toHaveBeenCalledTimes(2)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                countries: [],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                countries: [country.id],
            }))
        })

        await act(async () => {
            resolveCountries([country])
            await countriesPromise
        })

        const firstCriterion = getCountriesCriterion(container, 'countries-all')
        const secondCriterion = getCountriesCriterion(container, 'countries-entity')
        const firstInput = getCollectionInput(firstCriterion)
        const secondInput = getCollectionInput(secondCriterion)

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, 'all')).not.toBeNull()
            expect(getSelectedValue(secondCriterion, country.id)).not.toBeNull()
        })

        expect(firstInput.tagName).toBe('INPUT')
        expect(secondInput.tagName).toBe('INPUT')
        expect(firstInput.getAttribute('aria-label')).toBe('react.CriterionTypeEnum.COUNTRIES')
        expect(secondInput.getAttribute('aria-label')).toBe('react.CriterionTypeEnum.COUNTRIES')
        expect(firstInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(secondInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(getSelectedValue(firstCriterion, country.id)).toBeNull()
        expect(getSelectedValue(secondCriterion, 'all')).toBeNull()

        openCollection(firstInput)
        openCollection(secondInput)

        await waitFor(() => {
            expect(getOwnedPanel('countries-all')).not.toBeNull()
            expect(getOwnedPanel('countries-entity')).not.toBeNull()
            expect(getOwnedOptions('countries-all')).not.toBeNull()
            expect(getOwnedOptions('countries-entity')).not.toBeNull()
        })

        const firstPanel = getOwnedPanel('countries-all') as HTMLElement
        const secondPanel = getOwnedPanel('countries-entity') as HTMLElement
        const firstOptions = getOwnedOptions('countries-all') as HTMLElement
        const secondOptions = getOwnedOptions('countries-entity') as HTMLElement

        for (const [criterion, input, panel, listbox] of [
            [firstCriterion, firstInput, firstPanel, firstOptions],
            [secondCriterion, secondInput, secondPanel, secondOptions],
        ] as const) {
            expect(input.getAttribute('aria-expanded')).toBe('true')
            expect(input.getAttribute('aria-controls')).toBe(listbox.id)
            expect(criterion.contains(panel)).toBe(false)
            expect(panel.contains(listbox)).toBe(true)
            expect(listbox.querySelectorAll(
                '[role="option"][data-autotest="criterion-collection-option"]',
            )).toHaveLength(2)
            expect(getOption(listbox, 'all')).not.toBeNull()
            expect(getOption(listbox, country.id)).not.toBeNull()
            expect(getOption(listbox, 'all')?.querySelector(
                'input[type="checkbox"], [role="checkbox"]',
            )).toBeNull()
        }

        expect(getOption(firstOptions, 'all')?.getAttribute('aria-selected')).toBe('true')
        expect(getOption(firstOptions, country.id)?.getAttribute('aria-selected')).toBe('false')
        expect(getOption(secondOptions, 'all')?.getAttribute('aria-selected')).toBe('false')
        expect(getOption(secondOptions, country.id)?.getAttribute('aria-selected')).toBe('true')

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        await act(async () => {
            fireEvent.click(getOption(firstOptions, 'all') as HTMLElement)
            await Promise.resolve()
        })

        expect(getSelectedValue(firstCriterion, 'all')).not.toBeNull()
        expect(getSelectedValue(firstCriterion, country.id)).toBeNull()
        expect(firstOnFiltersUpdate).not.toHaveBeenCalled()
        expect(getSelectedValue(secondCriterion, country.id)).not.toBeNull()
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.click(getOption(firstOptions, country.id) as HTMLElement)

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, country.id)).not.toBeNull()
            expect(getSelectedValue(firstCriterion, 'all')).toBeNull()
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                countries: [country.id],
            }))
        })
        expect(getSelectedValue(secondCriterion, country.id)).not.toBeNull()
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        const updatedFirstOptions = getOwnedOptions('countries-all') as HTMLElement
        const updatedAllOption = getOption(updatedFirstOptions, 'all') as HTMLElement

        expect(updatedAllOption.getAttribute('aria-selected')).toBe('false')
        expect(getOption(updatedFirstOptions, country.id)?.getAttribute('aria-selected')).toBe('true')

        firstOnFiltersUpdate.mockClear()
        fireEvent.focus(firstInput)
        fireEvent.keyDown(firstInput, {key: 'Home', code: 'Home'})

        await waitFor(() => {
            expect(firstInput.getAttribute('aria-activedescendant')).toBe(updatedAllOption.id)
        })

        fireEvent.keyDown(firstInput, {key: 'Enter', code: 'Enter'})

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, 'all')).not.toBeNull()
            expect(getSelectedValue(firstCriterion, country.id)).toBeNull()
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                countries: [],
            }))
        })
        expect(getSelectedValue(secondCriterion, country.id)).not.toBeNull()
        expect(getSelectedValue(secondCriterion, 'all')).toBeNull()
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })
})
