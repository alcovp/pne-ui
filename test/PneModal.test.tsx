import * as React from 'react'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'

import {PneModal, PneModalActions} from '../src'

describe('PneModal', () => {
    it('renders actions in a persistent footer and makes only the body scrollable', () => {
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
        expect(within(footer!).getAllByRole('button').map(button => button.textContent))
            .toEqual(['Cancel', 'Save'])
        expect(window.getComputedStyle(modalContainer!).display).toBe('flex')
        expect(window.getComputedStyle(modalContainer!).overflow).toBe('hidden')
        expect(window.getComputedStyle(body!).overflowY).toBe('auto')
        expect(window.getComputedStyle(body!).minHeight).toBe('0')
        expect(window.getComputedStyle(footer!).flexShrink).toBe('0')
        expect(window.getComputedStyle(footer!).borderTopWidth).toBe('1px')
    })

    it('owns dialog semantics while forwarding safe slot attributes and the container ref', () => {
        const ref = React.createRef<HTMLDivElement>()

        render(
            <PneModal
                ref={ref}
                actions={<PneModalActions primary={<button>OK</button>} />}
                data-testattribute='information-modal'
                data-testid='modal-container'
                onClose={jest.fn()}
                open
                slotProps={{
                    closeButton: {'data-testid': 'modal-close'},
                    container: {'data-slot': 'container'},
                    title: {component: 'h2', 'data-testid': 'modal-title'},
                }}
                title={<span>Information</span>}
            />,
        )

        const dialog = screen.getByRole('dialog', {name: 'Information'})

        expect(document.querySelector('[data-pne-modal-body]')).toBeNull()
        expect(dialog).toBe(screen.getByTestId('modal-container'))
        expect(dialog.getAttribute('data-testattribute')).toBe('information-modal')
        expect(dialog.getAttribute('data-slot')).toBe('container')
        expect(ref.current).toBe(dialog)
        expect(dialog.getAttribute('aria-modal')).toBe('true')
        expect(screen.getByTestId('modal-title').tagName).toBe('H2')
        expect(screen.getByTestId('modal-close').getAttribute('aria-label')).toBe('Close')
        expect(screen.getByRole('button', {name: 'OK'})).not.toBeNull()
    })

    it('honors cleanup returned by a React 19 callback ref', () => {
        const cleanup = jest.fn()
        const callbackRef = jest.fn(() => cleanup)
        const {unmount} = render(
            <PneModal ref={callbackRef} onClose={jest.fn()} open title='Ref contract'/>,
        )
        const dialog = screen.getByRole('dialog', {name: 'Ref contract'})

        expect(callbackRef).toHaveBeenCalledWith(dialog)
        unmount()
        expect(cleanup).toHaveBeenCalledTimes(1)
    })

    it('supports a non-visual accessible name and an optional localized close label', () => {
        render(
            <PneModal
                ariaLabel='Logo preview'
                closeLabel='Закрыть'
                onClose={jest.fn()}
                open
                title=''
            >
                <img alt='Logo' src='logo.png'/>
            </PneModal>,
        )

        expect(screen.getByRole('dialog', {name: 'Logo preview'})).not.toBeNull()
        expect(screen.queryByRole('heading')).toBeNull()
        expect(screen.getByRole('button', {name: 'Закрыть'})).not.toBeNull()
    })

    it('uses a visible title before ariaLabel and normalizes an empty close label', () => {
        render(
            <PneModal
                ariaLabel='Fallback name'
                closeLabel='   '
                onClose={jest.fn()}
                open
                title='Visible title'
            />,
        )

        const dialog = screen.getByRole('dialog', {name: 'Visible title'})
        expect(dialog.getAttribute('aria-label')).toBeNull()
        expect(screen.getByRole('button', {name: 'Close'})).not.toBeNull()
    })

    it('reports the source of every close request', () => {
        const onClose = jest.fn()

        render(
            <PneModal onClose={onClose} open title='Edit item'>Content</PneModal>,
        )

        fireEvent.click(screen.getByRole('button', {name: 'Close'}))
        expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'closeButtonClick')

        fireEvent.keyDown(screen.getByRole('dialog', {name: 'Edit item'}), {key: 'Escape'})
        expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'escapeKeyDown')

        fireEvent.click(document.querySelector<HTMLElement>('.MuiModal-backdrop')!)
        expect(onClose).toHaveBeenLastCalledWith(expect.anything(), 'backdropClick')
    })

    it('turns a blocking overlay into an interaction and dismissal boundary', () => {
        const onClose = jest.fn()

        render(
            <PneModal
                actions={<PneModalActions primary={<button>Save</button>} />}
                blockingOverlay={<div>Loading</div>}
                onClose={onClose}
                open
                title='Edit item'
            >
                <button>Form control</button>
            </PneModal>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Edit item'})
        const header = document.querySelector<HTMLElement>('[data-pne-modal-header]')!
        const body = document.querySelector<HTMLElement>('[data-pne-modal-body]')!
        const footer = document.querySelector<HTMLElement>('[data-pne-modal-footer]')!
        const overlay = document.querySelector<HTMLElement>('[data-pne-modal-blocking-overlay]')!
        const closeButton = screen.getByRole('button', {name: 'Close', hidden: true})

        expect(dialog.getAttribute('aria-busy')).toBe('true')
        expect(Number(window.getComputedStyle(dialog.closest('.MuiModal-root')!).zIndex))
            .toBeGreaterThan(1500)
        expect(header.hasAttribute('inert')).toBe(true)
        expect(body.hasAttribute('inert')).toBe(true)
        expect(footer.hasAttribute('inert')).toBe(true)
        expect(closeButton.hasAttribute('inert')).toBe(true)
        expect(overlay.parentElement).toBe(dialog)
        expect(window.getComputedStyle(overlay).position).toBe('absolute')
        expect(window.getComputedStyle(overlay).inset).toBe('0')

        fireEvent.click(closeButton)
        fireEvent.keyDown(dialog, {key: 'Escape'})
        fireEvent.click(document.querySelector<HTMLElement>('.MuiModal-backdrop')!)
        expect(onClose).not.toHaveBeenCalled()
    })

    it('moves focus to the dialog while blocked and restores it afterwards', () => {
        const portaledControl = document.createElement('button')
        portaledControl.textContent = 'Portaled popup control'
        document.body.append(portaledControl)
        const {rerender} = render(
            <PneModal
                actions={<PneModalActions primary={<button>Save</button>} />}
                onClose={jest.fn()}
                open
                title='Edit item'
            >
                <button>Form control</button>
            </PneModal>,
        )
        const formControl = screen.getByRole('button', {name: 'Form control'})
        formControl.focus()
        expect(document.activeElement).toBe(formControl)

        rerender(
            <PneModal
                actions={<PneModalActions primary={<button>Save</button>} />}
                blockingOverlay={<div>Loading</div>}
                onClose={jest.fn()}
                open
                title='Edit item'
            >
                <button>Form control</button>
            </PneModal>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Edit item'})
        expect(document.activeElement).toBe(dialog)
        expect(dialog.getAttribute('tabindex')).toBe('-1')
        expect(portaledControl.hasAttribute('inert')).toBe(true)

        portaledControl.focus()
        expect(document.activeElement).toBe(dialog)

        rerender(
            <PneModal
                actions={<PneModalActions primary={<button>Save</button>} />}
                onClose={jest.fn()}
                open
                title='Edit item'
            >
                <button>Form control</button>
            </PneModal>,
        )

        expect(screen.getByRole('button', {name: 'Form control'})).toBe(formControl)
        expect(document.activeElement).toBe(formControl)
        expect(portaledControl.hasAttribute('inert')).toBe(false)
        portaledControl.remove()
    })

    it('keeps the topmost of two blocked dialogs as the only active boundary', async () => {
        const {rerender} = render(<>
            <PneModal
                blockingOverlay={<div>Loading first</div>}
                data-testid='first-dialog'
                onClose={jest.fn()}
                open
                title='First dialog'
            />
            <PneModal
                blockingOverlay={<div>Loading second</div>}
                data-testid='second-dialog'
                onClose={jest.fn()}
                open
                title='Second dialog'
            />
        </>)

        const firstDialog = screen.getByTestId('first-dialog')
        const secondDialog = screen.getByTestId('second-dialog')
        const firstModalRoot = firstDialog.closest<HTMLElement>('.MuiModal-root')!
        const secondModalRoot = secondDialog.closest<HTMLElement>('.MuiModal-root')!

        await waitFor(() => {
            expect(document.activeElement).toBe(secondDialog)
            expect(firstModalRoot.getAttribute('aria-hidden')).toBe('true')
            expect(secondModalRoot.getAttribute('aria-hidden')).toBeNull()
        })

        firstDialog.focus()
        expect(document.activeElement).toBe(secondDialog)

        rerender(
            <PneModal
                blockingOverlay={<div>Loading first</div>}
                data-testid='first-dialog'
                onClose={jest.fn()}
                open
                title='First dialog'
            />,
        )

        await waitFor(() => {
            expect(document.activeElement).toBe(firstDialog)
            expect(firstModalRoot.getAttribute('aria-hidden')).toBeNull()
        })
    })

    it('keeps the real top modal active when a lower modal starts blocking later', async () => {
        const {rerender} = render(<>
            <PneModal
                data-testid='lower-dialog'
                onClose={jest.fn()}
                open
                title='Lower dialog'
            />
            <PneModal
                blockingOverlay={<div>Loading upper</div>}
                data-testid='upper-dialog'
                onClose={jest.fn()}
                open
                title='Upper dialog'
            />
        </>)

        const lowerDialog = screen.getByTestId('lower-dialog')
        const upperDialog = screen.getByTestId('upper-dialog')
        const lowerModalRoot = lowerDialog.closest<HTMLElement>('.MuiModal-root')!
        const upperModalRoot = upperDialog.closest<HTMLElement>('.MuiModal-root')!

        await waitFor(() => expect(document.activeElement).toBe(upperDialog))

        rerender(<>
            <PneModal
                blockingOverlay={<div>Loading lower</div>}
                data-testid='lower-dialog'
                onClose={jest.fn()}
                open
                title='Lower dialog'
            />
            <PneModal
                blockingOverlay={<div>Loading upper</div>}
                data-testid='upper-dialog'
                onClose={jest.fn()}
                open
                title='Upper dialog'
            />
        </>)

        await waitFor(() => {
            expect(document.activeElement).toBe(upperDialog)
            expect(lowerModalRoot.hasAttribute('inert')).toBe(true)
            expect(upperModalRoot.hasAttribute('inert')).toBe(false)
        })

        lowerDialog.focus()
        expect(document.activeElement).toBe(upperDialog)
    })

    it('keeps managed dialog attributes authoritative for untyped callers', () => {
        const unsafeContainerProps = {
            'aria-label': 'Overridden name',
            'aria-modal': false,
            role: 'alert',
        } as unknown as NonNullable<React.ComponentProps<typeof PneModal>['slotProps']>['container']

        render(
            <PneModal
                onClose={jest.fn()}
                open
                slotProps={{container: unsafeContainerProps}}
                title='Managed name'
            />,
        )

        const dialog = screen.getByRole('dialog', {name: 'Managed name'})
        expect(dialog.getAttribute('aria-modal')).toBe('true')
        expect(dialog.getAttribute('aria-label')).toBeNull()
    })

    it('keeps structural elements fixed for untyped callers', () => {
        const unsafeSlotProps = {
            body: {
                component: 'section',
                dangerouslySetInnerHTML: {__html: 'Replaced body'},
            },
            closeButton: {
                children: 'Replaced close control',
                component: 'a',
                href: '#replaced',
                to: '#replaced',
                type: 'submit',
            },
            container: {
                'aria-hidden': true,
                as: 'article',
                component: 'section',
                dangerouslySetInnerHTML: {__html: 'Replaced dialog'},
                hidden: true,
                inert: true,
                role: 'alert',
                style: {position: 'static'},
            },
        } as unknown as NonNullable<React.ComponentProps<typeof PneModal>['slotProps']>

        render(
            <PneModal
                onClose={jest.fn()}
                open
                slotProps={unsafeSlotProps}
                title='Managed structure'
            >
                Safe body
            </PneModal>,
        )

        const dialog = screen.getByRole('dialog', {name: 'Managed structure'})
        const body = document.querySelector<HTMLElement>('[data-pne-modal-body]')!
        const closeButton = screen.getByRole('button', {name: 'Close'})

        expect(dialog.tagName).toBe('DIV')
        expect(dialog.getAttribute('aria-hidden')).toBeNull()
        expect(dialog.hasAttribute('hidden')).toBe(false)
        expect(dialog.hasAttribute('inert')).toBe(false)
        expect(window.getComputedStyle(dialog).position).toBe('absolute')
        expect(body.tagName).toBe('DIV')
        expect(body.textContent).toBe('Safe body')
        expect(closeButton.tagName).toBe('BUTTON')
        expect(closeButton.getAttribute('href')).toBeNull()
        expect(closeButton.getAttribute('type')).toBe('button')
    })

    it('can hide the close control without requiring another label prop', () => {
        render(
            <PneModal hideCloseButton onClose={jest.fn()} open title='Passive status'/>,
        )

        expect(screen.getByRole('dialog', {name: 'Passive status'})).not.toBeNull()
        expect(screen.queryByRole('button', {name: 'Close'})).toBeNull()
    })
})
