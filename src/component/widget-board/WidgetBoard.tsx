import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import Board, { type BoardProps } from '@cloudscape-design/board-components/board'
import { Box } from '@mui/material'
import { CloudscapeBoardStyles } from '../cloudscape/CloudscapeBoardStyles'
import { CloudscapeThemeProvider } from '../cloudscape/CloudscapeThemeProvider'
import { createBoardI18nStrings } from '../cloudscape/boardI18n'
import { buildPresetFromState } from './layoutPersistence'
import { useWidgetBoardAutosize } from './useWidgetBoardAutosize'
import { useWidgetBoardInteractionLock } from './useWidgetBoardInteractionLock'
import { useWidgetBoardLayoutActions } from './useWidgetBoardLayoutActions'
import { useWidgetBoardLayoutSource } from './useWidgetBoardLayoutSource'
import { useWidgetBoardStateActions } from './useWidgetBoardStateActions'
import { WidgetBoardItem } from './WidgetBoardItem'
import { WidgetBoardSkeleton } from './WidgetBoardSkeleton'
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

export const WidgetBoard = forwardRef<WidgetBoardHandle, WidgetBoardProps>(function WidgetBoard(
    {
        widgets,
        layoutByBreakpoint,
        loadLayouts,
        saveLayouts,
        onActionsStateChange,
        autoHeightEnabled = true,
    },
    ref,
) {
    const [isLoadingLayouts, setIsLoadingLayouts] = useState(true)
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

    const { handleItemsChange, hideItem, resetLayout, restoreHidden, toggleCollapse } = useWidgetBoardStateActions({
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
        const resetVisibleOnly = effectiveSelectedLayoutId !== defaultOption.id

        return {
            hasHiddenWidgets: layoutState.hidden.some(widgetId => definitionsMap.has(widgetId)),
            canResetLayout: differsFromBaseLayout(currentBreakpointLayout, defaultBreakpointLayout, {
                hiddenWidgetIds: resetVisibleOnly ? layoutState.hidden : undefined,
                ignoreHiddenState: resetVisibleOnly,
            }),
            isDefaultLayoutSelected: effectiveSelectedLayoutId === defaultOption.id,
            selectedLayoutId: effectiveSelectedLayoutId,
            defaultLayoutId: defaultOption.id,
        }
    }, [buildCurrentPreset, currentBreakpointKey, defaultBreakpointLayout, defaultOption.id, definitionsMap, effectiveSelectedLayoutId, layoutState.hidden])

    useWidgetBoardLayoutActions({
        buildCurrentPreset,
        defaultLayoutId: defaultOption.id,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        saveLayouts,
        actionsState,
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

    const boardI18nStrings = useMemo(() => createBoardI18nStrings<WidgetBoardItemData>(item => item.data.title), [])

    const renderItem = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const widgetId = item.id as string
        const definition = definitionsMap.get(widgetId)
        if (!definition) return <></>

        const isCollapsed = layoutState.collapsed.includes(widgetId)
        const isHeightModeLocked = Boolean(lockedHeightModeByWidgetId[widgetId])
        const baseHeightMode = isHeightModeLocked ? 'fixed' : layoutState.heightModeMemory[currentBreakpointKey]?.[widgetId] ?? definition.layout.heightMode ?? 'auto'
        const heightMode = autoHeightEnabled ? baseHeightMode : 'fixed'

        return (
            <WidgetBoardItem
                item={item}
                definition={definition}
                heightMode={heightMode}
                isCollapsed={isCollapsed}
                isInteractionLocked={isInteractionLocked}
                onContentRef={handleContentRef}
                onHide={hideItem}
                onToggleCollapse={toggleCollapse}
            />
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
            <WidgetBoardInteractionContext.Provider value={interactionState}>
                <Box ref={boardRootRef} sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {isLoadingLayouts ? <WidgetBoardSkeleton /> : boardElement}
                </Box>
            </WidgetBoardInteractionContext.Provider>
        </CloudscapeThemeProvider>
    )
})
