import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import {
    buildWidgetBoardBreakpoints,
    resolveWidgetBoardBreakpoint,
    useWidgetBoardBreakpoint,
} from '../src/component/widget-board/widgetBoardBreakpoints'
import type { WidgetBoardBreakpoint } from '../src/component/widget-board/types'

const semanticBreakpoints: readonly WidgetBoardBreakpoint[] = [
    { id: 'narrow', minWidth: 0, editBehavior: 'order-only' },
    { id: 'compact', minWidth: 640 },
    { id: 'wide', minWidth: 1024 },
]

describe('WidgetBoard breakpoints', () => {
    it('derives the backward-compatible numeric breakpoint contract from layout keys', () => {
        const result = buildWidgetBoardBreakpoints({
            1024: { widgets: {} },
            360: { widgets: {} },
            640: { widgets: {} },
        })

        expect(result).toEqual([
            { id: '360', minWidth: 360 },
            { id: '640', minWidth: 640 },
            { id: '1024', minWidth: 1024 },
        ])
    })

    it('resolves semantic breakpoint ids by their ordered minimum widths', () => {
        expect(resolveWidgetBoardBreakpoint(undefined, semanticBreakpoints).id).toBe('narrow')
        expect(resolveWidgetBoardBreakpoint(639, semanticBreakpoints).editBehavior).toBe('order-only')
        expect(resolveWidgetBoardBreakpoint(639, semanticBreakpoints).id).toBe('narrow')
        expect(resolveWidgetBoardBreakpoint(640, semanticBreakpoints).id).toBe('compact')
        expect(resolveWidgetBoardBreakpoint(1600, semanticBreakpoints).id).toBe('wide')
    })

    it('uses only measured container width in container mode', async () => {
        let containerWidth = 500
        let resizeCallback: ResizeObserverCallback | undefined
        const originalResizeObserver = global.ResizeObserver
        const rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
            () =>
                ({
                    bottom: 0,
                    height: 0,
                    left: 0,
                    right: containerWidth,
                    top: 0,
                    width: containerWidth,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }) as DOMRect,
        )

        class ResizeObserverMock implements ResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                resizeCallback = callback
            }

            disconnect = jest.fn()
            observe = jest.fn()
            unobserve = jest.fn()
        }

        global.ResizeObserver = ResizeObserverMock
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1800, writable: true })

        const Probe = () => {
            const { activeBreakpoint, containerRef } = useWidgetBoardBreakpoint({
                breakpoints: semanticBreakpoints,
                source: 'container',
            })
            return (
                <div ref={containerRef}>
                    <span data-testid='active-breakpoint'>{activeBreakpoint.id}</span>
                </div>
            )
        }

        try {
            render(<Probe />)
            await waitFor(() => expect(screen.getByTestId('active-breakpoint').textContent).toBe('narrow'))

            act(() => {
                window.innerWidth = 320
                window.dispatchEvent(new Event('resize'))
            })
            expect(screen.getByTestId('active-breakpoint').textContent).toBe('narrow')

            containerWidth = 1100
            act(() => {
                resizeCallback?.([], {} as ResizeObserver)
            })
            await waitFor(() => expect(screen.getByTestId('active-breakpoint').textContent).toBe('wide'))
        } finally {
            rectSpy.mockRestore()
            global.ResizeObserver = originalResizeObserver
        }
    })
})
