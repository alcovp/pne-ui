import React, { useMemo, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react'
import type { WidgetBoardLayoutOption, WidgetBoardState, WidgetDefinition, WidgetLayoutPreset } from '../index'
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

const initialOptions: WidgetBoardLayoutOption[] = [
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
    const [layoutOptions, setLayoutOptions] = useState<WidgetBoardLayoutOption[]>(initialOptions)
    const [selectedLayout, setSelectedLayout] = useState(layoutOptions[0]?.id ?? '')
    const [lastState, setLastState] = useState<WidgetBoardState | null>(null)

    const initialLayout = useMemo(
        () => layoutOptions[0]?.preset.layoutByBreakpoint ?? { 12: { columns: 12, widgets: {} } },
        [layoutOptions],
    )

    const stateToPreset = (state: WidgetBoardState | null): WidgetLayoutPreset => {
        const itemsMap = new Map(state?.items.map(item => [item.id as string, item]))
        const hiddenSet = new Set(state?.hidden ?? [])
        const collapsedSet = new Set(state?.collapsed ?? [])

        const widgetsConfig = widgets.reduce<Record<string, any>>((acc, widget) => {
            const item = itemsMap.get(widget.id)
            acc[widget.id] = {
                defaultSize: {
                    columnSpan: item?.columnSpan ?? 6,
                    rowSpan: item?.rowSpan ?? 2,
                    columnOffset: item?.columnOffset,
                },
                initialState: {
                    isHidden: hiddenSet.has(widget.id),
                    isCollapsed: collapsedSet.has(widget.id),
                },
            }
            return acc
        }, {})

        return {
            source: 'static',
            layoutByBreakpoint: {
                12: {
                    columns: 12,
                    widgets: widgetsConfig,
                },
            },
        }
    }

    const loadUserLayouts = React.useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
        return { options: layoutOptions, selectedId: selectedLayout }
    }, [layoutOptions, selectedLayout])

    const handleAdd = (name: string) => {
        const preset = stateToPreset(lastState)
        const option: WidgetBoardLayoutOption = { id: `${Date.now()}`, name, preset }
        setLayoutOptions(prev => [...prev, option])
        setSelectedLayout(option.id)
    }

    const handleUpdate = (id: string) => {
        const preset = stateToPreset(lastState)
        setLayoutOptions(prev => prev.map(option => (option.id === id ? { ...option, preset } : option)))
    }

    const handleDelete = (id: string) => {
        setLayoutOptions(prev => {
            const next = prev.filter(option => option.id !== id)
            setSelectedLayout(current => (current === id ? next[0]?.id ?? '' : current))
            return next
        })
    }

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Box sx={{ minWidth: 260 }}>
                    <PneLayoutsPanel
                        items={layoutOptions}
                        selectedId={selectedLayout}
                        onSelect={setSelectedLayout}
                        onAdd={handleAdd}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
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
                        onLayoutPersist={setLastState}
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
