import * as React from 'react'
import {render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

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

/** jsdom does not weigh selectors, so the rule itself is read: the one of the row whose selector ends so. */
const rowRule = (row: HTMLElement, selectorEnd: string): CSSStyleDeclaration | undefined => {
    const rowClass = Array.from(row.classList).find(name => name.startsWith('css-')) as string

    return Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .find(rule => rule.selectorText === `.${rowClass} ${selectorEnd}`)
        ?.style
}

const renderPanel = async () => {
    const onFiltersUpdate = jest.fn()
    const utils = render(
        <SearchUIFilters
            settingsContextName='values-look'
            possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.DATE_RANGE]}
            predefinedCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.DATE_RANGE]}
            initialSearchConditions={{
                dateRangeSpec: {
                    dateRangeSpecType: 'EXACTLY',
                    dateFrom: new Date(2026, 0, 5),
                    dateTo: new Date(2026, 0, 10),
                },
            }}
            onFiltersUpdate={onFiltersUpdate}
            config={filtersConfig}
        />,
    )
    await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
    const criterion = (type: CriterionTypeEnum) => utils.container.querySelector<HTMLElement>(
        `[data-autotest="criterion"][data-autotest-value="${type}"]`,
    ) as HTMLElement

    return {...utils, criterion}
}

describe('SearchUI filter values look', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('gives a row 6px over and under its 32px values, the line over it counted in', async () => {
        const {criterion} = await renderPanel()
        const row = getComputedStyle(criterion(CriterionTypeEnum.STATUS))

        expect(row.boxSizing).toBe('border-box')
        expect(row.minHeight).toBe('45px')
        expect(row.paddingTop).toBe('6px')
        expect(row.paddingBottom).toBe('6px')
    })

    it('draws a dropdown as a 32px field-chip and a picked value as a badge in a ring', async () => {
        const {criterion} = await renderPanel()
        const row = criterion(CriterionTypeEnum.STATUS)
        const chip = '.MuiChip-root:not(.MuiAutocomplete-tag)'

        // The badges of an autocomplete field are the library's own: the panel leaves them alone.
        const value = rowRule(row, chip)
        expect(value?.getPropertyValue('height')).toBe('32px')
        expect(value?.getPropertyValue('border-radius')).toBe('4px')
        expect(value?.getPropertyValue('font-size')).toBe('14px')
        expect(value?.getPropertyValue('line-height')).toBe('20px')

        expect(rowRule(row, `${chip}.MuiChip-deletable .MuiChip-label`)?.getPropertyValue('padding-right')).toBe('4px')
        expect(rowRule(row, `${chip}.MuiChip-deletable .MuiChip-deleteIcon`)?.getPropertyValue('margin-right')).toBe('4px')

        const badge = `${chip}:not(.MuiChip-deletable):not(.MuiChip-clickable)`
        expect(rowRule(row, badge)?.getPropertyValue('box-shadow')).toMatch(/^inset 0 0 0 1px /)
        expect(rowRule(row, `${badge} .MuiChip-label`)?.getPropertyValue('padding-left')).toBe('10px')
        // A group of values: the neutral badge with no ring.
        expect(rowRule(row, `${badge}[data-pne-tone="neutral"]`)?.getPropertyValue('box-shadow')).toBe('none')
    })

    it('draws one choice out of a few as a tabs group of 24px buttons', async () => {
        const {criterion} = await renderPanel()
        const row = criterion(CriterionTypeEnum.STATUS)
        const tabs = row.querySelector<HTMLElement>('[data-pne-tabs]') as HTMLElement

        expect(tabs.getAttribute('role')).toBe('group')
        expect(tabs.querySelectorAll('.MuiChip-root[aria-pressed]').length).toBeGreaterThan(1)
        expect(tabs.querySelectorAll('.MuiChip-root[aria-pressed="true"]')).toHaveLength(1)
        expect(rowRule(row, '[data-pne-tabs] .MuiChip-root')?.getPropertyValue('height')).toBe('24px')
        expect(rowRule(row, '[data-pne-tabs] .MuiChip-root')?.getPropertyValue('font-size')).toBe('12px')
    })

    it('keeps the exact dates in the line of the type chip, in a 32px field', async () => {
        const {criterion} = await renderPanel()
        const row = criterion(CriterionTypeEnum.DATE_RANGE)
        const specSelect = row.querySelector<HTMLElement>('[data-autotest="criterion-range-spec"]') as HTMLElement
        const specItem = specSelect.closest('.MuiInputBase-root')!.parentElement!.parentElement as HTMLElement
        const line = specItem.parentElement as HTMLElement
        const field = row.querySelector<HTMLElement>('.MuiPickersOutlinedInput-root') as HTMLElement

        expect(field).not.toBeNull()
        expect(line.contains(field)).toBe(true)
        expect(getComputedStyle(line).display).toBe('flex')
        expect(getComputedStyle(line).flexWrap).toBe('wrap')
        expect(getComputedStyle(line).gap).toBe('4px')
        expect(getComputedStyle(field).height).toBe('32px')
    })
})
