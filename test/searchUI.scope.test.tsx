import * as React from 'react'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {createPortal} from 'react-dom'

import {
    CriterionTypeEnum,
    SearchUI,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUITemplate,
} from '../src'
import {
    SearchUICriterionAutoTestScopeProvider,
    SearchUIAutoTestScopeProvider,
    useSearchUIAutoTestScope,
} from '../src/component/search-ui/filters/AutoTestScope'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const savedTemplate: SearchUITemplate = {
    name: 'Saved orders',
    searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
}

const PortalScopeProbe = () => {
    const scope = useSearchUIAutoTestScope()

    return createPortal(
        <div
            data-testid="portal-scope"
            data-scope={scope?.scope}
            data-criterion={scope?.criterionType}
        />,
        document.body,
    )
}

describe('SearchUI autotest scope', () => {
    it('supports explicit and settings-context standalone filter scopes', async () => {
        const explicitOnFiltersUpdate = jest.fn()
        const fallbackOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="standalone-orders"
                    settingsContextName="stored-orders-filters"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={explicitOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    settingsContextName="fallback-filters"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={fallbackOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(explicitOnFiltersUpdate).toHaveBeenCalled()
            expect(fallbackOnFiltersUpdate).toHaveBeenCalled()
        })

        const filterScopes = Array.from(
            container.querySelectorAll('[data-autotest="search-filters"]'),
        ).map(element => element.getAttribute('data-autotest-value'))

        expect(filterScopes).toEqual(['standalone-orders', 'fallback-filters'])

        for (const scope of filterScopes) {
            const scopedFilters = container.querySelector(
                `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
            )
            const statusCriteria = scopedFilters?.querySelectorAll(
                `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.STATUS}"]`,
            )

            expect(statusCriteria).toHaveLength(1)
        }
    })

    it('uses scoped buttons for shared criterion clear and remove actions', async () => {
        const removableOnFiltersUpdate = jest.fn()
        const fixedOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="removable-status"
                    settingsContextName="removable-status-actions"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    initialSearchConditions={{status: 'ENABLED'}}
                    onFiltersUpdate={removableOnFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                        removablePredefinedCriteria: [CriterionTypeEnum.STATUS],
                    }}
                />
                <SearchUIFilters
                    autoTestId="fixed-status"
                    settingsContextName="fixed-status-actions"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    initialSearchConditions={{status: 'ENABLED'}}
                    onFiltersUpdate={fixedOnFiltersUpdate}
                    config={filtersConfig}
                />
            </>,
        )

        await waitFor(() => {
            expect(removableOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({status: 'E'}))
            expect(fixedOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({status: 'E'}))
        })

        const removableScope = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="removable-status"]',
        )
        const fixedScope = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="fixed-status"]',
        )
        const removableCriterion = removableScope?.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.STATUS}"]`,
        )
        const fixedCriterion = fixedScope?.querySelector<HTMLElement>(
            `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.STATUS}"]`,
        )
        const removableClear = removableCriterion?.querySelector<HTMLButtonElement>(
            '[data-autotest="clear-criterion"]',
        )
        const removableRemove = removableCriterion?.querySelector<HTMLButtonElement>(
            '[data-autotest="remove-criterion"]',
        )
        const fixedClear = fixedCriterion?.querySelector<HTMLButtonElement>(
            '[data-autotest="clear-criterion"]',
        )

        expect(removableClear?.tagName).toBe('BUTTON')
        expect(removableClear?.type).toBe('button')
        expect(removableClear?.getAttribute('aria-label')).toBe(
            'Clear filter: react.CriterionTypeEnum.STATUS',
        )
        expect(removableRemove?.tagName).toBe('BUTTON')
        expect(removableRemove?.type).toBe('button')
        expect(removableRemove?.getAttribute('aria-label')).toBe(
            'Remove filter: react.CriterionTypeEnum.STATUS',
        )
        expect(fixedClear?.tagName).toBe('BUTTON')
        expect(fixedCriterion?.querySelector('[data-autotest="remove-criterion"]')).toBeNull()

        fixedOnFiltersUpdate.mockClear()
        fireEvent.click(fixedClear as HTMLButtonElement)

        await waitFor(() => {
            expect(fixedOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({status: null}))
        })
        expect(fixedScope?.querySelector('[data-autotest="criterion"]')).not.toBeNull()

        fireEvent.click(removableRemove as HTMLButtonElement)

        await waitFor(() => {
            expect(removableScope?.querySelector('[data-autotest="criterion"]')).toBeNull()
        })
        expect(fixedScope?.querySelector('[data-autotest="criterion"]')).not.toBeNull()
    })

    it('shares each SearchUI scope between its filters and results table', async () => {
        const ordersSearch = jest.fn().mockResolvedValue([])
        const transactionsSearch = jest.fn().mockResolvedValue([])
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        try {
            const {container} = render(
                <>
                    <SearchUI
                        autoTestId="orders"
                        settingsContextName="shared-search-state"
                        possibleCriteria={[]}
                        searchData={ordersSearch}
                        createTableHeader={() => <tr><th>Order</th></tr>}
                        createTableRow={() => <tr><td>Order</td></tr>}
                        config={filtersConfig}
                    />
                    <SearchUI
                        autoTestId="transactions"
                        settingsContextName="shared-search-state"
                        possibleCriteria={[]}
                        searchData={transactionsSearch}
                        createTableHeader={() => <tr><th>Transaction</th></tr>}
                        createTableRow={() => <tr><td>Transaction</td></tr>}
                        config={filtersConfig}
                    />
                </>,
            )

            await waitFor(() => {
                expect(ordersSearch).toHaveBeenCalled()
                expect(transactionsSearch).toHaveBeenCalled()
                expect(container.querySelectorAll('table[aria-busy="false"]')).toHaveLength(2)
            })

            const filterScopes = Array.from(
                container.querySelectorAll('[data-autotest="search-filters"]'),
            ).map(element => element.getAttribute('data-autotest-value'))
            const resultScopes = Array.from(
                container.querySelectorAll('[data-autotest="table"]'),
            ).map(element => element.getAttribute('data-autotest-value'))

            expect(filterScopes).toEqual(['orders', 'transactions'])
            expect(resultScopes).toEqual(['orders', 'transactions'])
            expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining(
                'Multiple SearchUI instances use settingsContextName "shared-search-state"',
            ))
        } finally {
            consoleWarn.mockRestore()
        }
    })

    it('keeps shared header actions scoped and exposes the filter toggle state', async () => {
        const ordersOnFiltersUpdate = jest.fn()
        const transactionsOnFiltersUpdate = jest.fn()
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="action-orders"
                    settingsContextName="action-orders-context"
                    possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.THREE_D]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={ordersOnFiltersUpdate}
                    config={{removablePredefinedCriteria: [CriterionTypeEnum.STATUS]}}
                />
                <SearchUIFilters
                    autoTestId="action-transactions"
                    settingsContextName="action-transactions-context"
                    possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.THREE_D]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={transactionsOnFiltersUpdate}
                    searchLoading
                    config={{removablePredefinedCriteria: [CriterionTypeEnum.STATUS]}}
                />
            </>,
        )

        await waitFor(() => {
            expect(ordersOnFiltersUpdate).toHaveBeenCalled()
            expect(transactionsOnFiltersUpdate).toHaveBeenCalled()
        })

        const actionIds = [
            'toggle-filters',
            'clear-all',
            'templates',
            'add-filter',
            'run-search',
        ]
        const filterScopes = Array.from(
            container.querySelectorAll<HTMLElement>('[data-autotest="search-filters"]'),
        )

        for (const filterScope of filterScopes) {
            for (const actionId of actionIds) {
                expect(filterScope.querySelectorAll(`[data-autotest="${actionId}"]`)).toHaveLength(1)
            }
        }

        const ordersScope = filterScopes[0]
        const transactionsScope = filterScopes[1]
        const toggleFilters = ordersScope.querySelector<HTMLButtonElement>(
            '[data-autotest="toggle-filters"]',
        )
        const templates = ordersScope.querySelector<HTMLButtonElement>('[data-autotest="templates"]')
        const addFilter = ordersScope.querySelector<HTMLElement>('[data-autotest="add-filter"]')
        const runSearch = ordersScope.querySelector<HTMLButtonElement>('[data-autotest="run-search"]')
        const loadingRunSearch = transactionsScope.querySelector<HTMLButtonElement>(
            '[data-autotest="run-search"]',
        )
        const controlledPanelId = toggleFilters?.getAttribute('aria-controls')
        const controlledPanel = controlledPanelId ? document.getElementById(controlledPanelId) : null

        expect(toggleFilters?.tagName).toBe('BUTTON')
        expect(toggleFilters?.getAttribute('aria-label')).toBe('react.searchUI.filters')
        expect(toggleFilters?.getAttribute('aria-expanded')).toBe('true')
        expect(controlledPanel && ordersScope.contains(controlledPanel)).toBe(true)
        expect(controlledPanel?.hidden).toBe(false)
        expect(templates?.getAttribute('aria-expanded')).toBe('false')
        expect(addFilter?.getAttribute('role')).toBe('combobox')
        expect(addFilter?.getAttribute('aria-label')).toBe('react.searchUI.addCriterion')
        expect(addFilter?.getAttribute('aria-expanded')).toBe('false')
        expect(runSearch?.disabled).toBe(false)
        expect(loadingRunSearch?.disabled).toBe(true)

        fireEvent.click(templates as HTMLButtonElement)

        expect(templates?.getAttribute('aria-expanded')).toBe('true')

        fireEvent.click(toggleFilters as HTMLButtonElement)

        expect(toggleFilters?.getAttribute('aria-expanded')).toBe('false')
        expect(controlledPanel?.hidden).toBe(true)
        expect(ordersScope.querySelector('[data-autotest="criterion"]')).toBeNull()
    })

    it('repeats each SearchUI scope on detached template panels', async () => {
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="portal-orders"
                    settingsContextName="portal-orders-templates"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={jest.fn()}
                />
                <SearchUIFilters
                    autoTestId="portal-transactions"
                    settingsContextName="portal-transactions-templates"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={jest.fn()}
                />
            </>,
        )

        const filterScopes = Array.from(
            container.querySelectorAll<HTMLElement>('[data-autotest="search-filters"]'),
        )

        for (const filterScope of filterScopes) {
            const templates = filterScope.querySelector<HTMLButtonElement>('[data-autotest="templates"]')

            fireEvent.click(templates as HTMLButtonElement)
        }

        await waitFor(() => {
            expect(document.body.querySelectorAll('[data-autotest="templates-panel"]')).toHaveLength(2)
        })

        for (const filterScope of filterScopes) {
            const scope = filterScope.getAttribute('data-autotest-value')
            const templates = filterScope.querySelector<HTMLButtonElement>('[data-autotest="templates"]')
            const panelId = templates?.getAttribute('aria-controls')
            const panel = panelId ? document.getElementById(panelId) : null

            expect(templates?.getAttribute('aria-expanded')).toBe('true')
            expect(templates?.getAttribute('aria-haspopup')).toBe('dialog')
            expect(panel?.getAttribute('data-autotest')).toBe('templates-panel')
            expect(panel?.getAttribute('data-autotest-value')).toBe(scope)
            expect(panel?.getAttribute('role')).toBe('dialog')
            expect(panel?.getAttribute('aria-label')).toBe('react.searchUI.template')
            expect(panel && filterScope.contains(panel)).toBe(false)
        }
    })

    it('uses semantic actions for saved template items without technical name IDs', async () => {
        const deleteSearchTemplate = jest.fn().mockResolvedValue(undefined)
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    deleteSearchTemplate,
                    getSearchTemplates: jest.fn().mockResolvedValue([savedTemplate]),
                }}
            >
                <SearchUIFilters
                    autoTestId="template-actions"
                    settingsContextName="template-item-actions"
                    possibleCriteria={[]}
                    onFiltersUpdate={jest.fn()}
                    config={{hideShowFiltersButton: true}}
                />
            </SearchUIProvider>,
        )
        const filters = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="template-actions"]',
        )
        const templates = filters?.querySelector<HTMLButtonElement>('[data-autotest="templates"]')

        fireEvent.click(templates as HTMLButtonElement)

        await waitFor(() => {
            expect(document.body.querySelector('[data-autotest="template-item"]')).not.toBeNull()
        })

        let panel = document.body.querySelector<HTMLElement>(
            '[data-autotest="templates-panel"][data-autotest-value="template-actions"]',
        )
        let item = panel?.querySelector<HTMLElement>('[data-autotest="template-item"]')
        const selectTemplate = item?.querySelector<HTMLButtonElement>('[data-autotest="select-template"]')
        const removeTemplate = item?.querySelector<HTMLButtonElement>('[data-autotest="remove-template"]')

        expect(item?.hasAttribute('data-autotest-value')).toBe(false)
        expect(selectTemplate?.tagName).toBe('BUTTON')
        expect(selectTemplate?.type).toBe('button')
        expect(selectTemplate?.getAttribute('aria-label')).toBe('Use template: Saved orders')
        expect(removeTemplate?.tagName).toBe('BUTTON')
        expect(removeTemplate?.type).toBe('button')
        expect(removeTemplate?.getAttribute('aria-label')).toBe('Remove template: Saved orders')

        fireEvent.click(selectTemplate as HTMLButtonElement)

        await waitFor(() => {
            expect(templates?.textContent).toContain('Saved orders')
            expect(templates?.getAttribute('aria-expanded')).toBe('false')
        })

        fireEvent.click(templates as HTMLButtonElement)

        await waitFor(() => {
            panel = document.body.querySelector<HTMLElement>(
                '[data-autotest="templates-panel"][data-autotest-value="template-actions"]',
            )
            expect(within(panel as HTMLElement).getByRole('button', {
                name: 'react.searchUI.template.update',
            })).not.toBeNull()
        })

        const newTemplate = within(panel as HTMLElement).getByRole<HTMLButtonElement>('button', {
            name: 'react.searchUI.template.create',
        })
        const updateTemplate = within(panel as HTMLElement).getByRole<HTMLButtonElement>('button', {
            name: 'react.searchUI.template.update',
        })
        item = panel?.querySelector<HTMLElement>('[data-autotest="template-item"]')

        expect(newTemplate?.type).toBe('button')
        expect(updateTemplate?.type).toBe('button')

        fireEvent.click(item?.querySelector('[data-autotest="remove-template"]') as HTMLButtonElement)

        await waitFor(() => {
            expect(deleteSearchTemplate).toHaveBeenCalledWith({
                contextName: 'template-item-actions',
                templateName: 'Saved orders',
            })
            expect(panel?.querySelector('[data-autotest="template-item"]')).toBeNull()
        })
    })

    it('keeps the template editor scoped and linked through its nested modal portal', async () => {
        const {container} = render(
            <SearchUIFilters
                autoTestId="template-editor-owner"
                settingsContextName="template-editor-actions"
                possibleCriteria={[]}
                onFiltersUpdate={jest.fn()}
                config={{hideShowFiltersButton: true}}
            />,
        )
        const filters = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="template-editor-owner"]',
        )
        const templates = filters?.querySelector<HTMLButtonElement>('[data-autotest="templates"]')

        fireEvent.click(templates as HTMLButtonElement)

        const panel = await waitFor(() => {
            const result = document.body.querySelector<HTMLElement>(
                '[data-autotest="templates-panel"][data-autotest-value="template-editor-owner"]',
            )
            expect(result).not.toBeNull()
            return result as HTMLElement
        })
        const newTemplate = within(panel).getByRole<HTMLButtonElement>('button', {
            name: 'react.searchUI.template.create',
        })

        expect(newTemplate?.getAttribute('aria-expanded')).toBe('false')
        expect(newTemplate?.getAttribute('aria-haspopup')).toBe('dialog')

        fireEvent.click(newTemplate as HTMLButtonElement)

        const editor = await waitFor(() => {
            const result = document.body.querySelector<HTMLElement>(
                '[data-autotest="template-editor"][data-autotest-value="template-editor-owner"]',
            )
            expect(result).not.toBeNull()
            return result as HTMLElement
        })
        const editorId = newTemplate?.getAttribute('aria-controls')
        const closeEditor = editor.querySelector<HTMLButtonElement>('[data-autotest="close-template-editor"]')
        const cancelTemplate = within(editor).getByRole<HTMLButtonElement>('button', {name: 'cancel'})
        const createTemplate = within(editor).getByRole<HTMLButtonElement>('button', {name: 'create'})
        const templateName = within(editor).getByRole<HTMLInputElement>('textbox', {
            name: 'react.searchUI.template.name',
        })
        const form = editor.querySelector<HTMLFormElement>('form')

        expect(editor.id).toBe(editorId)
        expect(editor.getAttribute('role')).toBe('dialog')
        expect(editor.getAttribute('aria-modal')).toBe('true')
        expect(editor.getAttribute('aria-label')).toBe('react.searchUI.template.newModal.title')
        expect(panel.contains(editor)).toBe(false)
        expect(newTemplate?.getAttribute('aria-expanded')).toBe('true')
        expect(closeEditor?.getAttribute('aria-label')).toBe('Close')
        expect(cancelTemplate?.type).toBe('button')
        expect(createTemplate?.type).toBe('submit')
        expect(createTemplate?.form).toBe(form)
        expect(templateName.required).toBe(true)

        fireEvent.click(cancelTemplate as HTMLButtonElement)

        await waitFor(() => {
            expect(document.body.querySelector('[data-autotest="template-editor"]')).toBeNull()
            expect(newTemplate?.getAttribute('aria-expanded')).toBe('false')
        })
        expect(document.body.contains(panel)).toBe(true)
    })

    it('repeats each SearchUI scope on detached add-filter listboxes', async () => {
        const {container} = render(
            <>
                <SearchUIFilters
                    autoTestId="portal-orders"
                    settingsContextName="portal-orders-add-filter"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={jest.fn()}
                    config={{hideTemplatesSelect: true}}
                />
                <SearchUIFilters
                    autoTestId="portal-transactions"
                    settingsContextName="portal-transactions-add-filter"
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    onFiltersUpdate={jest.fn()}
                    config={{hideTemplatesSelect: true}}
                />
            </>,
        )

        await waitFor(() => {
            expect(container.querySelectorAll('[data-autotest="add-filter"]')).toHaveLength(2)
        })

        const filterScopes = Array.from(
            container.querySelectorAll<HTMLElement>('[data-autotest="search-filters"]'),
        )

        for (const filterScope of filterScopes) {
            const addFilter = filterScope.querySelector<HTMLElement>('[data-autotest="add-filter"]')

            fireEvent.mouseDown(addFilter as HTMLElement)
        }

        await waitFor(() => {
            expect(document.body.querySelectorAll('[data-autotest="add-filter-options"]')).toHaveLength(2)
        })

        for (const filterScope of filterScopes) {
            const scope = filterScope.getAttribute('data-autotest-value')
            const addFilter = filterScope.querySelector<HTMLElement>('[data-autotest="add-filter"]')
            const listboxId = addFilter?.getAttribute('aria-controls')
            const listbox = listboxId ? document.getElementById(listboxId) : null

            expect(addFilter?.getAttribute('aria-expanded')).toBe('true')
            expect(listbox?.getAttribute('data-autotest')).toBe('add-filter-options')
            expect(listbox?.getAttribute('data-autotest-value')).toBe(scope)
            expect(listbox?.getAttribute('role')).toBe('listbox')
            expect(listbox && filterScope.contains(listbox)).toBe(false)
        }
    })

    it('keeps SearchUI and criterion ownership through a portal', () => {
        render(
            <SearchUIAutoTestScopeProvider scope="orders">
                <SearchUICriterionAutoTestScopeProvider criterionType={CriterionTypeEnum.STATUS}>
                    <PortalScopeProbe/>
                </SearchUICriterionAutoTestScopeProvider>
            </SearchUIAutoTestScopeProvider>,
        )

        const portalContent = screen.getByTestId('portal-scope')

        expect(portalContent.getAttribute('data-scope')).toBe('orders')
        expect(portalContent.getAttribute('data-criterion')).toBe(CriterionTypeEnum.STATUS)
    })
})
