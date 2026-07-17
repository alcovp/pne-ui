import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'
import {GROUPING_DATE_TYPES} from '../src/component/search-ui/filters/types'

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

const getGroupingCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.GROUPING}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getDateTypeControl = (criterion: HTMLElement): HTMLElement => {
    const control = criterion.querySelector<HTMLElement>(
        '[role="combobox"][data-autotest="criterion-grouping-date-type"]',
    )

    expect(control).not.toBeNull()

    return control as HTMLElement
}

const getOwnedOptions = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="listbox"][data-autotest="criterion-grouping-date-type-options"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.GROUPING}"]`,
)

const getOption = (listbox: HTMLElement, value: string): HTMLElement | null => listbox.querySelector<HTMLElement>(
    '[role="option"][data-autotest="criterion-grouping-date-type-option"]'
    + `[data-autotest-value="${value}"]`,
)

describe('SearchUI grouping date-type Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('exposes all raw date types and isolates two grouping selectors', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider defaults={{getSearchTemplates: neverResolves}}>
                <SearchUIFilters
                    autoTestId="grouping-date-first"
                    settingsContextName="grouping-date-first-context"
                    possibleCriteria={[CriterionTypeEnum.GROUPING]}
                    predefinedCriteria={[CriterionTypeEnum.GROUPING]}
                    initialSearchConditions={{
                        grouping: {
                            dateType: 'MONTH',
                            availableGroupingTypes: ['CURRENCY'],
                            selectedGroupingTypes: ['MERCHANT', 'DATE'],
                        },
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="grouping-date-second"
                    settingsContextName="grouping-date-second-context"
                    possibleCriteria={[CriterionTypeEnum.GROUPING]}
                    predefinedCriteria={[CriterionTypeEnum.GROUPING]}
                    initialSearchConditions={{
                        grouping: {
                            dateType: 'CLOSE_DAY',
                            availableGroupingTypes: ['CURRENCY'],
                            selectedGroupingTypes: ['MERCHANT', 'DATE'],
                        },
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                groupTypes: ['MERCHANT', 'MONTH'],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                groupTypes: ['MERCHANT', 'CLOSE_DAY'],
            }))
        })

        const firstCriterion = getGroupingCriterion(container, 'grouping-date-first')
        const secondCriterion = getGroupingCriterion(container, 'grouping-date-second')
        const firstControl = getDateTypeControl(firstCriterion)
        const secondControl = getDateTypeControl(secondCriterion)

        expect(firstControl.getAttribute('aria-label')).toBe('Grouping date type')
        expect(firstControl.getAttribute('data-autotest-value')).toBe('MONTH')
        expect(secondControl.getAttribute('data-autotest-value')).toBe('CLOSE_DAY')

        for (const criterion of [firstCriterion, secondCriterion]) {
            expect(criterion.querySelectorAll(
                '[data-autotest="criterion-grouping-date-type"]',
            )).toHaveLength(1)
            expect(criterion.querySelector(
                '[role="button"][aria-hidden="true"][tabindex="-1"]',
            )).not.toBeNull()
        }

        fireEvent.mouseDown(firstControl)
        fireEvent.mouseDown(secondControl)

        await waitFor(() => {
            expect(getOwnedOptions('grouping-date-first')).not.toBeNull()
            expect(getOwnedOptions('grouping-date-second')).not.toBeNull()
        })

        const firstOptions = getOwnedOptions('grouping-date-first') as HTMLElement
        const secondOptions = getOwnedOptions('grouping-date-second') as HTMLElement

        for (const [criterion, control, listbox, selectedValue] of [
            [firstCriterion, firstControl, firstOptions, 'MONTH'],
            [secondCriterion, secondControl, secondOptions, 'CLOSE_DAY'],
        ] as const) {
            expect(control.getAttribute('aria-expanded')).toBe('true')
            expect(control.getAttribute('aria-controls')).toBe(listbox.id)
            expect(criterion.contains(listbox)).toBe(false)
            expect(Array.from(listbox.querySelectorAll<HTMLElement>(
                '[role="option"][data-autotest="criterion-grouping-date-type-option"]',
            )).map(option => option.getAttribute('data-autotest-value'))).toEqual(
                GROUPING_DATE_TYPES,
            )

            for (const dateType of GROUPING_DATE_TYPES) {
                expect(getOption(listbox, dateType)?.getAttribute('aria-selected')).toBe(
                    String(dateType === selectedValue),
                )
            }
        }

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(getOption(firstOptions, 'SETTLEMENT_DAY') as HTMLElement)

        await waitFor(() => {
            expect(firstControl.getAttribute('data-autotest-value')).toBe('SETTLEMENT_DAY')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                groupTypes: ['MERCHANT', 'SETTLEMENT_DAY'],
            }))
        })
        expect(secondControl.getAttribute('data-autotest-value')).toBe('CLOSE_DAY')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })
})
