import {act, fireEvent, render, screen, within} from '@testing-library/react'
import * as React from 'react'

import {
    PAYNET_LEFT_MENU_PAGE_HEADER_INSET,
    PNE_PAGE_HEADER_HEIGHT_VARIABLE,
    PnePageHeader,
    type PneBreadcrumbItem,
} from '../src'

const createMatchMedia =
    (matches: boolean) =>
    (query: string): MediaQueryList => ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        dispatchEvent: jest.fn(),
        matches,
        media: query,
        onchange: null,
        removeEventListener: jest.fn(),
        removeListener: jest.fn(),
    })

const listTrail: readonly PneBreadcrumbItem[] = [
    {id: 'settings', label: 'Settings', type: 'text'},
    {id: 'users', label: 'Users', type: 'text'},
    {id: 'merchants', label: 'Merchants', type: 'text'},
]

const gateTrail: readonly PneBreadcrumbItem[] = [
    {href: '/paynet-ui/react-settings', id: 'settings', label: 'Settings', type: 'link'},
    {href: '/paynet-ui/settings/react-gates', id: 'gates', label: 'Gates', type: 'link'},
    {id: 'gate', label: 'Gate', type: 'text'},
]

const gateTabTrail: readonly PneBreadcrumbItem[] = [
    {href: '/paynet-ui/react-settings', id: 'settings', label: 'Settings', type: 'link'},
    {href: '/paynet-ui/settings/react-gates', id: 'gates', label: 'Gates', type: 'link'},
    {href: '/paynet-ui/settings/react-gates/view/id/311056', id: 'gate', label: 'Gate', type: 'link'},
    {id: 'properties', label: 'Properties', type: 'text'},
]

const ordersLink = {
    autoTestId: 'order-search-btn',
    href: '/paynet-ui/react-orders?order_entity_id=311056',
    label: 'Orders',
}

