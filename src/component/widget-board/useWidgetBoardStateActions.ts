import { useCallback } from 'react'
import type { MutableRefObject, SetStateAction } from 'react'
import type { Dispatch } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import type { WidgetBoardItemData, WidgetBoardState, WidgetHeightMode, WidgetHeightModeMemory, WidgetLayoutSnapshot } from './types'
import { buildDefaultState, toBoardItem, upsertLayoutMemory, type WidgetDefinitionWithLayout } from './widgetBoardLayoutUtils'

type UseWidgetBoardStateActionsParams = {
    currentBreakpointKey: string
    definitionsMap: Map<string, WidgetDefinitionWithLayout>
    definitionsWithLayout: WidgetDefinitionWithLayout[]
    measuredRowsRef: MutableRefObject<Record<string, number>>
    setLayoutState: Dispatch<SetStateAction<WidgetBoardState>>
}

export const useWidgetBoardStateActions = ({
    currentBreakpointKey,
    definitionsMap,
    definitionsWithLayout,
    measuredRowsRef,
    setLayoutState,
}: UseWidgetBoardStateActionsParams) => {
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
        [currentBreakpointKey, definitionsMap, setLayoutState],
    )

    const resetLayout = useCallback(
        () => setLayoutState(buildDefaultState(definitionsWithLayout, currentBreakpointKey)),
        [currentBreakpointKey, definitionsWithLayout, setLayoutState],
    )

    const handleItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange'] = useCallback(
        ({ detail }) => {
            setLayoutState(prev => {
                const nextHeightModeMemory: WidgetHeightModeMemory = { ...prev.heightModeMemory }
                const nextHeightModeById: Partial<Record<string, WidgetHeightMode>> = {
                    ...(nextHeightModeMemory[currentBreakpointKey] ?? {}),
                }
                const prevItemsById = new Map<string, BoardProps.Item<WidgetBoardItemData>>(
                    prev.items.map(item => [item.id as string, item]),
                )
                const nextItems = detail.items
                    .map(item => {
                        const widgetId = item.id as string
                        const definition = definitionsMap.get(widgetId)
                        if (!definition) return null

                        const defaultSize = definition.layout.defaultSize
                        const limits = definition.layout.limits
                        const columnSpan = item.columnSpan ?? defaultSize.columnSpan
                        const rowSpan = item.rowSpan ?? defaultSize.rowSpan
                        const columnOffset = item.columnOffset ?? defaultSize.columnOffset

                        const prevItem = prevItemsById.get(widgetId)
                        const prevRowSpan = prevItem?.rowSpan ?? defaultSize.rowSpan
                        const nextRowSpan = rowSpan

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

                        const data =
                            prevItem?.data && prevItem.data.title === definition.title
                                ? prevItem.data
                                : { id: definition.id, title: definition.title }
                        const itemDefinition =
                            prevItem?.definition &&
                            prevItem.definition.defaultColumnSpan === defaultSize.columnSpan &&
                            prevItem.definition.defaultRowSpan === defaultSize.rowSpan &&
                            prevItem.definition.minColumnSpan === limits?.minColumnSpan &&
                            prevItem.definition.minRowSpan === limits?.minRowSpan
                                ? prevItem.definition
                                : {
                                    defaultColumnSpan: defaultSize.columnSpan,
                                    defaultRowSpan: defaultSize.rowSpan,
                                    minColumnSpan: limits?.minColumnSpan,
                                    minRowSpan: limits?.minRowSpan,
                                }

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

                nextHeightModeMemory[currentBreakpointKey] = nextHeightModeById
                return { ...prev, items: nextItems, heightModeMemory: nextHeightModeMemory }
            })
        },
        [currentBreakpointKey, definitionsMap, measuredRowsRef, setLayoutState],
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
                        return { ...item, rowSpan: restored }
                    }

                    sizeMemory[id] = item.rowSpan ?? definition.layout.defaultSize.rowSpan ?? 2
                    const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
                    return { ...item, rowSpan: minRows }
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
    }, [currentBreakpointKey, definitionsMap, setLayoutState])

    return {
        handleItemsChange,
        hideItem,
        resetLayout,
        restoreHidden,
        toggleCollapse,
    }
}
