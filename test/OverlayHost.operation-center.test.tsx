import * as React from 'react'
import {act, render, screen} from '@testing-library/react'

import {OverlayHost, PermanentOverlay, overlayActions, useOverlayStore} from '../src'
import {resetOverlayRuntimeForTests} from '../src/component/overlay/overlayRuntime'

describe('OverlayHost operation center slot', () => {
    beforeEach(() => {
        resetOverlayRuntimeForTests()
        useOverlayStore.getState().clearSnackbars()
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
        expect(style.width).toBe('400px')
        expect(style.maxWidth).toContain('100vw')
        expect(style.pointerEvents).toBe('none')
        expect(window.getComputedStyle(content.parentElement!).pointerEvents).toBe('auto')
    })

    it('reserves the operation-center band for the default bottom-left snackbar stack', async () => {
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
            expect(window.getComputedStyle(snackbarStack as Element).bottom).toBe('136px')
        } finally {
            measure.mockRestore()
        }
    })

    it('reserves the measured operation-center height for bottom-right snackbars', async () => {
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
})
