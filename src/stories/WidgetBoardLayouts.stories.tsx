import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react'
import type { WidgetDefinition } from '../index'
import { WidgetLayoutsPanel, WidgetBoard } from '../index'

const widgets: WidgetDefinition[] = [
    {
        id: 'traffic',
        title: 'Traffic',
        render: () => <WidgetPreview title='Traffic'>Visits, CTR and referrers.</WidgetPreview>,
    },
    {
        id: 'sales',
        title: 'Sales',
        render: () => <WidgetPreview title='Sales'>Conversion and revenue.</WidgetPreview>,
    },
    {
        id: 'uptime',
        title: 'Uptime',
        render: () => <WidgetPreview title='Uptime'>Regional availability.</WidgetPreview>,
    },
    {
        id: 'errors',
        title: 'Errors',
        render: () => <WidgetPreview title='Errors'>Top failing endpoints.</WidgetPreview>,
    },
]

const analyticsLayout = {
    layoutByBreakpoint: {
        12: {
            columns: 12,
            widgets: {
                traffic: { defaultSize: { columnSpan: 8, rowSpan: 3 } },
                sales: { defaultSize: { columnSpan: 4, rowSpan: 3 } },
                uptime: { defaultSize: { columnSpan: 6, rowSpan: 2 }, initialState: { isCollapsed: true } },
                errors: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
            },
        },
    },
}

const operationsLayout = {
    layoutByBreakpoint: {
        12: {
            columns: 12,
            widgets: {
                traffic: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
                sales: { defaultSize: { columnSpan: 6, rowSpan: 2 } },
                uptime: { defaultSize: { columnSpan: 4, rowSpan: 2 } },
                errors: { defaultSize: { columnSpan: 8, rowSpan: 3 } },
            },
        },
    },
}

const WidgetPreview = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box
        sx={{
            p: 2,
            bgcolor: '#F7F9FC',
            border: '1px solid #E5E8ED',
            borderRadius: 1,
            height: '100%',
            boxSizing: 'border-box',
        }}
    >
        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
            {children}
        </Typography>
    </Box>
)

const BoardWithLayouts = () => {
    const loadLayouts = React.useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
        return {
            options: [
                { id: 'default', name: 'Analytics focus', layoutByBreakpoint: analyticsLayout.layoutByBreakpoint },
                { id: 'operations', name: 'Operations shift', layoutByBreakpoint: operationsLayout.layoutByBreakpoint },
            ],
            selectedId: 'default',
        }
    }, [])
    const saveLayouts = React.useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
    }, [])

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Box sx={{ minWidth: 260 }}>
                    <WidgetLayoutsPanel />
                </Box>
                <Box sx={{ flex: 1, minWidth: 320 }}>
                    <WidgetBoard widgets={widgets} layoutByBreakpoint={analyticsLayout.layoutByBreakpoint} loadLayouts={loadLayouts} saveLayouts={saveLayouts} />
                </Box>
            </Stack>
        </Box>
    )
}

export default {
    title: 'pne-ui/WidgetBoard',
    component: BoardWithLayouts,
    tags: ['autodocs'],
} satisfies Meta<typeof BoardWithLayouts>

export const WithLayouts: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithLayouts />,
}
