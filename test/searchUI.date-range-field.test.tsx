import * as React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters, type SearchCriteria} from '../src'
import {
    SEARCH_UI_DATE_RANGE_END_BEFORE_START,
    SEARCH_UI_DATE_RANGE_INVALID_DATE,
} from '../src/component/search-ui/filters/validation'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'

let mockLanguage = 'en'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
        i18n: {language: mockLanguage},
    }),
}))

// MUI X 9 date fields are editable sections; the browser hands every keystroke to the focused
// section as an `input` event, and MUI reads the typed character from its text.
const fieldOf = (autoTestId: string) => document.querySelector<HTMLElement>(
    `[role="group"][data-autotest="${autoTestId}"]`,
) as HTMLElement
const rangeField = () => fieldOf('criterion-date-range')
const hiddenInputOf = (field: HTMLElement) => field.querySelector('input') as HTMLInputElement
const sectionOf = (index: number) => rangeField().querySelector<HTMLElement>(
    `[data-sectionindex="${index}"] [role="spinbutton"]`,
) as HTMLElement

const selectSection = (index: number) => {
    const section = sectionOf(index)
    act(() => section.focus())
    fireEvent.click(section)
}

const typeIntoSection = (index: number, text: string) => {
    selectSection(index)
    for (const character of text) {
        fireEvent.input(sectionOf(index), {target: {textContent: character}})
    }
}

const clearSection = (index: number) => {
    selectSection(index)
    fireEvent.input(sectionOf(index), {target: {textContent: ''}})
}

const leaveField = () => act(() => (document.activeElement as HTMLElement | null)?.blur())

const START_DAY = 0
const START_MONTH = 1
const END_DAY = 3
const END_MONTH = 4
const END_YEAR = 5

const renderExactRange = (options: {enableTimeSelection?: boolean} = {}) => {
    const onFiltersUpdate = jest.fn<void, [SearchCriteria]>()
    const onValidationChange = jest.fn()
    render(<SearchUIFilters
        settingsContextName={'date-range-field'}
        possibleCriteria={[CriterionTypeEnum.DATE_RANGE]}
        predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
        initialSearchConditions={{
            dateRangeSpec: {
                dateRangeSpecType: 'EXACTLY',
                dateFrom: options.enableTimeSelection
                    ? new Date(2026, 6, 1, 10, 20, 30)
                    : new Date('2026-07-01T00:00:00.000Z'),
                dateTo: options.enableTimeSelection
                    ? new Date(2026, 6, 2, 11, 21, 31)
                    : new Date('2026-07-02T00:00:00.000Z'),
            },
        }}
        onFiltersUpdate={onFiltersUpdate}
        onValidationChange={onValidationChange}
        config={{
            hideShowFiltersButton: true,
            hideTemplatesSelect: true,
            dateRange: options.enableTimeSelection
                ? {enableTimeSelection: true}
                : {dateOnlyTimeZone: 'UTC'},
        }}
    />)
    return {onFiltersUpdate, onValidationChange}
}

const refreshButton = () => screen.getByRole('button', {name: 'Refresh'}) as HTMLButtonElement

const searchedDates = (onFiltersUpdate: jest.Mock<void, [SearchCriteria]>) => onFiltersUpdate.mock.calls
    .map(([criteria]) => [criteria.dateFrom, criteria.dateTo])

