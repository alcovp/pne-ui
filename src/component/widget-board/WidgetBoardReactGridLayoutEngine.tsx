import React, { useCallback, useMemo } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import OpenWithRoundedIcon from '@mui/icons-material/OpenWithRounded'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { Box, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReactGridLayout, {
    getCompactor,
    useContainerWidth,
    type Compactor,
    type Layout,
    type LayoutItem,
    type ResizeHandleAxis,
} from 'react-grid-layout'
import { useTranslation } from 'react-i18next'
import 'react-grid-layout/css/styles.css'
import { WidgetBoardOrderEditor } from './WidgetBoardOrderEditor'
import type {
    WidgetBoardEditBehavior,
    WidgetBoardInteractionMode,
    WidgetBoardItemData,
    WidgetBoardReactGridLayoutCollisionBehavior,
    WidgetBoardReactGridLayoutCompaction,
    WidgetHeightMode,
} from './types'
import type { WidgetDefinitionWithLayout } from './widgetBoardLayoutUtils'
import type { WidgetBoardVisibilityItem } from './widgetBoardFabStore'

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
    collisionBehavior: WidgetBoardReactGridLayoutCollisionBehavior
    columns: number
    compaction: WidgetBoardReactGridLayoutCompaction
    containerPadding: readonly [number, number] | null
    editBehavior: WidgetBoardEditBehavior
    interactionMode: WidgetBoardInteractionMode
    isLoadingLayouts: boolean
    items: BoardProps.Item<WidgetBoardItemData>[]
    orderEditorItems: BoardProps.Item<WidgetBoardItemData>[]
    margin: readonly [number, number]
    minWidthPxByWidgetId: Partial<Record<string, number>>
    onItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange']
    onOrderChange: (orderedIds: string[]) => void
    onSetWidgetVisibility: (id: string, visible: boolean) => void
    renderItem: (item: BoardProps.Item<WidgetBoardItemData>) => React.ReactElement
    rowHeight: number
    useCSSTransforms: boolean
    visibilityItems: WidgetBoardVisibilityItem[]
    empty: React.ReactNode
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const neutralColor = '#5E7594'
const widgetHeaderHeight = 32
const resizeRailInset = 4
const resizeRailWidth = 32
type GridItemPixelPosition = {
    top: number
    left: number
    width: number
    height: number
}

export const resolveReactGridLayoutCompactor = (
    compaction: WidgetBoardReactGridLayoutCompaction,
    collisionBehavior: WidgetBoardReactGridLayoutCollisionBehavior,
): Compactor =>
    getCompactor(
        compaction === 'vertical' ? 'vertical' : null,
        false,
        collisionBehavior === 'prevent',
    )

export const getResizeMinColumnSpan = ({
    columns,
    containerPadding,
    containerWidth,
    margin,
    minWidthPx,
}: {
    columns: number
    containerPadding: readonly [number, number] | null
    containerWidth: number
    margin: readonly [number, number]
    minWidthPx: number
}) => {
    if (!Number.isFinite(minWidthPx) || minWidthPx <= 0 || columns <= 1) return 1
    const effectivePadding = containerPadding ?? margin
    const columnWidth =
        (containerWidth - margin[0] * (columns - 1) - effectivePadding[0] * 2) /
        columns
    if (!Number.isFinite(columnWidth) || columnWidth <= 0) return columns

    for (let span = 1; span <= columns; span += 1) {
        const width = columnWidth * span + margin[0] * (span - 1)
        if (width >= minWidthPx) return span
    }
    return columns
}

export const applyUserResizeMinWidths = ({
    columns,
    containerPadding,
    containerWidth,
    interactionMode,
    layout,
    margin,
    minWidthPxByWidgetId,
}: {
    columns: number
    containerPadding: readonly [number, number] | null
    containerWidth: number
    interactionMode: WidgetBoardInteractionMode
    layout: Layout
    margin: readonly [number, number]
    minWidthPxByWidgetId: Partial<Record<string, number>>
}): Layout => {
    if (interactionMode !== 'edit') return layout

    return layout.map(item => {
        const minWidthPx = minWidthPxByWidgetId[item.i]
        if (minWidthPx === undefined) return item
        const pixelMinW = getResizeMinColumnSpan({
            columns,
            containerPadding,
            containerWidth,
            margin,
            minWidthPx,
        })
        const minW = Math.min(columns, Math.max(item.minW ?? 1, pixelMinW))
        return minW === item.minW ? item : { ...item, minW }
    })
}

const transformPositionStrategy = {
    type: 'transform' as const,
    scale: 1,
    calcStyle: ({ top, left, width, height }: GridItemPixelPosition): React.CSSProperties => {
        const translate = `translate(${left}px,${top}px)`

        return {
            transform: translate,
            WebkitTransform: translate,
            MozTransform: translate,
            msTransform: translate,
            width: `${width}px`,
            height: `${height}px`,
            position: 'absolute',
        }
    },
}

const absolutePositionStrategy = {
    type: 'absolute' as const,
    scale: 1,
    calcStyle: ({ top, left, width, height }: GridItemPixelPosition): React.CSSProperties => ({
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
    }),
}

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

export const toReactGridLayout = (
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
            minH: height,
            maxH: height,
            static: interactionMode === 'view',
            isDraggable: interactionMode === 'edit',
            isResizable: interactionMode === 'edit',
        }
    })
}

