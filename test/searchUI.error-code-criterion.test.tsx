import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    AutoCompleteChoice,
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

const quietAsyncDefaults = {
    getSearchTemplates: neverResolves,
}

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
}

const createDeferred = <T,>(): Deferred<T> => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(resolvePromise => {
        resolve = resolvePromise
    })

    return {promise, resolve}
}

const getErrorCodeCriterion = (
    container: HTMLElement,
    scope: string,
): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.ERROR_CODE}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getErrorCodeInput = (criterion: HTMLElement): HTMLInputElement => {
    const input = criterion.querySelector<HTMLInputElement>(
        'input[role="combobox"][data-autotest="criterion-error-code"]',
    )

    expect(input).not.toBeNull()

    return input as HTMLInputElement
}

const openErrorCode = (input: HTMLInputElement) => {
    fireEvent.focus(input)
    fireEvent.mouseDown(input)
    fireEvent.keyDown(input, {key: 'ArrowDown'})
}

describe('SearchUI Error Code Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('restores raw values and scopes result portals across instances', async () => {
        const firstResults = createDeferred<AutoCompleteChoice[]>()
        const secondResults = createDeferred<AutoCompleteChoice[]>()
        const firstSearchErrorCodes = jest.fn(() => firstResults.promise)
        const secondSearchErrorCodes = jest.fn(() => secondResults.promise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIProvider
                    defaults={{...quietAsyncDefaults, searchErrorCodes: firstSearchErrorCodes}}
                >
                    <SearchUIFilters
                        autoTestId="error-code-first"
                        settingsContextName="error-code-first-context"
                        possibleCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        predefinedCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        initialSearchConditions={{
                            errorCode: {
                                choiceId: 1,
                                displayName: 'Timeout',
                                description: 'External code: 05',
                            },
                        }}
                        onFiltersUpdate={firstOnFiltersUpdate}
                        config={filtersConfig}
                    />
                </SearchUIProvider>
                <SearchUIProvider
                    defaults={{...quietAsyncDefaults, searchErrorCodes: secondSearchErrorCodes}}
                >
                    <SearchUIFilters
                        autoTestId="error-code-second"
                        settingsContextName="error-code-second-context"
                        possibleCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        predefinedCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        initialSearchConditions={{
                            errorCode: {
                                choiceId: 2,
                                displayName: 'Timeout',
                                description: 'External code: 51',
                            },
                        }}
                        onFiltersUpdate={secondOnFiltersUpdate}
                        config={filtersConfig}
                    />
                </SearchUIProvider>
            </>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 1,
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 2,
            }))
        })

        const firstCriterion = getErrorCodeCriterion(container, 'error-code-first')
        const secondCriterion = getErrorCodeCriterion(container, 'error-code-second')
        const firstInput = getErrorCodeInput(firstCriterion)
        const secondInput = getErrorCodeInput(secondCriterion)

        expect(firstInput.getAttribute('aria-label')).toBe('Error code')
        expect(firstInput.value).toBe('Timeout')
        expect(firstInput.getAttribute('data-autotest-value')).toBe('1')
        expect(firstInput.getAttribute('aria-busy')).toBe('false')
        expect(secondInput.value).toBe('Timeout')
        expect(secondInput.getAttribute('data-autotest-value')).toBe('2')
        expect(secondInput.getAttribute('aria-busy')).toBe('false')

        openErrorCode(firstInput)

        await waitFor(() => {
            expect(firstSearchErrorCodes).toHaveBeenCalledWith({searchString: ''})
            expect(firstInput.getAttribute('aria-busy')).toBe('true')
        })

        const firstPanel = document.body.querySelector<HTMLElement>(
            '[data-autotest="criterion-error-code-panel"]'
            + '[data-autotest-value="error-code-first"]'
            + `[data-autotest-criterion="${CriterionTypeEnum.ERROR_CODE}"]`,
        )

        expect(firstPanel).not.toBeNull()
        expect(firstPanel?.querySelector('[role="listbox"]')).toBeNull()
        expect(firstPanel && firstCriterion.contains(firstPanel)).toBe(false)

        const firstOptions: AutoCompleteChoice[] = [
            {choiceId: 1, displayName: 'Timeout', description: 'External code: 05'},
            {choiceId: 3, displayName: 'Declined', description: 'External code: 54'},
        ]

        await act(async () => {
            firstResults.resolve(firstOptions)
            await firstResults.promise
        })

        await waitFor(() => {
            expect(firstInput.getAttribute('aria-busy')).toBe('false')
            expect(firstPanel?.querySelectorAll(
                '[role="option"][data-autotest="criterion-error-code-option"]',
            )).toHaveLength(firstOptions.length)
        })

        const firstListbox = firstPanel?.querySelector<HTMLElement>(
            '[role="listbox"][data-autotest="criterion-error-code-options"]',
        )

        expect(firstListbox?.getAttribute('data-autotest-value')).toBe('error-code-first')
        expect(firstListbox?.getAttribute('data-autotest-criterion')).toBe(
            CriterionTypeEnum.ERROR_CODE,
        )
        expect(firstListbox?.getAttribute('aria-label')).toBe('Error code')
        expect(firstListbox?.hasAttribute('aria-labelledby')).toBe(false)
        expect(firstInput.getAttribute('aria-controls')).toBe(firstListbox?.id)
        expect(firstListbox?.querySelector(
            '[data-autotest="criterion-error-code-option"][data-autotest-value="1"]',
        )?.getAttribute('aria-selected')).toBe('true')
        expect(firstListbox?.querySelector(
            '[data-autotest="criterion-error-code-option"][data-autotest-value="3"]',
        )?.getAttribute('aria-selected')).toBe('false')
        expect(firstPanel?.textContent).toContain('External code: 05')
        expect(firstPanel?.textContent).toContain('External code: 54')

        const declinedOption = firstListbox?.querySelector<HTMLElement>(
            '[role="option"][data-autotest="criterion-error-code-option"]'
            + '[data-autotest-value="3"]',
        )

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(declinedOption as HTMLElement)

        await waitFor(() => {
            expect(firstInput.value).toBe('Declined')
            expect(firstInput.getAttribute('data-autotest-value')).toBe('3')
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 3,
            }))
        })
        expect(secondInput.value).toBe('Timeout')
        expect(secondInput.getAttribute('data-autotest-value')).toBe('2')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        openErrorCode(secondInput)

        await waitFor(() => {
            expect(secondSearchErrorCodes).toHaveBeenCalledWith({searchString: ''})
            expect(secondInput.getAttribute('aria-busy')).toBe('true')
        })

        const secondOptions: AutoCompleteChoice[] = [
            {choiceId: 2, displayName: 'Timeout', description: 'External code: 51'},
            {choiceId: 4, displayName: 'Declined', description: 'External code: 57'},
        ]

        await act(async () => {
            secondResults.resolve(secondOptions)
            await secondResults.promise
        })

        const secondPanelSelector = '[data-autotest="criterion-error-code-panel"]'
            + '[data-autotest-value="error-code-second"]'
            + `[data-autotest-criterion="${CriterionTypeEnum.ERROR_CODE}"]`

        await waitFor(() => {
            expect(document.body.querySelector(secondPanelSelector)?.querySelectorAll(
                '[role="option"][data-autotest="criterion-error-code-option"]',
            )).toHaveLength(secondOptions.length)
        })

        const secondPanel = document.body.querySelector<HTMLElement>(secondPanelSelector)
        const secondListbox = secondPanel?.querySelector<HTMLElement>(
            '[role="listbox"][data-autotest="criterion-error-code-options"]',
        )

        expect(secondListbox?.getAttribute('data-autotest-value')).toBe('error-code-second')
        expect(secondListbox?.querySelector(
            '[data-autotest="criterion-error-code-option"][data-autotest-value="2"]',
        )?.getAttribute('aria-selected')).toBe('true')

        const firstClear = firstCriterion.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-error-code-clear"]',
        )

        expect(firstClear).not.toBeNull()
        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(firstClear as HTMLButtonElement)

        await waitFor(() => {
            expect(firstInput.value).toBe('')
            expect(firstInput.hasAttribute('data-autotest-value')).toBe(false)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: null,
            }))
        })
        expect(secondInput.value).toBe('Timeout')
        expect(secondInput.getAttribute('data-autotest-value')).toBe('2')
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()
    })

    it('distinguishes a typed pending search from an empty result without mirroring the query', async () => {
        const initialResults = createDeferred<AutoCompleteChoice[]>()
        const typedResults = createDeferred<AutoCompleteChoice[]>()
        const searchErrorCodes = jest.fn(({searchString = ''}: {searchString?: string}) => (
            searchString === '' ? initialResults.promise : typedResults.promise
        ))
        const {container} = render(
            <SearchUIProvider defaults={{...quietAsyncDefaults, searchErrorCodes}}>
                <SearchUIFilters
                    autoTestId="error-code-empty"
                    settingsContextName="error-code-empty-context"
                    possibleCriteria={[CriterionTypeEnum.ERROR_CODE]}
                    predefinedCriteria={[CriterionTypeEnum.ERROR_CODE]}
                    onFiltersUpdate={jest.fn()}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        const criterion = getErrorCodeCriterion(container, 'error-code-empty')
        const input = getErrorCodeInput(criterion)

        expect(input.value).toBe('')
        expect(input.hasAttribute('data-autotest-value')).toBe(false)
        expect(input.getAttribute('aria-busy')).toBe('false')

        openErrorCode(input)

        await waitFor(() => {
            expect(searchErrorCodes).toHaveBeenCalledWith({searchString: ''})
            expect(input.getAttribute('aria-busy')).toBe('true')
        })

        fireEvent.change(input, {target: {value: 'E42'}})

        await waitFor(() => {
            expect(searchErrorCodes).toHaveBeenCalledWith({searchString: 'E42'})
        })
        expect(input.value).toBe('E42')
        expect(input.hasAttribute('data-autotest-value')).toBe(false)

        const panel = document.body.querySelector<HTMLElement>(
            '[data-autotest="criterion-error-code-panel"]'
            + '[data-autotest-value="error-code-empty"]'
            + `[data-autotest-criterion="${CriterionTypeEnum.ERROR_CODE}"]`,
        )

        expect(panel).not.toBeNull()
        expect(panel?.querySelector('[role="listbox"]')).toBeNull()
        expect(panel?.querySelector('[data-autotest="criterion-error-code-option"]')).toBeNull()

        await act(async () => {
            typedResults.resolve([])
            await typedResults.promise
        })

        await waitFor(() => {
            expect(input.getAttribute('aria-busy')).toBe('false')
        })
        expect(input.value).toBe('E42')
        expect(input.hasAttribute('data-autotest-value')).toBe(false)
        expect(panel?.querySelector('[role="listbox"]')).toBeNull()
        expect(panel?.querySelector('[data-autotest="criterion-error-code-option"]')).toBeNull()
    })
})
