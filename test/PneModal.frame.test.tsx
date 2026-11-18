import * as React from 'react'
import {ThemeProvider} from '@mui/material/styles'
import {act, fireEvent, render, screen} from '@testing-library/react'

import {createPneTheme, PneModal, type PneModalProps, type Skin} from '../src'

// jsdom lays nothing out: the window is 400 × 300 in the middle of the 1024 × 768 page until its inline
// style says otherwise, as a browser would have it.
const PAGE = {width: 1024, height: 768}
const WINDOW = {width: 400, height: 300}

const layOut = (container: HTMLElement) => {
    container.getBoundingClientRect = () => {
        const style = container.style
        const width = style.width ? Number.parseFloat(style.width) : WINDOW.width
        const height = style.height ? Number.parseFloat(style.height) : WINDOW.height
        const left = style.left ? Number.parseFloat(style.left) : (PAGE.width - width) / 2
        const top = style.top ? Number.parseFloat(style.top) : (PAGE.height - height) / 2

        return {
            left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}),
        }
    }
}

const pointer = (type: string, clientX: number, clientY: number, init: MouseEventInit = {}) => new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
    ...init,
})

const drag = (from: Element, by: {x: number; y: number}, start = {x: 500, y: 250}) => {
    fireEvent(from, pointer('pointerdown', start.x, start.y))
    fireEvent(document, pointer('pointermove', start.x + by.x, start.y + by.y))
    fireEvent(document, pointer('pointerup', start.x + by.x, start.y + by.y))
}

const renderModal = (props: Partial<PneModalProps> = {}) => {
    const theme = createPneTheme({experimentalColor: '#0a91bc'} as Skin)
    const view = render(
        <ThemeProvider theme={theme}>
            <PneModal onClose={jest.fn()} open title='Window' {...props as object}>
                Body
            </PneModal>
        </ThemeProvider>,
    )
    const container = screen.getByRole('dialog')
    layOut(container)

    return {
        ...view,
        container,
        header: container.querySelector<HTMLElement>('[data-pne-modal-header]')!,
        handle: () => container.querySelector<HTMLElement>('[data-pne-modal-resize-handle]'),
        rerenderModal: (nextProps: Partial<PneModalProps>) => view.rerender(
            <ThemeProvider theme={theme}>
                <PneModal onClose={jest.fn()} open title='Window' {...nextProps as object}>
                    Body
                </PneModal>
            </ThemeProvider>,
        ),
    }
}

const place = (container: HTMLElement) => ({
    left: container.style.left,
    top: container.style.top,
    width: container.style.width,
    height: container.style.height,
    transform: container.style.transform,
})

