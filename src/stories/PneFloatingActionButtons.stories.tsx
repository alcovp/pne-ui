import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, Typography } from '@mui/material'
import { PneFloatingActionButtons } from '../index'
import type { Meta, StoryObj } from '@storybook/react'

const FloatingDemo = () => {
    const [lastAction, setLastAction] = useState('—')
    const actions = [
        {
            id: 'add',
            label: 'Add item',
            icon: <AddIcon fontSize='small' />,
            onClick: () => setLastAction('Add item'),
        },
        {
            id: 'reset',
            label: 'Reset layout',
            icon: <RefreshIcon fontSize='small' />,
            onClick: () => setLastAction('Reset layout'),
        },
        {
            id: 'restore',
            label: 'Restore hidden',
            icon: <VisibilityIcon fontSize='small' />,
            onClick: () => setLastAction('Restore hidden'),
        },
    ]

    return (
        <Box sx={{ minHeight: 260, position: 'relative', p: 2 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Resize the canvas to see FAB collapse on mobile breakpoints.
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
                Last action: {lastAction}
            </Typography>
            <PneFloatingActionButtons actions={actions} />
        </Box>
    )
}

export default {
    title: 'pne-ui/PneFloatingActionButtons',
    component: FloatingDemo,
    tags: ['autodocs'],
} satisfies Meta<typeof FloatingDemo>

export const Basic: StoryObj<typeof FloatingDemo> = {
    render: () => <FloatingDemo />,
}
