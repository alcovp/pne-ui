import * as React from 'react'
import {act, render, screen, waitFor} from '@testing-library/react'

import {OverlayHost, PermanentOverlay, overlayActions, useOverlayStore} from '../src'
import {resetOverlayRuntimeForTests} from '../src/component/overlay/overlayRuntime'

describe('OverlayHost operation center slot', () => {
    const originalInnerWidth = window.innerWidth

    const setViewportWidth = (width: number) => {
        Object.defineProperty(window, 'innerWidth', {configurable: true, value: width})
    }

    beforeEach(() => {
        setViewportWidth(1024)
        resetOverlayRuntimeForTests()
        useOverlayStore.getState().clearSnackbars()
    })

    afterAll(() => {
        setViewportWidth(originalInnerWidth)
    })

    it('does not add the dedicated slot when no operation center is supplied', () => {
        render(<OverlayHost container={null}/>)

        expect(document.querySelector('[data-pne-overlay-operation-center]')).toBeNull()
    })

    it('portals a presentation-only operation center into a safe bottom-right slot', () => {
        render(<OverlayHost operationCenter={<div>Operation center content</div>}/>)

        const content = screen.getByText('Operation center content')
        const slot = content.closest<HTMLElement>('[data-pne-overlay-operation-center]')!
        const style = window.getComputedStyle(slot)

        expect(slot.parentElement).toBe(document.body)
        expect(style.position).toBe('fixed')
        // jsdom does not evaluate env(safe-area-*); the explicit fallback is still measurable.
        expect(style.right).toBe('16px')
        expect(style.bottom).toBe('16px')
        // jsdom normalizes unsupported intrinsic sizing to an empty string; it must no longer
        // expose the former fixed 400px interaction footprint.
        expect(style.width).not.toBe('400px')
        expect(style.maxWidth).toContain('100vw')
        expect(style.pointerEvents).toBe('none')
        expect(window.getComputedStyle(content.parentElement!).pointerEvents).toBe('auto')
    })

    it('keeps the default bottom-left snackbar at the viewport edge on desktop', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-stack')) {
                    return {
                        bottom: 72,
                        height: 60,
                        left: 24,
                        right: 360,
                        top: 12,
                        width: 336,
                        x: 24,
                        y: 12,
                        toJSON: () => ({}),
                    }
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 608,
                    right: 1008,
                    top: 0,
                    width: 400,
                    x: 608,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            render(<OverlayHost container={null} operationCenter={<div>Running report</div>}/>)

            act(() => {
                overlayActions.showInfo({
                    id: 'operation-feedback',
                    message: 'Report queued',
                    autoHideMs: undefined,
                })
            })

            const snackbarMessage = await screen.findByText('Report queued')
            const snackbarStack = snackbarMessage.closest('[data-pne-overlay-stack]')
            const operationSlot = screen.getByText('Running report').closest('[data-pne-overlay-operation-center]')

            expect(snackbarStack?.getAttribute('data-pne-overlay-stack')).toBe('bottom-left')
            expect(operationSlot).not.toBeNull()
            expect(snackbarStack).not.toBe(operationSlot)
            await waitFor(() => {
                expect(window.getComputedStyle(snackbarStack as Element).bottom).toBe('12px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('keeps separated overlays side by side even below the former width breakpoint', async () => {
        setViewportWidth(760)
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-stack')) return {
                    bottom: 72,
                    height: 60,
                    left: 24,
                    right: 360,
                    top: 12,
                    width: 336,
                    x: 24,
                    y: 12,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 520,
                    right: 744,
                    top: 0,
                    width: 224,
                    x: 520,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            render(<OverlayHost container={null} operationCenter={<div>Compact operation</div>}/>)
            act(() => {
                overlayActions.showInfo({
                    autoHideMs: undefined,
                    id: 'separated-feedback',
                    message: 'Separated feedback',
                })
            })

            const stack = (await screen.findByText('Separated feedback'))
                .closest<HTMLElement>('[data-pne-overlay-stack]')!
            await waitFor(() => {
                expect(window.getComputedStyle(stack).bottom).toBe('12px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('stacks a wide desktop snackbar when its actual footprint overlaps the center', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-stack')) return {
                    bottom: 72,
                    height: 60,
                    left: 24,
                    right: 900,
                    top: 12,
                    width: 876,
                    x: 24,
                    y: 12,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 800,
                    right: 1008,
                    top: 0,
                    width: 208,
                    x: 800,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            render(<OverlayHost container={null} operationCenter={<div>Desktop operation</div>}/>)
            act(() => {
                overlayActions.showInfo({
                    autoHideMs: undefined,
                    id: 'wide-feedback',
                    message: 'A deliberately wide desktop feedback message',
                })
            })

            const stack = (await screen.findByText('A deliberately wide desktop feedback message'))
                .closest<HTMLElement>('[data-pne-overlay-stack]')!
            await waitFor(() => {
                expect(window.getComputedStyle(stack).bottom).toBe('136px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('remeasures horizontal overlap when a snackbar position prop changes without resizing', async () => {
        let stackLeft = 24
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-stack')) return {
                    bottom: 72,
                    height: 60,
                    left: stackLeft,
                    right: stackLeft + 336,
                    top: 12,
                    width: 336,
                    x: stackLeft,
                    y: 12,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 608,
                    right: 1008,
                    top: 0,
                    width: 400,
                    x: 608,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            const view = render(
                <OverlayHost
                    container={null}
                    leftOffset={24}
                    operationCenter={<div>Offset operation</div>}
                />,
            )
            act(() => {
                overlayActions.showInfo({
                    autoHideMs: undefined,
                    id: 'offset-feedback',
                    message: 'Position-aware feedback',
                })
            })

            const stack = (await screen.findByText('Position-aware feedback'))
                .closest<HTMLElement>('[data-pne-overlay-stack]')!
            await waitFor(() => {
                expect(window.getComputedStyle(stack).bottom).toBe('12px')
            })

            stackLeft = 500
            view.rerender(
                <OverlayHost
                    container={null}
                    leftOffset={500}
                    operationCenter={<div>Offset operation</div>}
                />,
            )

            await waitFor(() => {
                expect(window.getComputedStyle(stack).bottom).toBe('136px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('stacks the default bottom-left snackbar above the operation center on narrow screens', async () => {
        setViewportWidth(390)
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-stack')) return {
                    bottom: 92,
                    height: 80,
                    left: 24,
                    right: 345,
                    top: 12,
                    width: 321,
                    x: 24,
                    y: 12,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 16,
                    right: 374,
                    top: 0,
                    width: 358,
                    x: 16,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            render(<OverlayHost container={null} operationCenter={<div>Mobile operation</div>}/>)
            act(() => {
                overlayActions.showInfo({
                    autoHideMs: undefined,
                    id: 'mobile-operation-feedback',
                    message: 'Mobile report queued',
                })
            })

            const snackbar = await screen.findByText('Mobile report queued')
            const stack = snackbar.closest<HTMLElement>('[data-pne-overlay-stack]')!
            expect(stack.getAttribute('data-pne-overlay-stack')).toBe('bottom-left')
            await waitFor(() => {
                expect(window.getComputedStyle(stack).bottom).toBe('136px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('reserves the measured operation-center height for bottom-right snackbars', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 624,
                    right: 1008,
                    top: 0,
                    width: 384,
                    x: 624,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            render(<OverlayHost operationCenter={<div>Measured operation</div>}/>)
            act(() => {
                overlayActions.showInfo({
                    anchorOrigin: {horizontal: 'right', vertical: 'bottom'},
                    autoHideMs: undefined,
                    id: 'bottom-right-feedback',
                    message: 'Right-side feedback',
                })
            })

            const snackbar = await screen.findByText('Right-side feedback')
            const stack = snackbar.closest<HTMLElement>('[data-pne-overlay-stack]')!
            expect(stack.getAttribute('data-pne-overlay-stack')).toBe('bottom-right')
            expect(window.getComputedStyle(stack).bottom).toBe('136px')
        } finally {
            measure.mockRestore()
        }
    })

    it('stacks a permanent bottom overlay above the operation center', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (!this.hasAttribute('data-pne-overlay-operation-center')) {
                    return originalGetBoundingClientRect.call(this)
                }
                return {
                    bottom: 120,
                    height: 120,
                    left: 0,
                    right: 400,
                    top: 0,
                    width: 400,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }
            })
        try {
            render(
                <OverlayHost container={null} operationCenter={<div>Running report</div>}>
                    <PermanentOverlay id='permanent' render={() => <div>Permanent tools</div>}/>
                </OverlayHost>,
            )

            const permanent = (await screen.findByText('Permanent tools'))
                .closest<HTMLElement>('[data-pne-overlay-slot="bottom-right"]')!
            expect(window.getComputedStyle(permanent).bottom).toBe('156px')
        } finally {
            measure.mockRestore()
        }
    })

    it('keeps a zero-offset permanent bottom overlay clear of the inset operation center', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (!this.hasAttribute('data-pne-overlay-operation-center')) {
                    return originalGetBoundingClientRect.call(this)
                }
                return {
                    bottom: 120,
                    height: 120,
                    left: 0,
                    right: 400,
                    top: 0,
                    width: 400,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }
            })
        try {
            render(
                <OverlayHost container={null} operationCenter={<div>Inset operation</div>}>
                    <PermanentOverlay
                        id='zero-offset-permanent'
                        offset={0}
                        render={() => <div>Zero-offset tools</div>}
                    />
                </OverlayHost>,
            )

            const permanent = (await screen.findByText('Zero-offset tools'))
                .closest<HTMLElement>('[data-pne-overlay-slot="bottom-right"]')!
            expect(window.getComputedStyle(permanent).bottom).toBe('148px')
        } finally {
            measure.mockRestore()
        }
    })

    it('only lifts a bottom-left permanent overlay when the narrow viewport can overlap the center', async () => {
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.getAttribute('data-pne-overlay-slot') === 'bottom-left') return {
                    bottom: 84,
                    height: 60,
                    left: 24,
                    right: 224,
                    top: 24,
                    width: 200,
                    x: 24,
                    y: 24,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return window.innerWidth < 800 ? {
                    bottom: 120,
                    height: 120,
                    left: 16,
                    right: 374,
                    top: 0,
                    width: 358,
                    x: 16,
                    y: 0,
                    toJSON: () => ({}),
                } : {
                    bottom: 120,
                    height: 120,
                    left: 608,
                    right: 1008,
                    top: 0,
                    width: 400,
                    x: 608,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            const view = render(
                <OverlayHost container={null} operationCenter={<div>Responsive operation</div>}>
                    <PermanentOverlay
                        id='left-permanent'
                        slot='bottom-left'
                        render={() => <div>Left tools</div>}
                    />
                </OverlayHost>,
            )

            let permanent = (await screen.findByText('Left tools'))
                .closest<HTMLElement>('[data-pne-overlay-slot="bottom-left"]')!
            await waitFor(() => {
                expect(window.getComputedStyle(permanent).bottom).toBe('24px')
            })

            setViewportWidth(390)
            act(() => window.dispatchEvent(new Event('resize')))
            view.rerender(
                <OverlayHost container={null} operationCenter={<div>Responsive operation</div>}>
                    <PermanentOverlay
                        id='left-permanent'
                        slot='bottom-left'
                        render={() => <div>Left tools</div>}
                    />
                </OverlayHost>,
            )
            permanent = screen.getByText('Left tools')
                .closest<HTMLElement>('[data-pne-overlay-slot="bottom-left"]')!
            await waitFor(() => {
                expect(window.getComputedStyle(permanent).bottom).toBe('156px')
            })
        } finally {
            measure.mockRestore()
        }
    })

    it('remeasures permanent-overlay overlap when its offset changes without resizing', async () => {
        let permanentLeft = 24
        const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        const measure = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
                if (this.getAttribute('data-pne-overlay-slot') === 'bottom-left') return {
                    bottom: 84,
                    height: 60,
                    left: permanentLeft,
                    right: permanentLeft + 200,
                    top: 24,
                    width: 200,
                    x: permanentLeft,
                    y: 24,
                    toJSON: () => ({}),
                }
                if (this.hasAttribute('data-pne-overlay-operation-center')) return {
                    bottom: 120,
                    height: 120,
                    left: 608,
                    right: 1008,
                    top: 0,
                    width: 400,
                    x: 608,
                    y: 0,
                    toJSON: () => ({}),
                }
                return originalGetBoundingClientRect.call(this)
            })
        try {
            const renderOverlay = (offset: number) => (
                <OverlayHost container={null} operationCenter={<div>Offset-aware operation</div>}>
                    <PermanentOverlay
                        id='offset-aware-permanent'
                        offset={offset}
                        render={() => <div>Offset-aware tools</div>}
                        slot='bottom-left'
                    />
                </OverlayHost>
            )
            const view = render(renderOverlay(24))
            const permanent = (await screen.findByText('Offset-aware tools'))
                .closest<HTMLElement>('[data-pne-overlay-slot="bottom-left"]')!
            await waitFor(() => {
                expect(window.getComputedStyle(permanent).bottom).toBe('24px')
            })

            permanentLeft = 500
            view.rerender(renderOverlay(500))

            await waitFor(() => {
                expect(window.getComputedStyle(permanent).bottom).toBe('632px')
            })
        } finally {
            measure.mockRestore()
        }
    })
})
