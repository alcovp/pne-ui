import React from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import BoardItem from '@cloudscape-design/board-components/board-item'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { boardItemI18nStrings } from '../cloudscape/boardI18n'
import type { WidgetBoardItemData, WidgetHeightMode } from './types'
import type { WidgetDefinitionWithLayout } from './widgetBoardLayoutUtils'

type WidgetContentProps = {
    render: () => React.ReactNode
    dragLock: boolean
}

const WidgetContent = React.memo(
    function WidgetContent({ render }: WidgetContentProps) {
        return <>{render()}</>
    },
    (prev, next) => {
        if (next.dragLock) return true
        if (prev.dragLock !== next.dragLock) return false
        return prev.render === next.render
    },
)

type WidgetBoardItemProps = {
    item: BoardProps.Item<WidgetBoardItemData>
    definition: WidgetDefinitionWithLayout
    heightMode: WidgetHeightMode
    isCollapsed: boolean
    isInteractionLocked: boolean
    onContentRef: (widgetId: string, node: HTMLDivElement | null) => void
    onHide: (widgetId: string) => void
    onToggleCollapse: (widgetId: string) => void
}

export const WidgetBoardItem = ({
    item,
    definition,
    heightMode,
    isCollapsed,
    isInteractionLocked,
    onContentRef,
    onHide,
    onToggleCollapse,
}: WidgetBoardItemProps) => {
    const widgetId = item.id as string
    const contentOverflow = definition.contentFullHeight ? 'hidden' : heightMode === 'fixed' ? 'auto' : 'hidden'
    const boardItemDataAttributes = { 'data-height-mode': heightMode, 'data-collapsed': isCollapsed ? 'true' : 'false' } as any

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
                onClick={() => onToggleCollapse(widgetId)}
                size='small'
                sx={{ color: 'rgba(78, 93, 120, 1)' }}
            >
                {isCollapsed ? <ExpandMoreRoundedIcon fontSize='medium' /> : <ExpandLessRoundedIcon fontSize='medium' />}
            </IconButton>
            <IconButton aria-label='Hide widget' onClick={() => onHide(widgetId)} size='small' sx={{ color: 'rgba(78, 93, 120, 1)' }}>
                <CloseRoundedIcon fontSize='medium' />
            </IconButton>
        </Stack>
    )

    return (
        <BoardItem
            {...boardItemDataAttributes}
            key={item.id}
            i18nStrings={boardItemI18nStrings}
            header={headerElement}
            settings={settingsElement}
            disableContentPaddings
        >
            {!isCollapsed ? (
                <Box sx={{ height: '100%', boxSizing: 'border-box', overflow: contentOverflow }}>
                    <Box
                        ref={(node: HTMLDivElement | null) => onContentRef(widgetId, node)}
                        data-widget-id={widgetId}
                        sx={{
                            p: 2,
                            boxSizing: 'border-box',
                            height: definition.contentFullHeight ? '100%' : 'auto',
                            minHeight: definition.contentFullHeight ? 0 : undefined,
                            display: definition.contentFullHeight ? 'flex' : 'block',
                            flexDirection: definition.contentFullHeight ? 'column' : undefined,
                        }}
                    >
                        <WidgetContent render={definition.render} dragLock={isInteractionLocked} />
                    </Box>
                </Box>
            ) : null}
        </BoardItem>
    )
}
