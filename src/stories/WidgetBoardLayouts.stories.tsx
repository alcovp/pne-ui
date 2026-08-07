import React from 'react'
import { Box, Button, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { expect, fireEvent, waitFor } from 'storybook/test'
import type { PneFabAction, PneFabItem, WidgetBoardEditScale, WidgetBoardInteractionMode, WidgetBoardLayoutOption, WidgetBoardLoadLayoutsResult, WidgetBoardReactGridLayoutTuning, WidgetDefinition } from '../index'
import {
    DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING,
    OverlayHost,
    PneButton,
    WidgetBoardEditScaleControl,
    WidgetBoardVisibilityModal,
    WidgetBoardHeaderControls,
    WidgetBoardReactGridLayoutTuningControls,
    WidgetLayoutsPanel,
    WidgetBoard,
    WidgetBoardScopeProvider,
    WidgetBoardVisibilityControl,
    useWidgetBoardFabActions,
    useWidgetBoardScopeStore,
} from '../index'

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
        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
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
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                {title}
            </Typography>
            {tags.length > 0 && (
                <Stack direction='row' spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
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

const heavyLayout: Pick<WidgetBoardLayoutOption, 'layoutByBreakpoint'> = {
    layoutByBreakpoint: {
        12: {
            columns: 12,
            rowHeight: 48,
            margin: [0, 0],
            containerPadding: [0, 0],
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
        <WidgetBoardScopeProvider>
            <Box sx={{ p: 2 }}>
                <WidgetBoard widgets={heavyWidgets} layoutByBreakpoint={heavyLayout.layoutByBreakpoint} loadLayouts={loadLayouts} saveLayouts={saveLayouts} />
            </Box>
        </WidgetBoardScopeProvider>
    )
}

const BoardWithLightWidget = () => {
    const loadLayouts = React.useCallback(async () => ({ options: [{ id: 'default', name: 'Light', layoutByBreakpoint: lightLayout.layoutByBreakpoint }] }), [])
    const saveLayouts = React.useCallback(async () => undefined, [])

    return (
        <WidgetBoardScopeProvider>
            <Box sx={{ p: 2 }}>
                <WidgetBoard widgets={[lightWidget]} layoutByBreakpoint={lightLayout.layoutByBreakpoint} loadLayouts={loadLayouts} saveLayouts={saveLayouts} />
            </Box>
        </WidgetBoardScopeProvider>
    )
}

const orderOnlyBreakpoints = [
    { id: '12', minWidth: 0, editBehavior: 'order-only' },
] as const

const BoardWithReactGridLayout = ({
    interactionMode,
    orderOnly = false,
}: {
    interactionMode: WidgetBoardInteractionMode
    orderOnly?: boolean
}) => {
    const loadLayouts = React.useCallback(async () => ({ options: [{ id: 'default', name: 'RGL', layoutByBreakpoint: heavyLayout.layoutByBreakpoint }] }), [])
    const saveLayouts = React.useCallback(async () => undefined, [])

    return (
        <WidgetBoardScopeProvider>
            <Box sx={{ p: 2 }}>
                <WidgetBoard
                    engine='react-grid-layout'
                    interactionMode={interactionMode}
                    widgets={heavyWidgets}
                    layoutByBreakpoint={heavyLayout.layoutByBreakpoint}
                    breakpoints={orderOnly ? orderOnlyBreakpoints : undefined}
                    loadLayouts={loadLayouts}
                    saveLayouts={saveLayouts}
                    reactGridLayoutOptions={{
                        columns: 12,
                        rowHeight: 48,
                        margin: [0, 0],
                        containerPadding: [0, 0],
                    }}
                />
            </Box>
        </WidgetBoardScopeProvider>
    )
}

const BoardWithHeaderControlsContent = ({
    initialInteractionMode = 'view',
}: {
    initialInteractionMode?: WidgetBoardInteractionMode
}) => {
    const [interactionMode, setInteractionMode] = React.useState<WidgetBoardInteractionMode>(initialInteractionMode)
    const [tuning, setTuning] = React.useState<WidgetBoardReactGridLayoutTuning>(
        DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING,
    )
    const [editScale, setEditScale] = React.useState<WidgetBoardEditScale>(0.75)

    const loadLayouts = React.useCallback(async () => {
        return mockOrderHistoryLayoutsApi.getOrderHistoryLayoutSettings()
    }, [])

    const saveLayouts = React.useCallback(async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
        await mockOrderHistoryLayoutsApi.saveOrderHistoryLayoutSettings(options, selectedId)
    }, [])

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        minHeight: 40,
                    }}
                >
                    <WidgetBoardHeaderControls
                        interactionMode={interactionMode}
                        onInteractionModeChange={setInteractionMode}
                        editActions={
                            <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                                <WidgetBoardEditScaleControl
                                    scale={editScale}
                                    onScaleChange={setEditScale}
                                />
                                <WidgetBoardReactGridLayoutTuningControls
                                    tuning={tuning}
                                    onTuningChange={setTuning}
                                />
                            </Stack>
                        }
                    />
                </Box>
                <WidgetBoard
                    engine='react-grid-layout'
                    interactionMode={interactionMode}
                    widgets={heavyWidgets}
                    layoutByBreakpoint={heavyLayout.layoutByBreakpoint}
                    loadLayouts={loadLayouts}
                    saveLayouts={saveLayouts}
                    reactGridLayoutOptions={{
                        columns: 12,
                        rowHeight: 48,
                        margin: [0, 0],
                        containerPadding: [0, 0],
                        compaction: tuning.compaction,
                        collisionBehavior: tuning.collisionBehavior,
                        editScale,
                    }}
                />
            </Stack>
        </Box>
    )
}

