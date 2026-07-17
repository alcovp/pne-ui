import * as React from 'react'
import {fireEvent, render, waitFor, within} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters} from '../src'
import {DateRangeSpecType} from '../src/component/search-ui/filters/types'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const createDateRangeSpec = (dateRangeSpecType: DateRangeSpecType, beforeCount: number) => ({
    dateRangeSpecType,
    dateFrom: new Date('2026-07-01T00:00:00.000Z'),
    dateTo: new Date('2026-07-02T00:00:00.000Z'),
    beforeCount,
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

const originalMatchMedia = window.matchMedia

describe('SearchUI date-range native input Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: originalMatchMedia,
        })
    })

    it('anchors relative day/hour counts and isolates simultaneous criteria', async () => {
        const daysOnFiltersUpdate = jest.fn()
        const hoursOnFiltersUpdate = jest.fn()
        const presetOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="days-before"
                    settingsContextName="days-before-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('DAYS_BEFORE', 7),
                    }}
                    onFiltersUpdate={daysOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="hours-before"
                    settingsContextName="hours-before-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('HOURS_BEFORE', 12),
                    }}
                    onFiltersUpdate={hoursOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="date-preset"
                    settingsContextName="date-preset-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: createDateRangeSpec('TODAY', 1),
                    }}
                    onFiltersUpdate={presetOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(daysOnFiltersUpdate).toHaveBeenCalled()
            expect(hoursOnFiltersUpdate).toHaveBeenCalled()
            expect(presetOnFiltersUpdate).toHaveBeenCalled()
        })

        const daysCriterion = getDateCriterion(
            container,
            'days-before',
            CriterionTypeEnum.DATE_RANGE,
        )
        const hoursCriterion = getDateCriterion(
            container,
            'hours-before',
            CriterionTypeEnum.DATE_RANGE_ORDERS,
        )
        const presetCriterion = getDateCriterion(
            container,
            'date-preset',
            CriterionTypeEnum.DATE_RANGE,
        )
        const daysInput = within(daysCriterion).getByRole<HTMLInputElement>('spinbutton', {
            name: 'Number of days before',
        })
        const hoursInput = within(hoursCriterion).getByRole<HTMLInputElement>('spinbutton', {
            name: 'Number of hours before',
        })

        expect(daysInput.getAttribute('data-autotest')).toBe('criterion-before-count')
        expect(daysInput.getAttribute('min')).toBe('1')
        expect(daysInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(daysInput.value).toBe('7')
        expect(hoursInput.getAttribute('data-autotest')).toBe('criterion-before-count')
        expect(hoursInput.getAttribute('min')).toBe('1')
        expect(hoursInput.hasAttribute('data-autotest-value')).toBe(false)
        expect(hoursInput.value).toBe('12')
        expect(presetCriterion.querySelector(
            '[data-autotest="criterion-before-count"]',
        )).toBeNull()

        daysOnFiltersUpdate.mockClear()
        hoursOnFiltersUpdate.mockClear()
        presetOnFiltersUpdate.mockClear()
        fireEvent.change(daysInput, {target: {value: '9'}})

        await waitFor(() => {
            expect(daysInput.value).toBe('9')
            expect(daysOnFiltersUpdate).toHaveBeenCalled()
        })
        expect(hoursInput.value).toBe('12')
        expect(hoursOnFiltersUpdate).not.toHaveBeenCalled()
        expect(presetOnFiltersUpdate).not.toHaveBeenCalled()

        daysOnFiltersUpdate.mockClear()
        hoursOnFiltersUpdate.mockClear()
        fireEvent.change(hoursInput, {target: {value: '24'}})

        await waitFor(() => {
            expect(hoursInput.value).toBe('24')
            expect(hoursOnFiltersUpdate).toHaveBeenCalled()
        })
        expect(daysInput.value).toBe('9')
        expect(daysOnFiltersUpdate).not.toHaveBeenCalled()
        expect(presetOnFiltersUpdate).not.toHaveBeenCalled()
    })

    it('anchors exact date-only fields and owner-scopes their calendars', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const dateOnlyConfig = {
            ...filtersConfig,
            dateRange: {dateOnlyTimeZone: 'UTC'},
        }
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="exact-date-first"
                    settingsContextName="exact-date-first-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: {
                            ...createDateRangeSpec('EXACTLY', 1),
                            dateFrom: new Date('2026-07-01T00:00:00.000Z'),
                            dateTo: new Date('2026-07-02T00:00:00.000Z'),
                        },
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={dateOnlyConfig}
                />
                <SearchUIFilters
                    autoTestId="exact-date-second"
                    settingsContextName="exact-date-second-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: {
                            ...createDateRangeSpec('EXACTLY', 1),
                            dateFrom: new Date('2026-09-10T00:00:00.000Z'),
                            dateTo: new Date('2026-09-11T00:00:00.000Z'),
                        },
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={dateOnlyConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                dateFrom: new Date('2026-07-01T00:00:00.000Z'),
                dateTo: new Date('2026-07-03T00:00:00.000Z'),
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                dateFrom: new Date('2026-09-10T00:00:00.000Z'),
                dateTo: new Date('2026-09-12T00:00:00.000Z'),
            }))
        })

        const firstCriterion = getDateCriterion(
            container,
            'exact-date-first',
            CriterionTypeEnum.DATE_RANGE,
        )
        const secondCriterion = getDateCriterion(
            container,
            'exact-date-second',
            CriterionTypeEnum.DATE_RANGE,
        )
        const firstField = within(firstCriterion).getByRole<HTMLElement>('group', {
            name: 'Exact date range',
        })
        const secondField = within(secondCriterion).getByRole<HTMLElement>('group', {
            name: 'Exact date range',
        })
        const firstToggle = firstCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-range-picker-toggle"]',
        )
        const secondToggle = secondCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-range-picker-toggle"]',
        )

        expect(firstField.tagName).toBe('DIV')
        expect(firstField.getAttribute('data-autotest')).toBe('criterion-date-range')
        expect(firstField.querySelectorAll('[role="spinbutton"]')).toHaveLength(6)
        expect(secondField.getAttribute('data-autotest')).toBe('criterion-date-range')
        expect(secondField.querySelectorAll('[role="spinbutton"]')).toHaveLength(6)
        expect(firstField.querySelector(
            'input[aria-hidden="true"][data-autotest]',
        )).toBeNull()
        expect(firstToggle?.getAttribute('data-autotest')).toBe(
            'criterion-date-range-picker-toggle',
        )
        expect(firstToggle?.getAttribute('aria-label')).not.toBeNull()
        expect(secondToggle?.getAttribute('data-autotest')).toBe(
            'criterion-date-range-picker-toggle',
        )
        expect(secondToggle?.getAttribute('aria-label')).not.toBeNull()

        fireEvent.click(firstToggle as HTMLButtonElement)

        const getCalendar = (scope: string) => document.body.querySelector<HTMLElement>(
            `[role="dialog"][data-autotest="criterion-date-range-picker"]`
            + `[data-autotest-value="${scope}"]`
            + `[data-autotest-criterion="${CriterionTypeEnum.DATE_RANGE}"]`,
        )

        await waitFor(() => {
            expect(getCalendar('exact-date-first')).not.toBeNull()
        })

        const firstCalendar = getCalendar('exact-date-first') as HTMLElement

        expect(firstCalendar.getAttribute('aria-label')).toBe('Exact date range calendar')
        expect(firstCriterion.contains(firstCalendar)).toBe(false)
        expect(firstCalendar.querySelectorAll('[role="grid"]')).toHaveLength(2)
        expect(firstCalendar.querySelectorAll(
            '[role="gridcell"][aria-selected="true"]',
        )).toHaveLength(2)
        expect(firstCalendar.querySelector(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-01"][aria-selected="true"]',
        )).not.toBeNull()
        expect(firstCalendar.querySelector(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-02"][aria-selected="true"]',
        )).not.toBeNull()
        expect(getCalendar('exact-date-second')).toBeNull()

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(firstCalendar.querySelector<HTMLElement>(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-03"]',
        ) as HTMLElement)
        fireEvent.click(firstCalendar.querySelector<HTMLElement>(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-04"]',
        ) as HTMLElement)

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: new Date('2026-07-03T00:00:00.000Z'),
                dateTo: new Date('2026-07-05T00:00:00.000Z'),
            }))
            expect(getCalendar('exact-date-first')).toBeNull()
        })
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.click(secondToggle as HTMLButtonElement)

        await waitFor(() => {
            expect(getCalendar('exact-date-second')).not.toBeNull()
        })
        expect(secondCriterion.contains(getCalendar('exact-date-second'))).toBe(false)
        expect(getCalendar('exact-date-first')).toBeNull()
        expect(consoleError.mock.calls.every(call => (
            String(call[0]).includes('MUI X: Missing license key')
        ))).toBe(true)
        expect(consoleLog.mock.calls.every(call => (
            String(call[0]).includes('[mui-x-telemetry]')
        ))).toBe(true)
    })

    it('keeps the date-only picker scope on its mobile dialog', async () => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIFilters
                autoTestId="exact-date-mobile"
                settingsContextName="exact-date-mobile-context"
                possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                initialSearchConditions={{
                    dateRangeSpec: {
                        ...createDateRangeSpec('EXACTLY', 1),
                        dateFrom: new Date('2026-10-01T00:00:00.000Z'),
                        dateTo: new Date('2026-10-02T00:00:00.000Z'),
                    },
                }}
                onFiltersUpdate={onFiltersUpdate}
                config={{
                    ...filtersConfig,
                    dateRange: {dateOnlyTimeZone: 'UTC'},
                }}
            />,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const criterion = getDateCriterion(
            container,
            'exact-date-mobile',
            CriterionTypeEnum.DATE_RANGE,
        )
        const toggle = criterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-range-picker-toggle"]',
        )

        fireEvent.click(toggle as HTMLButtonElement)

        const getMobilePicker = () => document.body.querySelector<HTMLElement>(
            '[role="dialog"][aria-modal="true"]'
            + '[data-autotest="criterion-date-range-picker"]'
            + '[data-autotest-value="exact-date-mobile"]'
            + `[data-autotest-criterion="${CriterionTypeEnum.DATE_RANGE}"]`,
        )

        await waitFor(() => {
            expect(getMobilePicker()).not.toBeNull()
        })

        const mobilePicker = getMobilePicker() as HTMLElement

        expect(criterion.contains(mobilePicker)).toBe(false)
        expect(mobilePicker.querySelector(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-10-01"][aria-selected="true"]',
        )).not.toBeNull()
        expect(consoleError.mock.calls.every(call => (
            String(call[0]).includes('MUI X: Missing license key')
        ))).toBe(true)
        expect(consoleLog.mock.calls.every(call => (
            String(call[0]).includes('[mui-x-telemetry]')
        ))).toBe(true)
    })

    it('separates exact date-time fields and their owner-scoped pickers', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
        const standardOnFiltersUpdate = jest.fn()
        const ordersOnFiltersUpdate = jest.fn()
        const standardFrom = new Date(2026, 6, 1, 10, 20, 30)
        const standardTo = new Date(2026, 6, 2, 11, 21, 31)
        const ordersFrom = new Date(2026, 7, 10, 12, 22, 32)
        const ordersTo = new Date(2026, 7, 11, 13, 23, 33)
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="exact-date-time-standard"
                    settingsContextName="exact-date-time-standard-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    initialSearchConditions={{
                        dateRangeSpec: {
                            ...createDateRangeSpec('EXACTLY', 1),
                            dateFrom: standardFrom,
                            dateTo: standardTo,
                        },
                    }}
                    onFiltersUpdate={standardOnFiltersUpdate}
                    config={{
                        ...filtersConfig,
                        dateRange: {enableTimeSelection: true},
                    }}
                />
                <SearchUIFilters
                    autoTestId="exact-date-time-orders"
                    settingsContextName="exact-date-time-orders-context"
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE_ORDERS]}
                    initialSearchConditions={{
                        dateRangeSpec: {
                            ...createDateRangeSpec('EXACTLY', 1),
                            dateFrom: ordersFrom,
                            dateTo: ordersTo,
                        },
                    }}
                    onFiltersUpdate={ordersOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(standardOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                dateFrom: standardFrom,
                dateTo: standardTo,
            }))
            expect(ordersOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                dateFrom: ordersFrom,
                dateTo: ordersTo,
            }))
        })

        const standardCriterion = getDateCriterion(
            container,
            'exact-date-time-standard',
            CriterionTypeEnum.DATE_RANGE,
        )
        const ordersCriterion = getDateCriterion(
            container,
            'exact-date-time-orders',
            CriterionTypeEnum.DATE_RANGE_ORDERS,
        )
        const standardFromField = standardCriterion.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-date-time-from"]',
        )
        const standardToField = standardCriterion.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-date-time-to"]',
        )
        const ordersFromField = ordersCriterion.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-date-time-from"]',
        )
        const ordersToField = ordersCriterion.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-date-time-to"]',
        )

        expect(standardFromField?.getAttribute('aria-label')).toBe('Exact date and time from')
        expect(standardToField?.getAttribute('aria-label')).toBe('Exact date and time to')
        expect(ordersFromField?.getAttribute('aria-label')).toBe('Exact date and time from')
        expect(ordersToField?.getAttribute('aria-label')).toBe('Exact date and time to')
        for (const field of [
            standardFromField,
            standardToField,
            ordersFromField,
            ordersToField,
        ]) {
            expect(field).not.toBeNull()
            expect(field?.querySelectorAll('[role="spinbutton"]')).toHaveLength(6)
            expect(field?.querySelector(
                'input[aria-hidden="true"][data-autotest]',
            )).toBeNull()
        }

        const standardFromToggle = standardCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-time-from-picker-toggle"]',
        )
        const standardToToggle = standardCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-time-to-picker-toggle"]',
        )
        const ordersFromToggle = ordersCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-date-time-from-picker-toggle"]',
        )

        expect(standardFromToggle?.getAttribute('aria-label')).not.toBeNull()
        expect(standardToToggle?.getAttribute('aria-label')).not.toBeNull()
        expect(ordersFromToggle?.getAttribute('aria-label')).not.toBeNull()

        const getPicker = (
            id: string,
            scope: string,
            criterionType: CriterionTypeEnum,
        ) => document.body.querySelector<HTMLElement>(
            `[role="dialog"][data-autotest="${id}"]`
            + `[data-autotest-value="${scope}"]`
            + `[data-autotest-criterion="${criterionType}"]`,
        )

        fireEvent.click(standardFromToggle as HTMLButtonElement)

        await waitFor(() => {
            expect(getPicker(
                'criterion-date-time-from-picker',
                'exact-date-time-standard',
                CriterionTypeEnum.DATE_RANGE,
            )).not.toBeNull()
        })

        const standardFromPicker = getPicker(
            'criterion-date-time-from-picker',
            'exact-date-time-standard',
            CriterionTypeEnum.DATE_RANGE,
        ) as HTMLElement

        expect(standardFromPicker.getAttribute('aria-label')).toBe(
            'Exact start date and time picker',
        )
        expect(standardCriterion.contains(standardFromPicker)).toBe(false)
        expect(standardFromPicker.querySelector(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-01"][aria-selected="true"]',
        )).not.toBeNull()
        const hoursListbox = within(standardFromPicker).getByRole('listbox', {
            name: 'Select hours',
        })
        const minutesListbox = within(standardFromPicker).getByRole('listbox', {
            name: 'Select minutes',
        })
        const secondsListbox = within(standardFromPicker).getByRole('listbox', {
            name: 'Select seconds',
        })

        expect(hoursListbox.querySelectorAll(
            '[role="option"][data-autotest="criterion-time-option"]',
        )).toHaveLength(24)
        expect(minutesListbox.querySelectorAll(
            '[role="option"][data-autotest="criterion-time-option"]',
        )).toHaveLength(60)
        expect(secondsListbox.querySelectorAll(
            '[role="option"][data-autotest="criterion-time-option"]',
        )).toHaveLength(60)
        for (const listbox of [hoursListbox, minutesListbox, secondsListbox]) {
            expect(listbox.querySelector('[role="option"][aria-selected="true"]')).not.toBeNull()
        }

        standardOnFiltersUpdate.mockClear()
        ordersOnFiltersUpdate.mockClear()
        const minuteFourteen = Array.from(minutesListbox.querySelectorAll<HTMLElement>(
            '[role="option"][data-autotest="criterion-time-option"]',
        )).find(option => option.textContent?.trim() === '14')

        expect(minuteFourteen).not.toBeUndefined()
        fireEvent.click(minuteFourteen as HTMLElement)

        await waitFor(() => {
            expect(standardOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: new Date(2026, 6, 1, 10, 14, 30),
                dateTo: standardTo,
            }))
            expect(standardFromField?.querySelector(
                '[role="spinbutton"][aria-label="Minutes"]',
            )?.getAttribute('aria-valuenow')).toBe('14')
        })
        expect(ordersOnFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.click(standardFromPicker.querySelector<HTMLElement>(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-03"]',
        ) as HTMLElement)

        await waitFor(() => {
            expect(standardOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: new Date(2026, 6, 3, 10, 14, 30),
                dateTo: standardTo,
            }))
        })
        expect(ordersOnFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.keyDown(standardFromPicker, {key: 'Escape', code: 'Escape'})

        await waitFor(() => {
            expect(getPicker(
                'criterion-date-time-from-picker',
                'exact-date-time-standard',
                CriterionTypeEnum.DATE_RANGE,
            )).toBeNull()
        })

        fireEvent.click(standardToToggle as HTMLButtonElement)

        await waitFor(() => {
            expect(getPicker(
                'criterion-date-time-to-picker',
                'exact-date-time-standard',
                CriterionTypeEnum.DATE_RANGE,
            )).not.toBeNull()
        })

        const standardToPicker = getPicker(
            'criterion-date-time-to-picker',
            'exact-date-time-standard',
            CriterionTypeEnum.DATE_RANGE,
        ) as HTMLElement

        expect(standardToPicker.getAttribute('aria-label')).toBe('Exact end date and time picker')
        expect(standardToPicker.querySelector(
            '[role="gridcell"][data-autotest="criterion-date-option"]'
            + '[data-autotest-value="2026-07-02"][aria-selected="true"]',
        )).not.toBeNull()

        fireEvent.keyDown(standardToPicker, {key: 'Escape', code: 'Escape'})

        await waitFor(() => {
            expect(getPicker(
                'criterion-date-time-to-picker',
                'exact-date-time-standard',
                CriterionTypeEnum.DATE_RANGE,
            )).toBeNull()
        })

        fireEvent.click(ordersFromToggle as HTMLButtonElement)

        await waitFor(() => {
            expect(getPicker(
                'criterion-date-time-from-picker',
                'exact-date-time-orders',
                CriterionTypeEnum.DATE_RANGE_ORDERS,
            )).not.toBeNull()
        })
        expect(consoleError.mock.calls.every(call => (
            String(call[0]).includes('MUI X: Missing license key')
        ))).toBe(true)
        expect(consoleLog.mock.calls.every(call => (
            String(call[0]).includes('[mui-x-telemetry]')
        ))).toBe(true)
    }, 10_000)
})
