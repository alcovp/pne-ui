import { useCallback } from 'react'
import type { SetStateAction } from 'react'
import type { Dispatch } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import type { WidgetBoardItemData, WidgetBoardState, WidgetLayoutSnapshot } from './types'
import {
    buildDefaultState,
    COLLAPSED_ROW_SPAN,
    createBoardItemDefinition,
    toBoardItem,
    upsertLayoutMemory,
    type WidgetDefinitionWithLayout,
} from './widgetBoardLayoutUtils'

const resolveCompleteWidgetOrder = (
    state: WidgetBoardState,
    definitionsMap: Map<string, WidgetDefinitionWithLayout>,
    definitionsWithLayout: WidgetDefinitionWithLayout[],
) => {
    const seen = new Set<string>()
    const order: string[] = []
    const candidates = [
        ...state.widgetOrder,
        ...state.items.map(item => item.id as string),
        ...state.hidden,
        ...definitionsWithLayout.map(definition => definition.id),
    ]

    candidates.forEach(id => {
        if (!definitionsMap.has(id) || seen.has(id)) return
        seen.add(id)
        order.push(id)
    })

    return order
}

export const mergeVisibleOrderIntoFullOrder = (
    fullOrder: readonly string[],
    visibleOrder: readonly string[],
    hiddenIds: ReadonlySet<string>,
) => {
    const visibleIterator = visibleOrder[Symbol.iterator]()
    const merged = fullOrder.map(id => hiddenIds.has(id) ? id : visibleIterator.next().value ?? id)

    visibleOrder.forEach(id => {
        if (!merged.includes(id)) merged.push(id)
    })

    return merged
}

const updateHiddenSnapshotOrders = (
    layoutMemory: WidgetBoardState['layoutMemory'],
    breakpointKey: string,
    hiddenIds: readonly string[],
    widgetOrder: readonly string[],
    definitionsMap: Map<string, WidgetDefinitionWithLayout>,
) => {
    if (hiddenIds.length === 0) return layoutMemory

    const currentMemory = layoutMemory[breakpointKey] ?? {}
    const nextMemory = { ...currentMemory }

    hiddenIds.forEach(id => {
        const definition = definitionsMap.get(id)
        if (!definition) return
        const current = currentMemory[id]
        nextMemory[id] = {
            columnSpan: current?.columnSpan ?? definition.layout.defaultSize.columnSpan,
            rowSpan: current?.rowSpan ?? definition.layout.defaultSize.rowSpan,
            columnOffset: current?.columnOffset ?? definition.layout.defaultSize.columnOffset,
            order: Math.max(0, widgetOrder.indexOf(id)),
        }
    })

    return {
        ...layoutMemory,
        [breakpointKey]: nextMemory,
    }
}

type UseWidgetBoardStateActionsParams = {
    currentBreakpointKey: string
    defaultDefinitionsWithLayout: WidgetDefinitionWithLayout[]
    definitionsMap: Map<string, WidgetDefinitionWithLayout>
    definitionsWithLayout: WidgetDefinitionWithLayout[]
    isDefaultLayoutSelected: boolean
    setLayoutState: Dispatch<SetStateAction<WidgetBoardState>>
}

