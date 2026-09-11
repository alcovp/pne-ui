import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    AbstractEntity,
    CriterionTypeEnum,
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

const createCollectionSource = (id: number, displayName: string) => {
    const entity: AbstractEntity = {id, displayName}
    let resolve!: (options: AbstractEntity[]) => void
    const promise = new Promise<AbstractEntity[]>(resolvePromise => {
        resolve = resolvePromise
    })

    return {
        entity,
        getOptions: jest.fn(() => promise),
        promise,
        resolve,
    }
}

const transactionStatus: AbstractEntity = {
    id: 7,
    displayName: 'Authorized',
}

const getTransactionStatusCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.TRANSACTION_STATUS}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getCollectionInput = (criterion: HTMLElement): HTMLInputElement => {
    const input = criterion.querySelector<HTMLInputElement>(
        'input[role="combobox"][data-autotest="criterion-collection"]',
    )

    expect(input).not.toBeNull()

    return input as HTMLInputElement
}

const getSelectedValue = (
    criterion: HTMLElement,
    value: string | number,
): HTMLElement | null => criterion.querySelector<HTMLElement>(
    '[data-autotest="criterion-collection-value"]'
    + `[data-autotest-value="${value}"]`,
)

const getOwnedOptions = (scope: string): HTMLElement | null => (
    document.body.querySelector<HTMLElement>(
        '[role="listbox"][data-autotest="criterion-collection-options"]'
        + `[data-autotest-value="${scope}"]`
        + `[data-autotest-criterion="${CriterionTypeEnum.TRANSACTION_STATUS}"]`,
    )
)

const getOwnedPanel = (scope: string): HTMLElement | null => (
    document.body.querySelector<HTMLElement>(
        '[data-autotest="criterion-collection-panel"]'
        + `[data-autotest-value="${scope}"]`
        + `[data-autotest-criterion="${CriterionTypeEnum.TRANSACTION_STATUS}"]`,
    )
)

const getOption = (listbox: HTMLElement, value: string | number): HTMLElement | null => (
    listbox.querySelector<HTMLElement>(
        '[role="option"][data-autotest="criterion-collection-option"]'
        + `[data-autotest-value="${value}"]`,
    )
)

const openCollection = (input: HTMLInputElement) => {
    fireEvent.focus(input)
    fireEvent.mouseDown(input)
    fireEvent.keyDown(input, {key: 'ArrowDown'})
}

