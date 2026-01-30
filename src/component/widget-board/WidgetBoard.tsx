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
import { buildPresetFromState } from './layoutPersistence'
import { setWidgetLayoutsPanelBridge } from './widgetLayoutsPanelStore'
import { WidgetBoardSkeleton } from './WidgetBoardSkeleton'
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
} from './types'

export type WidgetBoardHandle = {
    resetLayout: () => void
    restoreHidden: () => void
}

type WidgetDefinitionWithLayout = WidgetDefinition & { layout: WidgetLayoutConfig }

const fallbackLayout: WidgetLayoutConfig = { defaultSize: { columnSpan: 1, rowSpan: 2 } }
const createLayoutId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `layout-${Date.now()}`
}

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

const buildLayoutOptions = (
    options: WidgetBoardLayoutOption[] | undefined,
    fallback: WidgetBoardLayoutOption,
): WidgetBoardLayoutOption[] => {
    if (options?.length) {
        return options.map(option => ({
            ...option,
            layoutByBreakpoint: option.layoutByBreakpoint ?? fallback.layoutByBreakpoint,
        }))
    }

    return [fallback]
}

const layoutOptionsEqual = (a: WidgetBoardLayoutOption[], b: WidgetBoardLayoutOption[]) =>
    a.length === b.length &&
    a.every((option, index) => option.id === b[index]?.id && option.name === b[index]?.name && option.layoutByBreakpoint === b[index]?.layoutByBreakpoint)

