import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters, SearchUIProvider, type SearchUIDefaults} from '../src'

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

const renderFilters = (
    scope: string,
    {allRemovable = false, defaults}: {allRemovable?: boolean, defaults?: Partial<SearchUIDefaults>} = {},
) => {
    const onFiltersUpdate = jest.fn()
    const filters = <SearchUIFilters
        autoTestId={scope}
        settingsContextName={`${scope}-context`}
        // THREE_D stays available, so the Add filter button has something to offer.
        possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY, CriterionTypeEnum.THREE_D]}
        predefinedCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY]}
        initialSearchConditions={{status: 'ENABLED'}}
        onFiltersUpdate={onFiltersUpdate}
        config={{
            manualSearch: true,
            removablePredefinedCriteria: allRemovable
                ? [CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY]
                : [CriterionTypeEnum.CURRENCY],
        }}
    />
    const utils = render(defaults ? <SearchUIProvider defaults={defaults}>{filters}</SearchUIProvider> : filters)
    const root = () => utils.container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
    )

    return {...utils, onFiltersUpdate, root}
}

describe('SearchUIFilters layout', () => {
    it('keeps the action anchors and names the panel in its header and as a region', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-orders')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(scope.getAttribute('role')).toBe('region')
        expect(scope.getAttribute('aria-label')).toBe('react.searchUI.filters')
        // UI Kit Filter: the header strip names the panel and holds the saved sets; unfolded, the other
        // actions stand in the footer strip under the rows.
        const header = scope.querySelector('[data-autotest="filters-header"]') as HTMLElement
        const footer = scope.querySelector('[data-autotest="filters-footer"]') as HTMLElement
        expect(header.querySelector('[data-autotest="toggle-filters"]')?.textContent).toBe('react.searchUI.filters')
        expect(header.querySelector('[data-autotest="filters-count"]')?.textContent).toBe('2')
        expect(header.querySelector('[data-autotest="templates"]')).not.toBeNull()
        expect(footer.querySelector('[data-autotest="add-filter"]')).not.toBeNull()
        expect(footer.querySelector('[data-autotest="run-search"]')).not.toBeNull()

        for (const actionId of ['toggle-filters', 'templates', 'add-filter', 'run-search']) {
            expect(scope.querySelectorAll(`[data-autotest="${actionId}"]`)).toHaveLength(1)
        }
        expect(scope.querySelector('[data-autotest="clear-all"]')).toBeNull()
        expect(scope.querySelector('[data-autotest="templates"]')?.textContent).toContain('Saved filters')
    })

    it('draws the panel as a bordered box with a header strip and a footer strip', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-frame')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const header = scope.querySelector('[data-autotest="filters-header"]') as HTMLElement
        const footer = scope.querySelector('[data-autotest="filters-footer"]') as HTMLElement
        const style = (element: Element) => window.getComputedStyle(element)

        // UI Kit Filter: radius 8 inside a 1px line; the strips stand on the tabs fill.
        expect(style(scope).borderRadius).toBe('8px')
        expect(style(scope).borderTopWidth).toBe('1px')
        expect(style(header).backgroundColor).toBe('rgb(240, 244, 248)')
        expect(style(header).minHeight).toBe('32px')
        expect(style(footer).backgroundColor).toBe('rgb(240, 244, 248)')
        expect(style(footer).borderTopWidth).toBe('1px')
        // 24px buttons in the header, 32px in the footer.
        expect(header.querySelector('[data-autotest="templates"]')?.getAttribute('data-pne-size')).toBe('small')
        expect(footer.querySelector('[data-autotest="add-filter"]')?.getAttribute('data-pne-size')).toBe('medium')
        expect(footer.querySelector('[data-autotest="run-search"]')?.getAttribute('data-pne-size')).toBe('medium')
    })

    it('collapses the rows through the toggle and moves the actions into the header', async () => {
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
        // The footer actions come after the rows: the row buttons are reached first.
        expect(precedes(scope.querySelector('[data-autotest="criterion"]'), scope.querySelector('[data-autotest="run-search"]'))).toBe(true)
        expect(scope.querySelector('[data-autotest="filters-footer"] [data-autotest="run-search"]')).not.toBeNull()

        fireEvent.click(toggle as HTMLButtonElement)

        expect(toggle?.getAttribute('aria-expanded')).toBe('false')
        // The rows fold with a transition and leave the DOM once it is over.
        await waitFor(() => {
            expect(panel?.hidden).toBe(true)
        })
        expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        expect(scope.querySelector('[data-autotest="toggle-filters"]')).not.toBeNull()
        expect(scope.querySelector('[data-autotest="templates"]')).not.toBeNull()
        // Folded, the header is the whole panel and holds every action.
        expect(scope.querySelector('[data-autotest="filters-footer"]')).toBeNull()
        expect(scope.querySelector('[data-autotest="filters-header"] [data-autotest="add-filter"]')).not.toBeNull()
        expect(scope.querySelector('[data-autotest="filters-header"] [data-autotest="run-search"]')).not.toBeNull()

        fireEvent.click(toggle as HTMLButtonElement)

        expect(toggle?.getAttribute('aria-expanded')).toBe('true')
        await waitFor(() => {
            expect(panel?.hidden).toBe(false)
        })
        expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
    })

    it('remembers the fold with the host and opens folded when the host says so', async () => {
        const getSearchFiltersCollapsed = jest.fn().mockResolvedValue(true)
        const saveSearchFiltersCollapsed = jest.fn().mockResolvedValue(undefined)
        const {onFiltersUpdate, root} = renderFilters('layout-folded', {
            defaults: {getSearchFiltersCollapsed, saveSearchFiltersCollapsed},
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(getSearchFiltersCollapsed).toHaveBeenCalledWith('layout-folded-context')
        // Folded from the first render: no rows, the count beside the name.
        expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        const toggle = scope.querySelector<HTMLButtonElement>('[data-autotest="toggle-filters"]') as HTMLButtonElement
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        expect(scope.querySelector('[data-autotest="filters-header"] [data-autotest="filters-count"]')?.textContent).toBe('2')

        fireEvent.click(toggle)
        expect(saveSearchFiltersCollapsed).toHaveBeenCalledWith({contextName: 'layout-folded-context', collapsed: false})
        await waitFor(() => {
            expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
        })

        fireEvent.click(toggle)
        expect(saveSearchFiltersCollapsed).toHaveBeenLastCalledWith({contextName: 'layout-folded-context', collapsed: true})
        expect(saveSearchFiltersCollapsed).toHaveBeenCalledTimes(2)
    })

    it('opens expanded and carries on when the host cannot answer about the fold', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const {onFiltersUpdate, root} = renderFilters('layout-fold-unavailable', {
            defaults: {
                getSearchFiltersCollapsed: jest.fn().mockRejectedValue(new Error('older server')),
                saveSearchFiltersCollapsed: jest.fn().mockRejectedValue(new Error('older server')),
            },
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
        fireEvent.click(scope.querySelector('[data-autotest="toggle-filters"]') as HTMLButtonElement)
        await waitFor(() => {
            expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        })
        await waitFor(() => {
            expect(warn).toHaveBeenCalledTimes(2)
        })
        warn.mockRestore()
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

    it('shows the number of criteria beside the name of the panel, folded or not', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-count')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const toggle = scope.querySelector<HTMLButtonElement>('[data-autotest="toggle-filters"]') as HTMLButtonElement
        const count = () => scope.querySelector('[data-autotest="filters-header"] [data-autotest="filters-count"]')
        expect(count()?.textContent).toBe('2')
        // The count is not a part of the button: the button keeps its own name.
        expect(toggle.contains(count())).toBe(false)

        fireEvent.click(toggle)

        expect(count()?.textContent).toBe('2')
        await waitFor(() => {
            expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        })
    })

    it('shows the full name of a criterion in a tooltip only when the column cuts it', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-names')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const nameCell = (type: CriterionTypeEnum) => scope.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${type}"]`,
        )?.children[0].firstElementChild as HTMLElement
        const status = nameCell(CriterionTypeEnum.STATUS)
        const currency = nameCell(CriterionTypeEnum.CURRENCY)
        expect(status.textContent).toBe('react.CriterionTypeEnum.STATUS')
        expect(status.getAttribute('title')).toBeNull()

        // jsdom has no layout: the cut is staged through the sizes the cell measures.
        Object.defineProperty(currency, 'scrollWidth', {value: 300, configurable: true})
        Object.defineProperty(currency, 'clientWidth', {value: 150, configurable: true})
        fireEvent.mouseEnter(currency)
        fireEvent.mouseOver(currency)
        expect((await screen.findByRole('tooltip')).textContent).toBe('react.CriterionTypeEnum.CURRENCY')
        fireEvent.mouseLeave(currency)
        // The tooltip leaves through a transition on real timers; on a loaded CI runner it outlived
        // waitFor's default second (rc.7 check run), so the wait is generous.
        await waitFor(() => {
            expect(screen.queryByRole('tooltip')).toBeNull()
        }, {timeout: 5000})

        Object.defineProperty(status, 'scrollWidth', {value: 100, configurable: true})
        Object.defineProperty(status, 'clientWidth', {value: 150, configurable: true})
        fireEvent.mouseEnter(status)
        fireEvent.mouseOver(status)
        await new Promise(resolve => setTimeout(resolve, 400))
        expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('drops the chevron while no criterion is on the panel and brings it back with the first one', async () => {
        const {onFiltersUpdate, root, getByText} = renderFilters('layout-empty', {allRemovable: true})

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        expect(scope.querySelector('[data-autotest="toggle-filters"]')).not.toBeNull()
        for (const remove of Array.from(scope.querySelectorAll<HTMLButtonElement>('[data-autotest="remove-criterion"]'))) {
            fireEvent.click(remove)
        }
        await waitFor(() => {
            expect(scope.querySelector('[data-autotest="criterion"]')).toBeNull()
        })
        expect(scope.querySelector('[data-autotest="toggle-filters"]')).toBeNull()
        expect(scope.querySelector('[data-autotest="add-filter"]')).not.toBeNull()

        fireEvent.click(scope.querySelector('[data-autotest="add-filter"]') as HTMLElement)
        fireEvent.click(await screen.findByRole('menuitem', {name: 'THREE_D'}))
        await waitFor(() => {
            expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(1)
        })
        expect(scope.querySelector('[data-autotest="toggle-filters"]')).not.toBeNull()
        expect(getByText('react.CriterionTypeEnum.THREE_D')).toBeTruthy()
    })
})

const rectAt = (left: number): DOMRect => ({
    x: left,
    y: 0,
    left,
    top: 0,
    width: 200,
    height: 28,
    right: left + 200,
    bottom: 28,
    toJSON: () => ({}),
} as DOMRect)

describe('SearchUIFilters actions row', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('adds a filter through a button with a menu, as the saved filters trigger does', async () => {
        const {onFiltersUpdate, root} = renderFilters('layout-add-filter')

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
        })

        const scope = root() as HTMLElement
        const addFilter = scope.querySelector<HTMLButtonElement>('[data-autotest="add-filter"]') as HTMLButtonElement
        const templates = scope.querySelector<HTMLButtonElement>('[data-autotest="templates"]') as HTMLButtonElement

        expect(addFilter.tagName).toBe('BUTTON')
        expect(addFilter.getAttribute('aria-haspopup')).toBe('menu')
        expect(addFilter.getAttribute('aria-expanded')).toBe('false')
        expect(addFilter.textContent).toBe('react.searchUI.addCriterion')
        // The same MUI button as the saved filters trigger, so both show the same focus.
        expect(addFilter.className).toContain('MuiButton-root')
        expect(templates.className).toContain('MuiButton-root')
        expect(scope.querySelector('[role="combobox"][data-autotest="add-filter"]')).toBeNull()

        fireEvent.click(addFilter)
        const menu = await waitFor(() => {
            const list = document.body.querySelector<HTMLElement>(
                '[data-autotest="add-filter-options"][data-autotest-value="layout-add-filter"]',
            )
            expect(list).not.toBeNull()
            return list as HTMLElement
        })
        expect(menu.getAttribute('role')).toBe('menu')
        expect(addFilter.getAttribute('aria-expanded')).toBe('true')
        expect(addFilter.getAttribute('aria-controls')).toBe(menu.id)
        const option = menu.querySelector<HTMLElement>(
            '[data-autotest="add-filter-option"][data-autotest-value="THREE_D"]',
        )
        expect(option?.getAttribute('role')).toBe('menuitem')
        expect(option?.textContent).toBe('THREE_D')

        fireEvent.keyDown(menu, {key: 'Escape', code: 'Escape'})
        await waitFor(() => {
            expect(document.body.querySelector('[data-autotest="add-filter-options"]')).toBeNull()
        })
        expect(addFilter.getAttribute('aria-expanded')).toBe('false')

        // The arrow keys open the menu as they open a native select.
        fireEvent.keyDown(addFilter, {key: 'ArrowDown', code: 'ArrowDown'})
        await waitFor(() => {
            expect(document.body.querySelector('[data-autotest="add-filter-options"]')).not.toBeNull()
        })
        fireEvent.click(document.body.querySelector(
            '[data-autotest="add-filter-option"][data-autotest-value="THREE_D"]',
        ) as HTMLElement)
        await waitFor(() => {
            expect(scope.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(3)
        })
        expect(document.body.querySelector('[data-autotest="add-filter-options"]')).toBeNull()
    })
})
