import React from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Stack } from '@mui/material'
import { DEFAULT_BREAKPOINTS, PneFloatingActionButtons, PneOverlayHost, overlayActions } from '../index'
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
            <PneOverlayHost
                breakpoints={DEFAULT_BREAKPOINTS}
                renderPermanent={() => <PneFloatingActionButtons actions={fabActions} breakpoints={DEFAULT_BREAKPOINTS} />}
                permanentPosition={{ vertical: 'bottom', horizontal: 'right', offset: 24 }}
            />
            <Stack direction='row' spacing={2}>
                <button onClick={() => overlayActions.showError({ message: 'Something went wrong' })}>Show error</button>
                <button onClick={() => overlayActions.showSuccess({ message: 'Saved successfully' })}>Show success</button>
            </Stack>
        </Box>
    )
}

export default {
    title: 'pne-ui/PneOverlayHost',
    component: OverlayDemo,
    tags: ['autodocs'],
} satisfies Meta<typeof OverlayDemo>

export const Basic: StoryObj<typeof OverlayDemo> = {
    render: () => <OverlayDemo />,
}
