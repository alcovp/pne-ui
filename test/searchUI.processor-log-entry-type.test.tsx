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

const processorLogEntryTypes: AbstractEntity[] = [
    {id: 1, displayName: 'One'},
    {id: 2, displayName: 'Second'},
    {id: 99, displayName: '33333'},
]

const createDeferredOptions = () => {
    let resolve!: (options: AbstractEntity[]) => void
    const promise = new Promise<AbstractEntity[]>(resolvePromise => {
        resolve = resolvePromise
    })

    return {promise, resolve}
}

const getProcessorLogCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getProcessorLogControl = (criterion: HTMLElement): HTMLElement => {
    const control = criterion.querySelector<HTMLElement>(
        '[role="combobox"][data-autotest="criterion-processor-log-entry-type"]',
    )

    expect(control).not.toBeNull()

    return control as HTMLElement
}

const getOwnedOptions = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="listbox"][data-autotest="criterion-processor-log-entry-type-options"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE}"]`,
)

const getOption = (listbox: HTMLElement, id: number): HTMLElement | null => listbox.querySelector<HTMLElement>(
    '[role="option"][data-autotest="criterion-processor-log-entry-type-option"]'
    + `[data-autotest-value="${id}"]`,
)

describe('SearchUI processor-log-entry-type Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('preserves restored IDs and owner-scopes loaded options across two instances', async () => {
        const options = createDeferredOptions()
        const getProcessorLogEntryTypes = jest.fn(() => options.promise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getProcessorLogEntryTypes,
                }}
            >
                <SearchUIFilters
                    autoTestId="processor-log-first"
                    settingsContextName="processor-log-first-context"
                    possibleCriteria={[CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE]}
                    predefinedCriteria={[CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE]}
                    initialSearchConditions={{
                        processorLogEntryType: processorLogEntryTypes[0],
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="processor-log-second"
                    settingsContextName="processor-log-second-context"
                    possibleCriteria={[CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE]}
                    predefinedCriteria={[CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE]}
                    initialSearchConditions={{
                        processorLogEntryType: processorLogEntryTypes[1],
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getProcessorLogEntryTypes).toHaveBeenCalledTimes(2)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                processorLogEntryType: 'One',
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                processorLogEntryType: 'Second',
            }))
        })

        const firstCriterion = getProcessorLogCriterion(container, 'processor-log-first')
        const secondCriterion = getProcessorLogCriterion(container, 'processor-log-second')
        const firstControl = getProcessorLogControl(firstCriterion)
        const secondControl = getProcessorLogControl(secondCriterion)

        expect(firstControl.getAttribute('aria-label')).toBe(
            'Processor log entry type',
        )
        expect(firstControl.getAttribute('data-autotest-value')).toBe('1')
        expect(secondControl.getAttribute('data-autotest-value')).toBe('2')

        for (const criterion of [firstCriterion, secondCriterion]) {
            expect(criterion.querySelectorAll(
                '[data-autotest="criterion-processor-log-entry-type"]',
            )).toHaveLength(1)
            expect(criterion.querySelector(
                'input[data-autotest="criterion-processor-log-entry-type"]',
            )).toBeNull()
            expect(criterion.querySelector(
                '[role="button"][aria-hidden="true"][tabindex="-1"]',
            )).not.toBeNull()
        }

        await act(async () => {
            options.resolve(processorLogEntryTypes)
            await options.promise
        })

        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )

        fireEvent.mouseDown(firstControl)
        fireEvent.mouseDown(secondControl)

        await waitFor(() => {
            expect(getOwnedOptions('processor-log-first')).not.toBeNull()
            expect(getOwnedOptions('processor-log-second')).not.toBeNull()
        })

        const firstOptions = getOwnedOptions('processor-log-first') as HTMLElement
        const secondOptions = getOwnedOptions('processor-log-second') as HTMLElement

        for (const [criterion, control, listbox, selectedId] of [
            [firstCriterion, firstControl, firstOptions, 1],
            [secondCriterion, secondControl, secondOptions, 2],
        ] as const) {
            expect(control.getAttribute('aria-expanded')).toBe('true')
            expect(control.getAttribute('aria-controls')).toBe(listbox.id)
            expect(criterion.contains(listbox)).toBe(false)
            expect(listbox.querySelectorAll(
                '[role="option"][data-autotest="criterion-processor-log-entry-type-option"]',
            )).toHaveLength(processorLogEntryTypes.length)

            for (const option of processorLogEntryTypes) {
                expect(getOption(listbox, option.id)?.getAttribute('aria-selected')).toBe(
                    String(option.id === selectedId),
                )
            }
        }

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(getOption(firstOptions, 99) as HTMLElement)

        await waitFor(() => {
            expect(firstControl.getAttribute('data-autotest-value')).toBe('99')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                processorLogEntryType: '33333',
            }))
        })
        expect(secondControl.getAttribute('data-autotest-value')).toBe('2')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
        expect(consoleWarn).not.toHaveBeenCalledWith(
            expect.stringContaining('out-of-range value'),
        )
    })
})
