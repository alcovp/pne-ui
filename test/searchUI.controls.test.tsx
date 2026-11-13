import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchUIFilters} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const renderControls = () => {
    const onFiltersUpdate = jest.fn()
    const utils = render(
        <>
            <SearchUIFilters
                autoTestId="controls-orders"
                settingsContextName="controls-orders-context"
                possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                initialSearchConditions={{
                    ordersSearchLabel: 'merchant_invoice_id',
                    ordersSearchValue: 'invoice-001',
                }}
                onFiltersUpdate={onFiltersUpdate}
                config={filtersConfig}
            />
            <SearchUIFilters
                autoTestId="controls-exact"
                settingsContextName="controls-exact-context"
                possibleCriteria={[CriterionTypeEnum.EXACT]}
                predefinedCriteria={[CriterionTypeEnum.EXACT]}
                exactSearchLabels={Object.values(ExactCriterionSearchLabelEnum)}
                initialSearchConditions={{
                    exactSearchLabel: ExactCriterionSearchLabelEnum.NAME,
                    exactSearchValue: 'initial',
                }}
                onFiltersUpdate={onFiltersUpdate}
                config={filtersConfig}
            />
        </>,
    )
    const criterion = (type: CriterionTypeEnum) => utils.container.querySelector<HTMLElement>(
        `[data-autotest="criterion"][data-autotest-value="${type}"]`,
    ) as HTMLElement

    return {...utils, onFiltersUpdate, criterion}
}

describe('SearchUIFilters criterion controls', () => {
    it('draws one 16px chevron on every dropdown chip', async () => {
        const {onFiltersUpdate, criterion} = renderControls()

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(2)
        })

        // The orders label chip is a real button and holds its chevron in the label.
        const ordersTrigger = criterion(CriterionTypeEnum.ORDERS_SEARCH).querySelector<HTMLElement>(
            'button[data-autotest="criterion-label"]',
        ) as HTMLElement
        const ordersChevron = ordersTrigger.querySelector('svg') as SVGElement
        expect(ordersChevron.getAttribute('data-testid')).toBe('PneChevronDownIcon')
        expect(getComputedStyle(ordersChevron).fontSize).toBe('16px')

        // The exact search label chip is for show under a transparent select; its chevron is the
        // chip's delete icon slot, in the chip's own colour.
        const exactChip = criterion(CriterionTypeEnum.EXACT).querySelector<HTMLElement>('.MuiChip-root') as HTMLElement
        const exactChevron = exactChip.querySelector('svg.MuiChip-deleteIcon') as SVGElement
        expect(exactChevron.getAttribute('data-testid')).toBe('PneChevronDownIcon')
        expect(getComputedStyle(exactChevron).fontSize).toBe('16px')
        // jsdom drops `color: inherit`; the chip's colour on the chevron is checked in a browser.
    })

    it('paints the criterion icons as UI Kit icon actions', async () => {
        const {onFiltersUpdate, criterion} = renderControls()

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(2)
        })

        const reset = criterion(CriterionTypeEnum.EXACT).querySelector<HTMLButtonElement>(
            '[data-autotest="clear-criterion"]',
        ) as HTMLButtonElement
        // Icon action md: a 32px box, the tertiary text colour at rest (Neutral/600).
        expect(getComputedStyle(reset).color).toBe('rgb(110, 116, 122)')
        expect(getComputedStyle(reset).width).toBe('32px')
        expect(getComputedStyle(reset).height).toBe('32px')

        const resetClass = Array.from(reset.classList).find(name => name.startsWith('css-')) as string
        // jsdom applies no :hover: the rule itself is checked. Only the icon under the pointer or the
        // keyboard focus changes colour; the row under the pointer changes nothing.
        const hoverRules = Array.from(document.styleSheets)
            .flatMap(sheet => Array.from(sheet.cssRules))
            .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
            .filter(rule => rule.selectorText.includes(resetClass) && rule.selectorText.includes(':hover'))
        expect(hoverRules.length).toBeGreaterThan(0)
        expect(hoverRules.some(rule => rule.selectorText.includes('[data-autotest="criterion"]'))).toBe(false)
    })

    it('marks a focused pill input with the panel focus ring', async () => {
        const {onFiltersUpdate, criterion} = renderControls()

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(2)
        })

        const input = criterion(CriterionTypeEnum.EXACT).querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-input"]',
        ) as HTMLInputElement
        const root = input.closest('.MuiFilledInput-root') as HTMLElement

        expect(root.classList.contains('Mui-focused')).toBe(false)
        fireEvent.focus(input)
        await waitFor(() => {
            expect(root.classList.contains('Mui-focused')).toBe(true)
        })
        // jsdom keeps the shorthand as written.
        expect(getComputedStyle(root).getPropertyValue('outline')).toMatch(/^2px solid /)
        expect(getComputedStyle(root).getPropertyValue('outline-offset')).toBe('1px')
    })
})
