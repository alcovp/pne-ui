import React from 'react'
import {render, screen} from '@testing-library/react'
import PneTableToolbar from '../src/component/table/PneTableToolbar'
import PneTableSelectionControls from '../src/component/table/PneTableSelectionControls'

/**
 * Runs `body` with a ResizeObserver that only records the fact it was
 * constructed. The responsive control bands must never need one: a band that
 * observes the elements it has just laid out is measuring its own result, and
 * that feedback loop is what used to make the table header jump.
 */
const withRecordedResizeObservers = (body: (constructed: unknown[]) => void) => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver')
    const constructed: unknown[] = []

    class ResizeObserverMock {
        constructor() {
            constructed.push(this)
        }

        observe = jest.fn()
        unobserve = jest.fn()
        disconnect = jest.fn()
    }

    Object.defineProperty(window, 'ResizeObserver', {
        configurable: true,
        value: ResizeObserverMock,
    })

    try {
        body(constructed)
    } finally {
        if (descriptor) {
            Object.defineProperty(window, 'ResizeObserver', descriptor)
        } else {
            Reflect.deleteProperty(window, 'ResizeObserver')
        }
    }
}

describe('PneTableToolbar', () => {
    it('wraps its control groups without measuring the layout it produced', () => {
        withRecordedResizeObservers(constructed => {
            const {container} = render(
                <PneTableToolbar
                    aria-label='Results controls'
                    contextual={<button type='button'>Selection</button>}
                    persistent={<button type='button'>View</button>}
                />,
            )
            const toolbar = screen.getByRole('group', {name: 'Results controls'})
            const contextual = container.querySelector(
                '[data-autotest="table-contextual-controls"]',
            ) as HTMLElement
            const persistent = container.querySelector(
                '[data-autotest="table-persistent-controls"]',
            ) as HTMLElement

            expect(constructed).toHaveLength(0)
            expect(Array.from(toolbar.children)).toEqual([contextual, persistent])
            expect(toolbar.hasAttribute('data-autotest-value')).toBe(false)

            const toolbarStyle = window.getComputedStyle(toolbar)

            expect(toolbarStyle.display).toBe('flex')
            expect(toolbarStyle.flexWrap).toBe('wrap')
            expect(toolbarStyle.justifyContent).toBe('flex-end')
            expect(toolbarStyle.width).toBe('100%')
        })
    })

    /*
     * jsdom has no layout engine and drops `flex-basis: max-content` as an
     * unsupported value, so the wrap-whole-group behaviour itself is asserted on
     * real geometry by the GatesControls* stories. What is verifiable here is
     * that a group neither grows nor is pinned against shrinking.
     */
    it('lets a group claim its natural width so it wraps whole', () => {
        const {container} = render(
            <PneTableToolbar
                aria-label='Results controls'
                contextual={<button type='button'>Selection</button>}
                persistent={<button type='button'>View</button>}
            />,
        )

        const groups = Array.from(container.querySelectorAll<HTMLElement>(
            '[data-autotest="table-contextual-controls"],'
            + '[data-autotest="table-persistent-controls"]',
        ))

        expect(groups).toHaveLength(2)
        groups.forEach(group => {
            const style = window.getComputedStyle(group)

            expect(style.flexGrow).toBe('0')
            expect(style.flexShrink).toBe('1')
            expect(style.flexWrap).toBe('wrap')
        })
    })

    it('omits a group that was not supplied', () => {
        const {container} = render(
            <PneTableToolbar
                aria-label='Results controls'
                persistent={<button type='button'>View</button>}
            />,
        )

        expect(container.querySelector('[data-autotest="table-contextual-controls"]')).toBeNull()
        expect(container.querySelector('[data-autotest="table-persistent-controls"]')).not.toBeNull()
    })

    it('renders localized selection summary and actions', () => {
        render(
            <PneTableSelectionControls
                actions={<button type='button'>Clear</button>}
                summary='3 rows selected'
            />,
        )

        expect(screen.getByRole('status').textContent).toBe('3 rows selected')
        expect(screen.getByRole('button', {name: 'Clear'})).not.toBeNull()
    })

    it('draws the summary as a 32px grey line and leaves it out while nothing is selected', () => {
        const {rerender} = render(
            <PneTableSelectionControls
                actions={<button type='button'>Select all</button>}
                summary='Selected: 3'
            />,
        )

        const summary = window.getComputedStyle(screen.getByRole('status'))
        expect(summary.minHeight).toBe('32px')
        expect(summary.fontSize).toBe('14px')
        expect(summary.color).toBe('rgb(92, 92, 92)')

        rerender(<PneTableSelectionControls actions={<button type='button'>Select all</button>}/>)

        expect(screen.queryByRole('status')).toBeNull()
        expect(document.querySelector('[data-autotest="selection-summary"]')).toBeNull()
        expect(screen.getByRole('button', {name: 'Select all'})).not.toBeNull()
    })
})
