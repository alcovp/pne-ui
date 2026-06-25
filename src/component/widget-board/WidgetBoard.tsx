import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import { buildPresetFromState } from './layoutPersistence'
import { useWidgetBoardAutosize } from './useWidgetBoardAutosize'
import { useWidgetBoardInteractionLock } from './useWidgetBoardInteractionLock'
import { useWidgetBoardLayoutActions } from './useWidgetBoardLayoutActions'
import { useWidgetBoardLayoutSource } from './useWidgetBoardLayoutSource'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import { useWidgetBoardStateActions } from './useWidgetBoardStateActions'
import { WidgetBoardCloudscapeEngine } from './WidgetBoardCloudscapeEngine'
import { WidgetBoardItem } from './WidgetBoardItem'
import { WidgetBoardReactGridLayoutEngine, WidgetBoardReactGridLayoutItem } from './WidgetBoardReactGridLayoutEngine'
import {
    buildDefaultState,
    buildLayoutOptions,
    getLayoutConfigForWidth,
    layoutOptionsEqual,
    withLayout,
    type WidgetDefinitionWithLayout,
} from './widgetBoardLayoutUtils'
import type {
    BreakpointLayoutConfig,
    WidgetBoardActionsState,
    WidgetBoardItemData,
    WidgetBoardProps,
    WidgetLayoutConfig,
    WidgetBoardState,
    WidgetBoardEngine,
    WidgetHeightMode,
    WidgetBoardInteractionMode,
} from './types'

const resolveLayoutForBreakpoint = (
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpointKey: number | string,
): BreakpointLayoutConfig | undefined =>
    layoutByBreakpoint[breakpointKey] ??
    layoutByBreakpoint[String(breakpointKey)] ??
    layoutByBreakpoint[Number(breakpointKey)] ??
    Object.values(layoutByBreakpoint)[0]

const normalizeHeightMode = (value: WidgetLayoutConfig['heightMode']) => value ?? 'auto'
const stringifyColumnOffset = (value: WidgetLayoutConfig['defaultSize']['columnOffset']) => JSON.stringify(value ?? null)

const getFixedHeightModeLocks = (
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpointKey: number | string,
): Partial<Record<string, boolean>> => {
    const layout = resolveLayoutForBreakpoint(layoutByBreakpoint, breakpointKey)
    if (!layout) return {}

    return Object.fromEntries(
        Object.entries(layout.widgets)
            .filter(([, widget]) => normalizeHeightMode(widget.heightMode) === 'fixed')
            .map(([id]) => [id, true]),
    )
}

type LayoutDiffOptions = {
    hiddenWidgetIds?: readonly string[]
    ignoreHiddenState?: boolean
}

const isSameWidgetLayout = (
    current: WidgetLayoutConfig | undefined,
    base: WidgetLayoutConfig | undefined,
    { ignoreHiddenState = false }: LayoutDiffOptions = {},
) => {
    if (!current || !base) return false

    const currentSize = current.defaultSize
    const baseSize = base.defaultSize
    const currentHeightMode = normalizeHeightMode(current.heightMode)
    const baseHeightMode = normalizeHeightMode(base.heightMode)

    if (currentHeightMode !== baseHeightMode) return false

    if (
        currentSize.columnSpan !== baseSize.columnSpan ||
        stringifyColumnOffset(currentSize.columnOffset) !== stringifyColumnOffset(baseSize.columnOffset)
    ) {
        return false
    }

    // For auto-height widgets rowSpan is runtime-derived by autosize and should not mark layout as user-modified.
    if (currentHeightMode === 'fixed' && currentSize.rowSpan !== baseSize.rowSpan) {
        return false
    }

    if (!ignoreHiddenState && Boolean(current.initialState?.isHidden) !== Boolean(base.initialState?.isHidden)) return false
    if (Boolean(current.initialState?.isCollapsed) !== Boolean(base.initialState?.isCollapsed)) return false

    return true
}

const differsFromBaseLayout = (
    current: BreakpointLayoutConfig | undefined,
    base: BreakpointLayoutConfig | undefined,
    { hiddenWidgetIds, ignoreHiddenState = false }: LayoutDiffOptions = {},
) => {
    if (!current || !base) return false

    const hiddenSet = hiddenWidgetIds ? new Set(hiddenWidgetIds) : null
    const widgetIds = new Set([...Object.keys(current.widgets), ...Object.keys(base.widgets)])
    for (const widgetId of widgetIds) {
        if (hiddenSet?.has(widgetId)) continue

        if (!isSameWidgetLayout(current.widgets[widgetId], base.widgets[widgetId], { ignoreHiddenState })) {
            return true
        }
    }

    return false
}

