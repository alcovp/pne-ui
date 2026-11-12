import React from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Stack, Typography } from '@mui/material'
import { PneFloatingActionButtons, OverlayHost, PermanentOverlay, overlayActions } from '../index'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { expect, userEvent, waitFor, within } from 'storybook/test'

const OverlayDemo = () => {
    const fabActions = [
        {
            id: 'add',
            label: 'Add action',
            icon: <AddIcon fontSize='small' />,
            onClick: () => overlayActions.showSuccess({ message: 'Add action clicked' }),
        },
        {
            id: 'refresh',
            label: 'Refresh data',
            icon: <RefreshIcon fontSize='small' />,
            onClick: () => overlayActions.showInfo({ message: 'Data refreshed' }),
        },
    ]

    return (
        <Box sx={{ minHeight: 260, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <OverlayHost>
                <PermanentOverlay
                    id='fab'
                    slot='bottom-right'
                    render={() => <PneFloatingActionButtons actions={fabActions} />}
                />
            </OverlayHost>
            <Stack direction='row' spacing={2}>
                <button onClick={() => overlayActions.showError({ message: 'Something went wrong' })}>Show error</button>
                <button
                    onClick={() => overlayActions.showError({
                        error: {
                            errorId: 'storybook-error-42',
                            messageId: 'react.unexpected.exception.message',
                            details: 'Backend details are shown only when the server includes them.',
                            errorType: 'SERVER_ERROR',
                            status: 500,
                        },
                    })}
                >
                    Show backend error
                </button>
                <button onClick={() => overlayActions.showSuccess({ message: 'Saved successfully' })}>Show success</button>
                <button
                    onClick={() =>
                        overlayActions.showUndoSnackbar({
                            message: 'Filters cleared',
                            undoLabel: 'Undo',
                            onUndo: () => overlayActions.showInfo({ message: 'Undo applied' }),
                        })
                    }
                >
                    Show undo
                </button>
            </Stack>
        </Box>
    )
}

const UndoSnackbarDemo = () => (
    <Box sx={{ minHeight: 220, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <OverlayHost>
            <button
                onClick={() =>
                    overlayActions.showUndoSnackbar({
                        message: 'Filters cleared',
                        undoLabel: 'Undo',
                        autoHideMs: 2500,
                        onUndo: () => overlayActions.showInfo({ message: 'Undo applied' }),
                    })
                }
            >
                Show timed undo
            </button>
        </OverlayHost>
    </Box>
)

const SnackbarChromePreview = () => {
    const [settled, setSettled] = React.useState(false)

    React.useEffect(() => {
        overlayActions.clearSnackbars()

        const variants = [
            { id: 'chrome-info', title: 'Information', message: 'A general notification.', variant: 'info' as const },
            { id: 'chrome-success', title: 'Success', message: 'The operation completed.', variant: 'success' as const },
            { id: 'chrome-warning', title: 'Warning', message: 'Review the entered values.', variant: 'warning' as const },
            { id: 'chrome-error', title: 'Error', message: 'The operation could not be completed.', variant: 'error' as const },
        ]

        variants.forEach(({ id, title, message, variant }) => {
            overlayActions.showSnackbar({
                id,
                variant,
                autoHideMs: undefined,
                message: title,
                description: message,
            })
        })

        overlayActions.showUndoSnackbar({
            id: 'chrome-undo',
            message: 'Filters cleared',
            undoLabel: 'Undo',
            autoHideMs: undefined,
            onUndo: () => undefined,
        })

        const settledTimer = window.setTimeout(() => setSettled(true), 500)

        return () => {
            window.clearTimeout(settledTimer)
            overlayActions.clearSnackbars()
        }
    }, [])

    return (
        <Box
            data-story-chrome-settled={settled ? 'true' : 'false'}
            sx={{ bgcolor: 'grey.50', minHeight: '100vh', p: 3 }}
        >
            <Typography component='h1' sx={{ fontSize: 20, fontWeight: 700, lineHeight: '28px' }}>
                Toasts of every tone
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: '20px', mt: 0.5 }}>
                The message is the title, the description stands under it in the text colour of the tone. The undo
                action is a soft small button before the close cross.
            </Typography>
            <OverlayHost />
        </Box>
    )
}

export default {
    title: 'pne-ui/OverlayHost',
    component: OverlayDemo,
    tags: ['autodocs'],
    parameters: {
        // The host is a singleton fixed to the viewport: on the docs page every story gets a frame of its own.
        docs: { story: { inline: false, height: '520px' } },
    },
} satisfies Meta<typeof OverlayDemo>

export const Basic: StoryObj<typeof OverlayDemo> = {
    render: () => <OverlayDemo />,
}

export const UndoWithProgress: StoryObj<typeof UndoSnackbarDemo> = {
    render: () => <UndoSnackbarDemo />,
}

export const ChromeAlignment: StoryObj<typeof SnackbarChromePreview> = {
    render: () => <SnackbarChromePreview />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('[data-story-chrome-settled]'))
                .toHaveAttribute('data-story-chrome-settled', 'true')
        })

        const errorMessage = await within(canvasElement.ownerDocument.body)
            .findByText('The operation could not be completed.')
        const errorAlert = errorMessage.closest<HTMLElement>('.MuiAlert-root')!

        // UI Kit Toast: every notification is 448px wide, has no sign of its tone, and ends with a 32px
        // close cross that keeps 16px from the right edge.
        within(canvasElement.ownerDocument.body).getAllByRole('button', { name: 'Close' }).forEach(closeButton => {
            const alert = closeButton.closest<HTMLElement>('.MuiAlert-root')!
            const alertRect = alert.getBoundingClientRect()
            const closeRect = closeButton.getBoundingClientRect()

            expect(Math.round(alertRect.width)).toBe(448)
            expect(alert.querySelector('.MuiAlert-icon')).toBeNull()
            expect(Math.round(closeRect.width)).toBe(32)
            expect(Math.round(closeRect.height)).toBe(32)
            expect(Math.round(alertRect.right - closeRect.right)).toBe(16)
        })

        const undoButton = within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Undo' })
        const undoAlert = undoButton.closest<HTMLElement>('.MuiAlert-root')!
        expect(undoButton.getBoundingClientRect().height).toBeLessThan(undoAlert.getBoundingClientRect().height)

        await userEvent.hover(within(errorAlert).getByRole('button', { name: 'Close' }))
        canvasElement.setAttribute('data-story-close-hovered', 'true')
    },
}
