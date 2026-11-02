import * as React from 'react'
import {render, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

describe('SearchUI date range layout', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it.each([
        ['DAYS_BEFORE', CriterionTypeEnum.DATE_RANGE],
        ['HOURS_BEFORE', CriterionTypeEnum.DATE_RANGE_ORDERS],
    ] as const)('keeps the %s count in the line of the type chips', async (dateRangeSpecType, criterionType) => {
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIFilters
                settingsContextName={`date-range-layout-${dateRangeSpecType}`}
                possibleCriteria={[criterionType]}
                predefinedCriteria={[criterionType]}
                initialSearchConditions={{
                    dateRangeSpec: {dateRangeSpecType, beforeCount: 3},
                }}
                onFiltersUpdate={onFiltersUpdate}
                config={filtersConfig}
            />,
        )

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        const specSelect = container.querySelector<HTMLElement>('[data-autotest="criterion-range-spec"]')
        const countInput = container.querySelector<HTMLElement>('[data-autotest="criterion-before-count"]')
        expect(specSelect).not.toBeNull()
        expect(countInput).not.toBeNull()

        // The chip with its select overlay is one item of the row, the count field the next one.
        const specItem = specSelect!.closest('.MuiInputBase-root')!.parentElement!.parentElement!
        const countField = countInput!.closest('.MuiFormControl-root') as HTMLElement
        const row = specItem.parentElement as HTMLElement

        expect(countField.parentElement).toBe(row)
        expect(specItem.nextElementSibling).toBe(countField)
        expect(getComputedStyle(row).display).toBe('flex')
        expect(getComputedStyle(row).flexWrap).toBe('wrap')
        expect(getComputedStyle(row).alignItems).toBe('center')
        expect(['', '0px']).toContain(getComputedStyle(countField).marginLeft)
    })

    it.each([
        ['a valid', {dateRangeSpecType: 'THIS_MONTH'}, false],
        ['an end before the start', {
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date(2026, 0, 10),
            dateTo: new Date(2026, 0, 5),
        }, true],
    ] as const)('shows a hidden date range with %s value only when it blocks the search', async (
        _name,
        dateRangeSpec,
        shown,
    ) => {
        const {container} = render(
            <SearchUIFilters
                settingsContextName={`hidden-date-range-${String(shown)}`}
                possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.DATE_RANGE]}
                predefinedCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.DATE_RANGE]}
                hiddenCriteria={[CriterionTypeEnum.DATE_RANGE]}
                initialSearchConditions={{dateRangeSpec}}
                onFiltersUpdate={jest.fn()}
                config={filtersConfig}
            />,
        )

        await waitFor(() => expect(
            container.querySelector('[data-autotest="criterion"][data-autotest-value="STATUS"]'),
        ).not.toBeNull())
        expect(container.querySelector(
            '[data-autotest="criterion"][data-autotest-value="DATE_RANGE"]',
        ) !== null).toBe(shown)
    })
})