const BoardWithHeaderControls = ({
    initialInteractionMode,
}: {
    initialInteractionMode?: WidgetBoardInteractionMode
}) => (
    <WidgetBoardScopeProvider>
        <BoardWithHeaderControlsContent initialInteractionMode={initialInteractionMode} />
    </WidgetBoardScopeProvider>
)

const visibilityExperienceBreakpoints = [
    { id: 'narrow', minWidth: 0, editBehavior: 'order-only' },
    { id: 'desktop', minWidth: 700, editBehavior: 'grid' },
] as const

const visibilityExperienceLayout = {
    narrow: {
        columns: 1,
        rowHeight: 48,
        margin: [0, 0] as const,
        containerPadding: [0, 0] as const,
        widgetOrder: ['traffic', 'sales', 'uptime', 'errors'],
        widgets: {
            traffic: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
            sales: {
                defaultSize: { columnSpan: 1, rowSpan: 2 },
                initialState: { isHidden: true },
            },
            uptime: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
            errors: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
        },
    },
    desktop: {
        columns: 4,
        rowHeight: 48,
        margin: [8, 8] as const,
        containerPadding: [0, 0] as const,
        widgetOrder: ['traffic', 'sales', 'uptime', 'errors'],
        widgets: {
            traffic: { defaultSize: { columnSpan: 2, rowSpan: 3 } },
            sales: { defaultSize: { columnSpan: 2, rowSpan: 3 } },
            uptime: { defaultSize: { columnSpan: 2, rowSpan: 3 } },
            errors: { defaultSize: { columnSpan: 2, rowSpan: 3 } },
        },
    },
}