describe('SearchUI abstract-entity collection Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('wires every direct collection consumer to the shared native contract', async () => {
        const currencies = createCollectionSource(101, 'US Dollar')
        const cardTypes = createCollectionSource(102, 'Visa')
        const transactionTypes = createCollectionSource(103, 'Payment')
        const transactionStatuses = createCollectionSource(104, 'Authorized')
        const recurrenceTypes = createCollectionSource(105, 'Subscription')
        const recurrenceStatuses = createCollectionSource(106, 'Active')
        const mfoConfigurationTypes = createCollectionSource(107, 'MFO type')
        const markerTypes = createCollectionSource(108, 'Fraud alert')
        const consumers = [
            {criterionType: CriterionTypeEnum.CURRENCY, source: currencies},
            {criterionType: CriterionTypeEnum.CARD_TYPES, source: cardTypes},
            {criterionType: CriterionTypeEnum.TRANSACTION_TYPES, source: transactionTypes},
            {criterionType: CriterionTypeEnum.TRANSACTION_STATUS, source: transactionStatuses},
            {criterionType: CriterionTypeEnum.RECURRENCE_TYPE, source: recurrenceTypes},
            {criterionType: CriterionTypeEnum.RECURRENCE_STATUS, source: recurrenceStatuses},
            {criterionType: CriterionTypeEnum.MFO_CONFIGURATION_TYPE, source: mfoConfigurationTypes},
            {criterionType: CriterionTypeEnum.MARKER_TYPE, source: markerTypes},
        ] as const
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getCurrencies: currencies.getOptions,
                    getCardTypes: cardTypes.getOptions,
                    getTransactionTypes: transactionTypes.getOptions,
                    getTransactionStatuses: transactionStatuses.getOptions,
                    getRecurringPaymentTypes: recurrenceTypes.getOptions,
                    getRecurringPaymentStatuses: recurrenceStatuses.getOptions,
                    getMFOTypes: mfoConfigurationTypes.getOptions,
                    getTransactionMarkerTypes: markerTypes.getOptions,
                }}
            >
                <SearchUIFilters
                    autoTestId="collection-inventory"
                    settingsContextName="collection-inventory-context"
                    possibleCriteria={consumers.map(consumer => consumer.criterionType)}
                    predefinedCriteria={consumers.map(consumer => consumer.criterionType)}
                    initialSearchConditions={{
                        currencies: {all: false, entities: [currencies.entity]},
                        cardTypes: {all: false, entities: [cardTypes.entity]},
                        transactionTypes: {all: false, entities: [transactionTypes.entity]},
                        transactionStatuses: {all: false, entities: [transactionStatuses.entity]},
                        recurrenceTypes: {all: false, entities: [recurrenceTypes.entity]},
                        recurrenceStatuses: {all: false, entities: [recurrenceStatuses.entity]},
                        mfoConfigurationTypes: {all: false, entities: [mfoConfigurationTypes.entity]},
                        markerTypes: {all: false, entities: [markerTypes.entity]},
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            for (const {source} of consumers) {
                expect(source.getOptions).toHaveBeenCalledTimes(1)
            }
            expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                currencies: [currencies.entity.id],
                cardTypes: [cardTypes.entity.id],
                transactionTypes: [transactionTypes.entity.id],
                transactionStatuses: [transactionStatuses.entity.id],
                recurrenceTypes: [recurrenceTypes.entity.id],
                recurrenceStatuses: [recurrenceStatuses.entity.id],
                mfoConfigurationTypes: [mfoConfigurationTypes.entity.id],
                markerTypes: [markerTypes.entity.id],
            }))
        })

        await act(async () => {
            for (const {source} of consumers) {
                source.resolve([source.entity])
            }
            await Promise.all(consumers.map(consumer => consumer.source.promise))
        })

        const filters = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="collection-inventory"]',
        )

        expect(filters).not.toBeNull()

        for (const {criterionType, source} of consumers) {
            const criterion = filters?.querySelector<HTMLElement>(
                `[data-autotest="criterion"][data-autotest-value="${criterionType}"]`,
            )
            const input = criterion?.querySelector<HTMLInputElement>(
                'input[role="combobox"][data-autotest="criterion-collection"]',
            )

            expect(criterion).not.toBeNull()
            expect(input).not.toBeNull()
            expect(input?.tagName).toBe('INPUT')
            expect(input?.getAttribute('aria-label')).toBe(`react.CriterionTypeEnum.${criterionType}`)
            expect(input?.hasAttribute('data-autotest-value')).toBe(false)
            expect(getSelectedValue(criterion as HTMLElement, source.entity.id)).not.toBeNull()
            expect(getSelectedValue(criterion as HTMLElement, 'all')).toBeNull()
        }
    })

    it('keeps explicit All state truthful and owner-scopes two collection portals', async () => {
        const getTransactionStatuses = jest.fn().mockResolvedValue([transactionStatus])
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getTransactionStatuses,
                }}
            >
                <SearchUIFilters
                    autoTestId="transaction-status-all"
                    settingsContextName="transaction-status-all-context"
                    possibleCriteria={[CriterionTypeEnum.TRANSACTION_STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_STATUS]}
                    initialSearchConditions={{
                        transactionStatuses: {
                            all: true,
                            entities: [],
                        },
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="transaction-status-entity"
                    settingsContextName="transaction-status-entity-context"
                    possibleCriteria={[CriterionTypeEnum.TRANSACTION_STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_STATUS]}
                    initialSearchConditions={{
                        transactionStatuses: {
                            all: false,
                            entities: [transactionStatus],
                        },
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getTransactionStatuses).toHaveBeenCalledTimes(2)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionStatuses: [],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionStatuses: [transactionStatus.id],
            }))
        })

        const firstCriterion = getTransactionStatusCriterion(container, 'transaction-status-all')
        const secondCriterion = getTransactionStatusCriterion(container, 'transaction-status-entity')
        const firstInput = getCollectionInput(firstCriterion)
        const secondInput = getCollectionInput(secondCriterion)

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, 'all')).not.toBeNull()
            expect(getSelectedValue(secondCriterion, transactionStatus.id)).not.toBeNull()
        })

        expect(firstInput.tagName).toBe('INPUT')
        expect(secondInput.tagName).toBe('INPUT')
        expect(firstInput.getAttribute('aria-label')).toBe('react.CriterionTypeEnum.TRANSACTION_STATUS')
        expect(secondInput.getAttribute('aria-label')).toBe('react.CriterionTypeEnum.TRANSACTION_STATUS')
        expect(firstInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(secondInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(getSelectedValue(firstCriterion, transactionStatus.id)).toBeNull()
        expect(getSelectedValue(secondCriterion, 'all')).toBeNull()

        openCollection(firstInput)
        openCollection(secondInput)

        await waitFor(() => {
            expect(getOwnedPanel('transaction-status-all')).not.toBeNull()
            expect(getOwnedPanel('transaction-status-entity')).not.toBeNull()
            expect(getOwnedOptions('transaction-status-all')).not.toBeNull()
            expect(getOwnedOptions('transaction-status-entity')).not.toBeNull()
        })

        const firstOptions = getOwnedOptions('transaction-status-all') as HTMLElement
        const secondOptions = getOwnedOptions('transaction-status-entity') as HTMLElement

        for (const [criterion, input, listbox] of [
            [firstCriterion, firstInput, firstOptions],
            [secondCriterion, secondInput, secondOptions],
        ] as const) {
            expect(input.getAttribute('aria-expanded')).toBe('true')
            expect(input.getAttribute('aria-controls')).toBe(listbox.id)
            expect(criterion.contains(listbox)).toBe(false)
            expect(listbox.getAttribute('aria-label')).toBe(
                'react.CriterionTypeEnum.TRANSACTION_STATUS',
            )
            expect(listbox.hasAttribute('aria-labelledby')).toBe(false)
            expect(listbox.querySelectorAll(
                '[role="option"][data-autotest="criterion-collection-option"]',
            )).toHaveLength(2)
            expect(getOption(listbox, 'all')).not.toBeNull()
            expect(getOption(listbox, transactionStatus.id)).not.toBeNull()
            expect(getOption(listbox, 'all')?.querySelector(
                'input[type="checkbox"], [role="checkbox"]',
            )).toBeNull()
        }

        expect(getOption(firstOptions, 'all')?.getAttribute('aria-selected')).toBe('true')
        expect(getOption(firstOptions, transactionStatus.id)?.getAttribute('aria-selected')).toBe('false')
        expect(getOption(secondOptions, 'all')?.getAttribute('aria-selected')).toBe('false')
        expect(getOption(secondOptions, transactionStatus.id)?.getAttribute('aria-selected')).toBe('true')

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(getOption(firstOptions, 'all') as HTMLElement)

        expect(firstOnFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.click(getOption(firstOptions, transactionStatus.id) as HTMLElement)

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, transactionStatus.id)).not.toBeNull()
            expect(getSelectedValue(firstCriterion, 'all')).toBeNull()
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionStatuses: [transactionStatus.id],
            }))
        })
        expect(getSelectedValue(secondCriterion, transactionStatus.id)).not.toBeNull()
        expect(getSelectedValue(secondCriterion, 'all')).toBeNull()
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        const updatedFirstOptions = getOwnedOptions('transaction-status-all') as HTMLElement

        expect(getOption(updatedFirstOptions, 'all')?.getAttribute('aria-selected')).toBe('false')
        expect(getOption(updatedFirstOptions, transactionStatus.id)?.getAttribute('aria-selected')).toBe('true')

        firstOnFiltersUpdate.mockClear()
        fireEvent.focus(firstInput)
        fireEvent.keyDown(firstInput, {key: 'Home'})
        fireEvent.keyDown(firstInput, {key: 'Enter'})

        await waitFor(() => {
            expect(getSelectedValue(firstCriterion, 'all')).not.toBeNull()
            expect(getSelectedValue(firstCriterion, transactionStatus.id)).toBeNull()
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionStatuses: [],
            }))
        })
        expect(getSelectedValue(secondCriterion, transactionStatus.id)).not.toBeNull()
        expect(getSelectedValue(secondCriterion, 'all')).toBeNull()
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })
})
