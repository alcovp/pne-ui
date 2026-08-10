import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneCoachmark} from '../src'

const createAnchor = (): HTMLButtonElement => {
    const anchor = document.createElement('button')
    anchor.textContent = 'Anchor'
    anchor.getBoundingClientRect = () => ({
        bottom: 60,
        height: 40,
        left: 20,
        right: 120,
        top: 20,
        width: 100,
        x: 20,
        y: 20,
        toJSON: () => undefined,
    })
    document.body.append(anchor)
    return anchor
}

describe('PneCoachmark', () => {
    it('renders an anchored non-modal dialog without taking focus', () => {
        const anchor = createAnchor()
        const outsideControl = document.createElement('button')
        outsideControl.textContent = 'Outside control'
        document.body.append(outsideControl)
        outsideControl.focus()

        render(
            <PneCoachmark
                actions={<button>Start tour</button>}
                anchorEl={anchor}
                onClose={jest.fn()}
                open
                subtitle='Optional guidance'
                title='Widget help'
            >
                <p>Arrange and resize widgets.</p>
            </PneCoachmark>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Widget help'})

        expect(dialog.getAttribute('aria-modal')).toBe('false')
        expect(dialog.getAttribute('aria-describedby')).toBe(
            screen.getByText('Optional guidance').id,
        )
        expect(dialog.querySelector('[data-pne-coachmark-body="true"]')?.textContent)
            .toContain('Arrange and resize widgets.')
        expect(dialog.querySelector('[data-pne-coachmark-footer="true"]')?.textContent)
            .toContain('Start tour')
        expect(document.querySelector('[data-pne-coachmark-popper="true"]')).not.toBeNull()
        expect(document.querySelector('[data-pne-coachmark-fallback="true"]')).toBeNull()
        expect(document.activeElement).toBe(outsideControl)

        outsideControl.remove()
        anchor.remove()
    })

    it('centers through a non-blocking fallback when the anchor is unavailable', () => {
        const ref = React.createRef<HTMLDivElement>()

        render(
            <PneCoachmark
                ref={ref}
                anchorEl={null}
                ariaLabel='Fallback help'
                data-pne-coachmark-container='false'
                data-testid='coachmark-surface'
                onClose={jest.fn()}
                open
                slotProps={{
                    fallback: {
                        'data-pne-coachmark-fallback': 'false',
                        'data-testid': 'coachmark-fallback',
                        sx: {alignItems: 'flex-start'},
                    },
                }}
                title={null}
            >
                Fallback content
            </PneCoachmark>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Fallback help'})
        const fallback = screen.getByTestId('coachmark-fallback')

        expect(ref.current).toBe(dialog)
        expect(dialog).toBe(screen.getByTestId('coachmark-surface'))
        expect(dialog.dataset.pneCoachmarkContainer).toBe('true')
        expect(fallback.dataset.pneCoachmarkFallback).toBe('true')
        expect(window.getComputedStyle(fallback).position).toBe('fixed')
        expect(window.getComputedStyle(fallback).pointerEvents).toBe('none')
        expect(window.getComputedStyle(fallback).alignItems).toBe('flex-start')
        expect(window.getComputedStyle(dialog).pointerEvents).toBe('auto')
        expect(document.querySelector('[data-pne-coachmark-popper="true"]')).toBeNull()
    })

    it('reports close-button and Escape requests while allowing an outer shell to own Escape', () => {
        const onClose = jest.fn()
        const {rerender} = render(
            <PneCoachmark
                anchorEl={null}
                closeLabel='Dismiss help'
                onClose={onClose}
                open
                title='Widget help'
            />,
        )

        fireEvent.click(screen.getByRole('button', {name: 'Dismiss help'}))
        expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'closeButtonClick')

        fireEvent.keyDown(document, {key: 'Escape'})
        expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'escapeKeyDown')
        expect(onClose).toHaveBeenCalledTimes(2)

        rerender(
            <PneCoachmark
                anchorEl={null}
                disableEscapeKeyDown
                onClose={onClose}
                open
                title='Widget help'
            />,
        )
        fireEvent.keyDown(document, {key: 'Escape'})
        expect(onClose).toHaveBeenCalledTimes(2)
    })

    it('forwards slot attributes and styling while retaining owned semantics', () => {
        const anchor = createAnchor()

        render(
            <PneCoachmark
                anchorEl={anchor}
                onClose={jest.fn()}
                open
                slotProps={{
                    body: {'data-testid': 'coachmark-body', sx: {padding: '7px'}},
                    closeButton: {'aria-label': 'Custom close'},
                    container: {role: 'alert'} as never,
                    header: {'data-testid': 'coachmark-header'},
                    popper: {
                        'data-pne-coachmark-popper': 'false',
                        'data-testid': 'coachmark-popper',
                    },
                    title: {component: 'h2', 'data-testid': 'coachmark-title'},
                }}
                title='Slot contract'
            >
                Body
            </PneCoachmark>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Slot contract'})

        expect(dialog.getAttribute('role')).toBe('dialog')
        expect(screen.getByTestId('coachmark-title').tagName).toBe('H2')
        expect(screen.getByTestId('coachmark-header')).not.toBeNull()
        expect(window.getComputedStyle(screen.getByTestId('coachmark-body')).padding).toBe('7px')
        expect(screen.getByRole('button', {name: 'Custom close'})).not.toBeNull()
        expect(screen.getByTestId('coachmark-popper').dataset.pneCoachmarkPopper).toBe('true')

        anchor.remove()
    })

    it('does not mount any surface while closed', () => {
        render(
            <PneCoachmark anchorEl={null} onClose={jest.fn()} open={false} title='Hidden'/>,
        )

        expect(screen.queryByRole('dialog', {name: 'Hidden'})).toBeNull()
        expect(document.querySelector('[data-pne-coachmark-fallback]')).toBeNull()
        expect(document.querySelector('[data-pne-coachmark-popper]')).toBeNull()
    })
})