describe('PnePageHeader', () => {
    const originalMatchMedia = window.matchMedia
    const originalClipboard = navigator.clipboard

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {configurable: true, value: createMatchMedia(false)})
    })

    afterEach(() => {
        Object.defineProperty(window, 'matchMedia', {configurable: true, value: originalMatchMedia})
        Object.defineProperty(navigator, 'clipboard', {configurable: true, value: originalClipboard})
        document.documentElement.style.removeProperty(PNE_PAGE_HEADER_HEIGHT_VARIABLE)
    })

    it('draws one row of the trail and the actions, the last crumb naming the page', () => {
        render(
            <PnePageHeader
                breadcrumbs={listTrail}
                actions={<button type='button'>New merchant</button>}
                labels={{breadcrumbs: 'Path'}}
                autoTestId='itemDetailsPageHeader'
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Path'})
        const row = navigation.closest('[data-pne-page-header-row="true"]') as HTMLElement
        expect(row.getAttribute('data-autotest')).toBe('itemDetailsPageHeader')
        expect(within(navigation).getByText('Merchants').closest('[aria-current="page"]')).not.toBeNull()
        const actions = row.querySelector('[data-pne-page-header-actions="true"]') as HTMLElement
        expect(within(actions).getByRole('button', {name: 'New merchant'})).not.toBeNull()
        expect(row.querySelector('h1, h2')).toBeNull()
    })

    it('leaves out the actions row part when the page has no actions', () => {
        const {container} = render(<PnePageHeader breadcrumbs={listTrail} />)

        expect(container.querySelector('[data-pne-page-header-actions="true"]')).toBeNull()
    })

    it("puts the entity's id and name into its crumb on its own page, the id copied on click", async () => {
        const writeText = jest.fn(() => Promise.resolve())
        Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}})

        render(
            <PnePageHeader
                breadcrumbs={gateTrail}
                entity={{crumbId: 'gate', id: '311056', link: ordersLink, name: 'Gate name'}}
                labels={{breadcrumbs: 'Path', copy: 'Copy to clipboard'}}
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Path'})
        expect(within(navigation).queryByText('Gate')).toBeNull()
        expect(within(navigation).getByText('Gate name')).not.toBeNull()
        const copyButton = navigation.querySelector('[data-autotest="copy-entity-id"]') as HTMLElement
        expect(copyButton.textContent).toBe('311056')

        await act(async () => {
            fireEvent.click(copyButton)
        })
        expect(writeText).toHaveBeenCalledWith('311056')

        const link = within(navigation).getByRole('link', {name: 'Orders'})
        expect(link.getAttribute('href')).toBe(ordersLink.href)
        expect(link.getAttribute('data-autotest')).toBe('order-search-btn')
        expect(link.closest('[data-pne-breadcrumb-keep="true"]')).not.toBeNull()
    })

    it("keeps the entity's crumb a link to the entity on the pages of its tabs", () => {
        render(
            <PnePageHeader
                breadcrumbs={gateTabTrail}
                entity={{crumbId: 'gate', id: '311056', link: ordersLink, name: 'Gate name'}}
                labels={{breadcrumbs: 'Path'}}
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Path'})
        const entityCrumb = within(navigation).getByRole('link', {name: '311056 Gate name'})
        expect(entityCrumb.getAttribute('href')).toBe('/paynet-ui/settings/react-gates/view/id/311056')
        expect(navigation.querySelector('[data-autotest="copy-entity-id"]')).toBeNull()
        const ordersAnchor = within(navigation).getByRole('link', {name: 'Orders'})
        expect(entityCrumb.contains(ordersAnchor)).toBe(false)
        expect(within(navigation).getByText('Properties').closest('[aria-current="page"]')).not.toBeNull()
    })

    it('publishes its height for what sticks under it, 0 when it scrolls with the page', () => {
        const html = document.documentElement
        const {rerender, unmount} = render(<PnePageHeader breadcrumbs={listTrail} />)
        expect(html.style.getPropertyValue(PNE_PAGE_HEADER_HEIGHT_VARIABLE)).toMatch(/^\d+px$/)

        rerender(<PnePageHeader breadcrumbs={listTrail} sticky={false} />)
        expect(html.style.getPropertyValue(PNE_PAGE_HEADER_HEIGHT_VARIABLE)).toBe('0px')

        unmount()
        expect(html.style.getPropertyValue(PNE_PAGE_HEADER_HEIGHT_VARIABLE)).toBe('')
    })

    it('sticks to the top unless told otherwise', () => {
        const {container, rerender} = render(<PnePageHeader breadcrumbs={listTrail} />)
        const root = container.querySelector('[data-pne-page-header="true"]') as HTMLElement
        expect(getComputedStyle(root).position).toBe('sticky')

        rerender(<PnePageHeader breadcrumbs={listTrail} sticky={false} />)
        expect(getComputedStyle(root).position).toBe('relative')
    })

    it('leaves room for the Paynet menu button on narrow screens', () => {
        const {container} = render(
            <PnePageHeader breadcrumbs={listTrail} menuInset={PAYNET_LEFT_MENU_PAGE_HEADER_INSET} />,
        )
        const row = container.querySelector('[data-pne-page-header-row="true"]') as HTMLElement
        const rule = [...document.styleSheets]
            .flatMap(sheet => [...sheet.cssRules])
            .find(
                candidate =>
                    candidate instanceof CSSMediaRule &&
                    candidate.conditionText.replace(/\s/g, '') === '(max-width:1080px)' &&
                    [...candidate.cssRules].some(inner =>
                        row.className.split(' ').some(name => (inner as CSSStyleRule).selectorText?.includes(name)),
                    ),
            ) as CSSMediaRule | undefined
        expect(rule).toBeDefined()
        expect((rule?.cssRules[0] as CSSStyleRule).style.getPropertyValue('padding-left')).toBe('56px')
    })
})
