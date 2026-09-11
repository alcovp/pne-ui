import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, Typography } from '@mui/material'
import type { PneFabItem } from '../index'
import { PneFloatingActionButtons } from '../index'
import type { Meta, StoryObj } from '@storybook/react-webpack5'

const FloatingDemo = () => {
    const [lastAction, setLastAction] = useState('—')

    const fabItems: PneFabItem[] = [
        {
            id: 'summary',
            kind: 'content',
            node: (
                <Box sx={{ minWidth: 220, px: 2, py: 1.5 }}>
                    <Typography variant='subtitle2'>Quick actions</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Content items can contain any application UI.
                    </Typography>
                </Box>
            ),
        },
        { id: 'divider-1', kind: 'divider' },
        {
            id: 'add',
            label: 'Add record',
            icon: <AddIcon fontSize='small' />,
            onClick: () => setLastAction('Add record'),
        },
        {
            id: 'refresh',
            label: 'Refresh data',
            icon: <RefreshIcon fontSize='small' />,
            onClick: () => setLastAction('Refresh data'),
        },
        {
            id: 'preview',
            label: 'Preview details',
            icon: <VisibilityIcon fontSize='small' />,
            onClick: () => setLastAction('Preview details'),
        },
    ]

    return (
        <Box sx={{ minHeight: 360, position: 'relative', p: 2 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                FAB supports application content, actions with right-aligned icons, a primary banner, and collapses to a menu on mobile.
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
                Last action: {lastAction}
            </Typography>
            <PneFloatingActionButtons actions={fabItems} bannerText='Record actions' />
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
