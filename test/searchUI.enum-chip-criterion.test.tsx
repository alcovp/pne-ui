import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
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

const criterionMatrix = [
    {
        type: CriterionTypeEnum.STATUS,
        values: ['ANY', 'DISABLED', 'ENABLED'],
        initialValue: 'ANY',
        nextValue: 'ENABLED',
    },
    {
        type: CriterionTypeEnum.THREE_D,
        values: ['ANY', 'NO', 'YES'],
        initialValue: 'ANY',
        nextValue: 'YES',
    },
    {
        type: CriterionTypeEnum.MARKER_STATUS,
        values: ['any', 'unprocessed', 'processed'],
        initialValue: 'any',
        nextValue: 'processed',
    },
] as const

const criterionTypes = criterionMatrix.map(({type}) => type)

const getCriterion = (
    container: HTMLElement,
    scope: string,
    criterionType: CriterionTypeEnum,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"][data-autotest-value="${criterionType}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

describe('SearchUI enum-chip criterion Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('exposes raw values and pressed state while isolating two filter instances', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="enum-chips-first"
                    settingsContextName="enum-chips-first-context"
                    possibleCriteria={criterionTypes}
                    predefinedCriteria={criterionTypes}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="enum-chips-second"
                    settingsContextName="enum-chips-second-context"
                    possibleCriteria={criterionTypes}
                    predefinedCriteria={criterionTypes}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalled()
            expect(secondOnFiltersUpdate).toHaveBeenCalled()
        })

        for (const scope of ['enum-chips-first', 'enum-chips-second']) {
            for (const {type, values, initialValue} of criterionMatrix) {
                const criterion = getCriterion(container, scope, type)
                const group = criterion.querySelector<HTMLElement>('[role="group"]')
                const options = Array.from(criterion.querySelectorAll<HTMLElement>(
                    '[role="button"][data-autotest="criterion-option"]',
                ))
                const pressedOptions = options.filter(option => (
                    option.getAttribute('aria-pressed') === 'true'
                ))

                expect(group?.getAttribute('aria-label')).toBe(`react.CriterionTypeEnum.${type}`)
                expect(options.map(option => option.getAttribute('data-autotest-value'))).toEqual(values)
                expect(options.every(option => option.tabIndex === 0)).toBe(true)
                expect(pressedOptions).toHaveLength(1)
                expect(pressedOptions[0].getAttribute('data-autotest-value')).toBe(initialValue)
            }
        }

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()

        for (const {type, initialValue, nextValue} of criterionMatrix) {
            const firstCriterion = getCriterion(container, 'enum-chips-first', type)
            const nextOption = firstCriterion.querySelector<HTMLElement>(
                `[role="button"][data-autotest="criterion-option"]`
                + `[data-autotest-value="${nextValue}"]`,
            )

            fireEvent.click(nextOption as HTMLElement)

            await waitFor(() => {
                expect(nextOption?.getAttribute('aria-pressed')).toBe('true')
            })
            expect(firstCriterion.querySelector(
                `[data-autotest="criterion-option"][data-autotest-value="${initialValue}"]`,
            )?.getAttribute('aria-pressed')).toBe('false')
            expect(getCriterion(container, 'enum-chips-second', type).querySelector(
                `[data-autotest="criterion-option"][data-autotest-value="${initialValue}"]`,
            )?.getAttribute('aria-pressed')).toBe('true')
        }

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                status: 'E',
                threeD: true,
                markerStatus: 'processed',
            }))
        })
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })
})
