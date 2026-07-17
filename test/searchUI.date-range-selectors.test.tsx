import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
    DATE_RANGE_SPEC_TYPES,
    SearchUIFilters,
} from '../src'
import {ORDER_DATE_TYPES} from '../src/component/search-ui/filters/types'

type DateRangeSpecType = typeof DATE_RANGE_SPEC_TYPES[number]

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const createDateRangeSpec = (dateRangeSpecType: DateRangeSpecType) => ({
    dateRangeSpecType,
    dateFrom: new Date('2026-07-01T00:00:00.000Z'),
    dateTo: new Date('2026-07-02T00:00:00.000Z'),
    beforeCount: 1,
})

const getDateCriterion = (
    container: HTMLElement,
    scope: string,
    criterionType: CriterionTypeEnum,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"][data-autotest-value="${criterionType}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

describe('SearchUI date-range selector Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('scopes every raw range-spec option across both date criteria', async () => {
        const dateRangeOnFiltersUpdate = jest.fn()
        const ordersDateRangeOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="date-range"
                    settingsContextName="date-range-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('TODAY'),
                    }}
                    onFiltersUpdate={dateRangeOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="orders-date-range"
                    settingsContextName="orders-date-range-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('LAST_MONTH'),
                    }}
                    onFiltersUpdate={ordersDateRangeOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(dateRangeOnFiltersUpdate).toHaveBeenCalled()
            expect(ordersDateRangeOnFiltersUpdate).toHaveBeenCalled()
        })

        const dateRangeCriterion = getDateCriterion(
            container,
            'date-range',
            CriterionTypeEnum.DATE_RANGE,
        )
        const ordersDateRangeCriterion = getDateCriterion(
            container,
            'orders-date-range',
            CriterionTypeEnum.DATE_RANGE_ORDERS,
        )
        const dateRangeTrigger = dateRangeCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-range-spec"]',
        )
        const ordersDateRangeTrigger = ordersDateRangeCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-range-spec"]',
        )

        expect(dateRangeTrigger?.getAttribute('aria-label')).toBe('Date range type')
        expect(dateRangeTrigger?.getAttribute('data-autotest-value')).toBe('TODAY')
        expect(ordersDateRangeTrigger?.getAttribute('aria-label')).toBe('Date range type')
        expect(ordersDateRangeTrigger?.getAttribute('data-autotest-value')).toBe('LAST_MONTH')
        expect(dateRangeCriterion.querySelector(
            '[data-autotest="criterion-order-date-type"]',
        )).toBeNull()
        expect(dateRangeCriterion.querySelector(
            '[aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()
        expect(ordersDateRangeCriterion.querySelector(
            '[aria-hidden="true"][tabindex="-1"]',
        )).not.toBeNull()

        fireEvent.mouseDown(dateRangeTrigger as HTMLElement)
        fireEvent.mouseDown(ordersDateRangeTrigger as HTMLElement)

        await waitFor(() => {
            expect(document.body.querySelectorAll(
                '[data-autotest="criterion-range-spec-options"]',
            )).toHaveLength(2)
        })

        for (const [scope, criterionType, criterion, trigger] of [
            [
                'date-range',
                CriterionTypeEnum.DATE_RANGE,
                dateRangeCriterion,
                dateRangeTrigger,
            ],
            [
                'orders-date-range',
                CriterionTypeEnum.DATE_RANGE_ORDERS,
                ordersDateRangeCriterion,
                ordersDateRangeTrigger,
            ],
        ] as const) {
            const listboxId = trigger?.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(trigger?.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox?.getAttribute('data-autotest')).toBe('criterion-range-spec-options')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('data-autotest-criterion')).toBe(criterionType)
            expect(listbox && criterion.contains(listbox)).toBe(false)
            expect(listbox?.querySelectorAll(
                '[role="option"][data-autotest="criterion-range-spec-option"]',
            )).toHaveLength(DATE_RANGE_SPEC_TYPES.length)

            for (const rangeSpecType of DATE_RANGE_SPEC_TYPES) {
                expect(listbox?.querySelector(
                    `[role="option"][data-autotest="criterion-range-spec-option"]`
                    + `[data-autotest-value="${rangeSpecType}"]`,
                )).not.toBeNull()
            }
        }

        const dateRangeListboxId = dateRangeTrigger?.getAttribute('aria-controls')
        const dateRangeListbox = dateRangeListboxId
            ? document.getElementById(dateRangeListboxId)
            : null
        const todayOption = dateRangeListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-range-spec-option"]'
            + '[data-autotest-value="TODAY"]',
        )
        const yesterdayOption = dateRangeListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-range-spec-option"]'
            + '[data-autotest-value="YESTERDAY"]',
        )

        expect(todayOption?.getAttribute('aria-selected')).toBe('true')
        expect(yesterdayOption?.getAttribute('aria-selected')).toBe('false')

        dateRangeOnFiltersUpdate.mockClear()
        ordersDateRangeOnFiltersUpdate.mockClear()
        fireEvent.click(yesterdayOption as HTMLElement)

        await waitFor(() => {
            expect(dateRangeTrigger?.getAttribute('data-autotest-value')).toBe('YESTERDAY')
            expect(dateRangeOnFiltersUpdate).toHaveBeenCalled()
        })
        expect(ordersDateRangeTrigger?.getAttribute('data-autotest-value')).toBe('LAST_MONTH')
        expect(ordersDateRangeOnFiltersUpdate).not.toHaveBeenCalled()
    })

    it('scopes every raw order-date option across orders criteria', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="orders-date-first"
                    settingsContextName="orders-date-first-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('TODAY'),
                        orderDateType: 'SESSION_STATUS_CHANGED',
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="orders-date-second"
                    settingsContextName="orders-date-second-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('YESTERDAY'),
                        orderDateType: 'SESSION_CREATED',
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                orderDateType: 'SESSION_STATUS_CHANGED',
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                orderDateType: 'SESSION_CREATED',
            }))
        })

        const firstCriterion = getDateCriterion(
            container,
            'orders-date-first',
            CriterionTypeEnum.DATE_RANGE_ORDERS,
        )
        const secondCriterion = getDateCriterion(
            container,
            'orders-date-second',
            CriterionTypeEnum.DATE_RANGE_ORDERS,
        )
        const firstTrigger = firstCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-order-date-type"]',
        )
        const secondTrigger = secondCriterion.querySelector<HTMLElement>(
            '[role="combobox"][data-autotest="criterion-order-date-type"]',
        )

        expect(firstTrigger?.getAttribute('aria-label')).toBe('Order date type')
        expect(firstTrigger?.getAttribute('data-autotest-value')).toBe('SESSION_STATUS_CHANGED')
        expect(secondTrigger?.getAttribute('aria-label')).toBe('Order date type')
        expect(secondTrigger?.getAttribute('data-autotest-value')).toBe('SESSION_CREATED')
        expect(firstCriterion.querySelectorAll(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).toHaveLength(2)
        expect(secondCriterion.querySelectorAll(
            '[role="button"][aria-hidden="true"][tabindex="-1"]',
        )).toHaveLength(2)

        fireEvent.mouseDown(firstTrigger as HTMLElement)
        fireEvent.mouseDown(secondTrigger as HTMLElement)

        await waitFor(() => {
            expect(document.body.querySelectorAll(
                '[data-autotest="criterion-order-date-type-options"]',
            )).toHaveLength(2)
        })

        for (const [scope, criterion, trigger] of [
            ['orders-date-first', firstCriterion, firstTrigger],
            ['orders-date-second', secondCriterion, secondTrigger],
        ] as const) {
            const listboxId = trigger?.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(trigger?.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox?.getAttribute('data-autotest')).toBe('criterion-order-date-type-options')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('data-autotest-criterion')).toBe(
                CriterionTypeEnum.DATE_RANGE_ORDERS,
            )
            expect(listbox && criterion.contains(listbox)).toBe(false)
            expect(listbox?.querySelectorAll(
                '[role="option"][data-autotest="criterion-order-date-type-option"]',
            )).toHaveLength(ORDER_DATE_TYPES.length)

            for (const orderDateType of ORDER_DATE_TYPES) {
                expect(listbox?.querySelector(
                    `[role="option"][data-autotest="criterion-order-date-type-option"]`
                    + `[data-autotest-value="${orderDateType}"]`,
                )).not.toBeNull()
            }
        }

        const firstListboxId = firstTrigger?.getAttribute('aria-controls')
        const firstListbox = firstListboxId ? document.getElementById(firstListboxId) : null
        const selectedOption = firstListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-order-date-type-option"]'
            + '[data-autotest-value="SESSION_STATUS_CHANGED"]',
        )
        const settledOption = firstListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-order-date-type-option"]'
            + '[data-autotest-value="TX_SETTLED"]',
        )

        expect(selectedOption?.getAttribute('aria-selected')).toBe('true')
        expect(settledOption?.getAttribute('aria-selected')).toBe('false')

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(settledOption as HTMLElement)

        await waitFor(() => {
            expect(firstTrigger?.getAttribute('data-autotest-value')).toBe('TX_SETTLED')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                orderDateType: 'TX_SETTLED',
            }))
        })
        expect(secondTrigger?.getAttribute('data-autotest-value')).toBe('SESSION_CREATED')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })
})
