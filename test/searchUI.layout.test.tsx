import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string} & Record<string, unknown>) => (
            options?.defaultValue?.replace(/{{(\w+)}}/g, (_, name: string) => String(options[name])) ?? key
        ),
    }),
}))

const precedes = (first: Element | null | undefined, second: Element | null | undefined) => Boolean(
    first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
)

const renderFilters = (scope: string) => {
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

describe('SearchUIFilters layout', () => {
    it('keeps the action anchors, has no title and names the region instead', async () => {
        const {onFiltersUpdate, root, queryByText} = renderFilters('layout-orders')

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
        expect(scope.querySelector('[data-autotest="templates"]')?.textContent).toContain('Saved filters')
    })

    it('collapses the rows through the toggle and keeps the actions row on screen', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-collapse')

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
        const {onFiltersUpdate, root} = renderFilters('layout-icons')

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

    it('shows what the icons and the chevron do in tooltips, keeping their names', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-tooltips')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const currency = scope.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.CURRENCY}"]`,
        )
        for (const iconId of ['remove-criterion', 'clear-criterion']) {
            const icon = currency?.querySelector<HTMLElement>(`[data-autotest="${iconId}"]`) as HTMLElement

            fireEvent.mouseOver(icon)
            const tooltip = await screen.findByRole('tooltip')
            expect(tooltip.textContent).toBe(icon.getAttribute('aria-label'))
            // It may cover the next row's icons: it lets the pointer through to them.
            expect(tooltip.classList.contains('MuiTooltip-popper')).toBe(true)
            expect(tooltip.classList.contains('MuiTooltip-popperInteractive')).toBe(false)
            fireEvent.mouseLeave(icon)
            await waitFor(() => {
                expect(screen.queryByRole('tooltip')).toBeNull()
            })
        }

        const toggle = scope.querySelector<HTMLButtonElement>('[data-autotest="toggle-filters"]') as HTMLButtonElement
        fireEvent.mouseOver(toggle)
        expect((await screen.findByRole('tooltip')).textContent).toBe('Hide filters')

        fireEvent.click(toggle)

        await waitFor(() => {
            expect(screen.getByRole('tooltip').textContent).toBe('Show filters')
        })
        // The tooltip hints at the click; the name stays, the state is in aria-expanded.
        expect(toggle.getAttribute('aria-label')).toBe('react.searchUI.filters')
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
    })

    it('reads the collapsed count as a number of filters', async () => {
        const {onFiltersUpdate, root, getByText} = renderFilters('layout-count')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        fireEvent.click(scope.querySelector('[data-autotest="toggle-filters"]') as HTMLButtonElement)

        expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        expect(getByText('Filters: 2')).toBeTruthy()
        expect(getByText('2').getAttribute('aria-hidden')).toBe('true')
    })

    it('keeps the full name of a criterion in the title of its name cell', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-names')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const status = (root() as HTMLElement).querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.STATUS}"]`,
        )
        const name = status?.querySelector('[title]')

        expect(name?.getAttribute('title')).toBe('react.CriterionTypeEnum.STATUS')
        expect(name?.textContent).toBe('react.CriterionTypeEnum.STATUS')
    })
})
