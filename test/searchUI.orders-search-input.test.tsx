import * as React from 'react'
import {fireEvent, render, waitFor, within} from '@testing-library/react'

import {
    CriterionTypeEnum,
    ORDER_SEARCH_LABELS,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'
import {OrdersSearchLabelsConfig} from '../src/component/search-ui/filters/state/actions'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

jest.mock(
    '../src/component/search-ui/filters/component/select/SearchUIOrdersSearchLabelSelect',
    () => ({SearchUIOrdersSearchLabelSelect: () => null}),
)

const ordinaryInputCases = [
    {
        label: 'registration_info_id',
        initialValue: 'restored hidden label',
        enteredValue: 'x'.repeat(130),
        expectedValue: 'x'.repeat(128),
    },
    {
        label: 'source_last4',
        initialValue: '0001',
        enteredValue: '12345',
        expectedValue: '1234',
    },
    {
        label: 'source_bin',
        initialValue: '001234',
        enteredValue: '12ab345678',
        expectedValue: '123456',
    },
    {
        label: 'customer_ip',
        initialValue: '127.0.0.1',
        enteredValue: '2001:db8::1',
        expectedValue: '2001:db8::1',
    },
] as const

const maskedInputCases = [
    {
        label: 'transaction_amount',
        enteredValue: '12345.67',
        expectedNativeValue: '12 345.67',
        expectedStoreValue: '12345.67',
    },
    {
        label: 'source_bin_last4',
        enteredValue: '1234567890',
        expectedNativeValue: '1234 56XX XXXX 7890',
        expectedStoreValue: '1234 56XX XXXX 7890',
    },
    {
        label: 'dest_bin_last',
        enteredValue: '6543210987',
        expectedNativeValue: '6543 21XX XXXX 0987',
        expectedStoreValue: '6543 21XX XXXX 0987',
    },
] as const

const countryInputLabels = [
    'customer_ip_country',
    'customer_billing_country',
    'source_country',
    'dest_country',
] as const

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

describe('SearchUI orders-search native input Selenium contract', () => {
    it('keeps the complete ordinary-input configuration inventory explicit', () => {
        const inputTypeCounts = ORDER_SEARCH_LABELS.reduce<Record<string, number>>((counts, label) => {
            const inputType = OrdersSearchLabelsConfig[label].type

            counts[inputType] = (counts[inputType] ?? 0) + 1
            return counts
        }, {})

        expect(inputTypeCounts.string).toBe(34)
        expect(inputTypeCounts.integer).toBe(13)
        expect(inputTypeCounts.ip).toBe(1)
        expect(inputTypeCounts.amount).toBe(1)
        expect(inputTypeCounts.card6and4).toBe(2)
        expect(inputTypeCounts.country).toBe(4)
        expect(inputTypeCounts.string + inputTypeCounts.integer + inputTypeCounts.ip).toBe(48)
        expect(ORDER_SEARCH_LABELS.filter(label => (
            OrdersSearchLabelsConfig[label].type === 'country'
        ))).toEqual(countryInputLabels)
    })

    it.each(ordinaryInputCases)(
        'anchors and updates the native input for $label',
        async ({label, initialValue, enteredValue, expectedValue}) => {
            const onFiltersUpdate = jest.fn()
            const scope = `orders-input-${label}`
            const {container} = render(
                <SearchUIFilters
                    autoTestId={scope}
                    settingsContextName={`${scope}-context`}
                    possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    initialSearchConditions={{
                        ordersSearchLabel: label,
                        ordersSearchValue: initialValue,
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={filtersConfig}
                />,
            )

            await waitFor(() => {
                expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: label,
                    ordersSearchValue: initialValue,
                }))
            })

            const filterScope = container.querySelector<HTMLElement>(
                `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
            )
            const criterion = filterScope?.querySelector<HTMLElement>(
                `[data-autotest="criterion"]`
                + `[data-autotest-value="${CriterionTypeEnum.ORDERS_SEARCH}"]`,
            )

            expect(criterion).not.toBeNull()

            const input = within(criterion as HTMLElement).getByRole<HTMLInputElement>('textbox', {
                name: 'Order search value',
            })

            expect(input.tagName).toBe('INPUT')
            expect(input.getAttribute('data-autotest')).toBe('criterion-input')
            expect(input.hasAttribute('data-autotest-value')).toBe(false)
            expect(input.value).toBe(initialValue)

            onFiltersUpdate.mockClear()
            fireEvent.change(input, {target: {value: enteredValue}})

            await waitFor(() => {
                expect(input.value).toBe(expectedValue)
                expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: label,
                    ordersSearchValue: expectedValue,
                }))
            })
        },
    )

    it.each(maskedInputCases)(
        'forwards the native contract and mask value for $label',
        async ({label, enteredValue, expectedNativeValue, expectedStoreValue}) => {
            const onFiltersUpdate = jest.fn()
            const scope = `orders-mask-${label}`
            const {container} = render(
                <SearchUIFilters
                    autoTestId={scope}
                    settingsContextName={`${scope}-context`}
                    possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    initialSearchConditions={{
                        ordersSearchLabel: label,
                        ordersSearchValue: '',
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={filtersConfig}
                />,
            )

            await waitFor(() => {
                expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: label,
                    ordersSearchValue: '',
                }))
            })

            const criterion = container.querySelector<HTMLElement>(
                `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
                + `[data-autotest="criterion"]`
                + `[data-autotest-value="${CriterionTypeEnum.ORDERS_SEARCH}"]`,
            )
            const input = within(criterion as HTMLElement).getByRole<HTMLInputElement>('textbox', {
                name: 'Order search value',
            })

            expect(input.tagName).toBe('INPUT')
            expect(input.getAttribute('data-autotest')).toBe('criterion-input')
            expect(input.hasAttribute('data-autotest-value')).toBe(false)

            onFiltersUpdate.mockClear()
            fireEvent.input(input, {target: {value: enteredValue}})

            await waitFor(() => {
                expect(input.value).toBe(expectedNativeValue)
                expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: label,
                    ordersSearchValue: expectedStoreValue,
                }))
            })
        },
    )

    it.each(countryInputLabels)(
        'restores the raw country ID for %s',
        async label => {
            const onFiltersUpdate = jest.fn()
            const {container} = render(
                <SearchUIProvider
                    defaults={{
                        getCountries: jest.fn().mockResolvedValue([
                            {id: 840, displayName: 'United States', theCode: 'US', theCode3: 'USA'},
                        ]),
                    }}
                >
                    <SearchUIFilters
                        autoTestId={`country-${label}`}
                        settingsContextName={`country-${label}-context`}
                        possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        initialSearchConditions={{
                            ordersSearchLabel: label,
                            ordersSearchValue: '840',
                        }}
                        onFiltersUpdate={onFiltersUpdate}
                        config={filtersConfig}
                    />
                </SearchUIProvider>,
            )
            const input = container.querySelector<HTMLElement>(
                '[role="combobox"][data-autotest="criterion-input"]',
            )

            await waitFor(() => {
                expect(input?.getAttribute('data-autotest-value')).toBe('840')
                expect(input?.textContent).toContain('United States')
                expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: label,
                    ordersSearchValue: '840',
                }))
            })
        },
    )

    it('restores and scopes country selection across two asynchronous portals', async () => {
        const countries = [
            {id: 840, displayName: 'United States', theCode: 'US', theCode3: 'USA'},
            {id: 826, displayName: 'United Kingdom', theCode: 'GB', theCode3: 'GBR'},
            {id: 124, displayName: 'Canada', theCode: 'CA', theCode3: 'CAN'},
        ]
        const getCountries = jest.fn().mockResolvedValue(countries)
        const ordersOnFiltersUpdate = jest.fn()
        const transactionsOnFiltersUpdate = jest.fn()
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        try {
            const {container} = render(
                <SearchUIProvider defaults={{getCountries}}>
                    <SearchUIFilters
                        autoTestId="orders-country"
                        settingsContextName="orders-country-context"
                        possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        initialSearchConditions={{
                            ordersSearchLabel: 'customer_ip_country',
                            ordersSearchValue: '840',
                        }}
                        onFiltersUpdate={ordersOnFiltersUpdate}
                        config={filtersConfig}
                    />
                    <SearchUIFilters
                        autoTestId="transactions-country"
                        settingsContextName="transactions-country-context"
                        possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                        initialSearchConditions={{
                            ordersSearchLabel: 'source_country',
                            ordersSearchValue: '826',
                        }}
                        onFiltersUpdate={transactionsOnFiltersUpdate}
                        config={filtersConfig}
                    />
                </SearchUIProvider>,
            )

            const getCountryInput = (scope: string) => container.querySelector<HTMLElement>(
                `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
                + `[data-autotest="criterion"]`
                + `[data-autotest-value="${CriterionTypeEnum.ORDERS_SEARCH}"] `
                + `[role="combobox"][data-autotest="criterion-input"]`,
            )
            const ordersInput = getCountryInput('orders-country')
            const transactionsInput = getCountryInput('transactions-country')

            expect(ordersInput?.getAttribute('aria-label')).toBe('Order search value')
            expect(ordersInput?.getAttribute('aria-busy')).toBe('true')
            expect(ordersInput?.getAttribute('aria-disabled')).toBe('true')
            expect(ordersInput?.hasAttribute('data-autotest-value')).toBe(false)

            await waitFor(() => {
                expect(ordersInput?.getAttribute('aria-busy')).toBe('false')
                expect(ordersInput?.getAttribute('aria-disabled')).not.toBe('true')
                expect(ordersInput?.getAttribute('data-autotest-value')).toBe('840')
                expect(transactionsInput?.getAttribute('data-autotest-value')).toBe('826')
            })
            expect(getCountries).toHaveBeenCalledTimes(2)

            fireEvent.mouseDown(ordersInput as HTMLElement)
            fireEvent.mouseDown(transactionsInput as HTMLElement)

            const getOwnedOptions = (scope: string) => document.body.querySelector<HTMLElement>(
                `[role="listbox"][data-autotest="criterion-input-options"]`
                + `[data-autotest-value="${scope}"]`
                + `[data-autotest-criterion="${CriterionTypeEnum.ORDERS_SEARCH}"]`,
            )

            await waitFor(() => {
                expect(getOwnedOptions('orders-country')).not.toBeNull()
                expect(getOwnedOptions('transactions-country')).not.toBeNull()
            })

            const ordersOptions = getOwnedOptions('orders-country') as HTMLElement
            const transactionsOptions = getOwnedOptions('transactions-country') as HTMLElement
            const ordersUnitedStates = ordersOptions.querySelector<HTMLElement>(
                '[role="option"][data-autotest="criterion-input-option"][data-autotest-value="840"]',
            )
            const ordersUnitedKingdom = ordersOptions.querySelector<HTMLElement>(
                '[role="option"][data-autotest="criterion-input-option"][data-autotest-value="826"]',
            )
            const ordersCanada = ordersOptions.querySelector<HTMLElement>(
                '[role="option"][data-autotest="criterion-input-option"][data-autotest-value="124"]',
            )

            expect(ordersOptions.querySelectorAll('[data-autotest="criterion-input-option"]')).toHaveLength(3)
            expect(ordersInput?.getAttribute('aria-controls')).toBe(ordersOptions.id)
            expect(transactionsInput?.getAttribute('aria-controls')).toBe(transactionsOptions.id)
            expect(container.contains(ordersOptions)).toBe(false)
            expect(container.contains(transactionsOptions)).toBe(false)
            expect(ordersUnitedStates?.getAttribute('aria-selected')).toBe('true')
            expect(ordersUnitedKingdom?.getAttribute('aria-selected')).toBe('false')
            expect(ordersCanada?.getAttribute('aria-selected')).toBe('false')
            expect(transactionsOptions.querySelector<HTMLElement>(
                '[role="option"][data-autotest="criterion-input-option"][data-autotest-value="826"]',
            )?.getAttribute('aria-selected')).toBe('true')

            ordersOnFiltersUpdate.mockClear()
            transactionsOnFiltersUpdate.mockClear()
            fireEvent.click(ordersCanada as HTMLElement)

            await waitFor(() => {
                expect(ordersInput?.getAttribute('data-autotest-value')).toBe('124')
                expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                    ordersSearchLabel: 'customer_ip_country',
                    ordersSearchValue: '124',
                }))
            })
            expect(transactionsInput?.getAttribute('data-autotest-value')).toBe('826')
            expect(transactionsOnFiltersUpdate).not.toHaveBeenCalled()
            expect(consoleWarn.mock.calls.flat().join(' ')).not.toContain('out-of-range value')
        } finally {
            consoleWarn.mockRestore()
        }
    })

    it('exposes an empty country source through native busy and disabled state', async () => {
        const {container} = render(
            <SearchUIProvider defaults={{getCountries: jest.fn().mockResolvedValue([])}}>
                <SearchUIFilters
                    autoTestId="empty-country"
                    settingsContextName="empty-country-context"
                    possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    initialSearchConditions={{ordersSearchLabel: 'dest_country'}}
                    onFiltersUpdate={jest.fn()}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )
        const input = container.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-input"]',
        )

        expect(input?.getAttribute('aria-busy')).toBe('true')

        await waitFor(() => {
            expect(input?.getAttribute('aria-busy')).toBe('false')
            expect(input?.getAttribute('aria-disabled')).toBe('true')
        })
        expect(input?.hasAttribute('data-autotest-value')).toBe(false)
    })
})