describe('PneModal: a window a person moves and resizes', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {configurable: true, value: PAGE.width})
        Object.defineProperty(window, 'innerHeight', {configurable: true, value: PAGE.height})
    })

    it('stays where its styles put it and shows no grip unless asked', () => {
        const {container, header, handle} = renderModal()

        drag(header, {x: 120, y: 40})

        expect(handle()).toBeNull()
        expect(container.hasAttribute('data-pne-modal-movable')).toBe(false)
        expect(container.hasAttribute('data-pne-modal-resizable')).toBe(false)
        expect(place(container)).toEqual({left: '', top: '', width: '', height: '', transform: ''})
    })

    it('moves by its header from the very place it stood at and keeps its width', () => {
        const {container, header} = renderModal({movable: true})

        fireEvent(header, pointer('pointerdown', 500, 250))

        // Nothing jumps under the pointer: the centred window is pinned where it was.
        expect(place(container)).toEqual({left: '312px', top: '234px', width: '400px', height: '', transform: 'none'})
        expect(container.getAttribute('data-pne-modal-action')).toBe('move')

        fireEvent(document, pointer('pointermove', 620, 290))
        expect(place(container)).toMatchObject({left: '432px', top: '274px', width: '400px', height: ''})

        fireEvent(document, pointer('pointerup', 620, 290))
        expect(container.hasAttribute('data-pne-modal-action')).toBe(false)

        // The button is up: the pointer no longer drags the window.
        fireEvent(document, pointer('pointermove', 100, 100))
        expect(place(container)).toMatchObject({left: '432px', top: '274px'})
    })

    it('keeps the whole window inside the page', () => {
        const {container, header} = renderModal({movable: true})

        drag(header, {x: 5000, y: 5000})
        expect(place(container)).toMatchObject({left: '624px', top: '468px'})

        drag(header, {x: -5000, y: -5000})
        expect(place(container)).toMatchObject({left: '0px', top: '0px'})
    })

    it('leaves a press on the close button to the button', () => {
        const onClose = jest.fn()
        const {container} = renderModal({movable: true, onClose})
        const closeButton = screen.getByRole('button', {name: 'Close'})

        drag(closeButton, {x: 120, y: 40})
        fireEvent.click(closeButton)

        expect(place(container)).toMatchObject({left: '', top: ''})
        expect(onClose).toHaveBeenCalledWith(expect.anything(), 'closeButtonClick')
    })

    it('does not start on a press of another mouse button', () => {
        const {container, header} = renderModal({movable: true})

        fireEvent(header, pointer('pointerdown', 500, 250, {button: 2}))
        fireEvent(document, pointer('pointermove', 620, 290))

        expect(place(container)).toMatchObject({left: '', top: ''})
    })

    it('lets the header handler of the consumer take the press', () => {
        const {container, header} = renderModal({
            movable: true,
            slotProps: {header: {onPointerDown: event => event.preventDefault()}},
        })

        drag(header, {x: 120, y: 40})

        expect(place(container)).toMatchObject({left: '', top: ''})
    })

    it('resizes by its lower right corner with the upper left corner in place', () => {
        const {container, handle} = renderModal({resizable: true})

        expect(handle()).not.toBeNull()
        fireEvent(handle()!, pointer('pointerdown', 712, 534))
        expect(place(container)).toEqual({left: '312px', top: '234px', width: '400px', height: '300px', transform: 'none'})
        expect(container.getAttribute('data-pne-modal-action')).toBe('resize')

        fireEvent(document, pointer('pointermove', 772, 574))
        fireEvent(document, pointer('pointerup', 772, 574))

        expect(place(container)).toMatchObject({left: '312px', top: '234px', width: '460px', height: '340px'})
    })

    it('resizes between its minimum and the edges of the page', () => {
        const {container, handle} = renderModal({resizable: true})

        drag(handle()!, {x: -5000, y: -5000}, {x: 712, y: 534})
        expect(place(container)).toMatchObject({left: '312px', top: '234px', width: '240px', height: '160px'})

        drag(handle()!, {x: 5000, y: 5000}, {x: 552, y: 394})
        expect(place(container)).toMatchObject({left: '312px', top: '234px', width: '712px', height: '534px'})
    })

    it('keeps the dragged height when the window is moved afterwards', () => {
        const {container, header, handle} = renderModal({movable: true, resizable: true})

        drag(handle()!, {x: 60, y: 40}, {x: 712, y: 534})
        drag(header, {x: -100, y: -100})

        expect(place(container)).toMatchObject({left: '212px', top: '134px', width: '460px', height: '340px'})
    })

    it('opens centred again after it was closed', () => {
        const {container, header, rerenderModal} = renderModal({movable: true, resizable: true})

        drag(header, {x: 120, y: 40})
        expect(place(container)).toMatchObject({left: '432px', top: '274px'})

        rerenderModal({movable: true, open: false, resizable: true})
        rerenderModal({movable: true, open: true, resizable: true})

        expect(place(screen.getByRole('dialog'))).toEqual({left: '', top: '', width: '', height: '', transform: ''})
    })

    it('comes back inside when the page gets smaller', () => {
        const {container, header} = renderModal({movable: true})

        drag(header, {x: 5000, y: 5000})
        expect(place(container)).toMatchObject({left: '624px', top: '468px'})

        Object.defineProperty(window, 'innerWidth', {configurable: true, value: 800})
        Object.defineProperty(window, 'innerHeight', {configurable: true, value: 600})
        act(() => {
            window.dispatchEvent(new Event('resize'))
        })

        expect(place(container)).toMatchObject({left: '400px', top: '300px', width: '400px'})
    })

    it('stops a drag that is in progress when the window closes', () => {
        const {container, header, rerenderModal} = renderModal({movable: true})

        fireEvent(header, pointer('pointerdown', 500, 250))
        rerenderModal({movable: true, open: false})
        rerenderModal({movable: true, open: true})
        fireEvent(document, pointer('pointermove', 620, 290))

        expect(place(screen.getByRole('dialog'))).toMatchObject({left: '', top: ''})
        expect(container.isConnected).toBe(false)
    })
})
