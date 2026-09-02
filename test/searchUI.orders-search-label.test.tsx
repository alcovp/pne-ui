import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    type OrderSearchLabel,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: (_namespace?: string, config?: {keyPrefix?: string}) => ({
        t: (key: string, options?: {defaultValue?: string}) => {
            const fullKey = config?.keyPrefix ? `${config.keyPrefix}.${key}` : key
            const translations: Record<string, string> = {
                'orders.search.labelTip.destination': 'dest.',
                'orders.search.labelTip.source': 'src.',
                'searchLabel.dest_bin_last': 'by 6+4',
                'searchLabel.dest_last4': 'by last 4',
                'searchLabel.source_bin_last4': 'by 6+4',
                'searchLabel.source_last4': 'by last 4',
            }

            return translations[fullKey] ?? options?.defaultValue ?? fullKey
        },
    }),
}))

const renderOrderSearch = (
    showCMSOrderSearchLabels?: () => boolean,
    ordersSearchLabel: OrderSearchLabel = 'customer_id',
    ordersSearchValue = '42',
    settingsContextName = 'order-search-labels',
) => {
    const onFiltersUpdate = jest.fn()
    const defaults = showCMSOrderSearchLabels === undefined
        ? {}
        : {showCMSOrderSearchLabels}

    render(
        <SearchUIProvider defaults={defaults}>
            <SearchUIFilters
                settingsContextName={settingsContextName}
                possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                initialSearchConditions={{
                    ordersSearchLabel,
                    ordersSearchValue,
                }}
                onFiltersUpdate={onFiltersUpdate}
                config={{
                    hideShowFiltersButton: true,
                    hideTemplatesSelect: true,
                }}
            />
        </SearchUIProvider>,
    )

    return onFiltersUpdate
}

beforeEach(() => {
    localStorage.clear()
})

describe('SearchUI selected order-search label', () => {
    it.each([
        ['source_last4', '9579', 'by last 4 src.'],
        ['dest_last4', '9579', 'by last 4 dest.'],
        ['source_bin_last4', '4050 64XX XXXX 9579', 'by 6+4 src.'],
        ['dest_bin_last', '4050 64XX XXXX 9579', 'by 6+4 dest.'],
    ] as const)('keeps the card side visible for %s', async (ordersSearchLabel, ordersSearchValue, expectedLabel) => {
        renderOrderSearch(
            undefined,
            ordersSearchLabel,
            ordersSearchValue,
            `qualifier-${ordersSearchLabel}`,
        )

        await waitFor(() => {
            const chipLabels = Array.from(document.querySelectorAll('.MuiChip-label'))
                .map(element => element.textContent)

            expect(chipLabels).toContain(expectedLabel)
        })
    })

    it('does not qualify a label outside source and destination card fields', async () => {
        renderOrderSearch(undefined, 'customer_id', '42', 'qualifier-neutral')

        await waitFor(() => {
            const chipLabels = Array.from(document.querySelectorAll('.MuiChip-label'))
                .map(element => element.textContent)

            expect(chipLabels).toContain('searchLabel.customer_id')
            expect(chipLabels.some(label => label?.includes('src.') || label?.includes('dest.'))).toBe(false)
        })
    })
})

const openLabelPicker = async () => {
    const select = await screen.findByRole('combobox')
    fireEvent.mouseDown(select)
}

describe('SearchUI order-search label visibility', () => {
    it('shows CMS labels by default', async () => {
        renderOrderSearch(undefined, 'customer_id', '42', 'visibility-default')
        await openLabelPicker()

        expect(await screen.findByRole('option', {name: 'searchLabel.customer_id'})).not.toBeNull()
        expect(screen.getByRole('option', {name: 'searchLabel.merchant_customer_identifier'})).not.toBeNull()
    })

    it('hides only CMS label options while preserving an existing condition', async () => {
        const onFiltersUpdate = renderOrderSearch(
            () => false,
            'customer_id',
            '42',
            'visibility-hidden',
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                ordersSearchLabel: 'customer_id',
                ordersSearchValue: '42',
            }))
        })
        await openLabelPicker()

        expect(screen.queryByRole('option', {name: 'searchLabel.customer_id'})).toBeNull()
        expect(screen.queryByRole('option', {name: 'searchLabel.merchant_customer_identifier'})).toBeNull()
        expect(await screen.findByRole('option', {name: 'searchLabel.customer_phone'})).not.toBeNull()
    })
})
