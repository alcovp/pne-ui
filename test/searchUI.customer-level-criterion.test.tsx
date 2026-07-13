import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
} from '../src/component/search-ui/filters/types'
import {
    initialSearchUIDefaults,
    SearchUIDefaultsContext,
} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}))

describe('CustomerLevelCriterion', () => {
    it('loads levels for exactly one selected merchant and selected currencies', async () => {
        const getCustomerLevels = jest.fn().mockResolvedValue([
            { id: 7, displayName: 'VIP' },
            { id: 8, displayName: 'Regular' },
        ])
        const onFiltersUpdate = jest.fn()

        render(
            <SearchUIDefaultsContext.Provider
                value={{
                    ...initialSearchUIDefaults,
                    getCustomerLevels,
                }}
            >
                <SearchUIFilters
                    settingsContextName={'customer-level-criterion-test'}
                    possibleCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    predefinedCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    initialSearchConditions={{
                        multigetCriteria: [{
                            entityType: LinkedEntityTypeEnum.MERCHANT,
                            filterType: MultichoiceFilterTypeEnum.NONE,
                            searchString: '',
                            selectedItems: '42',
                            selectedItemNames: 'Merchant 42',
                            deselectedItems: '',
                            deselectedItemNames: '',
                        }],
                        currencies: {
                            all: false,
                            entities: [{ id: 840, displayName: 'USD' }],
                        },
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        await waitFor(() => {
            expect(getCustomerLevels).toHaveBeenCalledWith({
                merchantId: 42,
                currencyIds: [840],
            })
        })

        const select = await screen.findByRole('combobox', { name: 'Customer level' })
        await waitFor(() => {
            expect(select.getAttribute('aria-disabled')).toBeNull()
        })
        const chipSelectWrapper = select.closest('.MuiFormControl-root')?.parentElement
        expect(chipSelectWrapper).not.toBeNull()
        expect(window.getComputedStyle(chipSelectWrapper as Element).display).toBe('inline-flex')

        fireEvent.mouseDown(select)
        fireEvent.click(await screen.findByRole('option', { name: 'VIP' }))

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                customerLevelId: 7,
            }))
        })
    })

    it('stays disabled and does not load levels for multiple merchants', async () => {
        const getCustomerLevels = jest.fn().mockResolvedValue([])

        render(
            <SearchUIDefaultsContext.Provider
                value={{
                    ...initialSearchUIDefaults,
                    getCustomerLevels,
                }}
            >
                <SearchUIFilters
                    settingsContextName={'customer-level-multiple-merchants-test'}
                    possibleCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    predefinedCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    initialSearchConditions={{
                        multigetCriteria: [{
                            entityType: LinkedEntityTypeEnum.MERCHANT,
                            filterType: MultichoiceFilterTypeEnum.NONE,
                            searchString: '',
                            selectedItems: '42,43',
                            selectedItemNames: 'Merchant 42,Merchant 43',
                            deselectedItems: '',
                            deselectedItemNames: '',
                        }],
                    }}
                    onFiltersUpdate={jest.fn()}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        expect(await screen.findByText('Select a merchant first')).toBeTruthy()
        const select = await screen.findByRole('combobox', { name: 'Customer level' })
        expect(select.getAttribute('aria-disabled')).toBe('true')
        expect(getCustomerLevels).not.toHaveBeenCalled()
    })

    it('shows an empty-state placeholder when a merchant has no customer levels', async () => {
        const getCustomerLevels = jest.fn().mockResolvedValue([])

        render(
            <SearchUIDefaultsContext.Provider
                value={{
                    ...initialSearchUIDefaults,
                    getCustomerLevels,
                }}
            >
                <SearchUIFilters
                    settingsContextName={'customer-level-empty-options-test'}
                    possibleCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    predefinedCriteria={[
                        CriterionTypeEnum.MERCHANT,
                        CriterionTypeEnum.CURRENCY,
                        CriterionTypeEnum.CUSTOMER_LEVEL,
                    ]}
                    initialSearchConditions={{
                        multigetCriteria: [{
                            entityType: LinkedEntityTypeEnum.MERCHANT,
                            filterType: MultichoiceFilterTypeEnum.NONE,
                            searchString: '',
                            selectedItems: '42',
                            selectedItemNames: 'Merchant 42',
                            deselectedItems: '',
                            deselectedItemNames: '',
                        }],
                    }}
                    onFiltersUpdate={jest.fn()}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        await waitFor(() => {
            expect(getCustomerLevels).toHaveBeenCalledWith({
                merchantId: 42,
                currencyIds: [],
            })
        })

        expect(await screen.findByText('No customer levels available')).toBeTruthy()
        const select = await screen.findByRole('combobox', { name: 'Customer level' })
        expect(select.getAttribute('aria-disabled')).toBe('true')
    })
})
