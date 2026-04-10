import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { OverlayHost, overlayActions, useOverlayStore } from '../src'
import { resetOverlayRuntimeForTests } from '../src/component/overlay/overlayRuntime'

describe('OverlayHost snackbar progress', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        resetOverlayRuntimeForTests()
        useOverlayStore.getState().clearSnackbars()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        jest.useRealTimers()
        consoleErrorSpy.mockRestore()
    })

    it('renders a progress bar for timed snackbars', async () => {
        render(<OverlayHost />)

        act(() => {
            overlayActions.showUndoSnackbar({
                id: 'timed-undo',
                message: 'Filters cleared',
                autoHideMs: 2500,
                onUndo: jest.fn(),
            })
        })

        expect(await screen.findByText('Filters cleared')).toBeTruthy()
        expect(screen.getByTestId('overlay-snackbar-progress')).toBeTruthy()
    })

    it('does not render a progress bar for non-timed snackbars', async () => {
        render(<OverlayHost />)

        act(() => {
            overlayActions.showError({
                id: 'non-timed-error',
                message: 'Something went wrong',
                autoHideMs: undefined,
            })
        })

        expect(await screen.findByText('Something went wrong')).toBeTruthy()
        await waitFor(() => {
            expect(screen.queryByTestId('overlay-snackbar-progress')).toBeNull()
        })
    })

    it('pauses auto-close on hover and resumes with the exact remaining time', async () => {
        jest.useFakeTimers()
        render(<OverlayHost />)

        act(() => {
            overlayActions.showUndoSnackbar({
                id: 'hover-undo',
                message: 'Hover me',
                autoHideMs: 1000,
                onUndo: jest.fn(),
            })
        })

        expect(await screen.findByText('Hover me')).toBeTruthy()

        act(() => {
            jest.advanceTimersByTime(400)
        })

        fireEvent.mouseEnter(screen.getByTestId('overlay-snackbar-hover-undo'))

        act(() => {
            jest.advanceTimersByTime(1000)
        })

        expect(screen.getByText('Hover me')).toBeTruthy()

        fireEvent.mouseLeave(screen.getByTestId('overlay-snackbar-hover-undo'))

        act(() => {
            jest.advanceTimersByTime(500)
        })

        expect(screen.getByText('Hover me')).toBeTruthy()

        act(() => {
            jest.advanceTimersByTime(100)
        })

        await waitFor(() => {
            expect(screen.queryByText('Hover me')).toBeNull()
        })
    })

    it('logs an explicit error when more than one OverlayHost is mounted', async () => {
        render(
            <>
                <OverlayHost />
                <OverlayHost />
            </>,
        )

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('mounted <OverlayHost /> instances'))
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('OverlayHost is a singleton'))
    })
})
