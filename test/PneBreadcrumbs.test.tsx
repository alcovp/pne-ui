import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {Link, type LinkProps} from '@mui/material'
import * as React from 'react'

import {
    PneBreadcrumbs,
    PneOrdersIcon,
    type PneBreadcrumbItem,
} from '../src'

const createMatchMedia = (matches: boolean) => (query: string): MediaQueryList => ({
    addEventListener: jest.fn(),
    addListener: jest.fn(),
    dispatchEvent: jest.fn(),
    matches,
    media: query,
    onchange: null,
    removeEventListener: jest.fn(),
    removeListener: jest.fn(),
})

type BridgeLinkProps = LinkProps & {
    href: string
}

const BridgeLink = React.forwardRef<HTMLAnchorElement, BridgeLinkProps>(
    (props, ref) => <Link data-bridge-link='true' ref={ref} {...props}/>,
)

const baseItems: readonly PneBreadcrumbItem[] = [
    {
        id: 'orders',
        label: 'Orders',
        icon: <PneOrdersIcon/>,
        type: 'text',
    },
    {
        href: '/paynet-ui/react-orders',
        id: 'orders-search',
        label: 'Orders search',
        type: 'link',
    },
    {
        id: 'order',
        label: 'Order 8861110',
        type: 'text',
    },
]

