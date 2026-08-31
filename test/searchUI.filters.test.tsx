import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import {CriterionTypeEnum} from '../src/component/search-ui/filters/types'

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

    it('shows the max-range error and disables search for an invalid report range', async () => {
        const onFiltersUpdate = jest.fn()
        const onValidationChange = jest.fn()

        renderFilters({
            possibleCriteria: [CriterionTypeEnum.DATE_RANGE],
            predefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
            initialSearchConditions: {
                dateRangeSpec: {
                    dateRangeSpecType: 'EXACTLY',
                    dateFrom: new Date('2026-01-01T00:00:00.000Z'),
                    dateTo: new Date('2026-04-04T00:00:00.000Z'),
                },
            },
            onFiltersUpdate,
            onValidationChange,
            config: {
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                manualSearch: true,
                dateRange: {maxRangeSpanInDays: 93},
            },
        })

        const error = await screen.findByRole('alert')
        const searchButton = screen.getByRole('button', {name: 'react.searchUI.search'}) as HTMLButtonElement

        expect(error.textContent).toBe('react.searchUI.dateRange.maxRangeSpanExceeded')
        expect(searchButton.disabled).toBe(true)
        expect(onValidationChange).toHaveBeenLastCalledWith(expect.objectContaining({isValid: false}))
        expect(onFiltersUpdate).not.toHaveBeenCalled()
    })

    it('rejects a non-positive max-range configuration', () => {
        expect(() => renderFilters({
            config: {
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                dateRange: {maxRangeSpanInDays: 0},
            },
        })).toThrow('expected a positive integer')
    })
})
