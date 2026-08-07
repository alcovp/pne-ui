import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import { useTranslation } from 'react-i18next'
import { overlayActions } from '../overlay/overlayStore'
import { buildPresetFromState } from './layoutPersistence'
import { useWidgetBoardAutosize } from './useWidgetBoardAutosize'
import { useWidgetBoardInteractionLock } from './useWidgetBoardInteractionLock'
import {
    useWidgetBoardLayoutActions,
    type WidgetBoardPersistenceState,
} from './useWidgetBoardLayoutActions'
import { useWidgetBoardLayoutSource } from './useWidgetBoardLayoutSource'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import { useWidgetBoardStateActions } from './useWidgetBoardStateActions'
import { WidgetBoardCloudscapeEngine } from './WidgetBoardCloudscapeEngine'
import { WidgetBoardEmptyState } from './WidgetBoardEmptyState'
import { WidgetBoardItem } from './WidgetBoardItem'
import {
    WidgetBoardReactGridLayoutEngine,
    WidgetBoardReactGridLayoutItem,
} from './WidgetBoardReactGridLayoutEngine'
import { buildWidgetBoardBreakpoints, useWidgetBoardBreakpoint } from './widgetBoardBreakpoints'
import {
    buildDefaultState,
    buildLayoutOptions,
    getLayoutConfigForBreakpoint,
    layoutOptionsEqual,
    toBoardItem,
    withLayout,
    type WidgetDefinitionWithLayout,
} from './widgetBoardLayoutUtils'
import {
    DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING,
    type BreakpointLayoutConfig,
    type WidgetBoardActionsState,
    type WidgetBoardEditBehavior,
    type WidgetBoardEditScale,
    type WidgetBoardItemData,
    type WidgetBoardProps,
    type WidgetBoardEngine,
    type WidgetBoardInteractionMode,
    type WidgetBoardState,
    type WidgetHeightMode,
    type WidgetLayoutConfig,
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
const resolveCompleteWidgetOrder = (layout: BreakpointLayoutConfig) => {
    const widgetIds = Object.keys(layout.widgets)
    const widgetIdSet = new Set(widgetIds)
    const seen = new Set<string>()
    const order: string[] = []
    const configuredOrder = layout.widgetOrder ?? widgetIds

    configuredOrder.forEach(widgetId => {
        if (!widgetIdSet.has(widgetId) || seen.has(widgetId)) return
        seen.add(widgetId)
        order.push(widgetId)
    })
    widgetIds.forEach(widgetId => {
        if (seen.has(widgetId)) return
        seen.add(widgetId)
        order.push(widgetId)
    })

    return order
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

    const currentOrder = resolveCompleteWidgetOrder(current)
    const baseOrder = resolveCompleteWidgetOrder(base)
    if (
        currentOrder.length !== baseOrder.length ||
        currentOrder.some((widgetId, index) => widgetId !== baseOrder[index])
    ) {
        return true
    }

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
    flushPendingSave: () => Promise<void>
    discardDraft: () => Promise<void>
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
        breakpoints: configuredBreakpoints,
        breakpointSource = 'viewport',
        showHideUndo = false,
    },
    ref,
) {
    const { t } = useTranslation()
    const [isLoadingLayouts, setIsLoadingLayouts] = useState(true)
    const scopeFabStore = useWidgetBoardScopeStore()
    const resolvedBreakpoints = useMemo(
        () => buildWidgetBoardBreakpoints(layoutByBreakpoint, configuredBreakpoints),
        [configuredBreakpoints, layoutByBreakpoint],
    )
    const breakpointIds = useMemo(
        () => resolvedBreakpoints.map(breakpoint => breakpoint.id),
        [resolvedBreakpoints],
    )
    const {
        activeBreakpoint,
        containerRef: breakpointContainerRef,
    } = useWidgetBoardBreakpoint({
        breakpoints: resolvedBreakpoints,
        source: breakpointSource,
    })
    const currentBreakpointKey = activeBreakpoint.id
    const activeEditBehavior: WidgetBoardEditBehavior = activeBreakpoint.editBehavior ?? 'grid'
    const currentEditBehavior: WidgetBoardEditBehavior =
        interactionMode === 'edit'
            ? activeEditBehavior
            : 'grid'
    const currentBreakpointKeyRef = useRef(currentBreakpointKey)
    currentBreakpointKeyRef.current = currentBreakpointKey
    const {
        breakpoints,
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
        setLayoutSource,
        setSelectedLayoutId,
    } = useWidgetBoardLayoutSource({
        layoutByBreakpoint,
        breakpointIds,
        currentBreakpointKey,
    })
    const breakpointsRef = useRef(breakpoints)
    breakpointsRef.current = breakpoints
    const breakpointIdsKey = breakpoints.join('\u0000')
    const defaultDraftStatesRef = useRef(new Map<string, WidgetBoardState>())
    const defaultDraftOwnerRef = useRef({ layoutByBreakpoint, widgets })
    const [persistenceState, setPersistenceState] = useState<WidgetBoardPersistenceState>({
        status: 'idle',
        dirtyBreakpointIds: [],
    })

    useEffect(() => {
        const owner = defaultDraftOwnerRef.current
        if (owner.layoutByBreakpoint === layoutByBreakpoint && owner.widgets === widgets) return

        defaultDraftOwnerRef.current = { layoutByBreakpoint, widgets }
        defaultDraftStatesRef.current.clear()
    }, [layoutByBreakpoint, widgets])

    useEffect(() => {
        let cancelled = false

        const requestId = ++loadRequestIdRef.current
        setIsLoadingLayouts(true)
        loadLayouts()
            .then(result => {
                if (cancelled || loadRequestIdRef.current !== requestId || !result?.options) return
                const activeBreakpoints = breakpointsRef.current
                const nextOptions = buildLayoutOptions(result.options, defaultOption, activeBreakpoints)
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
                const activeBreakpointKey = currentBreakpointKeyRef.current
                const nextPreset = getLayoutConfigForBreakpoint(activeBreakpointKey, nextLayoutSource)
                const nextBreakpointKey = String(nextPreset.breakpoint ?? activeBreakpoints[0])
                const fallbackForNext = nextLayoutSource[activeBreakpoints[0]] ?? Object.values(nextLayoutSource)[0] ?? { widgets: {} }
                const nextDefinitions = withLayout(widgets, nextPreset.layout ?? fallbackForNext)
                const nextLayoutId = nextSelected ?? defaultOption.id
                const defaultDraft = nextLayoutId === defaultOption.id
                    ? defaultDraftStatesRef.current.get(nextBreakpointKey)
                    : undefined

                layoutSourceOwnerIdRef.current = nextLayoutId
                setLayoutSource(prev => (prev === nextLayoutSource ? prev : nextLayoutSource))
                setLayoutState(defaultDraft ?? buildDefaultState(nextDefinitions, nextBreakpointKey))
                setLayoutStateContext({
                    breakpointKey: nextBreakpointKey,
                    layoutId: nextLayoutId,
                    widgets,
                    defaultLayoutSource: nextLayoutId === defaultOption.id
                        ? defaultOption.layoutByBreakpoint
                        : undefined,
                })

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
        breakpointIdsKey,
        breakpointsRef,
        currentBreakpointKeyRef,
        layoutSourceOwnerIdRef,
        loadLayouts,
        loadRequestIdRef,
        lockedLayoutIdRef,
        selectedLayoutRef,
        setLayoutOptions,
        setLayoutSource,
        setSelectedLayoutId,
        widgets,
    ])

    const fallbackLayoutConfig = useMemo(() => {
        const firstKey = breakpoints[0]
        return layoutSource[firstKey] ?? Object.values(layoutSource)[0]
    }, [breakpoints, layoutSource])

    const activeLayoutConfig = layoutPreset.layout ?? fallbackLayoutConfig
    const reactGridLayoutColumns = activeLayoutConfig?.columns ?? reactGridLayoutOptions?.columns ?? 12
    const reactGridLayoutRowHeight = activeLayoutConfig?.rowHeight ?? reactGridLayoutOptions?.rowHeight ?? 96
    const reactGridLayoutMargin = activeLayoutConfig?.margin ?? reactGridLayoutOptions?.margin ?? [0, 0]
    const reactGridLayoutContainerPadding = activeLayoutConfig?.containerPadding ?? reactGridLayoutOptions?.containerPadding ?? [0, 0]
    const reactGridLayoutUseCSSTransforms = reactGridLayoutOptions?.useCSSTransforms ?? true
    const reactGridLayoutCompaction =
        reactGridLayoutOptions?.compaction ?? DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING.compaction
    const reactGridLayoutCollisionBehavior =
        reactGridLayoutOptions?.collisionBehavior ?? DEFAULT_WIDGET_BOARD_REACT_GRID_LAYOUT_TUNING.collisionBehavior
    const reactGridLayoutEditScale: WidgetBoardEditScale =
        engine === 'react-grid-layout' &&
        interactionMode === 'edit' &&
        currentEditBehavior === 'grid' &&
        reactGridLayoutColumns > 1
            ? reactGridLayoutOptions?.editScale ?? 1
            : 1

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
    const [layoutStateContext, setLayoutStateContext] = useState(() => ({
        breakpointKey: currentBreakpointKey,
        layoutId: effectiveSelectedLayoutId,
        widgets,
        defaultLayoutSource: effectiveSelectedLayoutId === defaultOption.id
            ? defaultOption.layoutByBreakpoint
            : undefined,
    }))
    const stashDefaultDraft = useCallback((state: WidgetBoardState, context: typeof layoutStateContext) => {
        if (
            context.layoutId !== defaultOption.id ||
            context.widgets !== widgets ||
            context.defaultLayoutSource !== defaultOption.layoutByBreakpoint ||
            defaultDraftOwnerRef.current.layoutByBreakpoint !== layoutByBreakpoint ||
            defaultDraftOwnerRef.current.widgets !== widgets
        ) {
            return
        }

        if (defaultDraftStatesRef.current.get(context.breakpointKey) === state) return
        defaultDraftStatesRef.current.set(context.breakpointKey, state)
    }, [defaultOption.id, defaultOption.layoutByBreakpoint, layoutByBreakpoint, widgets])

    useEffect(() => {
        stashDefaultDraft(layoutState, layoutStateContext)
    }, [layoutState, layoutStateContext, stashDefaultDraft])

    const isInteractionLocked = useWidgetBoardInteractionLock()
    const interactionState = useMemo(() => ({ isInteractionLocked }), [isInteractionLocked])
    const { boardRootRef, handleContentRef, remeasureAll } = useWidgetBoardAutosize({
        autoHeightEnabled,
        definitionsMap,
        isInteractionLocked,
        isSuspended: currentEditBehavior === 'order-only',
        editScale: reactGridLayoutEditScale,
        layoutPresetBreakpoint: layoutPreset.breakpoint,
        setLayoutState,
    })

    useEffect(() => {
        if (currentEditBehavior === 'order-only') return
        const frameId = requestAnimationFrame(remeasureAll)
        return () => cancelAnimationFrame(frameId)
    }, [currentEditBehavior, remeasureAll])
    const handleBoardRootRef = useCallback(
        (node: HTMLDivElement | null) => {
            boardRootRef.current = node
            breakpointContainerRef(node)
        },
        [boardRootRef, breakpointContainerRef],
    )
    const layoutResetContextRef = useRef<{
        breakpointKey: string
        layoutId: string
        layoutSource?: Record<number | string, BreakpointLayoutConfig>
        ownerId?: string
        widgets: WidgetBoardProps['widgets']
    } | null>(null)
    const layoutSourceOwnerId = layoutSourceOwnerIdRef.current

    useEffect(() => {
        if (layoutSourceOwnerId !== effectiveSelectedLayoutId) return
        const previous = layoutResetContextRef.current
        const isDefaultLayout = effectiveSelectedLayoutId === defaultOption.id
        const shouldReset =
            !previous ||
            previous.breakpointKey !== currentBreakpointKey ||
            previous.layoutId !== effectiveSelectedLayoutId ||
            previous.ownerId !== layoutSourceOwnerId ||
            previous.widgets !== widgets ||
            (isDefaultLayout && previous.layoutSource !== layoutSource)
        if (!shouldReset) return

        stashDefaultDraft(layoutState, layoutStateContext)

        layoutResetContextRef.current = {
            breakpointKey: currentBreakpointKey,
            layoutId: effectiveSelectedLayoutId,
            layoutSource: isDefaultLayout ? layoutSource : undefined,
            ownerId: layoutSourceOwnerId,
            widgets,
        }
        const nextState = isDefaultLayout
            ? defaultDraftStatesRef.current.get(currentBreakpointKey) ??
                buildDefaultState(definitionsWithLayout, currentBreakpointKey)
            : buildDefaultState(definitionsWithLayout, currentBreakpointKey)
        setLayoutState(nextState)
        setLayoutStateContext({
            breakpointKey: currentBreakpointKey,
            layoutId: effectiveSelectedLayoutId,
            widgets,
            defaultLayoutSource: isDefaultLayout ? defaultOption.layoutByBreakpoint : undefined,
        })
    }, [
        currentBreakpointKey,
        defaultOption.id,
        defaultOption.layoutByBreakpoint,
        definitionsWithLayout,
        effectiveSelectedLayoutId,
        layoutSource,
        layoutSourceOwnerId,
        layoutState,
        layoutStateContext,
        stashDefaultDraft,
        widgets,
    ])

    useEffect(() => {
        if (typeof window === 'undefined') return
        let frameId: number | null = null
        const run = () => {
            frameId = null
            remeasureAll()
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
    }, [remeasureAll])

    const buildCurrentPreset = useCallback(() => {
        if (effectiveSelectedLayoutId !== defaultOption.id) {
            return buildPresetFromState(layoutState, layoutSource, breakpoints, currentBreakpointKey)
        }

        const drafts = new Map(defaultDraftStatesRef.current)
        if (
            layoutStateContext.layoutId === defaultOption.id &&
            layoutStateContext.widgets === widgets &&
            layoutStateContext.defaultLayoutSource === defaultOption.layoutByBreakpoint
        ) {
            drafts.set(layoutStateContext.breakpointKey, layoutState)
        }

        return breakpoints.reduce<Record<number | string, BreakpointLayoutConfig>>(
            (preset, breakpoint) => {
                const draft = drafts.get(String(breakpoint))
                return draft
                    ? buildPresetFromState(draft, preset, breakpoints, breakpoint)
                    : preset
            },
            defaultOption.layoutByBreakpoint,
        )
    }, [
        breakpoints,
        currentBreakpointKey,
        defaultOption.id,
        defaultOption.layoutByBreakpoint,
        effectiveSelectedLayoutId,
        layoutSource,
        layoutState,
        layoutStateContext,
        widgets,
    ])
    const isLayoutStateCurrent =
        layoutStateContext.breakpointKey === currentBreakpointKey &&
        layoutStateContext.layoutId === effectiveSelectedLayoutId &&
        layoutStateContext.widgets === widgets &&
        layoutSourceOwnerIdRef.current === effectiveSelectedLayoutId

    const {
        handleItemsChange,
        hideItem,
        reorderAllItems,
        setWidgetVisibility,
        resetLayout,
        restoreHidden,
        toggleCollapse,
    } = useWidgetBoardStateActions({
        currentBreakpointKey,
        defaultDefinitionsWithLayout,
        definitionsMap,
        definitionsWithLayout,
        isDefaultLayoutSelected: effectiveSelectedLayoutId === defaultOption.id,
        setLayoutState,
    })

    const defaultDirtyBreakpointIds = useMemo(() => {
        const drafts = new Map(defaultDraftStatesRef.current)
        if (
            layoutStateContext.layoutId === defaultOption.id &&
            layoutStateContext.widgets === widgets &&
            layoutStateContext.defaultLayoutSource === defaultOption.layoutByBreakpoint
        ) {
            drafts.set(layoutStateContext.breakpointKey, layoutState)
        }

        return breakpoints.filter(breakpoint => {
            const breakpointKey = String(breakpoint)
            const draft = drafts.get(breakpointKey)
            if (!draft) return false
            const draftPreset = buildPresetFromState(
                draft,
                defaultOption.layoutByBreakpoint,
                breakpoints,
                breakpoint,
            )
            const currentLayout = resolveLayoutForBreakpoint(draftPreset, breakpoint)
            const baseLayout = resolveLayoutForBreakpoint(defaultOption.layoutByBreakpoint, breakpoint)
            return differsFromBaseLayout(currentLayout, baseLayout)
        }).map(String)
    }, [
        breakpoints,
        defaultOption.id,
        defaultOption.layoutByBreakpoint,
        layoutState,
        layoutStateContext,
        widgets,
    ])

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

            const currentFullOrder = layoutState.widgetOrder.filter(id => definitionsMap.has(id))
            const defaultFullOrder = defaultDefinitionsWithLayout
                .filter(definition => definitionsMap.has(definition.id))
                .map(definition => definition.id)
            const hasDifferentOrder =
                currentFullOrder.length !== defaultFullOrder.length ||
                defaultFullOrder.some((id, index) => currentFullOrder[index] !== id)

            if (hasDifferentVisibleWidgets || hasDifferentOrder) {
                canResetLayout = true
            } else {
                const visibleItemsMap = new Map(visibleItems.map(item => [item.id as string, item]))
                const collapsedSet = new Set(layoutState.collapsed)
                canResetLayout = defaultVisibleIds.some(id => {
                    const item = visibleItemsMap.get(id)
                    const currentDefinition = definitionsMap.get(id)
                    const defaultDefinition = defaultDefinitionsMap.get(id)
                    if (!item || !currentDefinition || !defaultDefinition) return true

                    const defaultSize = defaultDefinition.layout.defaultSize
                    if (item.columnSpan !== defaultSize.columnSpan) return true
                    if (!hasHiddenWidgets && stringifyColumnOffset(item.columnOffset) !== stringifyColumnOffset(defaultSize.columnOffset)) return true

                    const isCollapsed = collapsedSet.has(id)
                    const defaultIsCollapsed = Boolean(defaultDefinition.layout.initialState?.isCollapsed)
                    if (isCollapsed !== defaultIsCollapsed) return true

                    return false
                })
            }
        }

        const isDefaultLayoutSelected = effectiveSelectedLayoutId === defaultOption.id
        const isSelectedLayoutLocked = lockedLayoutIdRef.current === effectiveSelectedLayoutId
        const dirtyBreakpointIds = isDefaultLayoutSelected
            ? defaultDirtyBreakpointIds
            : persistenceState.dirtyBreakpointIds

        return {
            hasHiddenWidgets: layoutState.hidden.some(widgetId => definitionsMap.has(widgetId)),
            canResetLayout,
            isDefaultLayoutSelected,
            selectedLayoutId: effectiveSelectedLayoutId,
            defaultLayoutId: defaultOption.id,
            isSelectedLayoutLocked,
            hasDraftChanges: dirtyBreakpointIds.length > 0,
            dirtyBreakpointIds,
            persistenceStatus: persistenceState.status,
            persistenceError: persistenceState.error,
        }
    }, [
        buildCurrentPreset,
        currentBreakpointKey,
        defaultBreakpointLayout,
        defaultDefinitionsMap,
        defaultDefinitionsWithLayout,
        defaultDirtyBreakpointIds,
        defaultOption.id,
        definitionsMap,
        effectiveSelectedLayoutId,
        layoutState.collapsed,
        layoutState.hidden,
        layoutState.items,
        layoutState.widgetOrder,
        lockedLayoutIdRef,
        persistenceState,
    ])

    const fullWidgetOrder = useMemo(() => {
        const seen = new Set<string>()
        return [...layoutState.widgetOrder, ...definitionsWithLayout.map(definition => definition.id)].filter(id => {
            if (!definitionsMap.has(id) || seen.has(id)) return false
            seen.add(id)
            return true
        })
    }, [definitionsMap, definitionsWithLayout, layoutState.widgetOrder])

    const visibilityItems = useMemo(() => {
        const hiddenSet = new Set(layoutState.hidden)
        return fullWidgetOrder.flatMap(id => {
            const definition = definitionsMap.get(id)
            if (!definition) return []
            return [{
                id,
                title: definition.title,
                visible: !hiddenSet.has(id),
                canHide: definition.canHide !== false,
            }]
        })
    }, [definitionsMap, fullWidgetOrder, layoutState.hidden])

    const pendingHideUndoRef = useRef(new Map<string, string>())
    const undoContextKey = `${currentBreakpointKey}\u0000${effectiveSelectedLayoutId}`
    const undoContextKeyRef = useRef(undoContextKey)
    undoContextKeyRef.current = undoContextKey

    const dismissPendingHideUndo = useCallback((widgetId?: string) => {
        if (widgetId) {
            const snackbarId = pendingHideUndoRef.current.get(widgetId)
            if (snackbarId) overlayActions.removeSnackbar(snackbarId)
            pendingHideUndoRef.current.delete(widgetId)
            return
        }

        pendingHideUndoRef.current.forEach(snackbarId => overlayActions.removeSnackbar(snackbarId))
        pendingHideUndoRef.current.clear()
    }, [])

    useEffect(() => () => dismissPendingHideUndo(), [dismissPendingHideUndo, undoContextKey])

    const handleSetWidgetVisibility = useCallback(
        (id: string, visible: boolean) => {
            dismissPendingHideUndo(id)
            setWidgetVisibility(id, visible)
        },
        [dismissPendingHideUndo, setWidgetVisibility],
    )

    const handleRestoreHidden = useCallback(() => {
        dismissPendingHideUndo()
        restoreHidden()
    }, [dismissPendingHideUndo, restoreHidden])

    const handleDirectHide = useCallback(
        (id: string) => {
            const definition = definitionsMap.get(id)
            if (!definition || definition.canHide === false) return

            dismissPendingHideUndo(id)
            hideItem(id)
            if (!showHideUndo) return

            const hiddenInContext = undoContextKey
            const snackbarId = overlayActions.showUndoSnackbar({
                message: t('pne.widgetBoard.visibility.widgetHidden', {
                    title: definition.title,
                    defaultValue: 'Widget "{{title}}" hidden',
                }),
                undoLabel: t('pne.widgetBoard.visibility.undo', { defaultValue: 'Undo' }),
                onUndo: () => {
                    pendingHideUndoRef.current.delete(id)
                    if (undoContextKeyRef.current !== hiddenInContext) return
                    setWidgetVisibility(id, true)
                },
            })
            pendingHideUndoRef.current.set(id, snackbarId)
        },
        [definitionsMap, dismissPendingHideUndo, hideItem, setWidgetVisibility, showHideUndo, t, undoContextKey],
    )

    const clearDefaultLayoutDrafts = useCallback(() => {
        defaultDraftStatesRef.current.clear()
    }, [])

    const discardLockedLayoutDrafts = useCallback(() => {
        clearDefaultLayoutDrafts()
        if (effectiveSelectedLayoutId !== defaultOption.id) return

        setLayoutState(buildDefaultState(defaultDefinitionsWithLayout, currentBreakpointKey))
        setLayoutStateContext({
            breakpointKey: currentBreakpointKey,
            layoutId: defaultOption.id,
            widgets,
            defaultLayoutSource: defaultOption.layoutByBreakpoint,
        })
    }, [
        currentBreakpointKey,
        clearDefaultLayoutDrafts,
        defaultDefinitionsWithLayout,
        defaultOption.id,
        defaultOption.layoutByBreakpoint,
        effectiveSelectedLayoutId,
        widgets,
    ])

    const promoteLockedDraftToLayout = useCallback((
        layoutId: string,
        savedLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    ) => {
        clearDefaultLayoutDrafts()
        layoutSourceOwnerIdRef.current = layoutId
        setLayoutSource(savedLayoutByBreakpoint)
        setLayoutStateContext(context => ({
            ...context,
            layoutId,
            defaultLayoutSource: undefined,
        }))
    }, [clearDefaultLayoutDrafts, layoutSourceOwnerIdRef, setLayoutSource])

    const restorePersistedLayout = useCallback((
        layoutId: string,
        persistedLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    ) => {
        const preset = getLayoutConfigForBreakpoint(currentBreakpointKey, persistedLayoutByBreakpoint)
        const fallback = persistedLayoutByBreakpoint[breakpoints[0]] ??
            Object.values(persistedLayoutByBreakpoint)[0] ??
            { widgets: {} }
        const restoredDefinitions = withLayout(widgets, preset.layout ?? fallback)
        layoutSourceOwnerIdRef.current = layoutId
        setLayoutState(buildDefaultState(restoredDefinitions, currentBreakpointKey))
        setLayoutStateContext({
            breakpointKey: currentBreakpointKey,
            layoutId,
            widgets,
            defaultLayoutSource: undefined,
        })
    }, [breakpoints, currentBreakpointKey, layoutSourceOwnerIdRef, widgets])

    const {
        discardLayoutChanges,
        flushPendingSave,
    } = useWidgetBoardLayoutActions({
        buildCurrentPreset,
        defaultLayoutId: defaultOption.id,
        isLayoutStateCurrent,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        saveLayouts,
        fabStore: scopeFabStore,
        actionsState,
        activeBreakpointId: currentBreakpointKey,
        editBehavior: activeEditBehavior,
        visibilityItems,
        onSetWidgetVisibility: handleSetWidgetVisibility,
        onResetLayout: resetLayout,
        onRestoreHidden: handleRestoreHidden,
        onDiscardLockedLayoutDrafts: discardLockedLayoutDrafts,
        onRestorePersistedLayout: restorePersistedLayout,
        onSaveAsLockedLayoutSuccess: promoteLockedDraftToLayout,
        onPersistenceStateChange: setPersistenceState,
        selectedLayoutId,
        setLayoutOptions,
        setLayoutSource,
        setSelectedLayoutId,
    })

    useEffect(() => {
        onActionsStateChange?.(actionsState)
    }, [actionsState, onActionsStateChange])

    useImperativeHandle(
        ref,
        () => ({
            resetLayout,
            restoreHidden: handleRestoreHidden,
            flushPendingSave,
            discardDraft: discardLayoutChanges,
            getActionsState: () => actionsState,
        }),
        [actionsState, discardLayoutChanges, flushPendingSave, handleRestoreHidden, resetLayout],
    )

    const visibleItems = useMemo(
        () => layoutState.items.filter(item => definitionsMap.has(item.id as string)),
        [layoutState.items, definitionsMap],
    )
    const orderEditorItems = useMemo(() => {
        const visibleItemMap = new Map(layoutState.items.map(item => [item.id as string, item]))
        const memory = layoutState.layoutMemory[currentBreakpointKey] ?? {}

        return fullWidgetOrder.flatMap(id => {
            const visibleItem = visibleItemMap.get(id)
            if (visibleItem) return [visibleItem]
            const definition = definitionsMap.get(id)
            if (!definition) return []
            const snapshot = memory[id]
            return [snapshot ? toBoardItem(definition, snapshot) : toBoardItem(definition)]
        })
    }, [currentBreakpointKey, definitionsMap, fullWidgetOrder, layoutState.items, layoutState.layoutMemory])
    const minWidthPxByWidgetId = useMemo(
        () =>
            Object.fromEntries(
                definitionsWithLayout
                    .filter(definition => definition.minWidthPx !== undefined)
                    .map(definition => [definition.id, definition.minWidthPx]),
            ) as Partial<Record<string, number>>,
        [definitionsWithLayout],
    )

    const resolveItemRenderState = (item: BoardProps.Item<WidgetBoardItemData>) => {
        const widgetId = item.id as string
        const definition = definitionsMap.get(widgetId)
        if (!definition) return null

        const isCollapsed = layoutState.collapsed.includes(widgetId)
        const baseHeightMode = definition.layout.heightMode ?? 'auto'
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
                onHide={handleDirectHide}
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
                isOverview={reactGridLayoutEditScale === 0.5}
                onContentRef={handleContentRef}
                onHide={handleDirectHide}
            />
        )
    }

    const emptyState = (
        <WidgetBoardEmptyState
            hasHiddenWidgets={actionsState.hasHiddenWidgets}
            onShowAll={handleRestoreHidden}
        />
    )

    return (
        <WidgetBoardInteractionContext.Provider value={interactionState}>
            {engine === 'react-grid-layout' ? (
                <WidgetBoardReactGridLayoutEngine
                    boardRootRef={handleBoardRootRef}
                    collisionBehavior={reactGridLayoutCollisionBehavior}
                    columns={reactGridLayoutColumns}
                    compaction={reactGridLayoutCompaction}
                    containerPadding={reactGridLayoutContainerPadding}
                    editBehavior={currentEditBehavior}
                    editScale={reactGridLayoutEditScale}
                    empty={emptyState}
                    interactionMode={interactionMode}
                    isLoadingLayouts={isLoadingLayouts}
                    items={visibleItems}
                    orderEditorItems={orderEditorItems}
                    margin={reactGridLayoutMargin}
                    minWidthPxByWidgetId={minWidthPxByWidgetId}
                    onItemsChange={handleItemsChange}
                    onOrderChange={reorderAllItems}
                    onSetWidgetVisibility={handleSetWidgetVisibility}
                    renderItem={renderReactGridLayoutItem}
                    rowHeight={reactGridLayoutRowHeight}
                    useCSSTransforms={reactGridLayoutUseCSSTransforms}
                    visibilityItems={visibilityItems}
                />
            ) : (
                <WidgetBoardCloudscapeEngine
                    boardRootRef={handleBoardRootRef}
                    empty={emptyState}
                    items={visibleItems}
                    isLoadingLayouts={isLoadingLayouts}
                    onItemsChange={handleItemsChange}
                    renderItem={renderCloudscapeItem}
                />
            )}
        </WidgetBoardInteractionContext.Provider>
    )
})