const WidgetVisibilityExperienceContent = () => {
    const [narrow, setNarrow] = React.useState(false)
    const loadLayouts = React.useCallback(async () => ({
        options: [{ id: 'default', name: 'Visibility demo', layoutByBreakpoint: visibilityExperienceLayout }],
        selectedId: 'default',
    }), [])
    const saveLayouts = React.useCallback(async () => undefined, [])

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                        The side sheet is desktop-only; narrow editing keeps every widget in the inline order list.
                    </Typography>
                    <PneButton
                        data-pne-widget-board-story-width-toggle='true'
                        onClick={() => setNarrow(value => !value)}
                        pneStyle='outlined'
                        size='small'
                    >
                        {narrow ? 'Switch to desktop' : 'Switch to narrow'}
                    </PneButton>
                </Stack>
                <Box
                    data-pne-widget-board-story-surface='true'
                    sx={{ maxWidth: '100%', transition: 'width 160ms ease', width: narrow ? 360 : '100%' }}
                >
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', minHeight: 40 }}>
                            <WidgetBoardHeaderControls
                                interactionMode='edit'
                                onInteractionModeChange={() => undefined}
                                visibilityControl={<WidgetBoardVisibilityControl />}
                            />
                        </Box>
                        <WidgetBoard
                            autoHeightEnabled={false}
                            breakpointSource='container'
                            breakpoints={visibilityExperienceBreakpoints}
                            interactionMode='edit'
                            layoutByBreakpoint={visibilityExperienceLayout}
                            loadLayouts={loadLayouts}
                            reactGridLayoutOptions={{
                                columns: 4,
                                rowHeight: 48,
                                margin: [8, 8],
                                containerPadding: [0, 0],
                            }}
                            saveLayouts={saveLayouts}
                            showHideUndo
                            widgets={widgets}
                        />
                    </Stack>
                </Box>
            </Stack>
        </Box>
    )
}

const WidgetVisibilityExperience = () => (
    <>
        <OverlayHost />
        <WidgetBoardScopeProvider>
            <WidgetVisibilityExperienceContent />
        </WidgetBoardScopeProvider>
    </>
)

const BoardWithLayoutsContent = () => {
    const [boardVersion, setBoardVersion] = React.useState(0)
    const [isVisibilityModalOpen, setVisibilityModalOpen] = React.useState(false)
    const boardStore = useWidgetBoardScopeStore()
    const panelProps = boardStore(state => ({
        items: state.items,
        selectedId: state.selectedId,
        onSelect: state.onSelect,
        onDelete: state.onDelete,
        onAdd: state.onAdd,
        addInfo: state.addInfo,
        lockedIds: state.lockedIds,
        actionsState: state.actionsState,
        onResetLayout: state.onResetLayout,
        visibilityItems: state.visibilityItems,
        onSetWidgetVisibility: state.onSetWidgetVisibility,
    }))
    const actions = useWidgetBoardFabActions({
        store: boardStore,
        onEditVisibilityClick: () => setVisibilityModalOpen(true),
    })

    const actionItems = React.useMemo(() => actions.filter(isActionItem), [actions])
    const resetLayoutAction = actionItems.find(item => item.id === 'reset-layout')
    const editVisibilityAction = actionItems.find(item => item.id === 'edit-visibility')

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
            <Stack
                spacing={2}
                direction={{ xs: 'column', md: 'row' }}
                sx={{ alignItems: { xs: 'stretch', md: 'flex-start' } }}
            >
                <Box sx={{ minWidth: 260 }}>
                    <WidgetLayoutsPanel {...panelProps} />
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {resetLayoutAction ? (
                            <PneButton
                                pneStyle='outlined'
                                size='small'
                                startIcon={resetLayoutAction.icon}
                                disabled={resetLayoutAction.disabled}
                                onClick={resetLayoutAction.onClick}
                            >
                                {resetLayoutAction.label}
                            </PneButton>
                        ) : null}
                        {editVisibilityAction ? (
                            <PneButton
                                pneStyle='outlined'
                                size='small'
                                startIcon={editVisibilityAction.icon}
                                disabled={editVisibilityAction.disabled}
                                onClick={editVisibilityAction.onClick}
                            >
                                {editVisibilityAction.label}
                            </PneButton>
                        ) : null}
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
            <WidgetBoardVisibilityModal
                open={isVisibilityModalOpen}
                onClose={() => setVisibilityModalOpen(false)}
                items={panelProps.visibilityItems}
                onSetWidgetVisibility={panelProps.onSetWidgetVisibility}
            />
        </Box>
    )
}

