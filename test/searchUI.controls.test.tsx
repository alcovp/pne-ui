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
        expect(ordersChevron.getAttribute('data-testid')).toBe('ExpandMoreIcon')
        expect(getComputedStyle(ordersChevron).fontSize).toBe('16px')

        // The exact search label chip is for show under a transparent select; its chevron is the
        // chip's delete icon slot, in the chip's own colour.
        const exactChip = criterion(CriterionTypeEnum.EXACT).querySelector<HTMLElement>('.MuiChip-root') as HTMLElement
        const exactChevron = exactChip.querySelector('svg.MuiChip-deleteIcon') as SVGElement
        expect(exactChevron.getAttribute('data-testid')).toBe('ExpandMoreIcon')
        expect(getComputedStyle(exactChevron).fontSize).toBe('16px')
        // jsdom drops `color: inherit`; the chip's colour on the chevron is checked in a browser.
    })

    it('paints the criterion icons in the control grey', async () => {
        const {onFiltersUpdate, criterion} = renderControls()

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(2)
        })

        const eraser = criterion(CriterionTypeEnum.EXACT).querySelector<HTMLButtonElement>(
            '[data-autotest="clear-criterion"]',
        ) as HTMLButtonElement
        // #8A8A8A: 3.5:1 on white, the same token as the pagination arrows.
        expect(getComputedStyle(eraser).color).toBe('rgb(138, 138, 138)')
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
