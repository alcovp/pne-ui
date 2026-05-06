import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import { getSearchUIFiltersInitialState } from '../src/component/search-ui/filters/state/initial'
import { useSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}))

describe('SearchUIFilters search button', () => {
    const renderFilters = (props?: Partial<React.ComponentProps<typeof SearchUIFilters>>) => render(
        <SearchUIFilters
            settingsContextName={'ctx'}
            possibleCriteria={[]}
            predefinedCriteria={[]}
            onFiltersUpdate={jest.fn()}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                ...props?.config,
            }}
            {...props}
        />,
    )

    beforeEach(() => {
        useSearchUIFiltersStore.setState(getSearchUIFiltersInitialState())
    })

    it('renders Refresh in automatic search mode', async () => {
        renderFilters()

        const refreshButton = await screen.findByRole('button', {name: 'Refresh'}) as HTMLButtonElement

        expect(refreshButton.disabled).toBe(false)
    })

    it('keeps Search enabled in manual mode when filters are already applied', async () => {
        renderFilters({
            config: {
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                manualSearch: true,
            },
        })

        const searchButton = await screen.findByRole('button', {name: 'react.searchUI.search'})

        await waitFor(() => {
            expect((searchButton as HTMLButtonElement).disabled).toBe(false)
        })
    })

    it('disables the search button while table data is loading', async () => {
        renderFilters({
            config: {
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                manualSearch: true,
            },
            searchLoading: true,
        })

        const searchButton = await screen.findByRole('button', {name: 'react.searchUI.search'}) as HTMLButtonElement

        expect(searchButton.disabled).toBe(true)
    })
})
