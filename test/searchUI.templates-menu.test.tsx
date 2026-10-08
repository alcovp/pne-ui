import * as React from 'react'
import {act, fireEvent, render, waitFor, within} from '@testing-library/react'

import {
    overlayActions,
    PneConfirmProvider,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIDefaults,
    type SearchUITemplate,
} from '../src'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const text = typeof options?.defaultValue === 'string' ? options.defaultValue : key
            return text.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? ''))
        },
    }),
}))

const CONTEXT_NAME = 'templates-menu'
const SCOPE = 'orders'

const createTemplates = (...names: string[]): SearchUITemplate[] => names.map(name => ({
    name,
    searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
}))

const renderMenu = (defaults: Partial<SearchUIDefaults> = {}, options: {confirm?: boolean} = {}) => {
    const filters = <SearchUIProvider
        defaults={{
            getSearchTemplates: jest.fn().mockResolvedValue(createTemplates('Alpha', 'Bravo', 'Charlie')),
            ...defaults,
        }}
    >
        <SearchUIFilters
            autoTestId={SCOPE}
            settingsContextName={CONTEXT_NAME}
            possibleCriteria={[]}
            onFiltersUpdate={jest.fn()}
            config={{hideShowFiltersButton: true}}
        />
    </SearchUIProvider>

    return render(options.confirm ? <PneConfirmProvider>{filters}</PneConfirmProvider> : filters)
}

const trigger = () => document.body.querySelector<HTMLButtonElement>('[data-autotest="templates"]')!
const panel = () => document.body.querySelector<HTMLElement>(
    `[data-autotest="templates-panel"][data-autotest-value="${SCOPE}"]`,
)
const templateNames = () => Array.from(
    document.body.querySelectorAll<HTMLElement>('[data-autotest="select-template"]'),
).map(item => item.getAttribute('title'))
const selectItem = (name: string) => document.body.querySelector<HTMLButtonElement>(
    `[data-autotest="select-template"][title="${name}"]`,
)!
const rowOf = (name: string) => selectItem(name).closest<HTMLElement>('[data-autotest="template-item"]')!

const openMenu = async (expectedCount = 3) => {
    fireEvent.click(trigger())
    await waitFor(() => expect(templateNames()).toHaveLength(expectedCount))
    return panel() as HTMLElement
}

const pressAlt = (element: HTMLElement, key: 'ArrowUp' | 'ArrowDown') => {
    fireEvent.keyDown(element, {key, code: key, altKey: true})
}

