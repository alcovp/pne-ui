import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AlertTitle, Box, createTheme, ThemeProvider } from '@mui/material'

import {
    OverlayHost,
    overlayActions,
    PAYNET_LEFT_MENU_OVERLAY_OFFSET,
    useOverlayStore,
} from '../src'
import { createResponsiveLeftOffsetStyles } from '../src/component/overlay/OverlayHost'
import { resetOverlayRuntimeForTests } from '../src/component/overlay/overlayRuntime'

describe('OverlayHost', () => {
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

    it('keeps the existing Grow exit mounted while smoothly collapsing its stack space', async () => {
        const theme = createTheme()
        theme.transitions.duration.leavingScreen = 400
        render(
            <ThemeProvider theme={theme}>
                <OverlayHost container={null} />
            </ThemeProvider>,
        )

        act(() => {
            overlayActions.showError({
                id: 'animated-exit',
                message: 'Closing with motion',
                autoHideMs: undefined,
            })
        })

        const message = await screen.findByText('Closing with motion')
        const snackbar = screen.getByTestId('overlay-snackbar-animated-exit')
        const stack = message.closest<HTMLElement>('[data-pne-overlay-stack]')!
        const stackItem = message.closest<HTMLElement>('[data-pne-overlay-stack-item]')!

        expect(window.getComputedStyle(stack).gap).toBe('0px')
        expect(window.getComputedStyle(stack).bottom).toBe('12px')
        expect(window.getComputedStyle(stackItem).paddingBottom).toBe('12px')

        act(() => {
            overlayActions.removeSnackbar('animated-exit')
        })

        expect(useOverlayStore.getState().snackbars).toHaveLength(0)
        expect(screen.getByText('Closing with motion')).toBeTruthy()
        expect(window.getComputedStyle(snackbar).pointerEvents).toBe('none')

        await act(async () => {
            await new Promise(resolve => window.setTimeout(resolve, 250))
        })
        expect(screen.getByText('Closing with motion')).toBeTruthy()

        await waitFor(() => {
            expect(screen.queryByText('Closing with motion')).toBeNull()
        })
    })

    it('aligns the severity icon and stretches only the built-in close target', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showInfo({
                id: 'close-chrome',
                autoHideMs: undefined,
                message: (
                    <Box>
                        <AlertTitle>Information</AlertTitle>
                        A general notification.
                    </Box>
                ),
            })
        })

        const title = await screen.findByText('Information')
        const alert = title.closest('.MuiAlert-root')!
        const icon = alert.querySelector<HTMLElement>('.MuiAlert-icon')!
        const closeButton = screen.getByRole('button', { name: 'Close' })
        const closeAction = closeButton.closest<HTMLElement>('.MuiAlert-action')!

        expect(window.getComputedStyle(icon).paddingTop).toBe('7px')
        expect(window.getComputedStyle(closeAction).marginTop).toBe('-6px')
        expect(window.getComputedStyle(closeAction).marginBottom).toBe('-6px')
        expect(window.getComputedStyle(closeAction).marginRight).toBe('-16px')
        expect(window.getComputedStyle(closeAction).paddingLeft).toBe('8px')
        expect(window.getComputedStyle(closeButton).borderRadius).toBe('0')
        expect(window.getComputedStyle(closeButton).paddingTop).toBe('15px')
        expect(window.getComputedStyle(closeButton).paddingLeft).toBe('13px')
        expect(window.getComputedStyle(closeButton).paddingRight).toBe('13px')
        expect(window.getComputedStyle(closeButton).paddingBottom).toBe('0px')

        act(() => {
            overlayActions.clearSnackbars()
            overlayActions.showUndoSnackbar({
                id: 'unchanged-undo-chrome',
                message: 'Filters cleared',
                autoHideMs: undefined,
                onUndo: jest.fn(),
            })
        })

        const undoButton = await screen.findByRole('button', { name: 'Undo' })
        const undoAction = undoButton.closest<HTMLElement>('.MuiAlert-action')!

        expect(window.getComputedStyle(undoAction).marginTop).not.toBe('-6px')
        expect(window.getComputedStyle(undoAction).marginRight).not.toBe('-16px')
        expect(window.getComputedStyle(undoAction).paddingTop).toBe('4px')
        expect(window.getComputedStyle(undoButton).borderRadius).not.toBe('0')
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

    it('resumes auto-close only after both hover and focus have left', async () => {
        jest.useFakeTimers()
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showInfo({
                id: 'hover-focus-info',
                message: 'Keep me paused',
                autoHideMs: 1000,
            })
        })

        const snackbar = await screen.findByTestId('overlay-snackbar-hover-focus-info')
        const closeButton = screen.getByRole('button', { name: 'Close' })

        act(() => {
            jest.advanceTimersByTime(400)
        })
        fireEvent.mouseEnter(snackbar)
        fireEvent.focus(closeButton)
        fireEvent.mouseLeave(snackbar)

        act(() => {
            jest.advanceTimersByTime(1000)
        })
        expect(screen.getByText('Keep me paused')).toBeTruthy()

        fireEvent.blur(closeButton, { relatedTarget: null })
        act(() => {
            jest.advanceTimersByTime(600)
        })
        act(() => {
            jest.advanceTimersByTime(250)
        })

        expect(screen.queryByText('Keep me paused')).toBeNull()
    })

    it('disables transitions and the moving timeout progress for reduced motion', async () => {
        const originalMatchMedia = window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })

        try {
            render(<OverlayHost container={null} />)
            act(() => {
                overlayActions.showSuccess({
                    id: 'reduced-motion-success',
                    message: 'Saved without motion',
                    autoHideMs: 2500,
                })
            })

            expect(await screen.findByText('Saved without motion')).toBeTruthy()
            expect(screen.queryByTestId('overlay-snackbar-progress')).toBeNull()

            act(() => {
                overlayActions.removeSnackbar('reduced-motion-success')
            })
            await waitFor(() => {
                expect(screen.queryByText('Saved without motion')).toBeNull()
            })
        } finally {
            Object.defineProperty(window, 'matchMedia', {
                configurable: true,
                value: originalMatchMedia,
            })
        }
    })

    it('treats a removed and immediately re-enqueued id as a fresh snackbar instance', async () => {
        jest.useFakeTimers()
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showInfo({
                id: 'reused-id',
                message: 'First generation',
                autoHideMs: 1000,
            })
        })

        expect(await screen.findByText('First generation')).toBeTruthy()
        const firstSnackbar = screen.getByTestId('overlay-snackbar-reused-id')
        act(() => {
            jest.advanceTimersByTime(400)
            overlayActions.removeSnackbar('reused-id')
            overlayActions.showInfo({
                id: 'reused-id',
                message: 'Second generation',
                autoHideMs: 1000,
            })
        })

        expect(await screen.findByText('Second generation')).toBeTruthy()
        expect(screen.getByTestId('overlay-snackbar-reused-id')).not.toBe(firstSnackbar)
        expect(screen.queryByText('First generation')).toBeNull()

        act(() => {
            jest.advanceTimersByTime(700)
        })
        expect(screen.getByText('Second generation')).toBeTruthy()

        act(() => {
            jest.advanceTimersByTime(300)
        })
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(screen.queryByText('Second generation')).toBeNull()
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

    it('portals overlay stacks to document.body without adding a wrapper to the application tree', async () => {
        render(
            <div data-testid='application-root'>
                <OverlayHost>
                    <span>Application content</span>
                </OverlayHost>
            </div>,
        )

        act(() => {
            overlayActions.showError({
                id: 'body-portal',
                message: 'Rendered in body',
            })
        })

        const message = await screen.findByText('Rendered in body')
        const stack = message.closest('[data-pne-overlay-stack]')

        expect(stack).not.toBeNull()
        expect(stack?.parentElement).toBe(document.body)
        expect(screen.getByTestId('application-root').contains(message)).toBe(false)
    })

    it('supports a custom portal target', async () => {
        const portalTarget = document.createElement('div')
        document.body.appendChild(portalTarget)

        const view = render(<OverlayHost container={portalTarget} />)

        act(() => {
            overlayActions.showInfo({
                id: 'custom-portal',
                message: 'Rendered in a custom target',
                autoHideMs: undefined,
            })
        })

        const message = await screen.findByText('Rendered in a custom target')
        expect(portalTarget.contains(message)).toBe(true)

        view.unmount()
        portalTarget.remove()
    })

    it('resolves a callback portal target after its ref is mounted', async () => {
        const RefTargetHost = () => {
            const targetRef = React.useRef<HTMLDivElement>(null)

            return (
                <>
                    <div data-testid='ref-portal-target' ref={targetRef} />
                    <OverlayHost container={() => targetRef.current} />
                </>
            )
        }

        render(<RefTargetHost />)

        act(() => {
            overlayActions.showInfo({
                id: 'ref-portal',
                message: 'Rendered after ref commit',
                autoHideMs: undefined,
            })
        })

        const message = await screen.findByText('Rendered after ref commit')
        expect(screen.getByTestId('ref-portal-target').contains(message)).toBe(true)
    })

    it('uses the application theme snackbar layer through the portal', async () => {
        const theme = createTheme()
        theme.zIndex.snackbar = 4321

        render(
            <ThemeProvider theme={theme}>
                <OverlayHost />
            </ThemeProvider>,
        )

        act(() => {
            overlayActions.showWarning({
                id: 'themed-layer',
                message: 'Theme-aware layer',
                autoHideMs: undefined,
            })
        })

        const message = await screen.findByText('Theme-aware layer')
        const stack = message.closest('[data-pne-overlay-stack]')

        expect(stack).not.toBeNull()
        expect(window.getComputedStyle(stack!).zIndex).toBe('4321')
    })

    it('supports an explicit final offset for left-anchored stacks', async () => {
        render(<OverlayHost container={null} leftOffset={72} />)

        act(() => {
            overlayActions.showError({
                id: 'custom-left-offset',
                message: 'Offset from navigation',
            })
        })

        const message = await screen.findByText('Offset from navigation')
        const stack = message.closest('[data-pne-overlay-stack]')

        expect(stack).not.toBeNull()
        expect(window.getComputedStyle(stack!).left).toBe('72px')
    })

    it('exports the opt-in Paynet menu offset boundaries', () => {
        expect(PAYNET_LEFT_MENU_OVERLAY_OFFSET).toEqual({
            default: 16,
            breakpoints: [
                { minWidth: 1080, offset: 64 },
                { minWidth: 1600, offset: 272 },
            ],
        })
        expect(createResponsiveLeftOffsetStyles(PAYNET_LEFT_MENU_OVERLAY_OFFSET)).toEqual({
            left: 16,
            '@media (min-width: 1080px)': { left: 64 },
            '@media (min-width: 1600px)': { left: 272 },
        })
    })

    it('evicts overflow instead of retaining hidden snackbars that can reappear', async () => {
        render(<OverlayHost maxSnack={2} />)

        act(() => {
            overlayActions.showError({ id: 'overflow-1', message: 'First error' })
            overlayActions.showError({ id: 'overflow-2', message: 'Second error' })
            overlayActions.showError({ id: 'overflow-3', message: 'Third error' })
        })

        expect(await screen.findByText('Second error')).toBeTruthy()
        expect(screen.getByText('Third error')).toBeTruthy()

        await waitFor(() => {
            expect(useOverlayStore.getState().snackbars.map(snackbar => snackbar.id)).toEqual([
                'overflow-2',
                'overflow-3',
            ])
        })

        act(() => {
            overlayActions.removeSnackbar('overflow-3')
        })

        await waitFor(() => {
            expect(screen.queryByText('Third error')).toBeNull()
        })
        expect(screen.getByText('Second error')).toBeTruthy()
        expect(screen.queryByText('First error')).toBeNull()
    })
})
