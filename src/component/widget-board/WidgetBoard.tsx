import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import Board, { type BoardProps } from '@cloudscape-design/board-components/board'
import BoardItem from '@cloudscape-design/board-components/board-item'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import PneButton from '../PneButton'
import { CloudscapeBoardStyles } from '../cloudscape/CloudscapeBoardStyles'
import { CloudscapeThemeProvider } from '../cloudscape/CloudscapeThemeProvider'
import { boardItemI18nStrings, createBoardI18nStrings } from '../cloudscape/boardI18n'
import type {
    BreakpointLayoutConfig,
    WidgetBoardItemData,
    WidgetBoardProps,
    WidgetBoardState,
    WidgetDefinition,
    WidgetLayoutConfig,
    WidgetLayoutPreset,
} from './types'

export type WidgetBoardHandle = {
    resetLayout: () => void
    restoreHidden: () => void
}

type WidgetDefinitionWithLayout = WidgetDefinition & { layout: WidgetLayoutConfig }

const fallbackLayout: WidgetLayoutConfig = { defaultSize: { columnSpan: 1, rowSpan: 2 } }

const withLayout = (definitions: WidgetDefinition[], layout: BreakpointLayoutConfig): WidgetDefinitionWithLayout[] =>
    definitions.map(definition => ({
        ...definition,
        layout: layout.widgets[definition.id] ?? fallbackLayout,
    }))

const toBoardItem = (
    definition: WidgetDefinitionWithLayout,
    overrides?: Partial<Pick<BoardProps.Item<WidgetBoardItemData>, 'columnSpan' | 'rowSpan' | 'columnOffset'>>,
): BoardProps.Item<WidgetBoardItemData> => {
    const defaultSize = definition.layout.defaultSize
    const limits = definition.layout.limits

    return {
        id: definition.id,
        columnSpan: overrides?.columnSpan ?? defaultSize.columnSpan,
        rowSpan: overrides?.rowSpan ?? defaultSize.rowSpan,
        columnOffset: overrides?.columnOffset ?? defaultSize.columnOffset,
        data: { id: definition.id, title: definition.title },
        definition: {
            defaultColumnSpan: defaultSize.columnSpan,
            defaultRowSpan: defaultSize.rowSpan,
            minColumnSpan: limits?.minColumnSpan,
            minRowSpan: limits?.minRowSpan,
        },
    }
}

const applyCollapsedState = (
    items: BoardProps.Item<WidgetBoardItemData>[],
    collapsed: string[],
    definitionsMap: Map<string, WidgetDefinitionWithLayout>,
    sizeMemory: Partial<Record<string, number>>,
) => {
    if (collapsed.length === 0) return items

    const collapsedSet = new Set(collapsed)
    return items.map(item => {
        const widgetId = item.id as string
        if (!collapsedSet.has(widgetId)) return item

        const definition = definitionsMap.get(widgetId)
        if (!definition) return item

        if (sizeMemory[widgetId] === undefined) {
            sizeMemory[widgetId] = item.rowSpan ?? definition.layout.defaultSize.rowSpan
        }

        const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
        return { ...item, rowSpan: minRows }
    })
}

const buildDefaultState = (definitions: WidgetDefinitionWithLayout[]): WidgetBoardState => {
    const hidden = definitions.filter(def => def.layout.initialState?.isHidden).map(def => def.id)
    const collapsed = definitions.filter(def => def.layout.initialState?.isCollapsed).map(def => def.id)
    const sizeMemory: Partial<Record<string, number>> = {}
    const definitionsMap = new Map<string, WidgetDefinitionWithLayout>(definitions.map(def => [def.id, def]))

    const items = definitions.filter(def => !hidden.includes(def.id)).map(def => toBoardItem(def))
    const collapsedItems = applyCollapsedState(items, collapsed, definitionsMap, sizeMemory)

    return {
        items: collapsedItems,
        hidden,
        collapsed,
        sizeMemory,
    }
}

const resolveBreakpoint = (width: number | undefined, breakpoints: readonly number[]): number => {
    if (!width || Number.isNaN(width)) {
        return breakpoints[0]
    }

    let match: number = breakpoints[0]
    for (const breakpoint of breakpoints) {
        if (width >= breakpoint) {
            match = breakpoint
        } else {
            break
        }
    }

    return match
}

