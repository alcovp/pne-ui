import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, Typography } from '@mui/material'
import type { PneFabItem, PneLayoutOption } from '../index'
import { PneFloatingActionButtons, PneLayoutsPanel } from '../index'
import type { Meta, StoryObj } from '@storybook/react'

const FloatingDemo = () => {
    const [lastAction, setLastAction] = useState('—')
    const [layouts, setLayouts] = useState<PneLayoutOption[]>([
        { id: 'default', name: 'Default layout' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'compact', name: 'Compact' },
    ])
    const [selectedId, setSelectedId] = useState(layouts[0]?.id ?? '')
    const selectedLayout = layouts.find(layout => layout.id === selectedId)

    const removeLayout = (id: string) => {
        setLayouts(current => {
            const nextLayouts = current.filter(layout => layout.id !== id)
            if (id === selectedId) {
                setSelectedId(nextLayouts[0]?.id ?? '')
            }
            return nextLayouts
        })
        setLastAction(`Deleted layout ${id}`)
    }

    const updateLayout = (id: string) => setLastAction(`Update layout ${id}`)

    const addLayout = (name: string) => {
        setLayouts(current => {
            const next = {
                id: `layout-${current.length + 1}`,
                name,
            }
            setSelectedId(next.id)
            return [...current, next]
        })
        setLastAction(`Added layout "${name}"`)
    }

    React.useEffect(() => {
        if (!layouts.length && selectedId) {
            setSelectedId('')
        }
    }, [layouts.length, selectedId])

    const fabItems: PneFabItem[] = [
        {
            id: 'layouts',
            kind: 'content',
            node: (
                <PneLayoutsPanel
                    items={layouts}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDelete={removeLayout}
                    onUpdate={updateLayout}
                    onAdd={addLayout}
                />
            ),
        },
        { id: 'divider-1', kind: 'divider' },
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
        <Box sx={{ minHeight: 360, position: 'relative', p: 2 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                FAB shows a layouts panel on top, actions with right-aligned icons, a primary banner, and collapses to a menu on mobile.
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
                Last action: {lastAction}
            </Typography>
            <PneFloatingActionButtons actions={fabItems} bannerText={selectedLayout ? `Layout: ${selectedLayout.name}` : 'Edit widgets'} />
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
