import React from 'react'
import { Box, Button, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react'
import type { WidgetBoardLayoutOption, WidgetBoardLoadLayoutsResult, WidgetDefinition } from '../index'
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

type LayoutSettingsPayload = WidgetBoardLoadLayoutsResult

const WITH_LAYOUTS_STORAGE_KEY = 'pne-ui.storybook.widget-board.with-layouts.v1'
const LOAD_DELAY_MS = 350
const SAVE_DELAY_MS = 120

let inMemoryLayoutSettings: LayoutSettingsPayload | null = null

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const clonePayload = (payload: LayoutSettingsPayload): LayoutSettingsPayload => {
    if (typeof structuredClone === 'function') {
        return structuredClone(payload)
    }

    return JSON.parse(JSON.stringify(payload)) as LayoutSettingsPayload
}

const normalizePayload = (payload: LayoutSettingsPayload): LayoutSettingsPayload => {
    const options = Array.isArray(payload.options) ? payload.options : []
    if (options.length === 0) {
        return { options: [] }
    }

    const hasSelected = payload.selectedId ? options.some(option => option.id === payload.selectedId) : false
    return { options, selectedId: hasSelected ? payload.selectedId : options[0].id }
}

const createSeedPayload = (): LayoutSettingsPayload => ({
    options: [
        { id: 'default', name: 'Analytics focus', layoutByBreakpoint: analyticsLayout.layoutByBreakpoint },
        { id: 'operations', name: 'Operations shift', layoutByBreakpoint: operationsLayout.layoutByBreakpoint },
    ],
    selectedId: 'default',
})

const readPayloadFromStorage = (): LayoutSettingsPayload => {
    if (typeof window === 'undefined' || !window.localStorage) {
        inMemoryLayoutSettings = normalizePayload(inMemoryLayoutSettings ?? createSeedPayload())
        return clonePayload(inMemoryLayoutSettings)
    }

    try {
        const raw = window.localStorage.getItem(WITH_LAYOUTS_STORAGE_KEY)
        if (!raw) {
            const seed = createSeedPayload()
            window.localStorage.setItem(WITH_LAYOUTS_STORAGE_KEY, JSON.stringify(seed))
            return clonePayload(seed)
        }

        const parsed = JSON.parse(raw) as LayoutSettingsPayload
        const normalized = normalizePayload(parsed)
        window.localStorage.setItem(WITH_LAYOUTS_STORAGE_KEY, JSON.stringify(normalized))
        return clonePayload(normalized)
    } catch (error) {
        console.warn('Failed to read widget-board story layouts from storage', error)
        const seed = createSeedPayload()
        window.localStorage.setItem(WITH_LAYOUTS_STORAGE_KEY, JSON.stringify(seed))
        return clonePayload(seed)
    }
}

const writePayloadToStorage = (payload: LayoutSettingsPayload) => {
    const normalized = normalizePayload(payload)

    if (typeof window === 'undefined' || !window.localStorage) {
        inMemoryLayoutSettings = clonePayload(normalized)
        return
    }

    try {
        window.localStorage.setItem(WITH_LAYOUTS_STORAGE_KEY, JSON.stringify(normalized))
    } catch (error) {
        console.warn('Failed to save widget-board story layouts to storage', error)
    }
}

const resetPayloadStorage = () => {
    inMemoryLayoutSettings = null

    if (typeof window === 'undefined' || !window.localStorage) {
        return
    }

    try {
        window.localStorage.removeItem(WITH_LAYOUTS_STORAGE_KEY)
    } catch (error) {
        console.warn('Failed to reset widget-board story layouts storage', error)
    }
}

const mockOrderHistoryLayoutsApi = {
    async getOrderHistoryLayoutSettings(): Promise<LayoutSettingsPayload> {
        await wait(LOAD_DELAY_MS)
        return readPayloadFromStorage()
    },

    async saveOrderHistoryLayoutSettings(options: WidgetBoardLayoutOption[], selectedId?: string): Promise<void> {
        await wait(SAVE_DELAY_MS)
        writePayloadToStorage({ options, selectedId })
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

const heavyWidgetIds = Array.from({ length: 5 }, (_, index) => `heavy-${index + 1}`)

const HeavyWidgetContent = ({ seed, title, level }: { seed: number; title: string; level: number }) => {
    const configByLevel = [
        { tags: 0, metrics: 0, rows: 0, progress: false },
        { tags: 3, metrics: 0, rows: 4, progress: false },
        { tags: 5, metrics: 4, rows: 8, progress: true },
        { tags: 8, metrics: 6, rows: 16, progress: true },
        { tags: 10, metrics: 8, rows: 48, progress: true },
    ]
    const config = configByLevel[Math.min(Math.max(level, 1), configByLevel.length) - 1]

    const rows = React.useMemo(
        () =>
            Array.from({ length: config.rows }, (_, index) => ({
                id: `${seed}-${index}`,
                label: `Row ${index + 1}`,
                value: `${(seed + 1) * (index + 3)} ms`,
            })),
        [config.rows, seed],
    )

    const tags = React.useMemo(
        () => Array.from({ length: config.tags }, (_, index) => `Tag ${seed + 1}.${index + 1}`),
        [config.tags, seed],
    )

    return (
        <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
            {tags.length > 0 && (
                <Stack direction='row' spacing={0.5} useFlexGap flexWrap='wrap'>
                    {tags.map(tag => (
                        <Chip key={tag} label={tag} size='small' />
                    ))}
                </Stack>
            )}
            {config.metrics > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
                    {Array.from({ length: config.metrics }, (_, index) => (
                        <Box
                            key={`${seed}-metric-${index}`}
                            sx={{ p: 1, bgcolor: '#F4F6FA', borderRadius: 1, border: '1px solid #E5E8ED' }}
                        >
                            <Typography variant='caption' color='text.secondary'>
                                Metric {index + 1}
                            </Typography>
                            <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                {(seed + 2) * (index + 4)}%
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
            {config.progress && <LinearProgress variant='determinate' value={((seed + 3) * 13) % 100} />}
            {rows.length > 0 && <Divider />}
            {rows.length > 0 && (
                <Box sx={{ display: 'grid', gap: 0.75 }}>
                    {rows.map(row => (
                        <Box
                            key={row.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 0.75,
                                borderRadius: 0.75,
                                border: '1px solid #EEF1F6',
                                bgcolor: '#FBFCFE',
                            }}
                        >
                            <Typography variant='body2'>{row.label}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                                {row.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    )
}

const heavyWidgets: WidgetDefinition[] = heavyWidgetIds.map((id, index) => ({
    id,
    title: `Widget ${index + 1}`,
    render: () => <HeavyWidgetContent seed={index} title={`Widget ${index + 1}`} level={index + 1} />,
}))

const heavyLayout = {
    layoutByBreakpoint: {
        12: {
            columns: 12,
            widgets: Object.fromEntries(
                heavyWidgetIds.map((id, index) => [
                    id,
                    {
                        defaultSize: {
                            columnSpan: index === heavyWidgetIds.length - 1 ? 6 : 3,
                            rowSpan: 2 + index,
                        },
                        limits: { minColumnSpan: 2, minRowSpan: 2 },
                    },
                ]),
            ),
        },
    },
}

const lightWidget: WidgetDefinition = {
    id: heavyWidgetIds[0],
    title: 'Widget 1',
    render: () => <HeavyWidgetContent seed={0} title='Widget 1' level={1} />,
}

const lightLayout = {
    layoutByBreakpoint: {
        12: {
            columns: 12,
            widgets: {
                [heavyWidgetIds[0]]: { defaultSize: { columnSpan: 3, rowSpan: 2 } },
            },
        },
    },
}

const BoardWithHeavyWidgets = () => {
    const loadLayouts = React.useCallback(async () => ({ options: [{ id: 'default', name: 'Heavy', layoutByBreakpoint: heavyLayout.layoutByBreakpoint }] }), [])
    const saveLayouts = React.useCallback(async () => undefined, [])

    return (
        <Box sx={{ p: 2 }}>
            <WidgetBoard widgets={heavyWidgets} layoutByBreakpoint={heavyLayout.layoutByBreakpoint} loadLayouts={loadLayouts} saveLayouts={saveLayouts} />
        </Box>
    )
}

const BoardWithLightWidget = () => {
    const loadLayouts = React.useCallback(async () => ({ options: [{ id: 'default', name: 'Light', layoutByBreakpoint: lightLayout.layoutByBreakpoint }] }), [])
    const saveLayouts = React.useCallback(async () => undefined, [])

    return (
        <Box sx={{ p: 2 }}>
            <WidgetBoard widgets={[lightWidget]} layoutByBreakpoint={lightLayout.layoutByBreakpoint} loadLayouts={loadLayouts} saveLayouts={saveLayouts} />
        </Box>
    )
}

const BoardWithLayouts = () => {
    const [boardVersion, setBoardVersion] = React.useState(0)

    const loadLayouts = React.useCallback(async () => {
        return mockOrderHistoryLayoutsApi.getOrderHistoryLayoutSettings()
    }, [])

    const saveLayouts = React.useCallback(async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
        await mockOrderHistoryLayoutsApi.saveOrderHistoryLayoutSettings(options, selectedId)
    }, [])

    const resetMockBackend = React.useCallback(() => {
        resetPayloadStorage()
        setBoardVersion(prev => prev + 1)
    }, [])

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                <Box sx={{ minWidth: 260 }}>
                    <WidgetLayoutsPanel />
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        <Button variant='outlined' size='small' onClick={resetMockBackend}>
                            Reset mock backend
                        </Button>
                        <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.4 }}>
                            Backend mock persists to localStorage.
                            <br />
                            Key: <code>{WITH_LAYOUTS_STORAGE_KEY}</code>
                        </Typography>
                    </Stack>
                </Box>
                <Box sx={{ flex: 1, minWidth: 320 }}>
                    <WidgetBoard
                        key={boardVersion}
                        widgets={widgets}
                        layoutByBreakpoint={analyticsLayout.layoutByBreakpoint}
                        loadLayouts={loadLayouts}
                        saveLayouts={saveLayouts}
                    />
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

export const HeavyContent: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithHeavyWidgets />,
}

export const LightContent: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithLightWidget />,
}
