import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
    ORDER_SEARCH_LABELS,
    SearchUIFilters,
} from '../src'
import {ORDERS_SEARCH_LABEL_GROUPS} from '../src/component/search-ui/filters/component/select/SearchUICollapsableGroupSelect'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const hiddenOrderSearchLabels = [
    'customer_dna_id',
    'registration_info_id',
    'inn',
    'mtcn',
    'rebill',
    'swift_number',
    'webmoney_account',
    'yamoney_account',
    'wire_account',
    'card_number_hash_hash',
] as const

const groupInventory = [
    ['main', 7],
    ['customer', 7],
    ['source-card', 12],
    ['destination-card', 11],
    ['wire', 2],
    ['card-present-api', 3],
    ['mobile-api', 3],
] as const

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const getOrdersCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const filters = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
    )
    const criterion = filters?.querySelector<HTMLElement>(
        `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.ORDERS_SEARCH}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getLabelTrigger = (criterion: HTMLElement): HTMLButtonElement => {
    const trigger = criterion.querySelector<HTMLButtonElement>(
        'button[role="combobox"][data-autotest="criterion-label"]',
    )

    expect(trigger).not.toBeNull()

    return trigger as HTMLButtonElement
}

const getOwnedDialog = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    `[role="dialog"][data-autotest="criterion-label-options"]`
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.ORDERS_SEARCH}"]`,
)

