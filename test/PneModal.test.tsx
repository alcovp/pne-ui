import * as React from 'react'
import {render, screen, within} from '@testing-library/react'

import {PneModal, PneModalActions} from '../src'

const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: query === '(max-width:480px)' && width <= 480,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })
}

const buttonLabels = (container: HTMLElement) => (
    within(container)
        .getAllByRole('button')
        .map((button) => button.textContent)
)

describe('PneModalActions', () => {
    it('keeps leading separate and secondary next to primary on desktop', () => {
        setViewportWidth(1024)

        const {container} = render(
            <PneModalActions
                leading={<button>Help</button>}
                primary={<button>Save</button>}
                secondary={<button>Cancel</button>}
            />,
        )

        const actions = container.querySelector<HTMLElement>('[data-pne-modal-actions]')
        const leading = container.querySelector<HTMLElement>("[data-pne-modal-action='leading']")
        const trailing = container.querySelector<HTMLElement>('[data-pne-modal-actions-group]')

        expect(actions).not.toBeNull()
        expect(leading).not.toBeNull()
        expect(trailing).not.toBeNull()
        expect(actions?.dataset.layout).toBe('desktop')
        expect(buttonLabels(actions!)).toEqual(['Help', 'Cancel', 'Save'])
        expect(buttonLabels(trailing!)).toEqual(['Cancel', 'Save'])
        expect(window.getComputedStyle(actions!).justifyContent).toBe('flex-end')
        expect(window.getComputedStyle(leading!).marginInlineEnd).toBe('auto')
        expect(window.getComputedStyle(trailing!).gap).toBe('8px')
    })

    it('uses full-width primary, secondary, leading DOM order on narrow screens', () => {
        setViewportWidth(480)

        const {container} = render(
            <PneModalActions
                leading={<button>Help</button>}
                primary={<span><button>Save</button></span>}
                secondary={<button>Cancel</button>}
            />,
        )

        const actions = container.querySelector<HTMLElement>('[data-pne-modal-actions]')
        const buttons = within(actions!).getAllByRole('button')

        expect(actions?.dataset.layout).toBe('narrow')
        expect(buttonLabels(actions!)).toEqual(['Save', 'Cancel', 'Help'])
        expect(window.getComputedStyle(actions!).flexDirection).toBe('column')
        expect(window.getComputedStyle(actions!).gap).toBe('8px')
        buttons.forEach((button) => {
            expect(window.getComputedStyle(button).width).toBe('100%')
        })
    })
})

describe('PneModal', () => {
    it('renders actions in a persistent footer and makes only the body scrollable', () => {
        setViewportWidth(1024)

        render(
            <PneModal
                actions={(
                    <PneModalActions
                        primary={<button>Save</button>}
                        secondary={<button>Cancel</button>}
                    />
                )}
                onClose={jest.fn()}
                open
                title='Edit item'
            >
                <div>Long modal content</div>
            </PneModal>,
        )

        const body = document.querySelector<HTMLElement>('[data-pne-modal-body]')
        const footer = document.querySelector<HTMLElement>('[data-pne-modal-footer]')
        const modalContainer = body?.parentElement

        expect(screen.getByText('Long modal content')).not.toBeNull()
        expect(within(footer!).getAllByRole('button').map((button) => button.textContent))
            .toEqual(['Cancel', 'Save'])
        expect(window.getComputedStyle(modalContainer!).display).toBe('flex')
        expect(window.getComputedStyle(modalContainer!).overflow).toBe('hidden')
        expect(window.getComputedStyle(body!).overflowY).toBe('auto')
        expect(window.getComputedStyle(body!).minHeight).toBe('0')
        expect(window.getComputedStyle(footer!).flexShrink).toBe('0')
        expect(window.getComputedStyle(footer!).borderTopWidth).toBe('1px')
    })

    it('omits an empty body and forwards attributes to the modal container', () => {
        setViewportWidth(1024)

        render(
            <PneModal
                actions={<PneModalActions primary={<button>OK</button>} />}
                closeButtonProps={{'data-testid': 'modal-close'}}
                containerProps={{'data-testid': 'modal-container'}}
                onClose={jest.fn()}
                open
                title='Information'
            />,
        )

        expect(document.querySelector('[data-pne-modal-body]')).toBeNull()
        expect(screen.getByTestId('modal-container')).not.toBeNull()
        expect(screen.getByTestId('modal-close')).not.toBeNull()
        expect(screen.getByRole('button', {name: 'OK'})).not.toBeNull()
    })

    it('renders an overlay above the complete modal instead of inside the scrollable body', () => {
        setViewportWidth(1024)

        render(
            <PneModal
                actions={<PneModalActions primary={<button>Save</button>} />}
                onClose={jest.fn()}
                open
                overlay={<div>Loading</div>}
                title='Edit item'
            >
                <div>Form fields</div>
            </PneModal>,
        )

        const body = document.querySelector<HTMLElement>('[data-pne-modal-body]')
        const footer = document.querySelector<HTMLElement>('[data-pne-modal-footer]')
        const overlay = document.querySelector<HTMLElement>('[data-pne-modal-overlay]')

        expect(overlay?.parentElement).toBe(body?.parentElement)
        expect(overlay?.parentElement).toBe(footer?.parentElement)
        expect(window.getComputedStyle(overlay!).position).toBe('absolute')
        expect(window.getComputedStyle(overlay!).inset).toBe('0')
    })
})