const isActionItem = (item: PneFabItem): item is PneFabAction => !('kind' in item)

const BoardWithLayouts = () => (
    <WidgetBoardScopeProvider>
        <BoardWithLayoutsContent />
    </WidgetBoardScopeProvider>
)

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

export const ReactGridLayoutViewMode: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithReactGridLayout interactionMode='view' />,
}

export const ReactGridLayoutEditMode: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithReactGridLayout interactionMode='edit' />,
}

export const ReactGridLayoutOrderOnlyEditMode: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithReactGridLayout interactionMode='edit' orderOnly />,
}

export const ReactGridLayoutHeaderControls: StoryObj<typeof BoardWithLayouts> = {
    render: () => <BoardWithHeaderControls />,
}

export const ReactGridLayoutTuningPlayground: StoryObj<typeof BoardWithLayouts> = {
    name: 'React Grid Layout — tuning playground',
    render: () => <BoardWithHeaderControls initialInteractionMode='edit' />,
}

export const ReactGridLayoutEditScale: StoryObj<typeof BoardWithLayouts> = {
    name: 'React Grid Layout — edit scale',
    render: () => <BoardWithHeaderControls initialInteractionMode='edit' />,
    play: async ({ canvasElement }) => {
        const trigger = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-edit-scale-trigger="true"]',
            )
            if (!element) throw new Error('Edit scale trigger did not render')
            return element
        })
        expect(trigger.textContent).toContain('75%')

        fireEvent.click(trigger)
        const overviewOption = await waitFor(() => {
            const element = document.querySelector<HTMLElement>(
                '[data-pne-widget-board-edit-scale-option="0.5"]',
            )
            if (!element) throw new Error('Overview scale option did not render')
            return element
        })
        fireEvent.click(overviewOption)

        const board = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLElement>(
                '[data-pne-widget-board-edit-scale="0.5"]',
            )
            if (!element) throw new Error('Board did not switch to overview scale')
            return element
        })
        expect(board.getAttribute('data-pne-widget-board-overview')).toBe('true')
        expect(
            board.querySelector('[data-pne-widget-board-scale-canvas="true"]')
                ?.getAttribute('style'),
        ).toContain('scale(0.5)')
        expect(
            board.querySelector('[data-pne-widget-board-content-body="true"]')
                ?.hasAttribute('inert'),
        ).toBe(true)
    },
}

