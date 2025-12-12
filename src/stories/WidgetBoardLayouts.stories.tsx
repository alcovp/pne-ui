import React, { useMemo, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react'
import type { WidgetBoardLayoutOption, WidgetDefinition, WidgetLayoutPreset } from '../index'
import { PneLayoutsPanel, WidgetBoard } from '../index'

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

const analyticsLayout: WidgetLayoutPreset = {
    source: 'static',
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

const operationsLayout: WidgetLayoutPreset = {
    source: 'static',
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

const layoutOptions: WidgetBoardLayoutOption[] = [
    { id: 'analytics', name: 'Analytics focus', preset: analyticsLayout },
    { id: 'operations', name: 'Operations shift', preset: operationsLayout },
]

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
    const [selectedLayout, setSelectedLayout] = useState('')
    const initialLayout = useMemo(
        () => layoutOptions[0]?.preset.layoutByBreakpoint ?? { 12: { columns: 12, widgets: {} } },
        [],
    )
    const loadUserLayouts = React.useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
        return { options: layoutOptions, selectedId: layoutOptions[0]?.id }
    }, [])

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Box sx={{ minWidth: 260 }}>
                    <PneLayoutsPanel
                        items={layoutOptions}
                        selectedId={selectedLayout}
                        onSelect={setSelectedLayout}
                        title='Layouts'
                    />
                </Box>
                <Box sx={{ flex: 1, minWidth: 320 }}>
                    <WidgetBoard
                        widgets={widgets}
                        layoutByBreakpoint={initialLayout}
                        loadLayouts={loadUserLayouts}
                        layouts={{
                            options: layoutOptions,
                            selectedId: selectedLayout,
                            onSelect: setSelectedLayout,
                        }}
                    />
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        Selected layout: {selectedLayout || '—'}
                    </Typography>
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