export const WidgetBoard = forwardRef<WidgetBoardHandle, WidgetBoardProps>(function WidgetBoard(
    {
        widgets,
        layoutByBreakpoint,
        loadLayouts,
        saveLayouts,
    },
    ref,
) {
    const defaultOption = useMemo<WidgetBoardLayoutOption>(
        () => ({
            id: 'default',
            name: 'Default layout',
            layoutByBreakpoint,
        }),
        [layoutByBreakpoint],
    )

    const initialOptions = useMemo(() => buildLayoutOptions(undefined, defaultOption), [defaultOption])
    const [layoutOptions, setLayoutOptions] = useState<WidgetBoardLayoutOption[]>(initialOptions)
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | undefined>(initialOptions[0]?.id)
    const selectedLayoutRef = useRef<string | undefined>(initialOptions[0]?.id)
    const lockedLayoutIdRef = useRef<string | undefined>(defaultOption.id)
    const loadRequestIdRef = useRef(0)
    const [isLoadingLayouts, setIsLoadingLayouts] = useState(true)

    useEffect(() => {
        selectedLayoutRef.current = selectedLayoutId
    }, [selectedLayoutId])

    const layoutOptionsMap = useMemo(() => new Map(layoutOptions.map(option => [option.id, option])), [layoutOptions])

    useEffect(() => {
        if (!selectedLayoutId || layoutOptionsMap.has(selectedLayoutId)) return
        const fallbackId = layoutOptions[0]?.id
        if (fallbackId && fallbackId !== selectedLayoutId) {
            setSelectedLayoutId(fallbackId)
        }
    }, [layoutOptions, layoutOptionsMap, selectedLayoutId])

    const [layoutSource, setLayoutSource] = useState<Record<number | string, BreakpointLayoutConfig>>(
        () => layoutOptionsMap.get(selectedLayoutId ?? '')?.layoutByBreakpoint ?? defaultOption.layoutByBreakpoint,
    )

    const breakpoints = useMemo(() => Object.keys(layoutSource).map(Number).sort((a, b) => a - b), [layoutSource])

    const [layoutPreset, setLayoutPreset] = useState(() =>
        getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource, breakpoints),
    )

    useEffect(() => {
        setLayoutPreset(getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource, breakpoints))
    }, [breakpoints, layoutSource])

    const currentBreakpointKey = useMemo(
        () => String(layoutPreset.breakpoint ?? breakpoints[0]),
        [breakpoints, layoutPreset.breakpoint],
    )

    useEffect(() => {
        const nextSource = layoutOptionsMap.get(selectedLayoutId ?? '')?.layoutByBreakpoint ?? defaultOption.layoutByBreakpoint
        setLayoutSource(prev => (prev === nextSource ? prev : nextSource))
    }, [defaultOption.layoutByBreakpoint, layoutOptionsMap, selectedLayoutId])

    useEffect(() => {
        let cancelled = false

        const requestId = ++loadRequestIdRef.current
        setIsLoadingLayouts(true)
        loadLayouts()
            .then(result => {
                if (cancelled || loadRequestIdRef.current !== requestId || !result?.options) return
                const nextOptions = buildLayoutOptions(result.options, defaultOption)
                setLayoutOptions(prev => (layoutOptionsEqual(prev, nextOptions) ? prev : nextOptions))
                lockedLayoutIdRef.current = defaultOption.id

                const currentSelected = selectedLayoutRef.current
                let nextSelected = currentSelected && nextOptions.some(option => option.id === currentSelected) ? currentSelected : undefined

                if (result.selectedId && nextOptions.some(option => option.id === result.selectedId)) {
                    nextSelected = result.selectedId
                } else if (!nextSelected) {
                    nextSelected = nextOptions[0]?.id
                }

                const nextOptionsMap = new Map(nextOptions.map(option => [option.id, option]))
                const nextLayoutSource = nextOptionsMap.get(nextSelected ?? '')?.layoutByBreakpoint ?? defaultOption.layoutByBreakpoint
                const nextBreakpoints = Object.keys(nextLayoutSource)
                    .map(Number)
                    .sort((a, b) => a - b)
                const nextPreset = getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, nextLayoutSource, nextBreakpoints)
                const fallbackForNext = nextLayoutSource[nextBreakpoints[0]] ?? Object.values(nextLayoutSource)[0] ?? { columns: 12, widgets: {} }
                const nextDefinitions = withLayout(widgets, nextPreset.layout ?? fallbackForNext)

                setLayoutSource(prev => (prev === nextLayoutSource ? prev : nextLayoutSource))
                setLayoutPreset(nextPreset)
                setLayoutState(buildDefaultState(nextDefinitions))

                if (nextSelected && nextSelected !== currentSelected) {
                    setSelectedLayoutId(nextSelected)
                } else if (!currentSelected && nextSelected) {
                    setSelectedLayoutId(nextSelected)
                }
            })
            .catch(error => {
                console.warn('Failed to load widget layouts', error)
            })
            .finally(() => {
                if (cancelled || loadRequestIdRef.current !== requestId) return
                setIsLoadingLayouts(false)
            })

        return () => {
            cancelled = true
        }
    }, [defaultOption, loadLayouts])

    const fallbackLayoutConfig = useMemo(() => {
        const firstKey = breakpoints[0]
        return layoutSource[firstKey] ?? Object.values(layoutSource)[0]
    }, [breakpoints, layoutSource])

    const definitionsWithLayout = useMemo(
        () => withLayout(widgets, layoutPreset.layout ?? fallbackLayoutConfig ?? { columns: 12, widgets: {} }),
        [fallbackLayoutConfig, layoutPreset.layout, widgets],
    )

    const definitionsMap = useMemo(
        () => new Map<string, WidgetDefinitionWithLayout>(definitionsWithLayout.map(def => [def.id, def])),
        [definitionsWithLayout],
    )

    const [layoutState, setLayoutState] = useState<WidgetBoardState>(() => buildDefaultState(definitionsWithLayout))

    useEffect(() => {
        setLayoutState(buildDefaultState(definitionsWithLayout))
    }, [definitionsWithLayout])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handleResize = () => setLayoutPreset(getLayoutConfigForWidth(window.innerWidth, layoutSource, breakpoints))
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [breakpoints, layoutSource])

    const ensureSelected = useCallback(
        (options: WidgetBoardLayoutOption[], candidate?: string) => {
            if (candidate && options.some(option => option.id === candidate)) return candidate
            return options[0]?.id
        },
        [],
    )

    const buildCurrentPreset = useCallback(
        () => buildPresetFromState(layoutState, layoutSource, breakpoints),
        [breakpoints, layoutSource, layoutState],
    )

    const selectLayout = useCallback(
        (id: string) => {
            if (!id || id === selectedLayoutId || !layoutOptionsMap.has(id)) return
            setSelectedLayoutId(id)
            saveLayouts(layoutOptions, id)
        },
        [layoutOptions, layoutOptionsMap, saveLayouts, selectedLayoutId],
    )

    const addLayout = useCallback(
        (name: string) => {
            const layoutByBreakpoint = buildCurrentPreset()
            const option: WidgetBoardLayoutOption = {
                id: createLayoutId(),
                name: name.trim() || 'Custom layout',
                layoutByBreakpoint,
            }
            const nextOptions = [...layoutOptions, option]
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(option.id)
            saveLayouts(nextOptions, option.id)
        },
        [buildCurrentPreset, layoutOptions, saveLayouts],
    )

    const updateLayout = useCallback(
        (id: string) => {
            if (!layoutOptionsMap.has(id)) return
            if (lockedLayoutIdRef.current && id === lockedLayoutIdRef.current) return
            const layoutByBreakpoint = buildCurrentPreset()
            const nextOptions = layoutOptions.map(option => (option.id === id ? { ...option, layoutByBreakpoint } : option))
            setLayoutOptions(nextOptions)
            saveLayouts(nextOptions, selectedLayoutId)
        },
        [buildCurrentPreset, layoutOptions, layoutOptionsMap, saveLayouts, selectedLayoutId],
    )

    const deleteLayout = useCallback(
        (id: string) => {
            if (!layoutOptionsMap.has(id)) return
            if (lockedLayoutIdRef.current && id === lockedLayoutIdRef.current) return
            const nextOptions = layoutOptions.filter(option => option.id !== id)
            const nextSelected = id === selectedLayoutId ? ensureSelected(nextOptions) : selectedLayoutId
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(nextSelected)
            saveLayouts(nextOptions, nextSelected)
        },
        [ensureSelected, layoutOptions, layoutOptionsMap, saveLayouts, selectedLayoutId],
    )

    useEffect(() => {
        const panelProps = {
            items: layoutOptions,
            selectedId: selectedLayoutId,
            onSelect: selectLayout,
            onAdd: addLayout,
            onUpdate: updateLayout,
            onDelete: deleteLayout,
            lockedIds: lockedLayoutIdRef.current ? [lockedLayoutIdRef.current] : [],
        }
        setWidgetLayoutsPanelBridge(panelProps)
        return () => {
            setWidgetLayoutsPanelBridge(null)
        }
    }, [addLayout, deleteLayout, layoutOptions, selectLayout, selectedLayoutId, updateLayout])

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

    const resetLayout = useCallback(() => setLayoutState(buildDefaultState(definitionsWithLayout)), [definitionsWithLayout])

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
                {definition.settingsActions}
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

    const boardElement = (
        <Board<WidgetBoardItemData>
            items={visibleItems}
            renderItem={renderItem}
            i18nStrings={boardI18nStrings}
            onItemsChange={handleItemsChange}
            empty={<Box sx={{ p: 2, color: 'text.secondary' }}>No widgets available</Box>}
        />
    )

    return (
        <CloudscapeThemeProvider>
            <CloudscapeBoardStyles hideNavigationArrows />
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoadingLayouts ? <WidgetBoardSkeleton /> : boardElement}
            </Box>
        </CloudscapeThemeProvider>
    )
})
