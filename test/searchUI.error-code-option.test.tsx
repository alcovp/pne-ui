import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {CriterionTypeEnum, SearchUIFilters, SearchUIProvider} from '../src'
import {formatErrorCodeIdentifiers} from '../src/component/search-ui/filters/component/criterion/errorCodeOption'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const MESSAGE = 'referenced tx can not be captured (cut off time reached)'

const openErrorCode = (input: HTMLInputElement) => {
    fireEvent.focus(input)
    fireEvent.mouseDown(input)
    fireEvent.keyDown(input, {key: 'ArrowDown'})
}

describe('formatErrorCodeIdentifiers', () => {
    it('keeps the type, the id and the external code, not the repeated message', () => {
        expect(formatErrorCodeIdentifiers(`EXTERNAL:25323 ${MESSAGE} 700.300.400 `, MESSAGE))
            .toBe('EXTERNAL · 25323 · 700.300.400')
        expect(formatErrorCodeIdentifiers('EXTERNAL:7 Timeout', 'Timeout')).toBe('EXTERNAL · 7')
    })

    it('keeps a tail that is not the message', () => {
        expect(formatErrorCodeIdentifiers('EXTERNAL:40013 Custom text 1013', 'Another message'))
            .toBe('EXTERNAL · 40013 · Custom text 1013')
    })

    it('shows a description of another shape as it is and hides an empty one', () => {
        expect(formatErrorCodeIdentifiers('no colon here', 'Timeout')).toBe('no colon here')
        expect(formatErrorCodeIdentifiers('   ', 'Timeout')).toBeNull()
        expect(formatErrorCodeIdentifiers(undefined, 'Timeout')).toBeNull()
    })
})

describe('Error code options', () => {
    const renderErrorCode = (searchErrorCodes: jest.Mock) => {
        const utils = render(
            <SearchUIProvider defaults={{getSearchTemplates: () => new Promise(() => undefined), searchErrorCodes}}>
                <SearchUIFilters
                    autoTestId="error-code-rows"
                    settingsContextName="error-code-rows-context"
                    possibleCriteria={[CriterionTypeEnum.ERROR_CODE]}
                    predefinedCriteria={[CriterionTypeEnum.ERROR_CODE]}
                    initialSearchConditions={{}}
                    onFiltersUpdate={jest.fn()}
                    config={{hideShowFiltersButton: true, hideTemplatesSelect: true}}
                />
            </SearchUIProvider>,
        )
        const input = utils.container.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-error-code"]',
        ) as HTMLInputElement
        const panel = () => document.body.querySelector<HTMLElement>('[data-autotest="criterion-error-code-panel"]')

        return {...utils, input, panel}
    }

    it('asks for a query instead of calling the server with an empty one', async () => {
        const searchErrorCodes = jest.fn().mockResolvedValue([])
        const {input, panel} = renderErrorCode(searchErrorCodes)

        openErrorCode(input)
        await waitFor(() => {
            expect(panel()?.textContent).toContain('Start typing an error code or message')
        })
        expect(searchErrorCodes).not.toHaveBeenCalled()
    })

    it('shows the message with the query in bold and the identifiers under it', async () => {
        const searchErrorCodes = jest.fn().mockResolvedValue([
            {choiceId: 25323, displayName: MESSAGE, description: `EXTERNAL:25323 ${MESSAGE} 700.300.400`},
            {choiceId: 7, displayName: 'Timeout', description: 'EXTERNAL:7 Timeout'},
        ])
        const {input, panel} = renderErrorCode(searchErrorCodes)

        openErrorCode(input)
        fireEvent.change(input, {target: {value: 'time'}})
        await waitFor(() => {
            expect(searchErrorCodes).toHaveBeenCalledWith({searchString: 'time'})
        })
        const option = await waitFor(() => {
            const element = panel()?.querySelector<HTMLElement>(
                '[data-autotest="criterion-error-code-option"][data-autotest-value="25323"]',
            )
            expect(element).not.toBeNull()
            return element as HTMLElement
        })

        const marks = Array.from(option.querySelectorAll('mark')).map(mark => mark.textContent)
        expect(marks).toEqual(['time'])
        expect(option.textContent).toBe(`${MESSAGE}EXTERNAL · 25323 · 700.300.400`)
        expect(option.querySelector('span[title]')?.getAttribute('title')).toBe(MESSAGE)

        const timeout = panel()?.querySelector<HTMLElement>(
            '[data-autotest="criterion-error-code-option"][data-autotest-value="7"]',
        )
        expect(Array.from(timeout?.querySelectorAll('mark') ?? []).map(mark => mark.textContent)).toEqual(['Time'])
        expect(timeout?.textContent).toBe('TimeoutEXTERNAL · 7')
    })
})