describe('SearchUI templates menu', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('presents saved templates as a menu with the applied one checked', async () => {
        renderMenu()
        const menu = await openMenu()

        expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
        expect(trigger().getAttribute('aria-controls')).toBe(menu.id)
        expect(menu.getAttribute('role')).toBe('menu')
        expect(within(menu).getAllByRole('menuitemradio').map(item => item.textContent))
            .toEqual(['Alpha', 'Bravo', 'Charlie'])

        fireEvent.click(selectItem('Bravo'))
        await waitFor(() => expect(trigger().textContent).toContain('Bravo'))

        await openMenu()
        expect(selectItem('Bravo').getAttribute('aria-checked')).toBe('true')
        expect(selectItem('Alpha').getAttribute('aria-checked')).toBe('false')
        expect(panel()?.querySelector('[data-autotest="update-template"]')?.textContent).toBe('Update “Bravo”')
    })

    it('moves the focused template with Alt+Arrow keys and persists the whole order', async () => {
        const reorderSearchTemplates = jest.fn().mockResolvedValue(undefined)
        renderMenu({reorderSearchTemplates})
        await openMenu()

        act(() => selectItem('Alpha').focus())
        expect(selectItem('Alpha').getAttribute('aria-keyshortcuts')).toBe('Alt+ArrowUp Alt+ArrowDown')
        pressAlt(selectItem('Alpha'), 'ArrowDown')

        expect(templateNames()).toEqual(['Bravo', 'Alpha', 'Charlie'])
        expect(reorderSearchTemplates).toHaveBeenCalledWith({
            contextName: CONTEXT_NAME,
            templateNames: ['Bravo', 'Alpha', 'Charlie'],
        })
        await waitFor(() => expect(document.activeElement).toBe(selectItem('Alpha')))
        expect(document.body.querySelector('[aria-live="polite"]')?.textContent).toBe('Alpha: position 2 of 3')

        pressAlt(selectItem('Alpha'), 'ArrowUp')
        expect(templateNames()).toEqual(['Alpha', 'Bravo', 'Charlie'])

        // Already first: nothing to move and nothing to save.
        pressAlt(selectItem('Alpha'), 'ArrowUp')
        expect(reorderSearchTemplates).toHaveBeenCalledTimes(2)

        // Plain arrows keep moving focus through the menu instead of reordering.
        fireEvent.keyDown(selectItem('Alpha'), {key: 'ArrowDown', code: 'ArrowDown'})
        expect(templateNames()).toEqual(['Alpha', 'Bravo', 'Charlie'])
        expect(panel()).not.toBeNull()
    })

    it('restores the order and reports a failed save', async () => {
        const showTransientError = jest.spyOn(overlayActions, 'showTransientError').mockImplementation(() => undefined)
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        renderMenu({reorderSearchTemplates: jest.fn().mockRejectedValue(new Error('storage down'))})
        await openMenu()

        act(() => selectItem('Charlie').focus())
        pressAlt(selectItem('Charlie'), 'ArrowUp')
        expect(templateNames()).toEqual(['Alpha', 'Charlie', 'Bravo'])

        await waitFor(() => expect(templateNames()).toEqual(['Alpha', 'Bravo', 'Charlie']))
        expect(showTransientError).toHaveBeenCalledWith({
            message: 'Couldn’t save the template order. Try again.',
        })
    })

    it('offers no reordering when the host cannot persist an order', async () => {
        renderMenu()
        const menu = await openMenu()

        expect(menu.querySelector('[data-autotest="reorder-template"]')).toBeNull()
        expect(selectItem('Alpha').hasAttribute('aria-keyshortcuts')).toBe(false)

        pressAlt(selectItem('Alpha'), 'ArrowDown')
        expect(templateNames()).toEqual(['Alpha', 'Bravo', 'Charlie'])
    })

    it('shows no grip for a single template', async () => {
        renderMenu({
            getSearchTemplates: jest.fn().mockResolvedValue(createTemplates('Alpha')),
            reorderSearchTemplates: jest.fn().mockResolvedValue(undefined),
        })
        const menu = await openMenu(1)

        expect(menu.querySelector('[data-autotest="reorder-template"]')).toBeNull()
    })

    it('asks before deleting when a confirm provider is mounted', async () => {
        const deleteSearchTemplate = jest.fn().mockResolvedValue(undefined)
        renderMenu({deleteSearchTemplate}, {confirm: true})
        await openMenu()

        fireEvent.click(rowOf('Bravo').querySelector('[data-autotest="remove-template"]') as HTMLElement)
        const dialog = await waitFor(() => {
            const result = document.body.querySelector<HTMLElement>(
                `[data-autotest="alert.container"][data-autotest-value="${SCOPE}"]`,
            )
            expect(result).not.toBeNull()
            return result as HTMLElement
        })
        expect(dialog.textContent).toContain('Template “Bravo” will be permanently deleted.')

        fireEvent.click(dialog.querySelector('[data-autotest="alert.button.cancel"]') as HTMLElement)
        await waitFor(() => expect(document.body.querySelector('[data-autotest="alert.container"]')).toBeNull())
        expect(deleteSearchTemplate).not.toHaveBeenCalled()

        await openMenu()
        fireEvent.click(rowOf('Bravo').querySelector('[data-autotest="remove-template"]') as HTMLElement)
        const confirmation = await waitFor(() => {
            const result = document.body.querySelector<HTMLElement>('[data-autotest="alert.container"]')
            expect(result).not.toBeNull()
            return result as HTMLElement
        })
        fireEvent.click(confirmation.querySelector('[data-autotest="alert.button.submit"]') as HTMLElement)

        await waitFor(() => expect(deleteSearchTemplate).toHaveBeenCalledWith({
            contextName: CONTEXT_NAME,
            templateName: 'Bravo',
        }))
    })

    it('saves the current filters into the applied template', async () => {
        const saveSearchTemplate = jest.fn().mockResolvedValue(undefined)
        renderMenu({saveSearchTemplate})
        await openMenu()
        fireEvent.click(selectItem('Charlie'))
        await waitFor(() => expect(trigger().textContent).toContain('Charlie'))

        await openMenu()
        fireEvent.click(panel()?.querySelector('[data-autotest="update-template"]') as HTMLElement)

        await waitFor(() => expect(saveSearchTemplate).toHaveBeenCalledWith(expect.objectContaining({
            contextName: CONTEXT_NAME,
            templateName: 'Charlie',
        })))
    })

    describe('search', () => {
        const LONG_LIST = [
            'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo',
            'Foxtrot', 'Golf', 'Hotel', 'India', 'Bravo EU',
        ]
        const searchField = () => document.body.querySelector<HTMLInputElement>('[data-autotest="template-search"]')
        const renderLongMenu = (defaults: Partial<SearchUIDefaults> = {}) => renderMenu({
            getSearchTemplates: jest.fn().mockResolvedValue(createTemplates(...LONG_LIST)),
            reorderSearchTemplates: jest.fn().mockResolvedValue(undefined),
            ...defaults,
        })

        it('keeps short lists without a search field', async () => {
            renderMenu()
            await openMenu()

            expect(searchField()).toBeNull()
        })

        it('filters a long list in place and pauses reordering meanwhile', async () => {
            const getSearchTemplates = jest.fn().mockResolvedValue(createTemplates(...LONG_LIST))
            renderLongMenu({getSearchTemplates})
            const menu = await openMenu(LONG_LIST.length)

            await waitFor(() => expect(document.activeElement).toBe(searchField()))
            expect(searchField()?.getAttribute('aria-label')).toBe('Search templates')
            expect(menu.querySelectorAll('[data-autotest="reorder-template"]')).toHaveLength(LONG_LIST.length)

            fireEvent.change(searchField() as HTMLInputElement, {target: {value: '  bRAvo '}})

            expect(templateNames()).toEqual(['Bravo', 'Bravo EU'])
            expect(menu.querySelector('[data-autotest="reorder-template"]')).toBeNull()
            expect(selectItem('Bravo').hasAttribute('aria-keyshortcuts')).toBe(false)
            pressAlt(selectItem('Bravo'), 'ArrowDown')
            expect(templateNames()).toEqual(['Bravo', 'Bravo EU'])

            fireEvent.change(searchField() as HTMLInputElement, {target: {value: 'zulu'}})
            expect(templateNames()).toEqual([])
            expect(menu.querySelector('[data-autotest="template-search-empty"]')?.textContent)
                .toBe('No templates match')
            // Filtering happens in the browser: the list was loaded once.
            expect(getSearchTemplates).toHaveBeenCalledTimes(1)
        })

        it('moves between the field and the list and applies the first match with Enter', async () => {
            renderLongMenu()
            await openMenu(LONG_LIST.length)
            await waitFor(() => expect(document.activeElement).toBe(searchField()))

            fireEvent.change(searchField() as HTMLInputElement, {target: {value: 'o'}})
            // Typed characters stay in the field instead of jumping to a matching menu item.
            fireEvent.keyDown(searchField() as HTMLInputElement, {key: 'o', code: 'KeyO'})
            expect(document.activeElement).toBe(searchField())

            fireEvent.keyDown(searchField() as HTMLInputElement, {key: 'ArrowDown', code: 'ArrowDown'})
            expect(document.activeElement).toBe(selectItem('Bravo'))
            fireEvent.keyDown(selectItem('Bravo'), {key: 'ArrowUp', code: 'ArrowUp'})
            expect(document.activeElement).toBe(searchField())

            fireEvent.change(searchField() as HTMLInputElement, {target: {value: 'hot'}})
            fireEvent.keyDown(searchField() as HTMLInputElement, {key: 'Enter', code: 'Enter'})

            await waitFor(() => expect(trigger().textContent).toContain('Hotel'))
            await openMenu(LONG_LIST.length)
            expect(searchField()?.value).toBe('')
        })
    })
})

