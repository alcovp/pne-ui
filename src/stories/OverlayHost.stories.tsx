import React from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Stack } from '@mui/material'
import { PneFloatingActionButtons, OverlayHost, PermanentOverlay, overlayActions } from '../index'
import type { Meta, StoryObj } from '@storybook/react'

const OverlayDemo = () => {
    const fabActions = [
        {
            id: 'add',
            label: 'Add action',
            icon: <AddIcon fontSize='small' />,
            onClick: () => overlayActions.showSuccess({ message: 'Add action clicked' }),
        },
        {
            id: 'reset',
            label: 'Reset layout',
            icon: <RefreshIcon fontSize='small' />,
            onClick: () => overlayActions.showInfo({ message: 'Reset triggered' }),
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

export default {
    title: 'pne-ui/OverlayHost',
    component: OverlayDemo,
    tags: ['autodocs'],
} satisfies Meta<typeof OverlayDemo>

export const Basic: StoryObj<typeof OverlayDemo> = {
    render: () => <OverlayDemo />,
}

export const UndoWithProgress: StoryObj<typeof UndoSnackbarDemo> = {
    render: () => <UndoSnackbarDemo />,
}
