import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import Board, { type BoardProps } from '@cloudscape-design/board-components/board'
import BoardItem from '@cloudscape-design/board-components/board-item'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { CloudscapeBoardStyles } from '../cloudscape/CloudscapeBoardStyles'
import { CloudscapeThemeProvider } from '../cloudscape/CloudscapeThemeProvider'
import { boardItemI18nStrings, createBoardI18nStrings } from '../cloudscape/boardI18n'
import type {
    BreakpointLayoutConfig,
    WidgetBoardItemData,
    WidgetBoardLayoutOption,
    WidgetBoardProps,
    WidgetBoardState,
    WidgetDefinition,
    WidgetLayoutConfig,
    WidgetLayoutMemory,
    WidgetLayoutSnapshot,
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
        layoutMemory: {},
    }
}

const upsertLayoutMemory = (layoutMemory: WidgetLayoutMemory, breakpoint: number | string, id: string, snapshot: WidgetLayoutSnapshot): WidgetLayoutMemory => {
    const key = String(breakpoint)
    const next = { ...layoutMemory }
    const bucket = { ...(next[key] ?? {}) }
    bucket[id] = snapshot
    next[key] = bucket
    return next
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

type StoredLayoutState = {
    items: Array<Pick<BoardProps.Item<WidgetBoardItemData>, 'id' | 'columnSpan' | 'columnOffset' | 'rowSpan'>>
    hidden: string[]
    collapsed: string[]
    sizeMemory: Partial<Record<string, number>>
    layoutMemory?: WidgetLayoutMemory
}

type PersistedLayoutsState = {
    selectedLayoutId?: string
    layouts: Record<string, StoredLayoutState | string>
}

const buildStoragePayload = (state: WidgetBoardState): StoredLayoutState => ({
    items: state.items.map(({ id, columnSpan, columnOffset, rowSpan }) => ({ id, columnSpan, columnOffset, rowSpan })),
    hidden: state.hidden,
    collapsed: state.collapsed,
    sizeMemory: state.sizeMemory,
    layoutMemory: state.layoutMemory,
})

const hydrateStoragePayload = (raw: StoredLayoutState | string) => (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredLayoutState

const readPersistedLayouts = (storageKey: string): PersistedLayoutsState | null => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && 'layouts' in parsed) {
            const layouts = (parsed as PersistedLayoutsState).layouts ?? {}
            const selectedLayoutId = (parsed as PersistedLayoutsState).selectedLayoutId
            return { layouts, selectedLayoutId }
        }

        if (parsed && typeof parsed === 'object' && 'items' in parsed) {
            return {
                layouts: { __legacy: parsed as StoredLayoutState },
                selectedLayoutId: '__legacy',
            }
        }
    } catch {
        // ignore corrupt storage payloads
    }

    return null
}

const buildLayoutOptions = (
    options: WidgetBoardLayoutOption[] | undefined,
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
): WidgetBoardLayoutOption[] => {
    if (options?.length) {
        return options.map(option => ({
            ...option,
            preset: option.preset ?? {
                layoutByBreakpoint,
                source: 'static' as const,
            },
        }))
    }

    return [
        {
            id: 'default',
            name: 'Default layout',
            preset: {
                layoutByBreakpoint,
                source: 'static' as const,
            },
        },
    ]
}

const layoutOptionsEqual = (a: WidgetBoardLayoutOption[], b: WidgetBoardLayoutOption[]) =>
    a.length === b.length && a.every((option, index) => option.id === b[index]?.id && option.name === b[index]?.name && option.preset === b[index]?.preset)