describe('SearchUI templates menu dragging', () => {
    const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
        x: left, y: top, left, top, width, height,
        right: left + width, bottom: top + height,
        toJSON: () => ({}),
    })

    const pointer = (target: Element, type: string, clientX: number, clientY: number) => {
        const event = new MouseEvent(type, {bubbles: true, cancelable: true, button: 0, clientX, clientY})
        Object.defineProperties(event, {
            pointerId: {value: 1},
            pointerType: {value: 'touch'},
            isPrimary: {value: true},
        })
        fireEvent(target, event)
    }

    beforeEach(() => {
        localStorage.clear()
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const list = this.closest('[data-rfd-droppable-id]')
            if (this.hasAttribute('data-rfd-draggable-id') && list) {
                const index = Array.from(list.querySelectorAll('[data-rfd-draggable-id]')).indexOf(this)
                return rect(100, 100 + index * 40, 300, 40)
            }
            return rect(100, 100, 300, 400)
        })
        jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
        jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
        jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300)
        jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400)
        jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
        jest.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('drops a template dragged by its grip at the new position', async () => {
        const reorderSearchTemplates = jest.fn().mockResolvedValue(undefined)
        renderMenu({reorderSearchTemplates})
        await openMenu()

        const grip = rowOf('Alpha').querySelector<HTMLElement>('[data-autotest="reorder-template"]')!
        expect(grip.getAttribute('aria-hidden')).toBe('true')
        expect(grip.style.touchAction).toBe('none')

        pointer(grip, 'pointerdown', 110, 120)
        pointer(grip, 'pointermove', 110, 125)
        await waitFor(() => expect(rowOf('Alpha').style.position).toBe('fixed'))
        pointer(grip, 'pointermove', 170, 200)
        // The lifted row follows the pointer vertically only.
        await waitFor(() => expect(rowOf('Alpha').style.transform).toBe('translate(0px, 80px)'))
        // Back on the start column: the drop lands without an animation, which jsdom never finishes.
        pointer(grip, 'pointermove', 110, 200)
        pointer(grip, 'pointerup', 110, 200)
        fireEvent.click(grip)

        await waitFor(() => expect(reorderSearchTemplates).toHaveBeenCalledWith({
            contextName: CONTEXT_NAME,
            templateNames: ['Bravo', 'Charlie', 'Alpha'],
        }))
        expect(templateNames()).toEqual(['Bravo', 'Charlie', 'Alpha'])
        expect(panel()).not.toBeNull()
    })
})
