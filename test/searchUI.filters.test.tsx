import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'

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

    it('rejects legacy resolved relative dates at the component props boundary', () => {
        expect(() => renderFilters({
            initialSearchConditions: {
                dateRangeSpec: {
                    dateRangeSpecType: 'DAYS_BEFORE',
                    dateFrom: new Date('2020-01-01T00:00:00.000Z'),
                    dateTo: new Date('2020-01-31T00:00:00.000Z'),
                    beforeCount: 30,
                },
            } as never,
        })).toThrow(
            '[pne-ui] Invalid initialSearchConditions.dateRangeSpec: field "dateFrom" is not allowed for DAYS_BEFORE',
        )
    })
})
