import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const renderOrderSearch = (showCMSOrderSearchLabels?: () => boolean) => {
    const onFiltersUpdate = jest.fn()
    const defaults = showCMSOrderSearchLabels === undefined
        ? {}
        : {showCMSOrderSearchLabels}

    render(
        <SearchUIProvider defaults={defaults}>
            <SearchUIFilters
                settingsContextName={'order-search-labels'}
                possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                initialSearchConditions={{
                    ordersSearchLabel: 'customer_id',
                    ordersSearchValue: '42',
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

const openLabelPicker = async () => {
    const select = await screen.findByRole('combobox')
    fireEvent.mouseDown(select)
}

describe('SearchUI order-search label visibility', () => {
    it('shows CMS labels by default', async () => {
        renderOrderSearch()
        await openLabelPicker()

        expect(await screen.findByRole('option', {name: 'searchLabel.customer_id'})).not.toBeNull()
        expect(screen.getByRole('option', {name: 'searchLabel.merchant_customer_identifier'})).not.toBeNull()
    })

    it('hides only CMS label options while preserving an existing condition', async () => {
        const onFiltersUpdate = renderOrderSearch(() => false)

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
