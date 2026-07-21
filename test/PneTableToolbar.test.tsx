import React from 'react'
import {act, render, screen} from '@testing-library/react'
import PneTableToolbar, {
    resolvePneTableToolbarLayout,
} from '../src/component/table/PneTableToolbar'
import PneTableSelectionControls from '../src/component/table/PneTableSelectionControls'

describe('PneTableToolbar', () => {
    it('resolves inline and stacked group layouts from measured content', () => {
        const base = {
            contextualWidth: 180,
            persistentWidth: 160,
            hasContextual: true,
            hasPersistent: true,
        }

        expect(resolvePneTableToolbarLayout({...base, availableWidth: 348})).toBe('inline')
        expect(resolvePneTableToolbarLayout({...base, availableWidth: 328})).toBe('stacked')
        expect(resolvePneTableToolbarLayout({
            ...base,
            availableWidth: 100,
            hasPersistent: false,
        })).toBe('inline')
    })

    it('keeps DOM order aligned while responsive measurements change', () => {
        const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver')
        const resizeObservers: ResizeObserverMock[] = []

        class ResizeObserverMock {
            readonly observedElements: Element[] = []
            readonly callback: ResizeObserverCallback

            constructor(callback: ResizeObserverCallback) {
                this.callback = callback
                resizeObservers.push(this)
            }

            observe = jest.fn((element: Element) => {
                this.observedElements.push(element)
            })
            unobserve = jest.fn()
            disconnect = jest.fn()
        }

        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: ResizeObserverMock,
        })

        try {
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
            const contextualContent = contextual.firstElementChild as HTMLElement
            const persistentContent = persistent.firstElementChild as HTMLElement
            let availableWidth = 328

            Object.defineProperty(toolbar, 'clientWidth', {
                configurable: true,
                get: () => availableWidth,
            })
            Object.defineProperty(contextual, 'scrollWidth', {
                configurable: true,
                get: () => availableWidth,
            })
            Object.defineProperty(persistent, 'scrollWidth', {
                configurable: true,
                get: () => availableWidth,
            })
            Object.defineProperty(contextualContent, 'scrollWidth', {
                configurable: true,
                get: () => 180,
            })
            Object.defineProperty(persistentContent, 'scrollWidth', {
                configurable: true,
                get: () => 160,
            })
            const observer = resizeObservers.find(item => item.observedElements.includes(toolbar))
            const triggerResize = () => act(() => {
                observer?.callback([], observer as unknown as ResizeObserver)
            })

            triggerResize()
            expect(toolbar.dataset.autotestValue).toBe('stacked')
            expect(Array.from(toolbar.children)).toEqual([contextual, persistent])

            availableWidth = 640
            triggerResize()
            expect(toolbar.dataset.autotestValue).toBe('inline')
            expect(Array.from(toolbar.children)).toEqual([contextual, persistent])
        } finally {
            if (resizeObserverDescriptor) {
                Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor)
            } else {
                Reflect.deleteProperty(window, 'ResizeObserver')
            }
        }
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
})
