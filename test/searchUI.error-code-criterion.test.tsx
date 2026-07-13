import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import { CriterionTypeEnum } from '../src/component/search-ui/filters/types'
import { SearchUIDefaultsContext, initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

describe('ErrorCodeCriterion', () => {
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
                    <SearchUIFilters
                        settingsContextName={'error-code-criterion-test'}
                        possibleCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        predefinedCriteria={[CriterionTypeEnum.ERROR_CODE]}
                        onFiltersUpdate={jest.fn()}
                        config={{
                            hideShowFiltersButton: true,
                            hideTemplatesSelect: true,
                        }}
                    />
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
