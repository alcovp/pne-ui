import React, { useCallback, useState } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import {
    DragDropContext,
    Draggable,
    Droppable,
    type DropResult,
    type ResponderProvided,
} from '@hello-pangea/dnd'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import OpenWithRoundedIcon from '@mui/icons-material/OpenWithRounded'
import { Box, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { WidgetBoardItemData } from './types'

const ORDER_ONLY_ROW_HEIGHT = 48
const neutralColor = '#5E7594'

type WidgetBoardOrderEditorProps = {
    boardRootRef: React.Ref<HTMLDivElement>
    isLoadingLayouts: boolean
    items: BoardProps.Item<WidgetBoardItemData>[]
    onItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange']
    rowGap?: number
}

export const reorderWidgetBoardItems = <T,>(
    items: T[],
    sourceIndex: number,
    destinationIndex: number,
): T[] => {
    if (
        sourceIndex === destinationIndex ||
        sourceIndex < 0 ||
        destinationIndex < 0 ||
        sourceIndex >= items.length ||
        destinationIndex >= items.length
    ) {
        return items
    }

    const nextItems = [...items]
    const [movedItem] = nextItems.splice(sourceIndex, 1)
    nextItems.splice(destinationIndex, 0, movedItem)
    return nextItems
}

export const WidgetBoardOrderEditor = ({
    boardRootRef,
    isLoadingLayouts,
    items,
    onItemsChange,
    rowGap = 0,
}: WidgetBoardOrderEditorProps) => {
    const [orderAnnouncement, setOrderAnnouncement] = useState('')

    const emitReorder = useCallback(
        (
            sourceIndex: number,
            destinationIndex: number,
            announce?: ResponderProvided['announce'],
        ) => {
            const nextItems = reorderWidgetBoardItems(items, sourceIndex, destinationIndex)
            if (nextItems === items) return

            const movedItem = items[sourceIndex]
            const event = {
                detail: {
                    items: nextItems,
                    movedItem,
                },
            } as unknown as Parameters<typeof onItemsChange>[0]

            onItemsChange(event)
            const message =
                `${movedItem.data.title} moved to position ${destinationIndex + 1} of ${nextItems.length}`
            if (announce) {
                announce(message)
            } else {
                setOrderAnnouncement(message)
            }
        },
        [items, onItemsChange],
    )

    const handleDragEnd = useCallback(
        ({ destination, source }: DropResult, { announce }: ResponderProvided) => {
            if (!destination) return
            emitReorder(source.index, destination.index, announce)
        },
        [emitReorder],
    )

    const handleMove = useCallback(
        (widgetId: string, direction: -1 | 1) => {
            const sourceIndex = items.findIndex(item => item.id === widgetId)
            emitReorder(sourceIndex, sourceIndex + direction)
        },
        [emitReorder, items],
    )

    return (
        <Box
            data-pne-widget-board='true'
            data-pne-widget-board-edit-behavior='order-only'
            data-pne-widget-board-order-editor='true'
            ref={boardRootRef}
            sx={{
                '--pne-widget-board-row-height': `${ORDER_ONLY_ROW_HEIGHT}px`,
                '--pne-widget-board-row-gap': `${rowGap}px`,
                position: 'relative',
            }}
        >
            {isLoadingLayouts ? (
                <Box sx={{ p: 2, color: 'text.secondary' }}>Loading widgets...</Box>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId='pne-widget-board-order-editor' direction='vertical'>
                        {provided => (
                            <Box
                                {...provided.droppableProps}
                                aria-label='Widget order'
                                ref={provided.innerRef}
                                role='list'
                                sx={{ width: '100%' }}
                            >
                                {items.map((item, index) => {
                                    const widgetId = item.id as string
                                    const title = item.data.title

                                    return (
                                        <Draggable
                                            draggableId={widgetId}
                                            index={index}
                                            key={widgetId}
                                        >
                                            {(draggableProvided, snapshot) => {
                                                const draggableStyle = snapshot.isDropAnimating
                                                    ? {
                                                        ...draggableProvided.draggableProps.style,
                                                        transitionDuration: '0.001s',
                                                    }
                                                    : draggableProvided.draggableProps.style

                                                return (
                                                    <Box
                                                        {...draggableProvided.draggableProps}
                                                        aria-posinset={index + 1}
                                                        aria-setsize={items.length}
                                                        data-pne-widget-board-item-id={widgetId}
                                                        data-pne-widget-board-order-only-item='true'
                                                        ref={draggableProvided.innerRef}
                                                        role='listitem'
                                                        style={draggableStyle}
                                                        sx={{
                                                            alignItems: 'center',
                                                            bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
                                                            borderBottom: '1px solid',
                                                            borderColor: 'divider',
                                                            boxShadow: snapshot.isDragging ? 3 : 'none',
                                                            boxSizing: 'border-box',
                                                            display: 'flex',
                                                            height: ORDER_ONLY_ROW_HEIGHT,
                                                            mb: `${rowGap}px`,
                                                            minHeight: ORDER_ONLY_ROW_HEIGHT,
                                                            pl: 0,
                                                            pr: 0.25,
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        <Box
                                                            {...draggableProvided.dragHandleProps}
                                                            aria-label={`Drag ${title} to reorder`}
                                                            component='span'
                                                            title={`Drag ${title} to reorder`}
                                                            sx={{
                                                                alignItems: 'center',
                                                                alignSelf: 'stretch',
                                                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                                                display: 'flex',
                                                                flex: '0 0 auto',
                                                                justifyContent: 'center',
                                                                minHeight: 44,
                                                                minWidth: 44,
                                                            }}
                                                        >
                                                            <OpenWithRoundedIcon
                                                                aria-hidden
                                                                sx={{ fontSize: 18, color: neutralColor }}
                                                            />
                                                        </Box>
                                                        <Typography
                                                            component='h3'
                                                            sx={{
                                                                alignItems: 'center',
                                                                color: 'primary.main',
                                                                display: 'flex',
                                                                flex: '1 1 min-content',
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                lineHeight: '20px',
                                                                minWidth: 0,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {title}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flex: '0 0 auto' }}>
                                                            <IconButton
                                                                aria-label={`Move ${title} up`}
                                                                disabled={index === 0}
                                                                onClick={() => handleMove(widgetId, -1)}
                                                                size='small'
                                                                sx={{ color: neutralColor }}
                                                            >
                                                                <ArrowUpwardRoundedIcon fontSize='small' />
                                                            </IconButton>
                                                            <IconButton
                                                                aria-label={`Move ${title} down`}
                                                                disabled={index === items.length - 1}
                                                                onClick={() => handleMove(widgetId, 1)}
                                                                size='small'
                                                                sx={{ color: neutralColor }}
                                                            >
                                                                <ArrowDownwardRoundedIcon fontSize='small' />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                )
                                            }}
                                        </Draggable>
                                    )
                                })}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
            <Box
                aria-live='polite'
                sx={{
                    border: 0,
                    clip: 'rect(0 0 0 0)',
                    height: 1,
                    margin: -1,
                    overflow: 'hidden',
                    padding: 0,
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    width: 1,
                }}
            >
                {orderAnnouncement}
            </Box>
        </Box>
    )
}
