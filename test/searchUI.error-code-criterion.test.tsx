import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { ErrorCodeCriterion } from '../src/component/search-ui/filters/component/criterion/ErrorCodeCriterion'
import { getSearchUIFiltersInitialState } from '../src/component/search-ui/filters/state/initial'
import { useSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import { SearchUIDefaultsContext, initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

describe('ErrorCodeCriterion', () => {
    beforeEach(() => {
        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
    })

    it('renders descriptions for duplicate-looking error codes', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        try {
            const searchErrorCodes = jest.fn().mockResolvedValue([
                { choiceId: 1, displayName: 'Timeout', description: 'External code: 05' },
                { choiceId: 2, displayName: 'Timeout', description: 'External code: 51' },
            ])

            render(
                <SearchUIDefaultsContext.Provider
                    value={{
                        ...initialSearchUIDefaults,
                        searchErrorCodes,
                    }}
                >
                    <ErrorCodeCriterion />
                </SearchUIDefaultsContext.Provider>
            )

            const input = screen.getByRole('combobox')
            fireEvent.mouseDown(input)
            fireEvent.keyDown(input, { key: 'ArrowDown' })

            await waitFor(() => {
                expect(searchErrorCodes).toHaveBeenCalledWith({ searchString: '' })
            })

            expect(await screen.findByText('External code: 05')).toBeTruthy()
            expect(await screen.findByText('External code: 51')).toBeTruthy()
            expect(screen.getAllByText('Timeout')).toHaveLength(2)
            expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('Encountered two children with the same key')
        } finally {
            consoleErrorSpy.mockRestore()
        }
    })
})