describe('PneBreadcrumbs', () => {
    const originalMatchMedia = window.matchMedia
    const originalResizeObserver = window.ResizeObserver

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: createMatchMedia(false),
        })
    })

    afterEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: originalMatchMedia,
        })
        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: originalResizeObserver,
        })
    })

    it('renders translated text, bridge links, actions, current-page semantics, and stable locators', () => {
        const onAction = jest.fn()
        const items: readonly PneBreadcrumbItem[] = [
            baseItems[0],
            baseItems[1],
            {
                id: 'refresh',
                label: 'Refresh',
                onClick: onAction,
                type: 'action',
            },
            {
                id: 'order',
                label: 'Order 8861110',
                type: 'text',
            },
        ]

        render(
            <PneBreadcrumbs
                ariaLabel='Order path'
                items={items}
                linkComponent={BridgeLink}
                moreLabel='More pages'
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Order path'})
        const link = within(navigation).getByRole('link', {name: 'Orders search'})
        const action = within(navigation).getByRole('button', {name: 'Refresh'})
        const current = within(navigation).getByText('Order 8861110')
        const rootText = within(navigation).getByText('Orders')

        expect(link.getAttribute('href')).toBe('/paynet-ui/react-orders')
        expect(link.getAttribute('data-bridge-link')).toBe('true')
        expect(link.getAttribute('data-autotest')).toBe('link.orders-search')
        expect(action.getAttribute('data-autotest')).toBe('button.refresh')
        expect(current.getAttribute('aria-current')).toBe('page')
        expect(rootText.getAttribute('data-autotest')).toBeNull()
        expect(navigation.textContent).toContain('Orders/Orders search/Refresh/Order 8861110')

        fireEvent.click(action)
        expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('keeps the legacy typography and state colors', () => {
        render(<PneBreadcrumbs items={baseItems} moreLabel='More pages'/>)

        const link = screen.getByRole('link', {name: 'Orders search'})
        const current = screen.getByText('Order 8861110')
        const muted = screen.getByText('Orders')
        const linkStyle = window.getComputedStyle(link)
        const currentStyle = window.getComputedStyle(current)
        const mutedStyle = window.getComputedStyle(muted.parentElement as HTMLElement)

        expect(linkStyle.fontFamily).toBe('Arial,sans-serif')
        expect(linkStyle.fontSize).toBe('14px')
        expect(linkStyle.lineHeight).toBe('24px')
        expect(linkStyle.fontWeight).toBe('400')
        expect(linkStyle.textDecoration).toBe('none')
        expect(currentStyle.fontWeight).toBe('700')
        expect(mutedStyle.fontWeight).toBe('400')
    })

    it('collapses and expands its own trail as the available width changes', async () => {
        const observedElements: Element[] = []

        class ResizeObserverMock implements ResizeObserver {
            disconnect = jest.fn()
            observe = jest.fn((element: Element) => {
                observedElements.push(element)
            })
            unobserve = jest.fn()

            constructor(_callback: ResizeObserverCallback) {}
        }

        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: ResizeObserverMock,
        })

        render(
            <PneBreadcrumbs
                ariaLabel='Responsive path'
                items={[
                    baseItems[0],
                    baseItems[1],
                    {
                        id: 'saved-search',
                        label: 'Saved search',
                        onClick: jest.fn(),
                        type: 'action',
                    },
                    baseItems[2],
                ]}
                linkComponent={BridgeLink}
                moreLabel='More pages'
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Responsive path'})
        const root = navigation.parentElement as HTMLElement
        const list = navigation.querySelector('ol') as HTMLOListElement
        let availableWidth = 180

        Object.defineProperty(root, 'clientWidth', {
            configurable: true,
            get: () => availableWidth,
        })
        Object.defineProperty(list, 'scrollWidth', {
            configurable: true,
            get: () => 520,
        })

        expect(observedElements).toContain(root)
        expect(observedElements).toContain(list)

        act(() => {
            window.dispatchEvent(new Event('resize'))
        })

        const moreButton = within(navigation).getByRole('button', {name: 'More pages'})
        expect(within(navigation).queryByText('Orders search')).toBeNull()
        expect(within(navigation).getByText('Orders')).not.toBeNull()
        expect(within(navigation).getByText('Order 8861110')).not.toBeNull()

        fireEvent.click(moreButton)
        const menu = await screen.findByRole('menu')
        expect(within(menu).getByRole('menuitem', {name: 'Orders search'}).getAttribute('href'))
            .toBe('/paynet-ui/react-orders')
        expect(within(menu).getByRole('menuitem', {name: 'Saved search'})).not.toBeNull()

        fireEvent.keyDown(menu, {key: 'Escape'})
        availableWidth = 800
        act(() => {
            window.dispatchEvent(new Event('resize'))
        })

        expect(within(navigation).queryByRole('button', {name: 'More pages'})).toBeNull()
        expect(within(navigation).getByRole('link', {name: 'Orders search'})).not.toBeNull()
    })

    it('invalidates a collapsed measurement when rich label content changes', () => {
        const {rerender} = render(
            <PneBreadcrumbs
                ariaLabel='Rich path'
                items={[
                    baseItems[0],
                    baseItems[1],
                    {
                        id: 'order',
                        label: <span>Long current order label</span>,
                        type: 'text',
                    },
                ]}
                moreLabel='More pages'
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Rich path'})
        const root = navigation.parentElement as HTMLElement
        const list = navigation.querySelector('ol') as HTMLOListElement
        let measuredWidth = 520

        Object.defineProperty(root, 'clientWidth', {
            configurable: true,
            value: 180,
        })
        Object.defineProperty(list, 'scrollWidth', {
            configurable: true,
            get: () => measuredWidth,
        })

        act(() => {
            window.dispatchEvent(new Event('resize'))
        })
        expect(within(navigation).getByRole('button', {name: 'More pages'})).not.toBeNull()

        measuredWidth = 120
        rerender(
            <PneBreadcrumbs
                ariaLabel='Rich path'
                items={[
                    baseItems[0],
                    baseItems[1],
                    {
                        id: 'order',
                        label: <span>Short</span>,
                        type: 'text',
                    },
                ]}
                moreLabel='More pages'
            />,
        )

        expect(within(navigation).queryByRole('button', {name: 'More pages'})).toBeNull()
        expect(within(navigation).getByText('Short')).not.toBeNull()
    })

    it('never collapses a two-item trail', () => {
        render(
            <PneBreadcrumbs
                ariaLabel='Short path'
                items={baseItems.slice(1)}
                moreLabel='More pages'
            />,
        )

        const navigation = screen.getByRole('navigation', {name: 'Short path'})
        const root = navigation.parentElement as HTMLElement
        const list = navigation.querySelector('ol') as HTMLOListElement

        Object.defineProperty(root, 'clientWidth', {
            configurable: true,
            value: 10,
        })
        Object.defineProperty(list, 'scrollWidth', {
            configurable: true,
            value: 500,
        })

        act(() => {
            window.dispatchEvent(new Event('resize'))
        })

        expect(within(navigation).queryByRole('button', {name: 'More pages'})).toBeNull()
        expect(within(navigation).getByRole('link', {name: 'Orders search'})).not.toBeNull()
    })

    it('uses the legacy mobile ellipsis widths only on narrow viewports', () => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: createMatchMedia(true),
        })

        const {rerender} = render(
            <PneBreadcrumbs
                items={[{
                    id: 'long-order',
                    label: 'A very long order title',
                    type: 'text',
                }]}
                moreLabel='More pages'
            />,
        )

        const textOnlyLabel = screen.getByText('A very long order title')
        expect(textOnlyLabel.tagName).toBe('SPAN')
        expect(window.getComputedStyle(textOnlyLabel).maxWidth).toBe('120px')
        expect(window.getComputedStyle(textOnlyLabel).textOverflow).toBe('ellipsis')

        rerender(
            <PneBreadcrumbs
                items={[{
                    icon: <PneOrdersIcon/>,
                    id: 'long-order',
                    label: 'A very long order title',
                    type: 'text',
                }]}
                moreLabel='More pages'
            />,
        )

        expect(window.getComputedStyle(screen.getByText('A very long order title')).maxWidth)
            .toBe('200px')
    })

    it('exports the existing 16px Orders glyph without changing its paths', () => {
        const {container} = render(<PneOrdersIcon data-testid='orders-icon'/>)
        const icon = screen.getByTestId('orders-icon')
        const paths = container.querySelectorAll('path')

        expect(icon.getAttribute('width')).toBe('16')
        expect(icon.getAttribute('height')).toBe('16')
        expect(paths).toHaveLength(4)
        paths.forEach(path => {
            expect(path.getAttribute('fill')).toBe('currentColor')
        })
    })

    it('does not render an empty navigation landmark', () => {
        const {container} = render(<PneBreadcrumbs items={[]}/>)

        expect(container.firstChild).toBeNull()
        expect(screen.queryByRole('navigation')).toBeNull()
    })
})