export const WidgetBoard = forwardRef<WidgetBoardHandle, WidgetBoardProps>(function WidgetBoard(
    {
        widgets,
        layoutByBreakpoint,
        breakpoints: customBreakpoints,
        storageKey = 'pne-widget-board-layout',
        loadLayouts,
        layouts,
        empty,
        hideNavigationArrows = true,
        onLayoutPersist,
        isWidgetEnabled,
        className,
    },
    ref,
) {
    const initialPersistedLayouts = typeof window !== 'undefined' ? readPersistedLayouts(storageKey) : null
    const persistedLayoutsRef = useRef<PersistedLayoutsState>(initialPersistedLayouts ?? { layouts: {} })

    const [layoutOptions, setLayoutOptions] = useState<WidgetBoardLayoutOption[]>(() => buildLayoutOptions(layouts?.options, layoutByBreakpoint))

    useEffect(() => {
        if (loadLayouts) return
        const nextOptions = buildLayoutOptions(layouts?.options, layoutByBreakpoint)
        setLayoutOptions(prev => (layoutOptionsEqual(prev, nextOptions) ? prev : nextOptions))
    }, [layoutByBreakpoint, layouts?.options, loadLayouts])

    const layoutOptionsMap = useMemo(() => new Map(layoutOptions.map(option => [option.id, option])), [layoutOptions])

    const initialLayoutId = useMemo(() => {
        const fromLayouts = layouts?.selectedId
        if (fromLayouts && layoutOptionsMap.has(fromLayouts)) return fromLayouts
        const persistedId = persistedLayoutsRef.current.selectedLayoutId
        if (persistedId && layoutOptionsMap.has(persistedId)) return persistedId
        if (layouts?.initialSelectedId && layoutOptionsMap.has(layouts.initialSelectedId)) return layouts.initialSelectedId
        return layoutOptions[0]?.id
    }, [layoutOptions, layoutOptionsMap, layouts?.initialSelectedId, layouts?.selectedId])

    const [layoutSource, setLayoutSource] = useState<WidgetLayoutPreset>(() => ({
        ...(layoutOptionsMap.get(initialLayoutId ?? '')?.preset ?? { layoutByBreakpoint, source: 'static' as const }),
    }))

    const breakpoints = useMemo(
        () => customBreakpoints ?? Object.keys(layoutSource.layoutByBreakpoint).map(Number).sort((a, b) => a - b),
        [customBreakpoints, layoutSource.layoutByBreakpoint],
    )

    const [layoutPreset, setLayoutPreset] = useState(() =>
        getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource.layoutByBreakpoint, breakpoints),
    )

    useEffect(() => {
        setLayoutPreset(getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource.layoutByBreakpoint, breakpoints))
    }, [breakpoints, layoutSource.layoutByBreakpoint])

    const currentBreakpointKey = useMemo(
        () => String(layoutPreset.breakpoint ?? breakpoints[0]),
        [breakpoints, layoutPreset.breakpoint],
    )

    const [selectedLayoutId, setSelectedLayoutId] = useState(initialLayoutId)
    const selectedLayoutRef = useRef<string | undefined>(initialLayoutId)

    useEffect(() => {
        selectedLayoutRef.current = selectedLayoutId
    }, [selectedLayoutId])

    useEffect(() => {
        if (!selectedLayoutId || layoutOptionsMap.has(selectedLayoutId)) return
        const fallbackId = layoutOptions[0]?.id
        if (fallbackId && fallbackId !== selectedLayoutId) {
            setSelectedLayoutId(fallbackId)
            layouts?.onSelect?.(fallbackId)
        }
    }, [layoutOptions, layoutOptionsMap, layouts?.onSelect, selectedLayoutId])

    useEffect(() => {
        const externalSelected = layouts?.selectedId
        if (!externalSelected) return
        if (!layoutOptionsMap.has(externalSelected)) return
        if (externalSelected !== selectedLayoutId) {
            setSelectedLayoutId(externalSelected)
        }
    }, [layoutOptionsMap, layouts?.selectedId, selectedLayoutId])

    useEffect(() => {
        if (!selectedLayoutId || !layouts?.onSelect) return
        if (layouts.selectedId === selectedLayoutId) return
        layouts.onSelect(selectedLayoutId)
    }, [layouts?.onSelect, layouts?.selectedId, selectedLayoutId])

    useEffect(() => {
        const nextSource = layoutOptionsMap.get(selectedLayoutId ?? '')?.preset ?? {
            layoutByBreakpoint,
            source: 'static' as const,
        }
        setLayoutSource(prev => (prev === nextSource ? prev : nextSource))
    }, [layoutByBreakpoint, layoutOptionsMap, selectedLayoutId])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const nextPersisted = readPersistedLayouts(storageKey) ?? { layouts: {} }
        persistedLayoutsRef.current = nextPersisted
        if (
            nextPersisted.selectedLayoutId &&
            layoutOptionsMap.has(nextPersisted.selectedLayoutId) &&
            nextPersisted.selectedLayoutId !== selectedLayoutId
        ) {
            setSelectedLayoutId(nextPersisted.selectedLayoutId)
        }
    }, [layoutOptionsMap, selectedLayoutId, storageKey])

    useEffect(() => {
        let cancelled = false
        if (!loadLayouts) return undefined

        loadLayouts().then(result => {
            if (cancelled || !result?.options) return
            const nextOptions = buildLayoutOptions(result.options, layoutByBreakpoint)
            setLayoutOptions(prev => (layoutOptionsEqual(prev, nextOptions) ? prev : nextOptions))

            const currentSelected = selectedLayoutRef.current
            let nextSelected = currentSelected && nextOptions.some(option => option.id === currentSelected) ? currentSelected : undefined

            if (result.selectedId && nextOptions.some(option => option.id === result.selectedId)) {
                nextSelected = result.selectedId
            } else if (!nextSelected) {
                nextSelected = nextOptions[0]?.id
            }

            if (nextSelected && nextSelected !== currentSelected) {
                setSelectedLayoutId(nextSelected)
                layouts?.onSelect?.(nextSelected)
            } else if (!currentSelected && nextSelected) {
                setSelectedLayoutId(nextSelected)
            }
        })

        return () => {
            cancelled = true
        }
    }, [layoutByBreakpoint, loadLayouts, layouts?.onSelect])

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
        const storagePayload =
            (selectedLayoutId && persistedLayoutsRef.current.layouts[selectedLayoutId]) ??
            persistedLayoutsRef.current.layouts.__legacy

        if (storagePayload) {
            try {
                const parsed = hydrateStoragePayload(storagePayload)
                const items = (parsed.items || []).flatMap(item => {
                    const definition = definitionsMap.get(item.id as string)
                    if (!definition) return []
                    return [toBoardItem(definition, item)]
                })

                const hidden = (parsed.hidden || []).filter(id => definitionsMap.has(id)) as string[]
                const collapsed = (parsed.collapsed || []).filter(id => definitionsMap.has(id)) as string[]
                const sizeMemoryEntries = Object.entries(parsed.sizeMemory || {}).filter(([id]) => definitionsMap.has(id))
                const sizeMemory = Object.fromEntries(sizeMemoryEntries) as Partial<Record<string, number>>
                const layoutMemory = parsed.layoutMemory ?? {}

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
                    layoutMemory,
                })
                return
            } catch (e) {
                console.warn('Failed to parse saved widget layout', e)
            }
        }

        setLayoutState(buildDefaultState(activeDefinitions))
    }, [activeDefinitions, definitionsMap, selectedLayoutId])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handleResize = () => setLayoutPreset(getLayoutConfigForWidth(window.innerWidth, layoutSource.layoutByBreakpoint, breakpoints))
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [breakpoints, layoutSource.layoutByBreakpoint])

    useEffect(() => {
        if (typeof window === 'undefined' || !selectedLayoutId) return
        try {
            const payload = buildStoragePayload(layoutState)
            const nextPersisted = {
                ...persistedLayoutsRef.current,
                selectedLayoutId,
                layouts: {
                    ...persistedLayoutsRef.current.layouts,
                    [selectedLayoutId]: payload,
                },
            }
            persistedLayoutsRef.current = nextPersisted

            window.localStorage.setItem(storageKey, JSON.stringify(nextPersisted))
            onLayoutPersist?.(layoutState)
        } catch {
            // ignore storage failures
        }
    }, [layoutState, onLayoutPersist, selectedLayoutId, storageKey])

    const hideItem = useCallback(
        (id: string) => {
            setLayoutState(prev => {
                const definition = definitionsMap.get(id)
                if (!definition) return prev

                const index = prev.items.findIndex(item => item.id === id)
                const item = index >= 0 ? prev.items[index] : undefined
                const snapshot: WidgetLayoutSnapshot = {
                    columnSpan: item?.columnSpan ?? definition.layout.defaultSize.columnSpan,
                    rowSpan: item?.rowSpan ?? definition.layout.defaultSize.rowSpan,
                    columnOffset: item?.columnOffset ?? definition.layout.defaultSize.columnOffset,
                    order: index >= 0 ? index : prev.items.length,
                }

                const layoutMemory = upsertLayoutMemory(prev.layoutMemory, currentBreakpointKey, id, snapshot)

                return {
                    ...prev,
                    layoutMemory,
                    items: prev.items.filter(boardItem => boardItem.id !== id),
                    hidden: prev.hidden.includes(id) ? prev.hidden : [...prev.hidden, id],
                    collapsed: prev.collapsed.filter(col => col !== id),
                    sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
                }
            })
        },
        [currentBreakpointKey, definitionsMap],
    )

    const restoreItem = useCallback(
        (id: string) => {
            const definition = definitionsMap.get(id)
            if (!definition) return
            setLayoutState(prev => {
                const snapshot = prev.layoutMemory?.[currentBreakpointKey]?.[id]
                const restoredItem = snapshot ? toBoardItem(definition, snapshot) : toBoardItem(definition)
                const targetOrder = snapshot?.order ?? prev.items.length
                const nextItems = [...prev.items]
                nextItems.splice(Math.min(Math.max(targetOrder, 0), nextItems.length), 0, restoredItem)

                return {
                    ...prev,
                    hidden: prev.hidden.filter(hiddenId => hiddenId !== id),
                    items: nextItems,
                    collapsed: prev.collapsed.filter(col => col !== id),
                    sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
                }
            })
        },
        [currentBreakpointKey, definitionsMap],
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
            const restoredWithOrder: Array<{ order: number; hiddenIndex: number; item: BoardProps.Item<WidgetBoardItemData> }> = prev.hidden.flatMap(
                (id, hiddenIndex) => {
                    const def = definitionsMap.get(id)
                    if (!def) return []
                    const snapshot = prev.layoutMemory?.[currentBreakpointKey]?.[id]
                    const item = snapshot ? toBoardItem(def, snapshot) : toBoardItem(def)
                    const order = snapshot?.order ?? prev.items.length + hiddenIndex
                    return [{ order, hiddenIndex, item }]
                },
            )

            const nextItems = [...prev.items]
            restoredWithOrder
                .sort((a, b) => a.order - b.order || a.hiddenIndex - b.hiddenIndex)
                .reverse()
                .forEach(({ order, item }) => {
                    const target = Math.min(Math.max(order, 0), nextItems.length)
                    nextItems.splice(target, 0, item)
                })

            const nextSizeMemory = Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => !hiddenSet.has(key)))

            return {
                ...prev,
                hidden: [],
                collapsed: prev.collapsed.filter(col => !hiddenSet.has(col)),
                sizeMemory: nextSizeMemory,
                items: nextItems,
            }
        })
    }, [currentBreakpointKey, definitionsMap])

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

    return (
        <CloudscapeThemeProvider>
            <CloudscapeBoardStyles hideNavigationArrows={hideNavigationArrows} />
            <Box className={className}>
                <Board<WidgetBoardItemData>
                    items={visibleItems}
                    renderItem={renderItem}
                    i18nStrings={boardI18nStrings}
                    onItemsChange={handleItemsChange}
                    empty={empty ?? <Box sx={{ p: 2, color: 'text.secondary' }}>No widgets available</Box>}
                />
            </Box>
        </CloudscapeThemeProvider>
    )
})
