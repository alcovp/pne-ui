import React, { useMemo } from 'react'
import Board, { type BoardProps } from '@cloudscape-design/board-components/board'
import { Box } from '@mui/material'
import { CloudscapeBoardStyles } from '../cloudscape/CloudscapeBoardStyles'
import { CloudscapeThemeProvider } from '../cloudscape/CloudscapeThemeProvider'
import { createBoardI18nStrings } from '../cloudscape/boardI18n'
import { WidgetBoardSkeleton } from './WidgetBoardSkeleton'
import type { WidgetBoardItemData } from './types'

export type WidgetBoardCloudscapeEngineProps = {
    boardRootRef: React.Ref<HTMLDivElement>
    items: BoardProps.Item<WidgetBoardItemData>[]
    isLoadingLayouts: boolean
    onItemsChange: BoardProps<WidgetBoardItemData>['onItemsChange']
    renderItem: (item: BoardProps.Item<WidgetBoardItemData>) => React.ReactElement
}

/**
 * Deprecated compatibility engine kept only for explicit rollback while downstream
 * widget boards migrate to the default React Grid Layout engine.
 */
export const WidgetBoardCloudscapeEngine = ({
    boardRootRef,
    items,
    isLoadingLayouts,
    onItemsChange,
    renderItem,
}: WidgetBoardCloudscapeEngineProps) => {
    const boardI18nStrings = useMemo(() => createBoardI18nStrings<WidgetBoardItemData>(item => item.data.title), [])

    const boardElement = (
        <Board<WidgetBoardItemData>
            items={items}
            renderItem={renderItem}
            i18nStrings={boardI18nStrings}
            onItemsChange={onItemsChange}
            empty={<Box sx={{ p: 2, color: 'text.secondary' }}>No widgets available</Box>}
        />
    )

    return (
        <CloudscapeThemeProvider>
            <CloudscapeBoardStyles hideNavigationArrows />
            <Box data-pne-widget-board='true' ref={boardRootRef} sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoadingLayouts ? <WidgetBoardSkeleton /> : boardElement}
            </Box>
        </CloudscapeThemeProvider>
    )
}