const getLayoutConfigForWidth = (width: number | undefined, layoutMap: Record<number | string, BreakpointLayoutConfig>, breakpoints: readonly number[]) => {
    const breakpoint = resolveBreakpoint(width, breakpoints)
    return { breakpoint, layout: layoutMap[breakpoint] }
}

const buildStoragePayload = (state: WidgetBoardState) =>
    JSON.stringify({
        items: state.items.map(({ id, columnSpan, columnOffset, rowSpan }) => ({ id, columnSpan, columnOffset, rowSpan })),
        hidden: state.hidden,
        collapsed: state.collapsed,
        sizeMemory: state.sizeMemory,
    })

const hydrateStoragePayload = (raw: string) => JSON.parse(raw) as WidgetBoardState

export const WidgetBoard = forwardRef<WidgetBoardHandle, WidgetBoardProps>(function WidgetBoard(
    {
        widgets,
        layoutByBreakpoint,
        breakpoints: customBreakpoints,
        storageKey = 'pne-widget-board-layout',
        loadRemoteLayout,
        controls,
        empty,
        hideNavigationArrows = true,
        onLayoutPersist,
        isWidgetEnabled,
        className,
    },
    ref,
) {
    const breakpoints = useMemo(
        () => customBreakpoints ?? Object.keys(layoutByBreakpoint).map(Number).sort((a, b) => a - b),
        [customBreakpoints, layoutByBreakpoint],
    )

    const [layoutSource, setLayoutSource] = useState<WidgetLayoutPreset>(() => ({
        layoutByBreakpoint,
        source: 'static' as const,
    }))

    const [layoutPreset, setLayoutPreset] = useState(() =>
        getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource.layoutByBreakpoint, breakpoints),
    )

    const fallbackLayoutConfig = useMemo(() => {
        const firstKey = breakpoints[0]
        return layoutSource.layoutByBreakpoint[firstKey] ?? Object.values(layoutSource.layoutByBreakpoint)[0]
    }, [breakpoints, layoutSource.layoutByBreakpoint])

    const definitionsWithLayout = useMemo(
        () => withLayout(widgets, layoutPreset.layout ?? fallbackLayoutConfig ?? { columns: 12, widgets: {} }),
        [fallbackLayoutConfig, layoutPreset.layout, widgets],
    )

    const activeDefinitions = useMemo(
        () => definitionsWithLayout.filter(def => (isWidgetEnabled ? isWidgetEnabled(def) : true)),
        [definitionsWithLayout, isWidgetEnabled],
    )

    const definitionsMap = useMemo(
        () => new Map<string, WidgetDefinitionWithLayout>(activeDefinitions.map(def => [def.id, def])),
        [activeDefinitions],
    )

    const [layoutState, setLayoutState] = useState<WidgetBoardState>(() => buildDefaultState(activeDefinitions))

    useEffect(() => {
        const savedState = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
        if (savedState) {
            try {
                const parsed = hydrateStoragePayload(savedState)
                const items = (parsed.items || []).flatMap(item => {
                    const definition = definitionsMap.get(item.id as string)
                    if (!definition) return []
                    return [toBoardItem(definition, item)]
                })

                const hidden = (parsed.hidden || []).filter(id => definitionsMap.has(id)) as string[]
                const collapsed = (parsed.collapsed || []).filter(id => definitionsMap.has(id)) as string[]
                const sizeMemoryEntries = Object.entries(parsed.sizeMemory || {}).filter(([id]) => definitionsMap.has(id))
                const sizeMemory = Object.fromEntries(sizeMemoryEntries) as Partial<Record<string, number>>

                const missingItems = activeDefinitions
                    .filter(def => !hidden.includes(def.id) && !items.some(item => item.id === def.id))
                    .map(definition => toBoardItem(definition))

                const allItems = [...items, ...missingItems]
                const itemsWithCollapse = applyCollapsedState(allItems, collapsed, definitionsMap, sizeMemory)

                setLayoutState({
                    items: itemsWithCollapse,
                    hidden,
                    collapsed,
                    sizeMemory,
                })
                return
            } catch (e) {
                console.warn('Failed to parse saved widget layout', e)
            }
        }

        setLayoutState(buildDefaultState(activeDefinitions))
    }, [activeDefinitions, definitionsMap, storageKey])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handleResize = () => setLayoutPreset(getLayoutConfigForWidth(window.innerWidth, layoutSource.layoutByBreakpoint, breakpoints))
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [breakpoints, layoutSource.layoutByBreakpoint])

    useEffect(() => {
        let mounted = true
        if (!loadRemoteLayout) return undefined

        loadRemoteLayout().then(preset => {
            if (!mounted || !preset?.layoutByBreakpoint) return
            setLayoutSource(preset)
            const nextPreset = getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, preset.layoutByBreakpoint, breakpoints)
            const nextLayout = nextPreset.layout ?? Object.values(preset.layoutByBreakpoint)[0] ?? fallbackLayoutConfig
            setLayoutPreset(nextPreset)
            const nextDefinitions = withLayout(widgets, nextLayout)
            const nextActiveDefinitions = nextDefinitions.filter(def => (isWidgetEnabled ? isWidgetEnabled(def) : true))
            setLayoutState(buildDefaultState(nextActiveDefinitions))
        })

        return () => {
            mounted = false
        }
    }, [breakpoints, fallbackLayoutConfig, isWidgetEnabled, loadRemoteLayout, widgets])

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.setItem(storageKey, buildStoragePayload(layoutState))
            onLayoutPersist?.(layoutState)
        } catch {
            // ignore storage failures
        }
    }, [layoutState, onLayoutPersist, storageKey])

    const hideItem = useCallback(
        (id: string) => {
            setLayoutState(prev => ({
                ...prev,
                items: prev.items.filter(item => item.id !== id),
                hidden: prev.hidden.includes(id) ? prev.hidden : [...prev.hidden, id],
                collapsed: prev.collapsed.filter(col => col !== id),
                sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
            }))
        },
        [],
    )

    const restoreItem = useCallback(
        (id: string) => {
            const definition = definitionsMap.get(id)
            if (!definition) return
            setLayoutState(prev => ({
                ...prev,
                hidden: prev.hidden.filter(hiddenId => hiddenId !== id),
                items: [...prev.items, toBoardItem(definition)],
                collapsed: prev.collapsed.filter(col => col !== id),
                sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
            }))
        },
        [definitionsMap],
    )

    const resetLayout = useCallback(() => setLayoutState(buildDefaultState(activeDefinitions)), [activeDefinitions])

    const handleItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange'] = ({ detail }) => {
        setLayoutState(prev => ({
            ...prev,
            items: detail.items
                .map(item => {
                    const definition = definitionsMap.get(item.id as string)
                    if (!definition) return null
                    return toBoardItem(definition, item)
                })
                .filter(Boolean) as BoardProps.Item<WidgetBoardItemData>[],
        }))
    }

    const toggleCollapse = useCallback(
        (id: string) => {
            setLayoutState(prev => {
                const definition = definitionsMap.get(id)
                if (!definition) return prev

                const isCollapsed = prev.collapsed.includes(id)
                const nextCollapsed = isCollapsed ? prev.collapsed.filter(col => col !== id) : [...prev.collapsed, id]
                const sizeMemory = { ...prev.sizeMemory }

                const items = prev.items.map(item => {
                    if (item.id !== id) return item

                    if (isCollapsed) {
                        const restored = sizeMemory[id] ?? item.rowSpan ?? definition.layout.defaultSize.rowSpan ?? 2
                        delete sizeMemory[id]
                        return { ...item, rowSpan: restored }
                    }

                    sizeMemory[id] = item.rowSpan ?? definition.layout.defaultSize.rowSpan ?? 2
                    const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
                    return { ...item, rowSpan: minRows }
                })

                return { ...prev, items, collapsed: nextCollapsed, sizeMemory }
            })
        },
        [definitionsMap],
    )

    const restoreHidden = useCallback(() => {
        setLayoutState(prev => {
            if (prev.hidden.length === 0) return prev
            const hiddenSet = new Set(prev.hidden)
            const nextItems = [...prev.items]
            prev.hidden.forEach(id => {
                const def = definitionsMap.get(id)
                if (!def) return
                nextItems.push(toBoardItem(def))
            })
            const nextSizeMemory = Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => !hiddenSet.has(key)))
            return { ...prev, hidden: [], collapsed: prev.collapsed.filter(col => !hiddenSet.has(col)), sizeMemory: nextSizeMemory, items: nextItems }
        })
    }, [definitionsMap])

    useImperativeHandle(
        ref,
        () => ({
            resetLayout,
            restoreHidden,
        }),
        [resetLayout, restoreHidden],
    )

    const visibleItems = useMemo(
        () => layoutState.items.filter(item => definitionsMap.has(item.id as string)),
        [layoutState.items, definitionsMap],
    )

    const boardI18nStrings = useMemo(() => createBoardI18nStrings<WidgetBoardItemData>(item => item.data.title), [])

    const renderItem = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const widgetId = item.id as string
        const definition = definitionsMap.get(widgetId)
        if (!definition) return <></>

        const isCollapsed = layoutState.collapsed.includes(widgetId)

        const headerElement = (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    width: '100%',
                    height: '100%',
                }}
            >
                <Typography
                    component='h3'
                    sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: '24px',
                        color: 'rgba(78, 93, 120, 1)',
                    }}
                >
                    {definition.title}
                </Typography>
            </Box>
        )

        const settingsElement = (
            <Stack direction='row' spacing={0.5} alignItems='center'>
                <IconButton
                    aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
                    onClick={() => toggleCollapse(widgetId)}
                    size='small'
                    sx={{ color: 'rgba(78, 93, 120, 1)' }}
                >
                    {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
                </IconButton>
                <IconButton
                    aria-label='Hide widget'
                    onClick={() => hideItem(widgetId)}
                    size='small'
                    sx={{ color: 'rgba(78, 93, 120, 1)' }}
                >
                    <CloseIcon fontSize='small' />
                </IconButton>
            </Stack>
        )

        return (
            <BoardItem key={item.id} i18nStrings={boardItemI18nStrings} header={headerElement} settings={settingsElement} disableContentPaddings>
                <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {isCollapsed ? <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Collapsed</Typography> : definition.render()}
                </Box>
            </BoardItem>
        )
    }

    const controlsConfig = controls ?? {}
    const showControls = controlsConfig.hideReset !== true || (controlsConfig.hideRestore !== true && layoutState.hidden.length > 0)

    return (
        <CloudscapeThemeProvider>
            <CloudscapeBoardStyles hideNavigationArrows={hideNavigationArrows} />
            <Stack spacing={1.5} className={className}>
                {showControls && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent='space-between' spacing={1}>
                        <Typography variant='h6' fontWeight={700}>
                            {controlsConfig.title ?? 'Widgets layout'}
                        </Typography>
                        <Stack direction='row' spacing={1}>
                            {controlsConfig.hideReset !== true && (
                                <PneButton onClick={resetLayout} pneStyle='outlined' startIcon={<RestartAltIcon />}>
                                    {controlsConfig.resetLabel ?? 'Reset to default'}
                                </PneButton>
                            )}
                            {layoutState.hidden.length > 0 && controlsConfig.hideRestore !== true && (
                                <PneButton pneStyle='text' onClick={() => layoutState.hidden.forEach(restoreItem)}>
                                    {controlsConfig.restoreLabel ?? 'Restore hidden'}
                                </PneButton>
                            )}
                        </Stack>
                    </Stack>
                )}

                {layoutState.hidden.length > 0 && (
                    <Stack direction='row' spacing={1} flexWrap='wrap'>
                        {layoutState.hidden.map(id => (
                            <Chip key={id} variant='outlined' label={`Show ${definitionsMap.get(id)?.title ?? id}`} onClick={() => restoreItem(id)} size='small' />
                        ))}
                    </Stack>
                )}

                <Board<WidgetBoardItemData>
                    items={visibleItems}
                    renderItem={renderItem}
                    i18nStrings={boardI18nStrings}
                    onItemsChange={handleItemsChange}
                    empty={empty ?? <Box sx={{ p: 2, color: 'text.secondary' }}>No widgets available</Box>}
                />
            </Stack>
        </CloudscapeThemeProvider>
    )
})