export const toBoardItems = (
    layout: Layout,
    sourceItems: BoardProps.Item<WidgetBoardItemData>[],
    columns: number,
): BoardProps.Item<WidgetBoardItemData>[] => {
    const itemMap = new Map(sourceItems.map(item => [item.id as string, item]))
    const sourceOrder = new Map(sourceItems.map((item, index) => [item.id as string, index]))

    return [...layout]
        .filter(item => itemMap.has(item.i))
        .sort((a, b) => a.y - b.y || a.x - b.x || (sourceOrder.get(a.i) ?? 0) - (sourceOrder.get(b.i) ?? 0))
        .map(layoutItem => {
            const sourceItem = itemMap.get(layoutItem.i)
            if (!sourceItem) return null

            return {
                ...sourceItem,
                columnSpan: layoutItem.w,
                rowSpan: sourceItem.rowSpan,
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
    const { t } = useTranslation()
    const widgetId = item.id as string
    const contentOverflow = definition.contentFullHeight ? 'hidden' : heightMode === 'fixed' ? 'auto' : 'hidden'
    const showEditControls = interactionMode === 'edit'
    const canHide = definition.canHide !== false
    const hideLabel = t('pne.widgetBoard.visibility.hideWidget', {
        title: definition.title,
        defaultValue: 'Hide widget {{title}}',
    })

    const handleHide = (event: React.MouseEvent<HTMLButtonElement>) => {
        const board = event.currentTarget.closest<HTMLElement>('[data-pne-widget-board="true"]')
        const ownerDocument = event.currentTarget.ownerDocument
        const currentControls = board
            ? [...board.querySelectorAll<HTMLButtonElement>('[data-pne-widget-board-hide-widget="true"]')]
            : []
        const currentIndex = currentControls.indexOf(event.currentTarget)
        onHide(widgetId)
        if (typeof window === 'undefined') return
        window.requestAnimationFrame(() => {
            const remainingControls = board
                ? [...board.querySelectorAll<HTMLButtonElement>('[data-pne-widget-board-hide-widget="true"]')]
                : []
            const nextHideControl = remainingControls[
                Math.min(Math.max(currentIndex, 0), Math.max(remainingControls.length - 1, 0))
            ]
            const visibilityTrigger = ownerDocument.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-visibility-trigger="true"]',
            )
            const emptyStateAction = board?.querySelector<HTMLButtonElement>(
                '[data-pne-widget-board-empty-state="true"] button',
            )
            ;(nextHideControl ?? emptyStateAction ?? visibilityTrigger)?.focus()
        })
    }

    return (
        <Box
            data-pne-widget-board-rgl-item='true'
            data-pne-widget-board-item-id={widgetId}
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
                    borderBottom: 0,
                    cursor: showEditControls ? 'move' : 'default',
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
                    {showEditControls ? (
                        <OpenWithRoundedIcon
                            aria-hidden
                            sx={{ fontSize: 16, color: neutralColor, flex: '0 0 auto' }}
                        />
                    ) : null}
                    <Box component='span' sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {definition.title}
                    </Box>
                </Typography>
                {definition.settingsActions ? (
                    <Box
                        className='pne-widget-board-rgl-control'
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: '0 1 auto',
                            minWidth: 0,
                            ml: 1,
                        }}
                    >
                        {definition.settingsActions}
                    </Box>
                ) : null}
                {showEditControls && canHide ? (
                    <Box className='pne-widget-board-rgl-control' sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                        <IconButton
                            aria-label={hideLabel}
                            data-pne-widget-board-hide-widget='true'
                            onClick={handleHide}
                            size='small'
                            sx={{ color: neutralColor }}
                            title={hideLabel}
                        >
                            <VisibilityOffOutlinedIcon fontSize='small' />
                        </IconButton>
                    </Box>
                ) : null}
            </Box>
            {!isCollapsed ? (
                <Box
                    data-pne-widget-board-content-body='true'
                    sx={{
                        flex: '1 1 auto',
                        minHeight: 0,
                        boxSizing: 'border-box',
                        overflow: contentOverflow,
                    }}
                >
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

const WidgetBoardReactGridLayoutGrid = ({
    boardRootRef,
    collisionBehavior,
    columns,
    compaction,
    containerPadding,
    editBehavior,
    empty,
    interactionMode,
    isLoadingLayouts,
    items,
    margin,
    minWidthPxByWidgetId,
    onItemsChange,
    renderItem,
    rowHeight,
    useCSSTransforms,
}: WidgetBoardReactGridLayoutEngineProps) => {
    const { t } = useTranslation()
    const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1280 })
    const layout = useMemo(
        () =>
            applyUserResizeMinWidths({
                columns,
                containerPadding,
                containerWidth: width,
                interactionMode,
                layout: toReactGridLayout(items, columns, interactionMode),
                margin,
                minWidthPxByWidgetId,
            }),
        [
            columns,
            containerPadding,
            interactionMode,
            items,
            margin,
            minWidthPxByWidgetId,
            width,
        ],
    )
    const rowGap = margin[1] ?? 0
    const positionStrategy = useCSSTransforms ? transformPositionStrategy : absolutePositionStrategy
    const compactor = useMemo(
        () => resolveReactGridLayoutCompactor(compaction, collisionBehavior),
        [collisionBehavior, compaction],
    )
    const resizeWidthLabel = t('pne.widgetBoard.rgl.resizeWidth', {
        defaultValue: 'Drag to resize widget width',
    })
    const renderResizeHandle = useCallback(
        (axis: ResizeHandleAxis, ref: React.Ref<HTMLElement>) => (
            <span
                ref={ref as React.Ref<HTMLSpanElement>}
                className='react-resizable-handle pne-widget-board-rgl-resize-handle'
                data-pne-widget-board-resize-handle={axis}
                title={resizeWidthLabel}
            >
                {axis === 'w' ? (
                    <ChevronLeftRoundedIcon aria-hidden />
                ) : (
                    <ChevronRightRoundedIcon aria-hidden />
                )}
            </span>
        ),
        [resizeWidthLabel],
    )

    const emitItemsChange = useCallback(
        (nextItems: BoardProps.Item<WidgetBoardItemData>[]) => {
            const event = {
                detail: {
                    items: nextItems,
                },
            } as unknown as Parameters<typeof onItemsChange>[0]

            onItemsChange(event)
        },
        [onItemsChange],
    )

    const handleLayoutCommit = useCallback(
        (
            nextLayout: Layout,
            _oldItem: LayoutItem | null,
            changedItem: LayoutItem | null,
        ) => {
            const nextItems = toBoardItems(nextLayout, items, columns)
            if (boardItemsEqual(nextItems, items, columns)) return

            emitItemsChange(nextItems)
        },
        [columns, emitItemsChange, items],
    )

    return (
        <Box
            data-pne-widget-board='true'
            data-pne-widget-board-edit-behavior={interactionMode === 'edit' ? editBehavior : undefined}
            data-pne-widget-board-rgl-collision-behavior={collisionBehavior}
            data-pne-widget-board-rgl-compaction={compaction}
            ref={boardRootRef}
            sx={{
                '--pne-widget-board-row-height': `${rowHeight}px`,
                '--pne-widget-board-row-gap': `${rowGap}px`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                '& .react-grid-item.react-grid-placeholder': {
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    border: 0,
                    boxShadow: 'none',
                    outline: 'none',
                    opacity: 1,
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                },
                '& .react-grid-item > .react-resizable-handle.pne-widget-board-rgl-resize-handle': {
                    position: 'absolute',
                    top: `${widgetHeaderHeight}px`,
                    bottom: 0,
                    width: `${resizeRailWidth}px`,
                    height: 'auto',
                    m: 0,
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    borderRadius: '4px',
                    backgroundImage: 'none',
                    backgroundPosition: 'initial',
                    backgroundRepeat: 'no-repeat',
                    bgcolor: alpha(neutralColor, 0.04),
                    color: neutralColor,
                    cursor: 'ew-resize',
                    opacity: 1,
                    transform: 'none',
                    touchAction: 'none',
                    zIndex: 2,
                    transition: theme => theme.transitions.create(['background-color', 'color'], {
                        duration: theme.transitions.duration.shorter,
                    }),
                    '&:hover': {
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                    },
                    '&:active': {
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.14),
                        color: 'primary.main',
                    },
                    '& > svg': {
                        width: 24,
                        height: 24,
                        p: '2px',
                        boxSizing: 'border-box',
                        borderRadius: '4px',
                        bgcolor: '#fff',
                        boxShadow: `inset 0 0 0 1px ${alpha(neutralColor, 0.16)}`,
                        fontSize: 20,
                        color: 'inherit',
                        pointerEvents: 'none',
                    },
                    '&:hover > svg, &:active > svg': {
                        boxShadow: theme => `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.28)}`,
                    },
                    '&::after': {
                        content: 'none',
                        display: 'none',
                        width: 0,
                        height: 0,
                        border: 0,
                    },
                },
                '& .react-grid-item > [data-pne-widget-board-resize-handle="w"]': {
                    left: `${resizeRailInset}px`,
                },
                '& .react-grid-item > [data-pne-widget-board-resize-handle="e"]': {
                    right: `${resizeRailInset}px`,
                },
            }}
        >
            <Box ref={containerRef} sx={{ width: '100%' }}>
                {isLoadingLayouts ? (
                    <Box sx={{ p: 2, color: 'text.secondary' }}>Loading widgets...</Box>
                ) : mounted ? (
                    items.length === 0 ? empty : <Box>
                        <ReactGridLayout
                            autoSize
                            width={width}
                            layout={layout}
                            positionStrategy={positionStrategy}
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
                                handles: interactionMode === 'edit' ? ['e', 'w'] : [],
                                handleComponent: renderResizeHandle,
                            }}
                            compactor={compactor}
                            onDragStop={handleLayoutCommit}
                            onResizeStop={handleLayoutCommit}
                        >
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    style={{ height: '100%' }}
                                >
                                    {renderItem(item)}
                                </div>
                            ))}
                        </ReactGridLayout>
                    </Box>
                ) : null}
            </Box>
        </Box>
    )
}

export const WidgetBoardReactGridLayoutEngine = (props: WidgetBoardReactGridLayoutEngineProps) => {
    if (props.interactionMode === 'edit' && props.editBehavior === 'order-only') {
        return (
            <WidgetBoardOrderEditor
                boardRootRef={props.boardRootRef}
                isLoadingLayouts={props.isLoadingLayouts}
                items={props.orderEditorItems}
                onOrderChange={props.onOrderChange}
                onSetWidgetVisibility={props.onSetWidgetVisibility}
                rowGap={props.margin[1]}
                visibilityItems={props.visibilityItems}
            />
        )
    }

    return <WidgetBoardReactGridLayoutGrid {...props} />
}