export const useWidgetBoardStateActions = ({
    currentBreakpointKey,
    defaultDefinitionsWithLayout,
    definitionsMap,
    definitionsWithLayout,
    isDefaultLayoutSelected,
    setLayoutState,
}: UseWidgetBoardStateActionsParams) => {
    const setWidgetVisibility = useCallback(
        (id: string, visible: boolean) => {
            setLayoutState(prev => {
                const definition = definitionsMap.get(id)
                if (!definition) return prev
                if (!visible && definition.canHide === false) return prev

                const isHidden = prev.hidden.includes(id)
                if (visible === !isHidden) return prev

                const widgetOrder = resolveCompleteWidgetOrder(prev, definitionsMap, definitionsWithLayout)

                if (!visible) {
                    const item = prev.items.find(boardItem => boardItem.id === id)
                    const snapshot: WidgetLayoutSnapshot = {
                        columnSpan: item?.columnSpan ?? definition.layout.defaultSize.columnSpan,
                        rowSpan: item?.rowSpan ?? definition.layout.defaultSize.rowSpan,
                        columnOffset: item?.columnOffset ?? definition.layout.defaultSize.columnOffset,
                        order: Math.max(0, widgetOrder.indexOf(id)),
                    }

                    const layoutMemory = upsertLayoutMemory(prev.layoutMemory, currentBreakpointKey, id, snapshot)

                    return {
                        ...prev,
                        layoutMemory,
                        widgetOrder,
                        items: prev.items.filter(boardItem => boardItem.id !== id),
                        hidden: prev.hidden.includes(id) ? prev.hidden : [...prev.hidden, id],
                        collapsed: prev.collapsed.filter(col => col !== id),
                        sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
                    }
                }

                const snapshot = prev.layoutMemory?.[currentBreakpointKey]?.[id]
                const restoredItem = snapshot ? toBoardItem(definition, snapshot) : toBoardItem(definition)
                const nextItems = [...prev.items]
                const nextHidden = prev.hidden.filter(hiddenId => hiddenId !== id)
                const fullOrderIndex = Math.max(0, widgetOrder.indexOf(id))
                const target = widgetOrder
                    .slice(0, fullOrderIndex)
                    .filter(widgetId => definitionsMap.has(widgetId) && !nextHidden.includes(widgetId))
                    .length
                nextItems.splice(target, 0, restoredItem)

                return {
                    ...prev,
                    items: nextItems,
                    widgetOrder,
                    hidden: nextHidden,
                    collapsed: prev.collapsed.filter(col => col !== id),
                    sizeMemory: Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => key !== id)) as Partial<Record<string, number>>,
                }
            })
        },
        [currentBreakpointKey, definitionsMap, definitionsWithLayout, setLayoutState],
    )

    const hideItem = useCallback(
        (id: string) => {
            setWidgetVisibility(id, false)
        },
        [setWidgetVisibility],
    )

    const resetLayout = useCallback(() => {
        if (isDefaultLayoutSelected) {
            setLayoutState(buildDefaultState(definitionsWithLayout, currentBreakpointKey))
            return
        }

        setLayoutState(prev => {
            const hiddenSet = new Set(prev.hidden)

            const resetDefinitions = defaultDefinitionsWithLayout.map(defaultDefinition => {
                if (hiddenSet.has(defaultDefinition.id)) {
                    const currentDefinition = definitionsMap.get(defaultDefinition.id) ?? defaultDefinition
                    return {
                        ...currentDefinition,
                        layout: {
                            ...currentDefinition.layout,
                            initialState: {
                                ...currentDefinition.layout.initialState,
                                isHidden: true,
                            },
                        },
                    }
                }

                return {
                    ...defaultDefinition,
                    layout: {
                        ...defaultDefinition.layout,
                        initialState: {
                            ...defaultDefinition.layout.initialState,
                            isHidden: false,
                        },
                    },
                }
            })

            const nextState = buildDefaultState(resetDefinitions, currentBreakpointKey)
            const nextHidden = prev.hidden.filter(id => definitionsMap.has(id))
            const nextHiddenSet = new Set(nextHidden)
            const nextCollapsed = nextState.collapsed.filter(id => !nextHiddenSet.has(id))
            const nextLayoutMemory = { ...prev.layoutMemory }
            const currentBreakpointMemory = prev.layoutMemory[currentBreakpointKey] ?? {}
            const hiddenMemoryEntries = Object.entries(currentBreakpointMemory).filter(([id]) => nextHiddenSet.has(id))

            if (hiddenMemoryEntries.length > 0) {
                nextLayoutMemory[currentBreakpointKey] = Object.fromEntries(hiddenMemoryEntries)
            } else {
                delete nextLayoutMemory[currentBreakpointKey]
            }

            return {
                ...nextState,
                hidden: nextHidden,
                collapsed: nextCollapsed,
                layoutMemory: updateHiddenSnapshotOrders(
                    nextLayoutMemory,
                    currentBreakpointKey,
                    nextHidden,
                    nextState.widgetOrder,
                    definitionsMap,
                ),
            }
        })
    }, [
        currentBreakpointKey,
        defaultDefinitionsWithLayout,
        definitionsMap,
        definitionsWithLayout,
        isDefaultLayoutSelected,
        setLayoutState,
    ])

    const handleItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange'] = useCallback(
        ({ detail }) => {
            setLayoutState(prev => {
                const prevItemsById = new Map<string, BoardProps.Item<WidgetBoardItemData>>(
                    prev.items.map(item => [item.id as string, item]),
                )
                const nextItems = detail.items
                    .map(item => {
                        const widgetId = item.id as string
                        const definition = definitionsMap.get(widgetId)
                        if (!definition) return null

                        const defaultSize = definition.layout.defaultSize
                        const isCollapsed = prev.collapsed.includes(widgetId)
                        const prevItem = prevItemsById.get(widgetId)
                        const columnSpan = item.columnSpan ?? defaultSize.columnSpan
                        const rowSpan = isCollapsed
                            ? COLLAPSED_ROW_SPAN
                            : (prevItem?.rowSpan ?? defaultSize.rowSpan)
                        const columnOffset = item.columnOffset ?? defaultSize.columnOffset

                        const data =
                            prevItem?.data && prevItem.data.title === definition.title
                                ? prevItem.data
                                : { id: definition.id, title: definition.title }
                        const resolvedDefinition = createBoardItemDefinition(definition, isCollapsed)
                        const itemDefinition =
                            prevItem?.definition &&
                            prevItem.definition.defaultColumnSpan === resolvedDefinition.defaultColumnSpan &&
                            prevItem.definition.defaultRowSpan === resolvedDefinition.defaultRowSpan &&
                            prevItem.definition.minColumnSpan === resolvedDefinition.minColumnSpan &&
                            prevItem.definition.minRowSpan === resolvedDefinition.minRowSpan
                                ? prevItem.definition
                                : resolvedDefinition

                        if (
                            prevItem &&
                            prevItem.columnSpan === columnSpan &&
                            prevItem.rowSpan === rowSpan &&
                            prevItem.columnOffset === columnOffset &&
                            prevItem.data === data &&
                            prevItem.definition === itemDefinition
                        ) {
                            return prevItem
                        }

                        return {
                            id: definition.id,
                            columnSpan,
                            rowSpan,
                            columnOffset,
                            data,
                            definition: itemDefinition,
                        }
                    })
                    .filter(Boolean) as BoardProps.Item<WidgetBoardItemData>[]

                const previousFullOrder = resolveCompleteWidgetOrder(prev, definitionsMap, definitionsWithLayout)
                const hiddenSet = new Set(prev.hidden)
                const nextVisibleOrder = nextItems.map(item => item.id as string)
                const widgetOrder = mergeVisibleOrderIntoFullOrder(previousFullOrder, nextVisibleOrder, hiddenSet)

                return {
                    ...prev,
                    items: nextItems,
                    widgetOrder,
                    layoutMemory: updateHiddenSnapshotOrders(
                        prev.layoutMemory,
                        currentBreakpointKey,
                        prev.hidden,
                        widgetOrder,
                        definitionsMap,
                    ),
                }
            })
        },
        [currentBreakpointKey, definitionsMap, definitionsWithLayout, setLayoutState],
    )

    const reorderAllItems = useCallback(
        (orderedIds: string[]) => {
            setLayoutState(prev => {
                const previousOrder = resolveCompleteWidgetOrder(prev, definitionsMap, definitionsWithLayout)
                const orderedSet = new Set<string>()
                const widgetOrder = [...orderedIds, ...previousOrder].filter(id => {
                    if (!definitionsMap.has(id) || orderedSet.has(id)) return false
                    orderedSet.add(id)
                    return true
                })
                if (
                    widgetOrder.length === previousOrder.length &&
                    widgetOrder.every((id, index) => id === previousOrder[index])
                ) {
                    return prev
                }

                const itemMap = new Map(prev.items.map(item => [item.id as string, item]))
                const items = widgetOrder.flatMap(id => {
                    const item = itemMap.get(id)
                    return item ? [item] : []
                })

                return {
                    ...prev,
                    items,
                    widgetOrder,
                    layoutMemory: updateHiddenSnapshotOrders(
                        prev.layoutMemory,
                        currentBreakpointKey,
                        prev.hidden,
                        widgetOrder,
                        definitionsMap,
                    ),
                }
            })
        },
        [currentBreakpointKey, definitionsMap, definitionsWithLayout, setLayoutState],
    )

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
                        return {
                            ...item,
                            rowSpan: restored,
                            definition: createBoardItemDefinition(definition),
                        }
                    }

                    sizeMemory[id] = item.rowSpan ?? definition.layout.defaultSize.rowSpan ?? 2
                    return {
                        ...item,
                        rowSpan: COLLAPSED_ROW_SPAN,
                        definition: createBoardItemDefinition(definition, true),
                    }
                })

                return { ...prev, items, collapsed: nextCollapsed, sizeMemory }
            })
        },
        [definitionsMap, setLayoutState],
    )

    const restoreHidden = useCallback(() => {
        setLayoutState(prev => {
            if (prev.hidden.length === 0) return prev

            const hiddenSet = new Set(prev.hidden)
            const widgetOrder = resolveCompleteWidgetOrder(prev, definitionsMap, definitionsWithLayout)
            const currentItems = new Map(prev.items.map(item => [item.id as string, item]))
            const nextItems = widgetOrder.flatMap(id => {
                const currentItem = currentItems.get(id)
                if (currentItem) return [currentItem]
                if (!hiddenSet.has(id)) return []

                const definition = definitionsMap.get(id)
                if (!definition) return []
                const snapshot = prev.layoutMemory?.[currentBreakpointKey]?.[id]
                return [snapshot ? toBoardItem(definition, snapshot) : toBoardItem(definition)]
            })

            const nextSizeMemory = Object.fromEntries(Object.entries(prev.sizeMemory).filter(([key]) => !hiddenSet.has(key)))

            return {
                ...prev,
                widgetOrder,
                hidden: [],
                collapsed: prev.collapsed.filter(col => !hiddenSet.has(col)),
                sizeMemory: nextSizeMemory,
                items: nextItems,
            }
        })
    }, [currentBreakpointKey, definitionsMap, definitionsWithLayout, setLayoutState])

    return {
        handleItemsChange,
        reorderAllItems,
        hideItem,
        setWidgetVisibility,
        resetLayout,
        restoreHidden,
        toggleCollapse,
    }
}
