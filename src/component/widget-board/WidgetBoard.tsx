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
    WidgetHeightMode,
    WidgetHeightModeMemory,
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

const DEFAULT_ROW_HEIGHT = 96
const DEFAULT_ROW_GAP = 20
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

const buildDefaultState = (definitions: WidgetDefinitionWithLayout[], breakpointKey: string): WidgetBoardState => {
    const hidden = definitions.filter(def => def.layout.initialState?.isHidden).map(def => def.id)
    const collapsed = definitions.filter(def => def.layout.initialState?.isCollapsed).map(def => def.id)
    const sizeMemory: Partial<Record<string, number>> = {}
    const definitionsMap = new Map<string, WidgetDefinitionWithLayout>(definitions.map(def => [def.id, def]))
    const heightModeById: Partial<Record<string, WidgetHeightMode>> = Object.fromEntries(
        definitions.map(def => [def.id, def.layout.heightMode ?? 'auto']),
    )
    const heightModeMemory: WidgetHeightModeMemory = { [breakpointKey]: heightModeById }

    const items = definitions.filter(def => !hidden.includes(def.id)).map(def => toBoardItem(def))
    const collapsedItems = applyCollapsedState(items, collapsed, definitionsMap, sizeMemory)

    return {
        items: collapsedItems,
        hidden,
        collapsed,
        sizeMemory,
        layoutMemory: {},
        heightModeMemory,
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
                const nextBreakpointKey = String(nextPreset.breakpoint ?? nextBreakpoints[0])
                const fallbackForNext = nextLayoutSource[nextBreakpoints[0]] ?? Object.values(nextLayoutSource)[0] ?? { widgets: {} }
                const nextDefinitions = withLayout(widgets, nextPreset.layout ?? fallbackForNext)

                setLayoutSource(prev => (prev === nextLayoutSource ? prev : nextLayoutSource))
                setLayoutPreset(nextPreset)
                setLayoutState(buildDefaultState(nextDefinitions, nextBreakpointKey))

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
        () => withLayout(widgets, layoutPreset.layout ?? fallbackLayoutConfig ?? { widgets: {} }),
        [fallbackLayoutConfig, layoutPreset.layout, widgets],
    )

    const definitionsMap = useMemo(
        () => new Map<string, WidgetDefinitionWithLayout>(definitionsWithLayout.map(def => [def.id, def])),
        [definitionsWithLayout],
    )

    const [layoutState, setLayoutState] = useState<WidgetBoardState>(() => buildDefaultState(definitionsWithLayout, currentBreakpointKey))
    const boardRootRef = useRef<HTMLDivElement | null>(null)
    const gridMetricsRef = useRef<{ rowHeight: number; rowGap: number } | null>(null)
    const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const measuredRowsRef = useRef<Record<string, number>>({})

    useEffect(() => {
        measuredRowsRef.current = {}
        setLayoutState(buildDefaultState(definitionsWithLayout, currentBreakpointKey))
    }, [currentBreakpointKey, definitionsWithLayout])

    const parseCssNumber = useCallback((value: string | null) => {
        if (!value) return Number.NaN
        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed) ? parsed : Number.NaN
    }, [])

    const findGridElement = useCallback((root: HTMLElement) => {
        const boardRoot = root.querySelector<HTMLElement>('[data-awsui-board]') ?? root
        const boardStyle = window.getComputedStyle(boardRoot)
        if (boardStyle.display === 'grid' && boardStyle.gridAutoRows && boardStyle.gridAutoRows !== 'auto') {
            return boardRoot
        }

        const preferred = boardRoot.querySelectorAll<HTMLElement>('[class*="awsui_grid_"]')
        const candidates = preferred.length ? preferred : boardRoot.querySelectorAll<HTMLElement>('div')
        for (const element of candidates) {
            if (element !== boardRoot && element.closest('[data-awsui-board-item]')) continue
            const className = typeof element.className === 'string' ? element.className : ''
            if (className.includes('grid__item')) continue
            const style = window.getComputedStyle(element)
            if (style.display === 'grid' && style.gridAutoRows && style.gridAutoRows !== 'auto') {
                return element
            }
        }
        return null
    }, [])

    const updateGridMetrics = useCallback(() => {
        if (typeof window === 'undefined') return gridMetricsRef.current
        const root = boardRootRef.current
        if (!root) return gridMetricsRef.current
        const grid = findGridElement(root)
        if (!grid) return gridMetricsRef.current
        const style = window.getComputedStyle(grid)
        const rowHeight = parseCssNumber(style.gridAutoRows)
        const rowGapValue = parseCssNumber(style.rowGap)
        const gapValue = parseCssNumber(style.gap)
        const rowGap = Number.isFinite(rowGapValue) ? rowGapValue : Number.isFinite(gapValue) ? gapValue : DEFAULT_ROW_GAP
        if (!Number.isFinite(rowHeight) || rowHeight <= 0) return gridMetricsRef.current
        const next = { rowHeight, rowGap }
        gridMetricsRef.current = next
        return next
    }, [findGridElement, parseCssNumber])

    const computeRequiredRows = useCallback(
        (widgetId: string, contentElement: HTMLDivElement) => {
            if (!contentElement.isConnected) return null
            const metrics = updateGridMetrics() ?? { rowHeight: DEFAULT_ROW_HEIGHT, rowGap: DEFAULT_ROW_GAP }
            const containerRoot =
                (contentElement.closest('[data-awsui-board-item]') as HTMLElement | null) ??
                (contentElement.closest('[class*="container-override"]') as HTMLElement | null)
            if (!containerRoot) return null

            const containerRect = containerRoot.getBoundingClientRect()
            const contentRect = contentElement.getBoundingClientRect()
            const offsetTop = contentRect.top - containerRect.top
            const contentHeight = contentElement.scrollHeight

            if (!Number.isFinite(offsetTop) || !Number.isFinite(contentHeight) || contentHeight <= 0) return null

            const requiredPx = offsetTop + contentHeight
            const rows = Math.ceil((requiredPx + metrics.rowGap) / (metrics.rowHeight + metrics.rowGap))
            return rows
        },
        [updateGridMetrics],
    )

    const applyAutoSize = useCallback(
        (widgetId: string, requiredRows: number) => {
            setLayoutState(prev => {
                const definition = definitionsMap.get(widgetId)
                if (!definition) return prev
                if (prev.collapsed.includes(widgetId)) return prev

                const heightMode = prev.heightModeMemory[currentBreakpointKey]?.[widgetId] ?? definition.layout.heightMode ?? 'auto'
                if (heightMode !== 'auto') return prev

                const index = prev.items.findIndex(item => item.id === widgetId)
                if (index < 0) return prev

                const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
                const nextRows = Math.max(minRows, requiredRows)
                const currentItem = prev.items[index]
                if (currentItem.rowSpan === nextRows) return prev

                const nextItems = [...prev.items]
                nextItems[index] = { ...currentItem, rowSpan: nextRows }
                return { ...prev, items: nextItems }
            })
        },
        [currentBreakpointKey, definitionsMap],
    )

    const handleContentResize = useCallback(
        (widgetId: string, contentElement: HTMLDivElement) => {
            const requiredRows = computeRequiredRows(widgetId, contentElement)
            if (!requiredRows) return
            measuredRowsRef.current[widgetId] = requiredRows
            applyAutoSize(widgetId, requiredRows)
        },
        [applyAutoSize, computeRequiredRows],
    )

    const handleContentRef = useCallback(
        (widgetId: string, node: HTMLDivElement | null) => {
            const map = contentRefs.current
            const observer = resizeObserverRef.current
            const prev = map.get(widgetId)
            if (prev === node) return

            if (prev && observer) {
                observer.unobserve(prev)
            }

            if (!node) {
                map.delete(widgetId)
                return
            }

            map.set(widgetId, node)
            if (observer) {
                observer.observe(node)
            }
            requestAnimationFrame(() => handleContentResize(widgetId, node))
        },
        [handleContentResize],
    )

    useEffect(() => {
        if (typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const target = entry.target as HTMLDivElement
                const widgetId = target.dataset.widgetId
                if (!widgetId) return
                handleContentResize(widgetId, target)
            })
        })
        resizeObserverRef.current = observer
        contentRefs.current.forEach(element => observer.observe(element))
        return () => {
            observer.disconnect()
            resizeObserverRef.current = null
        }
    }, [handleContentResize])

    useEffect(() => {
        updateGridMetrics()
        contentRefs.current.forEach((element, widgetId) => {
            handleContentResize(widgetId, element)
        })
    }, [handleContentResize, layoutPreset.breakpoint, updateGridMetrics])

    useEffect(() => {
        if (typeof window === 'undefined') return
        let frameId: number | null = null
        const run = () => {
            frameId = null
            updateGridMetrics()
            contentRefs.current.forEach((element, widgetId) => {
                handleContentResize(widgetId, element)
            })
            setLayoutPreset(getLayoutConfigForWidth(window.innerWidth, layoutSource, breakpoints))
        }
        const handleResize = () => {
            if (frameId !== null) return
            frameId = window.requestAnimationFrame(run)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId)
            }
        }
    }, [breakpoints, handleContentResize, layoutSource, updateGridMetrics])

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

    const resetLayout = useCallback(
        () => setLayoutState(buildDefaultState(definitionsWithLayout, currentBreakpointKey)),
        [currentBreakpointKey, definitionsWithLayout],
    )

    const handleItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange'] = ({ detail }) => {
        setLayoutState(prev => {
            const nextHeightModeMemory: WidgetHeightModeMemory = { ...prev.heightModeMemory }
            const nextHeightModeById: Partial<Record<string, WidgetHeightMode>> = {
                ...(nextHeightModeMemory[currentBreakpointKey] ?? {}),
            }
            const nextItems = detail.items
                .map(item => {
                    const definition = definitionsMap.get(item.id as string)
                    if (!definition) return null

                    const widgetId = item.id as string
                    const prevItem = prev.items.find(prevItem => prevItem.id === widgetId)
                    const prevRowSpan = prevItem?.rowSpan ?? definition.layout.defaultSize.rowSpan
                    const nextRowSpan = item.rowSpan ?? prevRowSpan

                    if (prevRowSpan !== nextRowSpan) {
                        const requiredRows = measuredRowsRef.current[widgetId]
                        if (requiredRows) {
                            if (nextRowSpan < requiredRows) {
                                nextHeightModeById[widgetId] = 'fixed'
                            } else {
                                nextHeightModeById[widgetId] = 'auto'
                            }
                        }
                    }

                    return toBoardItem(definition, item)
                })
                .filter(Boolean) as BoardProps.Item<WidgetBoardItemData>[]

            nextHeightModeMemory[currentBreakpointKey] = nextHeightModeById
            return { ...prev, items: nextItems, heightModeMemory: nextHeightModeMemory }
        })
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

        const heightMode = layoutState.heightModeMemory[currentBreakpointKey]?.[widgetId] ?? definition.layout.heightMode ?? 'auto'
        const contentOverflow = heightMode === 'fixed' ? 'auto' : 'hidden'

        return (
            <BoardItem key={item.id} i18nStrings={boardItemI18nStrings} header={headerElement} settings={settingsElement} disableContentPaddings>
                <Box sx={{ height: '100%', boxSizing: 'border-box', overflow: contentOverflow }}>
                    <Box
                        ref={(node: HTMLDivElement | null) => handleContentRef(widgetId, node)}
                        data-widget-id={widgetId}
                        sx={{ p: 2, boxSizing: 'border-box' }}
                    >
                        {isCollapsed ? <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Collapsed</Typography> : definition.render()}
                    </Box>
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
            <Box ref={boardRootRef} sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoadingLayouts ? <WidgetBoardSkeleton /> : boardElement}
            </Box>
        </CloudscapeThemeProvider>
    )
})