export type WidgetBoardHandle = {
    resetLayout: () => void
    restoreHidden: () => void
    getActionsState: () => WidgetBoardActionsState
}

export type WidgetBoardInteractionState = {
    isInteractionLocked: boolean
}

export const WidgetBoardInteractionContext = React.createContext<WidgetBoardInteractionState>({
    isInteractionLocked: false,
})

export const useWidgetBoardInteraction = () => React.useContext(WidgetBoardInteractionContext)

const DEFAULT_WIDGET_BOARD_ENGINE: WidgetBoardEngine = 'react-grid-layout'
const DEFAULT_WIDGET_BOARD_INTERACTION_MODE: WidgetBoardInteractionMode = 'view'

export const WidgetBoard = forwardRef<WidgetBoardHandle, WidgetBoardProps>(function WidgetBoard(
    {
        widgets,
        layoutByBreakpoint,
        loadLayouts,
        saveLayouts,
        onActionsStateChange,
        autoHeightEnabled = true,
        engine = DEFAULT_WIDGET_BOARD_ENGINE,
        interactionMode = DEFAULT_WIDGET_BOARD_INTERACTION_MODE,
        reactGridLayoutOptions,
    },
    ref,
) {
    const [isLoadingLayouts, setIsLoadingLayouts] = useState(true)
    const scopeFabStore = useWidgetBoardScopeStore()
    const {
        breakpoints,
        currentBreakpointKey,
        defaultOption,
        layoutOptions,
        layoutOptionsMap,
        layoutPreset,
        layoutSource,
        layoutSourceOwnerIdRef,
        loadRequestIdRef,
        lockedLayoutIdRef,
        selectedLayoutId,
        selectedLayoutRef,
        setLayoutOptions,
        setLayoutPreset,
        setLayoutSource,
        setSelectedLayoutId,
    } = useWidgetBoardLayoutSource({ layoutByBreakpoint })

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

                layoutSourceOwnerIdRef.current = nextSelected ?? defaultOption.id
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
    }, [
        defaultOption,
        layoutSourceOwnerIdRef,
        loadLayouts,
        loadRequestIdRef,
        lockedLayoutIdRef,
        selectedLayoutRef,
        setLayoutOptions,
        setLayoutPreset,
        setLayoutSource,
        setSelectedLayoutId,
        widgets,
    ])

    const lockedHeightModeByWidgetId = useMemo(
        () => getFixedHeightModeLocks(layoutByBreakpoint, currentBreakpointKey),
        [currentBreakpointKey, layoutByBreakpoint],
    )

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
    const defaultBreakpointLayout = useMemo(
        () => resolveLayoutForBreakpoint(defaultOption.layoutByBreakpoint, currentBreakpointKey) ?? Object.values(defaultOption.layoutByBreakpoint)[0] ?? { widgets: {} },
        [currentBreakpointKey, defaultOption.layoutByBreakpoint],
    )
    const defaultDefinitionsWithLayout = useMemo(
        () => withLayout(widgets, defaultBreakpointLayout),
        [defaultBreakpointLayout, widgets],
    )
    const defaultDefinitionsMap = useMemo(
        () => new Map<string, WidgetDefinitionWithLayout>(defaultDefinitionsWithLayout.map(def => [def.id, def])),
        [defaultDefinitionsWithLayout],
    )
    const effectiveSelectedLayoutId = selectedLayoutId ?? defaultOption.id

    const [layoutState, setLayoutState] = useState<WidgetBoardState>(() => buildDefaultState(definitionsWithLayout, currentBreakpointKey))
    const isInteractionLocked = useWidgetBoardInteractionLock()
    const interactionState = useMemo(() => ({ isInteractionLocked }), [isInteractionLocked])
    const { boardRootRef, handleContentRef, measuredRowsRef, remeasureAll } = useWidgetBoardAutosize({
        autoHeightEnabled,
        lockedHeightModeByWidgetId,
        definitionsMap,
        currentBreakpointKey,
        isInteractionLocked,
        layoutPresetBreakpoint: layoutPreset.breakpoint,
        setLayoutState,
    })

    useEffect(() => {
        measuredRowsRef.current = {}
        setLayoutState(buildDefaultState(definitionsWithLayout, currentBreakpointKey))
    }, [currentBreakpointKey, definitionsWithLayout, measuredRowsRef])

    useEffect(() => {
        if (typeof window === 'undefined') return
        let frameId: number | null = null
        const run = () => {
            frameId = null
            remeasureAll()
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
    }, [breakpoints, layoutSource, remeasureAll, setLayoutPreset])

    const buildCurrentPreset = useCallback(
        () => buildPresetFromState(layoutState, layoutSource, breakpoints, currentBreakpointKey),
        [breakpoints, currentBreakpointKey, layoutSource, layoutState],
    )

    const { handleItemsChange, hideItem, setWidgetVisibility, resetLayout, restoreHidden, toggleCollapse } = useWidgetBoardStateActions({
        currentBreakpointKey,
        defaultDefinitionsMap,
        definitionsMap,
        definitionsWithLayout,
        isDefaultLayoutSelected: effectiveSelectedLayoutId === defaultOption.id,
        lockedHeightModeByWidgetId,
        measuredRowsRef,
        setLayoutState,
    })

    const actionsState = useMemo<WidgetBoardActionsState>(() => {
        const currentPreset = buildCurrentPreset()
        const currentBreakpointLayout = resolveLayoutForBreakpoint(currentPreset, currentBreakpointKey)

        let canResetLayout: boolean
        if (effectiveSelectedLayoutId === defaultOption.id) {
            canResetLayout = differsFromBaseLayout(currentBreakpointLayout, defaultBreakpointLayout)
        } else {
            const hiddenSet = new Set(layoutState.hidden)
            const hasHiddenWidgets = hiddenSet.size > 0
            const visibleItems = layoutState.items.filter(item => {
                const widgetId = item.id as string
                return definitionsMap.has(widgetId) && !hiddenSet.has(widgetId)
            })
            const visibleItemIdSet = new Set(visibleItems.map(item => item.id as string))
            const defaultVisibleIds = defaultDefinitionsWithLayout
                .filter(definition => definitionsMap.has(definition.id) && !hiddenSet.has(definition.id))
                .map(definition => definition.id)

            const hasDifferentVisibleWidgets =
                visibleItems.length !== defaultVisibleIds.length || defaultVisibleIds.some(id => !visibleItemIdSet.has(id))

            const hasDifferentOrder = !hasHiddenWidgets && defaultVisibleIds.some((id, index) => visibleItems[index]?.id !== id)

            if (hasDifferentVisibleWidgets || hasDifferentOrder) {
                canResetLayout = true
            } else {
                const visibleItemsMap = new Map(visibleItems.map(item => [item.id as string, item]))
                const collapsedSet = new Set(layoutState.collapsed)
                const heightModeById = layoutState.heightModeMemory[currentBreakpointKey] ?? {}

                canResetLayout = defaultVisibleIds.some(id => {
                    const item = visibleItemsMap.get(id)
                    const currentDefinition = definitionsMap.get(id)
                    const defaultDefinition = defaultDefinitionsMap.get(id)
                    if (!item || !currentDefinition || !defaultDefinition) return true

                    const defaultSize = defaultDefinition.layout.defaultSize
                    if (item.columnSpan !== defaultSize.columnSpan) return true
                    if (!hasHiddenWidgets && stringifyColumnOffset(item.columnOffset) !== stringifyColumnOffset(defaultSize.columnOffset)) return true

                    const currentHeightMode = normalizeHeightMode(heightModeById[id] ?? currentDefinition.layout.heightMode)
                    const defaultHeightMode = normalizeHeightMode(defaultDefinition.layout.heightMode)
                    if (currentHeightMode !== defaultHeightMode) return true
                    if (currentHeightMode === 'fixed' && item.rowSpan !== defaultSize.rowSpan) return true

                    const isCollapsed = collapsedSet.has(id)
                    const defaultIsCollapsed = Boolean(defaultDefinition.layout.initialState?.isCollapsed)
                    if (isCollapsed !== defaultIsCollapsed) return true

                    return false
                })
            }
        }

        return {
            hasHiddenWidgets: layoutState.hidden.some(widgetId => definitionsMap.has(widgetId)),
            canResetLayout,
            isDefaultLayoutSelected: effectiveSelectedLayoutId === defaultOption.id,
            selectedLayoutId: effectiveSelectedLayoutId,
            defaultLayoutId: defaultOption.id,
        }
    }, [
        buildCurrentPreset,
        currentBreakpointKey,
        defaultBreakpointLayout,
        defaultDefinitionsMap,
        defaultDefinitionsWithLayout,
        defaultOption.id,
        definitionsMap,
        effectiveSelectedLayoutId,
        layoutState.collapsed,
        layoutState.heightModeMemory,
        layoutState.hidden,
        layoutState.items,
    ])

    const visibilityItems = useMemo(() => {
        const hiddenSet = new Set(layoutState.hidden)
        return definitionsWithLayout.map(definition => ({
            id: definition.id,
            title: definition.title,
            visible: !hiddenSet.has(definition.id),
        }))
    }, [definitionsWithLayout, layoutState.hidden])

    useWidgetBoardLayoutActions({
        buildCurrentPreset,
        defaultLayoutId: defaultOption.id,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        saveLayouts,
        fabStore: scopeFabStore,
        actionsState,
        visibilityItems,
        onSetWidgetVisibility: setWidgetVisibility,
        onResetLayout: resetLayout,
        onRestoreHidden: restoreHidden,
        selectedLayoutId,
        setLayoutOptions,
        setSelectedLayoutId,
    })

    useEffect(() => {
        onActionsStateChange?.(actionsState)
    }, [actionsState, onActionsStateChange])

    useImperativeHandle(
        ref,
        () => ({
            resetLayout,
            restoreHidden,
            getActionsState: () => actionsState,
        }),
        [actionsState, resetLayout, restoreHidden],
    )

    const visibleItems = useMemo(
        () => layoutState.items.filter(item => definitionsMap.has(item.id as string)),
        [layoutState.items, definitionsMap],
    )

    const activeLayoutConfig = layoutPreset.layout ?? fallbackLayoutConfig
    const reactGridLayoutColumns = activeLayoutConfig?.columns ?? reactGridLayoutOptions?.columns ?? 12
    const reactGridLayoutRowHeight = activeLayoutConfig?.rowHeight ?? reactGridLayoutOptions?.rowHeight ?? 96
    const reactGridLayoutMargin = activeLayoutConfig?.margin ?? reactGridLayoutOptions?.margin ?? [0, 0]
    const reactGridLayoutContainerPadding = activeLayoutConfig?.containerPadding ?? reactGridLayoutOptions?.containerPadding ?? [0, 0]

    const resolveItemRenderState = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const widgetId = item.id as string
        const definition = definitionsMap.get(widgetId)
        if (!definition) return null

        const isCollapsed = layoutState.collapsed.includes(widgetId)
        const isHeightModeLocked = Boolean(lockedHeightModeByWidgetId[widgetId])
        const baseHeightMode = isHeightModeLocked ? 'fixed' : layoutState.heightModeMemory[currentBreakpointKey]?.[widgetId] ?? definition.layout.heightMode ?? 'auto'
        const heightMode: WidgetHeightMode = autoHeightEnabled ? baseHeightMode : 'fixed'

        return { definition, heightMode, isCollapsed }
    }

    const renderCloudscapeItem = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const renderState = resolveItemRenderState(item)
        if (!renderState) return <></>

        return (
            <WidgetBoardItem
                item={item}
                definition={renderState.definition}
                heightMode={renderState.heightMode}
                isCollapsed={renderState.isCollapsed}
                isInteractionLocked={isInteractionLocked}
                onContentRef={handleContentRef}
                onHide={hideItem}
                onToggleCollapse={toggleCollapse}
            />
        )
    }

    const renderReactGridLayoutItem = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const renderState = resolveItemRenderState(item)
        if (!renderState) return <></>

        return (
            <WidgetBoardReactGridLayoutItem
                item={item}
                definition={renderState.definition}
                heightMode={renderState.heightMode}
                isCollapsed={renderState.isCollapsed}
                interactionMode={interactionMode}
                onContentRef={handleContentRef}
                onHide={hideItem}
            />
        )
    }

    return (
        <WidgetBoardInteractionContext.Provider value={interactionState}>
            {engine === 'react-grid-layout' ? (
                <WidgetBoardReactGridLayoutEngine
                    boardRootRef={boardRootRef}
                    columns={reactGridLayoutColumns}
                    containerPadding={reactGridLayoutContainerPadding}
                    interactionMode={interactionMode}
                    isLoadingLayouts={isLoadingLayouts}
                    items={visibleItems}
                    margin={reactGridLayoutMargin}
                    onItemsChange={handleItemsChange}
                    renderItem={renderReactGridLayoutItem}
                    rowHeight={reactGridLayoutRowHeight}
                />
            ) : (
                <WidgetBoardCloudscapeEngine
                    boardRootRef={boardRootRef}
                    items={visibleItems}
                    isLoadingLayouts={isLoadingLayouts}
                    onItemsChange={handleItemsChange}
                    renderItem={renderCloudscapeItem}
                />
            )}
        </WidgetBoardInteractionContext.Provider>
    )
})
