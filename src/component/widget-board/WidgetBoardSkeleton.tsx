import React, { useMemo } from 'react'
import Board, { type BoardProps } from '@cloudscape-design/board-components/board'
import BoardItem from '@cloudscape-design/board-components/board-item'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { Box, IconButton, Skeleton, Stack } from '@mui/material'
import { boardItemI18nStrings, createBoardI18nStrings } from '../cloudscape/boardI18n'
import type { WidgetBoardItemData } from './types'

const skeletonItems: BoardProps.Item<WidgetBoardItemData>[] = [
    {
        id: 'skeleton-1',
        columnSpan: 6,
        rowSpan: 3,
        data: { id: 'skeleton-1', title: '' },
        definition: { defaultColumnSpan: 6, defaultRowSpan: 3 },
    },
    {
        id: 'skeleton-2',
        columnSpan: 6,
        rowSpan: 3,
        data: { id: 'skeleton-2', title: '' },
        definition: { defaultColumnSpan: 6, defaultRowSpan: 3 },
    },
    {
        id: 'skeleton-3',
        columnSpan: 6,
        rowSpan: 3,
        data: { id: 'skeleton-3', title: '' },
        definition: { defaultColumnSpan: 6, defaultRowSpan: 3 },
    },
    {
        id: 'skeleton-4',
        columnSpan: 6,
        rowSpan: 3,
        data: { id: 'skeleton-4', title: '' },
        definition: { defaultColumnSpan: 6, defaultRowSpan: 3 },
    },
]

export const WidgetBoardSkeleton = () => {
    const boardI18nStrings = useMemo(
        () => createBoardI18nStrings<WidgetBoardItemData>(item => item.data.title || 'Loading widget'),
        [],
    )

    const renderSkeletonItem = (item: BoardProps.Item<WidgetBoardItemData>) => (
        <BoardItem
            key={item.id}
            i18nStrings={boardItemI18nStrings}
            header={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        py: 0.5,
                    }}
                >
                    <Skeleton variant='rounded' width='50%' height={18} sx={{ borderRadius: 1 }} />
                </Box>
            }
            settings={
                <Stack direction='row' spacing={0.5} alignItems='center'>
                    <IconButton aria-label='Collapse widget' size='small' sx={{ color: 'rgba(78, 93, 120, 1)' }} disabled>
                        <ExpandLessIcon fontSize='small' />
                    </IconButton>
                    <IconButton aria-label='Hide widget' size='small' sx={{ color: 'rgba(78, 93, 120, 1)' }} disabled>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </Stack>
            }
            disableContentPaddings
        >
            <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <Skeleton variant='rounded' width='40%' height={18} sx={{ mb: 1, borderRadius: 1 }} />
                <Skeleton variant='rounded' width='90%' height={12} sx={{ mb: 0.5, borderRadius: 1 }} />
                <Skeleton variant='rounded' width='80%' height={12} sx={{ mb: 0.5, borderRadius: 1 }} />
                <Skeleton variant='rounded' width='100%' height={70} sx={{ mt: 1, borderRadius: 1 }} />
            </Box>
        </BoardItem>
    )

    return (
        <Box sx={{ pointerEvents: 'none' }}>
            <Board<WidgetBoardItemData>
                items={skeletonItems}
                renderItem={renderSkeletonItem}
                i18nStrings={boardI18nStrings}
                onItemsChange={() => {}}
                empty={<></>}
            />
        </Box>
    )
}
