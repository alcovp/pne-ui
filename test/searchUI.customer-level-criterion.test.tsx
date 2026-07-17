import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    CustomerLevel,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIFilters,
    SearchUIProvider,
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

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const quietAsyncDefaults = {
    getCurrencies: neverResolves,
    getSearchTemplates: neverResolves,
}

const createMerchantCriterion = (selectedItems: string): MultigetCriterion => ({
    entityType: LinkedEntityTypeEnum.MERCHANT,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems,
    selectedItemNames: selectedItems.split(',').map(id => `Merchant ${id}`).join(','),
    deselectedItems: '',
    deselectedItemNames: '',
})

const createDeferredLevels = () => {
    let resolve!: (levels: CustomerLevel[]) => void
    const promise = new Promise<CustomerLevel[]>(resolvePromise => {
        resolve = resolvePromise
    })

    return {promise, resolve}
}

const getCustomerLevelCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.CUSTOMER_LEVEL}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getCustomerLevelControl = (criterion: HTMLElement): HTMLElement => {
    const control = criterion.querySelector<HTMLElement>(
        '[role="combobox"][data-autotest="criterion-customer-level"]',
    )

    expect(control).not.toBeNull()

    return control as HTMLElement
}

describe('SearchUI Customer Level Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('preserves restored levels and scopes async options across instances', async () => {
        const firstLevels = createDeferredLevels()
        const secondLevels = createDeferredLevels()
        const getCustomerLevels = jest.fn(({merchantId}: {merchantId: number}) => {
            if (merchantId === 42) return firstLevels.promise
            if (merchantId === 43) return secondLevels.promise
            throw new Error(`Unexpected merchant ${merchantId}`)
        })
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const {container} = render(
            <SearchUIProvider defaults={{...quietAsyncDefaults, getCustomerLevels}}>
                <>
                    <SearchUIFilters
                        autoTestId="customer-level-first"
                        settingsContextName="customer-level-first-context"
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
                            multigetCriteria: [createMerchantCriterion('42')],
                            currencies: {
                                all: false,
                                entities: [
                                    {id: 978, displayName: 'EUR'},
                                    {id: 840, displayName: 'USD'},
                                ],
                            },
                            customerLevel: {id: 7, displayName: 'VIP'},
                        }}
                        onFiltersUpdate={firstOnFiltersUpdate}
                        config={filtersConfig}
                    />
                    <SearchUIFilters
                        autoTestId="customer-level-second"
                        settingsContextName="customer-level-second-context"
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
                            multigetCriteria: [createMerchantCriterion('43')],
                            currencies: {
                                all: true,
                                entities: [],
                            },
                            customerLevel: {id: 8, displayName: 'Regular'},
                        }}
                        onFiltersUpdate={secondOnFiltersUpdate}
                        config={filtersConfig}
                    />
                </>
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getCustomerLevels).toHaveBeenCalledWith({
                merchantId: 42,
                currencyIds: [840, 978],
            })
            expect(getCustomerLevels).toHaveBeenCalledWith({
                merchantId: 43,
                currencyIds: [],
            })
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                customerLevelId: 7,
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                customerLevelId: 8,
            }))
        })

        const firstCriterion = getCustomerLevelCriterion(container, 'customer-level-first')
        const secondCriterion = getCustomerLevelCriterion(container, 'customer-level-second')
        const firstControl = getCustomerLevelControl(firstCriterion)
        const secondControl = getCustomerLevelControl(secondCriterion)

        expect(firstControl.getAttribute('aria-label')).toBe('Customer level')
        expect(firstControl.getAttribute('data-autotest-value')).toBe('7')
        expect(firstControl.getAttribute('aria-busy')).toBe('true')
        expect(firstControl.getAttribute('aria-disabled')).toBe('true')
        expect(secondControl.getAttribute('data-autotest-value')).toBe('8')
        expect(secondControl.getAttribute('aria-busy')).toBe('true')
        expect(secondControl.getAttribute('aria-disabled')).toBe('true')
        expect(firstCriterion.querySelector(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()
        expect(secondCriterion.querySelector(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()
        expect(firstCriterion.querySelector(
            'input[data-autotest="criterion-customer-level"]',
        )).toBeNull()

        const firstOptions: CustomerLevel[] = [
            {id: 7, displayName: 'VIP'},
            {id: 9, displayName: 'Gold'},
        ]
        const secondOptions: CustomerLevel[] = [
            {id: 8, displayName: 'Regular'},
            {id: 10, displayName: 'Basic'},
        ]

        await act(async () => {
            firstLevels.resolve(firstOptions)
            secondLevels.resolve(secondOptions)
            await Promise.all([firstLevels.promise, secondLevels.promise])
        })

        await waitFor(() => {
            expect(firstControl.getAttribute('aria-busy')).toBe('false')
            expect(firstControl.hasAttribute('aria-disabled')).toBe(false)
            expect(secondControl.getAttribute('aria-busy')).toBe('false')
            expect(secondControl.hasAttribute('aria-disabled')).toBe(false)
        })
        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )

        fireEvent.mouseDown(firstControl)
        fireEvent.mouseDown(secondControl)

        await waitFor(() => {
            expect(document.body.querySelectorAll(
                '[data-autotest="criterion-customer-level-options"]',
            )).toHaveLength(2)
        })

        for (const [scope, selectedId, options, criterion, control] of [
            ['customer-level-first', 7, firstOptions, firstCriterion, firstControl],
            ['customer-level-second', 8, secondOptions, secondCriterion, secondControl],
        ] as const) {
            const listboxId = control.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(control.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('data-autotest-criterion')).toBe(
                CriterionTypeEnum.CUSTOMER_LEVEL,
            )
            expect(listbox && criterion.contains(listbox)).toBe(false)
            expect(listbox?.querySelectorAll(
                '[role="option"][data-autotest="criterion-customer-level-option"]',
            )).toHaveLength(options.length)

            for (const option of options) {
                const optionElement = listbox?.querySelector<HTMLElement>(
                    '[role="option"][data-autotest="criterion-customer-level-option"]'
                    + `[data-autotest-value="${option.id}"]`,
                )

                expect(optionElement).not.toBeNull()
                expect(optionElement?.getAttribute('aria-selected')).toBe(
                    String(option.id === selectedId),
                )
            }
        }

        const firstListboxId = firstControl.getAttribute('aria-controls')
        const firstListbox = firstListboxId ? document.getElementById(firstListboxId) : null
        const goldOption = firstListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-customer-level-option"]'
            + '[data-autotest-value="9"]',
        )

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(goldOption as HTMLElement)

        await waitFor(() => {
            expect(firstControl.getAttribute('data-autotest-value')).toBe('9')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                customerLevelId: 9,
            }))
        })
        expect(secondControl.getAttribute('data-autotest-value')).toBe('8')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )
    })

    it('stays idle and disabled without exactly one concrete merchant', async () => {
        const getCustomerLevels = jest.fn().mockResolvedValue([])
        const {container} = render(
            <SearchUIProvider defaults={{...quietAsyncDefaults, getCustomerLevels}}>
                <SearchUIFilters
                    autoTestId="customer-level-multiple-merchants"
                    settingsContextName="customer-level-multiple-merchants-context"
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
                        multigetCriteria: [createMerchantCriterion('42,43')],
                    }}
                    onFiltersUpdate={jest.fn()}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        const criterion = getCustomerLevelCriterion(container, 'customer-level-multiple-merchants')
        const control = getCustomerLevelControl(criterion)

        expect(criterion.textContent).toContain('Select a merchant first')
        expect(control.getAttribute('aria-busy')).toBe('false')
        expect(control.getAttribute('aria-disabled')).toBe('true')
        expect(control.hasAttribute('data-autotest-value')).toBe(false)
        expect(getCustomerLevels).not.toHaveBeenCalled()

        fireEvent.mouseDown(control)
        expect(document.body.querySelector(
            '[data-autotest="criterion-customer-level-options"]',
        )).toBeNull()
    })

    it('distinguishes pending and successfully empty options', async () => {
        const levels = createDeferredLevels()
        const getCustomerLevels = jest.fn(() => levels.promise)
        const {container} = render(
            <SearchUIProvider defaults={{...quietAsyncDefaults, getCustomerLevels}}>
                <SearchUIFilters
                    autoTestId="customer-level-empty"
                    settingsContextName="customer-level-empty-context"
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
                        multigetCriteria: [createMerchantCriterion('42')],
                    }}
                    onFiltersUpdate={jest.fn()}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getCustomerLevels).toHaveBeenCalledWith({
                merchantId: 42,
                currencyIds: [],
            })
        })

        const criterion = getCustomerLevelCriterion(container, 'customer-level-empty')
        const control = getCustomerLevelControl(criterion)

        expect(control.getAttribute('aria-busy')).toBe('true')
        expect(control.getAttribute('aria-disabled')).toBe('true')

        await act(async () => {
            levels.resolve([])
            await levels.promise
        })

        await waitFor(() => {
            expect(control.getAttribute('aria-busy')).toBe('false')
            expect(criterion.textContent).toContain('No customer levels available')
        })
        expect(control.getAttribute('aria-disabled')).toBe('true')

        fireEvent.mouseDown(control)
        expect(document.body.querySelector(
            '[data-autotest="criterion-customer-level-options"]',
        )).toBeNull()
    })

    it('keeps a restored level disabled but intact after a rejected request', async () => {
        const requestError = new Error('Customer levels unavailable')
        const getCustomerLevels = jest.fn().mockRejectedValue(requestError)
        const onFiltersUpdate = jest.fn()
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const {container} = render(
            <SearchUIProvider defaults={{...quietAsyncDefaults, getCustomerLevels}}>
                <SearchUIFilters
                    autoTestId="customer-level-error"
                    settingsContextName="customer-level-error-context"
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
                        multigetCriteria: [createMerchantCriterion('42')],
                        customerLevel: {id: 7, displayName: 'VIP'},
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        const criterion = getCustomerLevelCriterion(container, 'customer-level-error')
        const control = getCustomerLevelControl(criterion)

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(requestError)
            expect(control.getAttribute('aria-busy')).toBe('false')
        })

        expect(control.getAttribute('aria-disabled')).toBe('true')
        expect(control.getAttribute('data-autotest-value')).toBe('7')
        expect(criterion.textContent).toContain('VIP')
        expect(criterion.textContent).not.toContain('No customer levels available')
        expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            customerLevelId: 7,
        }))
    })
})
