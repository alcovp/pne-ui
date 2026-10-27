import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const precedes = (first: Element | null | undefined, second: Element | null | undefined) => Boolean(
    first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
)

const renderFilters = (scope: string, layout: 'header' | 'compact') => {
    const onFiltersUpdate = jest.fn()
    const utils = render(
        <SearchUIFilters
            autoTestId={scope}
            settingsContextName={`${scope}-context`}
            // THREE_D stays available, so the Add filter button has something to offer.
            possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY, CriterionTypeEnum.THREE_D]}
            predefinedCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY]}
            initialSearchConditions={{status: 'ENABLED'}}
            onFiltersUpdate={onFiltersUpdate}
            config={{
                layout,
                manualSearch: true,
                removablePredefinedCriteria: [CriterionTypeEnum.CURRENCY],
            }}
        />,
    )
    const root = () => utils.container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
    )

    return {...utils, onFiltersUpdate, root}
}

describe('SearchUIFilters compact layout', () => {
    it('keeps the action anchors, drops the title and names the region instead', async () => {
        const {onFiltersUpdate, root, queryByText} = renderFilters('compact-orders', 'compact')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(scope.getAttribute('role')).toBe('region')
        expect(scope.getAttribute('aria-label')).toBe('react.searchUI.filters')
        expect(queryByText('react.searchUI.filters')).toBeNull()

        for (const actionId of ['toggle-filters', 'templates', 'add-filter', 'run-search']) {
            expect(scope.querySelectorAll(`[data-autotest="${actionId}"]`)).toHaveLength(1)
        }
        expect(scope.querySelector('[data-autotest="clear-all"]')).toBeNull()

        const templates = scope.querySelector<HTMLButtonElement>('[data-autotest="templates"]')
        expect(templates?.textContent).toContain('Saved filters')
    })

    it('collapses the rows through the toggle and keeps the actions row on screen', async () => {
        const {onFiltersUpdate, root} = renderFilters('compact-collapse', 'compact')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const toggle = scope.querySelector<HTMLButtonElement>('[data-autotest="toggle-filters"]')
        const panelId = toggle?.getAttribute('aria-controls')
        const panel = panelId ? document.getElementById(panelId) : null

        expect(panel && scope.contains(panel)).toBe(true)
        expect(panel?.hidden).toBe(false)
        expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
        // The actions come after the rows: the row buttons are reached first.
        expect(precedes(panel, scope.querySelector('[data-autotest="templates"]'))).toBe(true)

        fireEvent.click(toggle as HTMLButtonElement)

        expect(toggle?.getAttribute('aria-expanded')).toBe('false')
        expect(panel?.hidden).toBe(true)
        expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        expect(scope.querySelector('[data-autotest="toggle-filters"]')).not.toBeNull()
        expect(scope.querySelector('[data-autotest="templates"]')).not.toBeNull()
        expect(scope.querySelector('[data-autotest="run-search"]')).not.toBeNull()

        fireEvent.click(toggle as HTMLButtonElement)

        expect(panel?.hidden).toBe(false)
        expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
    })

    it('puts the cross and the eraser between the name and the value, the cross first', async () => {
        const {onFiltersUpdate, root} = renderFilters('compact-icons', 'compact')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const currency = scope.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.CURRENCY}"]`,
        )
        const status = scope.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.STATUS}"]`,
        )
        const currencyClear = currency?.querySelector('[data-autotest="clear-criterion"]')
        const currencyRemove = currency?.querySelector('[data-autotest="remove-criterion"]')
        const currencyValue = currency?.querySelector('fieldset')
        const statusClear = status?.querySelector('[data-autotest="clear-criterion"]')

        expect(currencyClear?.tagName).toBe('BUTTON')
        expect(currencyRemove?.tagName).toBe('BUTTON')
        expect(precedes(currencyRemove, currencyClear)).toBe(true)
        expect(precedes(currencyClear, currencyValue)).toBe(true)
        expect(status?.querySelector('[data-autotest="remove-criterion"]')).toBeNull()
        expect(precedes(statusClear, status?.querySelector('fieldset'))).toBe(true)
        expect(statusClear?.getAttribute('aria-label')).toBe('Clear filter: react.CriterionTypeEnum.STATUS')

        fireEvent.click(currencyRemove as HTMLButtonElement)

        await waitFor(() => {
            expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(1)
        })
    })

    it('leaves the header layout as it was', async () => {
        const {onFiltersUpdate, root, getByText} = renderFilters('header-orders', 'header')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(scope.getAttribute('role')).toBeNull()
        expect(getByText('react.searchUI.filters')).not.toBeNull()
        expect(scope.querySelector('[data-autotest="templates"]')?.textContent).toContain('Saved filters')

        const currency = scope.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.CURRENCY}"]`,
        )
        const clear = currency?.querySelector('[data-autotest="clear-criterion"]')
        const remove = currency?.querySelector('[data-autotest="remove-criterion"]')

        expect(precedes(currency?.querySelector('fieldset'), clear)).toBe(true)
        expect(precedes(clear, remove)).toBe(true)
        // The title bar keeps the actions ahead of the rows.
        expect(precedes(
            scope.querySelector('[data-autotest="templates"]'),
            scope.querySelector('[data-autotest="criterion"]'),
        )).toBe(true)
    })
})