describe('SearchUI exact date field', () => {
    beforeEach(() => {
        localStorage.clear()
        // Every test renders the same context; a previous test's filters must not come back.
        resetSearchUIRetentionForTests()
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        jest.spyOn(console, 'log').mockImplementation(() => undefined)
    })

    afterEach(() => {
        mockLanguage = 'en'
        jest.restoreAllMocks()
    })

    it('shows dates day first in every language, as Wicket and the order page do', async () => {
        mockLanguage = 'ru'
        renderExactRange()

        await waitFor(() => expect(hiddenInputOf(rangeField()).value).toBe('01.07.2026 – 02.07.2026'))
    })

    it('shows date-times day first with seconds', async () => {
        renderExactRange({enableTimeSelection: true})

        await waitFor(() => {
            expect(hiddenInputOf(fieldOf('criterion-date-time-from')).value).toBe('01.07.2026 10:20:30')
            expect(hiddenInputOf(fieldOf('criterion-date-time-to')).value).toBe('02.07.2026 11:21:31')
        })
    })

    it('speaks the UI language in the calendar', async () => {
        mockLanguage = 'ru'
        renderExactRange()

        fireEvent.click(document.querySelector('button[data-autotest="criterion-date-range-picker-toggle"]') as HTMLElement)

        const calendar = await waitFor(() => {
            const dialog = document.body.querySelector<HTMLElement>(
                '[role="dialog"][data-autotest="criterion-date-range-picker"]',
            )
            expect(dialog).not.toBeNull()
            return dialog as HTMLElement
        })
        expect(calendar.textContent).toContain('июль')
        expect(calendar.textContent).not.toContain('July')
    })

    it('reports a typed date that does not exist and searches nothing with it', async () => {
        const {onFiltersUpdate, onValidationChange} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        typeIntoSection(START_DAY, '31')
        typeIntoSection(START_MONTH, '02')

        expect(hiddenInputOf(rangeField()).value).toBe('31.02.2026 – 02.07.2026')
        expect((await screen.findByRole('alert')).textContent).toBe('react.searchUI.dateRange.invalidDate')
        expect(rangeField().getAttribute('aria-invalid')).toBe('true')
        expect(refreshButton().disabled).toBe(true)
        expect(onValidationChange).toHaveBeenLastCalledWith({
            isValid: false,
            errors: [expect.objectContaining({
                code: SEARCH_UI_DATE_RANGE_INVALID_DATE,
                params: {boundary: 'from'},
            })],
        })
        expect(searchedDates(onFiltersUpdate).flat().every(date => !Number.isNaN(date?.getTime()))).toBe(true)
    })

    it('reports an end before the start', async () => {
        const {onFiltersUpdate, onValidationChange} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        onFiltersUpdate.mockClear()

        typeIntoSection(END_MONTH, '06')

        expect((await screen.findByRole('alert')).textContent).toBe('react.searchUI.dateRange.endBeforeStart')
        expect(onValidationChange).toHaveBeenLastCalledWith(expect.objectContaining({
            errors: [expect.objectContaining({code: SEARCH_UI_DATE_RANGE_END_BEFORE_START})],
        }))
        expect(onFiltersUpdate).not.toHaveBeenCalled()
    })

    it('takes a far year for a date', async () => {
        const {onFiltersUpdate} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        typeIntoSection(END_YEAR, '3000')

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2026-07-01T00:00:00.000Z'),
            dateTo: new Date('3000-07-03T00:00:00.000Z'),
        })))
        expect(screen.queryByRole('alert')).toBeNull()
        expect(rangeField().getAttribute('aria-invalid')).toBe('false')
    })

    it('searches without an upper bound once the end is cleared and left', async () => {
        const {onFiltersUpdate} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        onFiltersUpdate.mockClear()

        clearSection(END_DAY)
        clearSection(END_MONTH)
        clearSection(END_YEAR)
        // Typing has not finished while the field has focus.
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        leaveField()

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2026-07-01T00:00:00.000Z'),
            dateTo: new Date('2999-12-31T00:00:00.000Z'),
        })))
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('judges a half-typed end once the field is left', async () => {
        const {onFiltersUpdate, onValidationChange} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        onFiltersUpdate.mockClear()

        clearSection(END_DAY)

        expect(screen.queryByRole('alert')).toBeNull()
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        leaveField()

        expect((await screen.findByRole('alert')).textContent).toBe('react.searchUI.dateRange.invalidDate')
        expect(onValidationChange).toHaveBeenLastCalledWith(expect.objectContaining({
            errors: [expect.objectContaining({
                code: SEARCH_UI_DATE_RANGE_INVALID_DATE,
                params: {boundary: 'to'},
            })],
        }))
        expect(onFiltersUpdate).not.toHaveBeenCalled()
    })

    it('searches a calendar range once both days are picked', async () => {
        const {onFiltersUpdate} = renderExactRange()
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        onFiltersUpdate.mockClear()

        fireEvent.click(document.querySelector('button[data-autotest="criterion-date-range-picker-toggle"]') as HTMLElement)
        const dayOption = async (day: string) => waitFor(() => {
            const option = document.body.querySelector<HTMLElement>(
                `[role="gridcell"][data-autotest="criterion-date-option"][data-autotest-value="${day}"]`,
            )
            expect(option).not.toBeNull()
            return option as HTMLElement
        })

        fireEvent.click(await dayOption('2026-07-10'))
        // A lone first day is no range yet; searching it would mean an open end.
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.click(await dayOption('2026-07-12'))

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            dateFrom: new Date('2026-07-10T00:00:00.000Z'),
            dateTo: new Date('2026-07-13T00:00:00.000Z'),
        })))
        expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
    })
})