describe('SearchUI orders-search grouped label Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('preserves the seven-group and 45-label product inventory', () => {
        expect(ORDERS_SEARCH_LABEL_GROUPS.map(group => [
            group.autoTestValue,
            group.items.length,
        ])).toEqual(groupInventory)

        const selectableLabels = ORDERS_SEARCH_LABEL_GROUPS.flatMap(group => (
            group.items.map(item => item.value)
        ))
        const expectedSelectableLabels = ORDER_SEARCH_LABELS.filter(label => (
            !hiddenOrderSearchLabels.includes(label as typeof hiddenOrderSearchLabels[number])
        ))

        expect(selectableLabels).toHaveLength(45)
        expect(new Set(selectableLabels).size).toBe(45)
        expect([...selectableLabels].sort()).toEqual([...expectedSelectableLabels].sort())
    })

    it('scopes native disclosures and radio choices across two selector portals', async () => {
        const ordersOnFiltersUpdate = jest.fn()
        const transactionsOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="orders-labels"
                    settingsContextName="orders-labels-context"
                    possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    initialSearchConditions={{
                        ordersSearchLabel: 'merchant_invoice_id',
                        ordersSearchValue: 'invoice-001',
                    }}
                    onFiltersUpdate={ordersOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="transaction-labels"
                    settingsContextName="transaction-labels-context"
                    possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
                    initialSearchConditions={{
                        ordersSearchLabel: 'customer_email',
                        ordersSearchValue: 'person@example.test',
                    }}
                    onFiltersUpdate={transactionsOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                ordersSearchLabel: 'merchant_invoice_id',
                ordersSearchValue: 'invoice-001',
            }))
            expect(transactionsOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                ordersSearchLabel: 'customer_email',
                ordersSearchValue: 'person@example.test',
            }))
        })

        const ordersCriterion = getOrdersCriterion(container, 'orders-labels')
        const transactionsCriterion = getOrdersCriterion(container, 'transaction-labels')
        const ordersTrigger = getLabelTrigger(ordersCriterion)
        const transactionsTrigger = getLabelTrigger(transactionsCriterion)

        expect(ordersTrigger.type).toBe('button')
        expect(ordersTrigger.getAttribute('aria-label')).toBe('Order search field')
        expect(ordersTrigger.getAttribute('aria-haspopup')).toBe('dialog')
        expect(ordersTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(ordersTrigger.getAttribute('data-autotest-value')).toBe('merchant_invoice_id')
        expect(transactionsTrigger.getAttribute('data-autotest-value')).toBe('customer_email')

        fireEvent.keyDown(ordersTrigger, {key: 'ArrowDown'})
        fireEvent.click(transactionsTrigger)

        await waitFor(() => {
            expect(getOwnedDialog('orders-labels')).not.toBeNull()
            expect(getOwnedDialog('transaction-labels')).not.toBeNull()
        })

        const ordersDialog = getOwnedDialog('orders-labels') as HTMLElement
        const transactionsDialog = getOwnedDialog('transaction-labels') as HTMLElement

        for (const [scope, criterion, trigger, dialog, selectedLabel] of [
            ['orders-labels', ordersCriterion, ordersTrigger, ordersDialog, 'merchant_invoice_id'],
            ['transaction-labels', transactionsCriterion, transactionsTrigger, transactionsDialog, 'customer_email'],
        ] as const) {
            const groups = dialog.querySelectorAll<HTMLElement>(
                'summary[data-autotest="criterion-label-group"]',
            )
            const radios = dialog.querySelectorAll<HTMLInputElement>(
                'input[type="radio"][data-autotest="criterion-label-option"]',
            )
            const checkedRadios = Array.from(radios).filter(radio => radio.checked)

            expect(trigger.getAttribute('aria-expanded')).toBe('true')
            expect(trigger.getAttribute('aria-controls')).toBe(dialog.id)
            expect(dialog.getAttribute('data-autotest-value')).toBe(scope)
            expect(criterion.contains(dialog)).toBe(false)
            expect(dialog.querySelectorAll('[role="option"]')).toHaveLength(0)
            expect(dialog.querySelectorAll('fieldset')).toHaveLength(1)
            expect(groups).toHaveLength(7)
            expect(radios).toHaveLength(45)
            expect(radios[0].tagName).toBe('INPUT')
            expect(radios[0].type).toBe('radio')
            expect(radios[0].getAttribute('aria-hidden')).toBeNull()
            expect(new Set(Array.from(radios, radio => radio.name)).size).toBe(1)
            expect(new Set(Array.from(radios, radio => radio.value)).size).toBe(45)
            expect(checkedRadios).toHaveLength(1)
            expect(checkedRadios[0].value).toBe(selectedLabel)

            for (const [groupValue] of groupInventory) {
                const summary = dialog.querySelector<HTMLElement>(
                    `summary[data-autotest="criterion-label-group"]`
                    + `[data-autotest-value="${groupValue}"]`,
                )

                expect(summary?.tagName).toBe('SUMMARY')
                expect(summary?.tabIndex).toBe(0)
                expect(summary?.getAttribute('aria-expanded')).toBe('true')
                expect((summary?.parentElement as HTMLDetailsElement | null)?.open).toBe(true)
            }
        }

        const ordersRadioName = ordersDialog.querySelector<HTMLInputElement>('input[type="radio"]')?.name
        const transactionsRadioName = transactionsDialog.querySelector<HTMLInputElement>('input[type="radio"]')?.name

        expect(ordersRadioName).not.toBe(transactionsRadioName)

        const ordersMainGroup = ordersDialog.querySelector<HTMLElement>(
            'summary[data-autotest="criterion-label-group"][data-autotest-value="main"]',
        )
        const transactionsMainGroup = transactionsDialog.querySelector<HTMLElement>(
            'summary[data-autotest="criterion-label-group"][data-autotest-value="main"]',
        )

        fireEvent.click(ordersMainGroup as HTMLElement)

        await waitFor(() => {
            expect(ordersMainGroup?.getAttribute('aria-expanded')).toBe('false')
        })
        expect((ordersMainGroup?.parentElement as HTMLDetailsElement | null)?.open).toBe(false)
        expect(transactionsMainGroup?.getAttribute('aria-expanded')).toBe('true')
        expect(JSON.parse(
            localStorage.getItem('SearchUI_ordersSearch_expandedGroups') ?? '{}',
        )['searchLabelGroupID.orders.main']).toBe(false)

        const sourceLast4 = ordersDialog.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-label-option"][data-autotest-value="source_last4"]',
        )

        ordersOnFiltersUpdate.mockClear()
        fireEvent.click(sourceLast4 as HTMLInputElement)

        await waitFor(() => {
            expect(ordersTrigger.getAttribute('data-autotest-value')).toBe('source_last4')
            expect(ordersTrigger.getAttribute('aria-expanded')).toBe('false')
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                ordersSearchLabel: 'source_last4',
                ordersSearchValue: 'invoice-001',
            }))
        })
        expect(transactionsTrigger.getAttribute('data-autotest-value')).toBe('customer_email')
        expect(transactionsDialog.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-label-option"][data-autotest-value="customer_email"]',
        )?.checked).toBe(true)

        fireEvent.click(ordersTrigger)

        const reopenedOrdersDialog = await waitFor(() => {
            const dialog = getOwnedDialog('orders-labels')
            expect(dialog).not.toBeNull()
            return dialog as HTMLElement
        })
        const sourceBin = reopenedOrdersDialog.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-label-option"][data-autotest-value="source_bin"]',
        )

        fireEvent.click(sourceBin as HTMLInputElement)

        await waitFor(() => {
            expect(ordersTrigger.getAttribute('data-autotest-value')).toBe('source_bin')
            expect(ordersCriterion.querySelector<HTMLInputElement>(
                'input[data-autotest="criterion-input"]',
            )?.value).toBe('')
        })
        expect(transactionsTrigger.getAttribute('data-autotest-value')).toBe('customer_email')
    })
})
