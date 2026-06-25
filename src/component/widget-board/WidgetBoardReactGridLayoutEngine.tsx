import React, { useCallback, useMemo } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import OpenWithRoundedIcon from '@mui/icons-material/OpenWithRounded'
import { Box, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReactGridLayout, { noCompactor, useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import type { WidgetBoardInteractionMode, WidgetBoardItemData, WidgetHeightMode } from './types'
import type { WidgetDefinitionWithLayout } from './widgetBoardLayoutUtils'

type WidgetBoardReactGridLayoutItemProps = {
    item: BoardProps.Item<WidgetBoardItemData>
    definition: WidgetDefinitionWithLayout
    heightMode: WidgetHeightMode
    isCollapsed: boolean
    interactionMode: WidgetBoardInteractionMode
    onContentRef: (widgetId: string, node: HTMLDivElement | null) => void
    onHide: (widgetId: string) => void
}

type WidgetBoardReactGridLayoutEngineProps = {
    boardRootRef: React.Ref<HTMLDivElement>
    columns: number
    containerPadding: readonly [number, number] | null
    interactionMode: WidgetBoardInteractionMode
    isLoadingLayouts: boolean
    items: BoardProps.Item<WidgetBoardItemData>[]
    margin: readonly [number, number]
    onItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange']
    renderItem: (item: BoardProps.Item<WidgetBoardItemData>) => React.ReactElement
    rowHeight: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const neutralColor = '#5E7594'

const getItemColumnSpan = (item: BoardProps.Item<WidgetBoardItemData>, columns: number) => {
    const minColumnSpan = item.definition?.minColumnSpan ?? 1
    const columnSpan = item.columnSpan ?? item.definition?.defaultColumnSpan ?? minColumnSpan
    return clamp(columnSpan, minColumnSpan, columns)
}

const getItemRowSpan = (item: BoardProps.Item<WidgetBoardItemData>) => {
    const minRowSpan = item.definition?.minRowSpan ?? 1
    const rowSpan = item.rowSpan ?? item.definition?.defaultRowSpan ?? minRowSpan
    return Math.max(minRowSpan, rowSpan)
}

const getColumnOffset = (item: BoardProps.Item<WidgetBoardItemData>, columns: number, currentOffset: number, columnHeights: number[]) => {
    const columnSpan = getItemColumnSpan(item, columns)
    const itemOffset = item.columnOffset?.[columns]

    if (typeof itemOffset === 'number' && itemOffset >= 0 && itemOffset + columnSpan <= columns) {
        return itemOffset
    }

    const getRowOffset = (columnOffset: number) => {
        let rowOffset = 0
        for (let column = columnOffset; column < columnOffset + columnSpan; column += 1) {
            rowOffset = Math.max(rowOffset, columnHeights[column] ?? 0)
        }
        return rowOffset
    }

    const fullRowOffset = () => getRowOffset(0)

    for (let columnOffset = currentOffset; columnOffset + columnSpan <= columns; columnOffset += 1) {
        if (getRowOffset(columnOffset) + getItemRowSpan(item) <= fullRowOffset()) {
            return columnOffset
        }
    }

    for (let columnOffset = 0; columnOffset + columnSpan <= columns; columnOffset += 1) {
        if (getRowOffset(columnOffset) + getItemRowSpan(item) <= fullRowOffset()) {
            return columnOffset
        }
    }

    return 0
}

const toReactGridLayout = (
    items: BoardProps.Item<WidgetBoardItemData>[],
    columns: number,
    interactionMode: WidgetBoardInteractionMode,
): Layout => {
    const columnHeights = Array(columns).fill(0)
    let currentColumnOffset = 0

    return items.map(item => {
        const width = getItemColumnSpan(item, columns)
        const height = getItemRowSpan(item)
        const x = getColumnOffset(item, columns, currentColumnOffset, columnHeights)
        let y = 0

        for (let column = x; column < x + width; column += 1) {
            y = Math.max(y, columnHeights[column] ?? 0)
        }

        for (let column = x; column < x + width; column += 1) {
            columnHeights[column] = y + height
        }

        currentColumnOffset = x + width

        return {
            i: item.id as string,
            x,
            y,
            w: width,
            h: height,
            minW: item.definition?.minColumnSpan,
            minH: item.definition?.minRowSpan,
            static: interactionMode === 'view',
            isDraggable: interactionMode === 'edit',
            isResizable: interactionMode === 'edit',
        }
    })
}

const toBoardItems = (
    layout: Layout,
    sourceItems: BoardProps.Item<WidgetBoardItemData>[],
    columns: number,
): BoardProps.Item<WidgetBoardItemData>[] => {
    const itemMap = new Map(sourceItems.map(item => [item.id as string, item]))

    return [...layout]
        .filter(item => itemMap.has(item.i))
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(layoutItem => {
            const sourceItem = itemMap.get(layoutItem.i)
            if (!sourceItem) return null

            return {
                ...sourceItem,
                columnSpan: layoutItem.w,
                rowSpan: layoutItem.h,
                columnOffset: {
                    ...sourceItem.columnOffset,
                    [columns]: layoutItem.x,
                },
            }
        })
        .filter(Boolean) as BoardProps.Item<WidgetBoardItemData>[]
}

const boardItemsEqual = (a: BoardProps.Item<WidgetBoardItemData>[], b: BoardProps.Item<WidgetBoardItemData>[], columns: number) =>
    a.length === b.length &&
    a.every((item, index) => {
        const other = b[index]
        return (
            item.id === other?.id &&
            item.columnSpan === other.columnSpan &&
            item.rowSpan === other.rowSpan &&
            item.columnOffset?.[columns] === other.columnOffset?.[columns]
        )
    })

export const WidgetBoardReactGridLayoutItem = ({
    item,
    definition,
    heightMode,
    isCollapsed,
    interactionMode,
    onContentRef,
    onHide,
}: WidgetBoardReactGridLayoutItemProps) => {
    const widgetId = item.id as string
    const contentOverflow = definition.contentFullHeight ? 'hidden' : heightMode === 'fixed' ? 'auto' : 'hidden'
    const showControls = interactionMode === 'edit'

    return (
        <Box
            data-pne-widget-board-rgl-item='true'
            sx={{
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fff',
                border: 0,
                borderRadius: 0,
                boxShadow: 'none',
            }}
        >
            <Box
                className='pne-widget-board-rgl-drag-handle'
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 32,
                    minHeight: 32,
                    px: 1.5,
                    pr: 0.25,
                    py: 0,
                    boxSizing: 'border-box',
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
                    cursor: showControls ? 'move' : 'default',
                }}
            >
                <Typography
                    component='h3'
                    sx={{
                        flex: '1 1 min-content',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: '20px',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    {showControls ? (
                        <OpenWithRoundedIcon
                            aria-hidden
                            sx={{ fontSize: 16, color: neutralColor, flex: '0 0 auto' }}
                        />
                    ) : null}
                    <Box component='span' sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {definition.title}
                    </Box>
                </Typography>
                {showControls ? (
                    <Box className='pne-widget-board-rgl-control' sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                        <IconButton
                            aria-label='Remove widget'
                            onClick={() => onHide(widgetId)}
                            size='small'
                            sx={{ color: neutralColor }}
                        >
                            <DeleteOutlineRoundedIcon fontSize='small' />
                        </IconButton>
                    </Box>
                ) : null}
            </Box>
            {!isCollapsed ? (
                <Box sx={{ flex: '1 1 auto', minHeight: 0, boxSizing: 'border-box', overflow: contentOverflow }}>
                    <Box
                        ref={(node: HTMLDivElement | null) => onContentRef(widgetId, node)}
                        data-widget-id={widgetId}
                        sx={{
                            p: 0,
                            boxSizing: 'border-box',
                            height: definition.contentFullHeight ? '100%' : 'auto',
                            minHeight: definition.contentFullHeight ? 0 : undefined,
                            display: definition.contentFullHeight ? 'flex' : 'block',
                            flexDirection: definition.contentFullHeight ? 'column' : undefined,
                        }}
                    >
                        {definition.render()}
                    </Box>
                </Box>
            ) : null}
        </Box>
    )
}

export const WidgetBoardReactGridLayoutEngine = ({
    boardRootRef,
    columns,
    containerPadding,
    interactionMode,
    isLoadingLayouts,
    items,
    margin,
    onItemsChange,
    renderItem,
    rowHeight,
}: WidgetBoardReactGridLayoutEngineProps) => {
    const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1280 })
    const layout = useMemo(() => toReactGridLayout(items, columns, interactionMode), [columns, interactionMode, items])

    const handleLayoutCommit = useCallback(
        (nextLayout: Layout) => {
            const nextItems = toBoardItems(nextLayout, items, columns)
            if (boardItemsEqual(nextItems, items, columns)) return

            const event = {
                detail: {
                    items: nextItems,
                },
            } as unknown as Parameters<typeof onItemsChange>[0]

            onItemsChange(event)
        },
        [columns, items, onItemsChange],
    )

    return (
        <Box data-pne-widget-board='true' ref={boardRootRef} sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {isLoadingLayouts ? (
                <Box sx={{ p: 2, color: 'text.secondary' }}>Loading widgets...</Box>
            ) : (
                <Box ref={containerRef} sx={{ width: '100%' }}>
                    {mounted ? (
                        <ReactGridLayout
                            autoSize
                            width={width}
                            layout={layout}
                            gridConfig={{
                                cols: columns,
                                rowHeight,
                                margin,
                                containerPadding,
                                maxRows: Number.POSITIVE_INFINITY,
                            }}
                            dragConfig={{
                                enabled: interactionMode === 'edit',
                                handle: '.pne-widget-board-rgl-drag-handle',
                                cancel: '.pne-widget-board-rgl-control',
                            }}
                            resizeConfig={{
                                enabled: interactionMode === 'edit',
                                handles: interactionMode === 'edit' ? ['se'] : [],
                            }}
                            compactor={noCompactor}
                            onDragStop={handleLayoutCommit}
                            onResizeStop={handleLayoutCommit}
                        >
                            {items.map(item => (
                                <div key={item.id} style={{ height: '100%' }}>
                                    {renderItem(item)}
                                </div>
                            ))}
                        </ReactGridLayout>
                    ) : null}
                </Box>
            )}
        </Box>
    )
}