export const VisibilityExperience: StoryObj<typeof BoardWithLayouts> = {
    name: 'Visibility — side sheet, undo, empty recovery, narrow reorder',
    render: () => <WidgetVisibilityExperience />,
    play: async ({ canvasElement }) => {
        const trigger = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-visibility-trigger="true"]',
            )
            if (!element) throw new Error('Visibility trigger did not render')
            return element
        })
        fireEvent.click(trigger)

        const panel = await waitFor(() => {
            const element = document.querySelector<HTMLElement>(
                '[data-pne-widget-board-visibility-panel="true"]',
            )
            if (!element) throw new Error('Visibility side sheet did not open')
            return element
        })
        expect(panel.getAttribute('data-pne-widget-board-breakpoint-id')).toBe('desktop')
        expect(panel.getAttribute('aria-modal')).toBe('false')
        fireEvent.click(panel.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!)

        const firstHide = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-hide-widget="true"]',
            )
            if (!element) throw new Error('Direct hide control did not render')
            return element
        })
        fireEvent.click(firstHide)
        const undo = await waitFor(() => {
            const element = [...document.querySelectorAll<HTMLButtonElement>('button')]
                .find(button => button.textContent?.includes('Undo'))
            if (!element) throw new Error('Hide undo snackbar did not render')
            return element
        })
        fireEvent.click(undo)

        await waitFor(() => {
            const hideControls = canvasElement.querySelectorAll('[data-pne-widget-board-hide-widget="true"]')
            expect(hideControls.length).toBe(widgets.length)
        })
        for (let remaining = widgets.length; remaining > 0; remaining -= 1) {
            const hideControl = canvasElement.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-hide-widget="true"]',
            )
            if (!hideControl) throw new Error('Expected another widget hide control')
            fireEvent.click(hideControl)
            await waitFor(() => {
                expect(canvasElement.querySelectorAll('[data-pne-widget-board-hide-widget="true"]').length)
                    .toBe(remaining - 1)
            })
        }

        const showAll = await waitFor(() => {
            const emptyState = canvasElement.querySelector<HTMLElement>(
                '[data-pne-widget-board-empty-state="true"]',
            )
            const element = emptyState?.querySelector<HTMLButtonElement>('button')
            if (!element) throw new Error('All-hidden recovery action did not render')
            return element
        })
        fireEvent.click(showAll)
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('[data-pne-widget-board-hide-widget="true"]').length)
                .toBe(widgets.length)
        })

        fireEvent.click(canvasElement.querySelector<HTMLButtonElement>(
            '[data-pne-widget-board-story-width-toggle="true"]',
        )!)
        const hiddenRow = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLElement>(
                '[data-pne-widget-board-order-only-item="true"][data-pne-widget-board-widget-visible="false"]',
            )
            if (!element) throw new Error('Narrow hidden widget row did not render')
            return element
        })
        expect(hiddenRow.querySelector('[data-pne-widget-board-order-only-state="hidden"]')).toBeTruthy()
        const moveDown = [...hiddenRow.querySelectorAll<HTMLButtonElement>('button')]
            .find(button => button.getAttribute('aria-label')?.includes('down'))
        if (!moveDown) throw new Error('Hidden row reorder control did not render')
        fireEvent.click(moveDown)
    },
}

export const ReactGridLayoutDragPlaceholder: StoryObj<typeof BoardWithLayouts> = {
    name: 'React Grid Layout — drag placeholder',
    render: () => <BoardWithHeaderControls initialInteractionMode='edit' />,
    play: async ({ canvasElement }) => {
        const dragHandle = await waitFor(() => {
            const element = canvasElement.querySelector<HTMLElement>(
                '.pne-widget-board-rgl-drag-handle',
            )
            if (!element) throw new Error('RGL drag handle did not render')
            return element
        })
        const rect = dragHandle.getBoundingClientRect()

        fireEvent.mouseDown(dragHandle, {
            button: 0,
            buttons: 1,
            clientX: rect.left + 20,
            clientY: rect.top + 16,
        })
        fireEvent.mouseMove(document, {
            buttons: 1,
            clientX: rect.left + 180,
            clientY: rect.top + 96,
        })

        const placeholder = await waitFor(() => {
            const placeholder = canvasElement.querySelector<HTMLElement>('.react-grid-placeholder')
            if (!placeholder) throw new Error('RGL drag placeholder did not render')
            return placeholder
        })
        const placeholderStyle = getComputedStyle(placeholder)
        const title = dragHandle.querySelector<HTMLElement>('h3')
        if (!title) throw new Error('RGL widget title did not render')
        const accentRgb = getComputedStyle(title).color.match(/[\d.]+/g)?.slice(0, 3)
        const placeholderRgb = placeholderStyle.backgroundColor.match(/[\d.]+/g)?.slice(0, 3)

        expect(placeholderStyle.opacity).toBe('1')
        expect(placeholderStyle.borderRadius).toBe('4px')
        expect(placeholderStyle.borderTopWidth).toBe('0px')
        expect(placeholderStyle.boxShadow).toBe('none')
        expect(placeholderStyle.outlineStyle).toBe('none')
        expect(placeholderRgb).toEqual(accentRgb)
        expect(placeholderStyle.backgroundColor).not.toContain('255, 0, 0')

        // This visual story intentionally stays mid-drag; iframe teardown releases document listeners.
    },
}
