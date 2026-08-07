import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'

type WidgetBoardEmptyStateProps = {
    hasHiddenWidgets: boolean
    onShowAll: () => void
}

export const WidgetBoardEmptyState: React.FC<WidgetBoardEmptyStateProps> = ({
    hasHiddenWidgets,
    onShowAll,
}) => {
    const { t } = useTranslation()

    return (
        <Box
            data-pne-widget-board-empty-state='true'
            sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 160, p: 2 }}
        >
            <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 440, textAlign: 'center' }}>
                <Typography component='h3' sx={{ fontSize: 16, fontWeight: 600, lineHeight: '22px' }}>
                    {t('pne.widgetBoard.visibility.emptyTitle', { defaultValue: 'No widgets are shown' })}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: '20px' }}>
                    {hasHiddenWidgets
                        ? t('pne.widgetBoard.visibility.emptyDescription', {
                            defaultValue: 'Show widgets to add them back to this layout.',
                        })
                        : t('pne.widgetBoard.visibility.emptyUnavailable', {
                            defaultValue: 'No widgets are available for this board.',
                        })}
                </Typography>
                {hasHiddenWidgets ? (
                    <PneButton onClick={onShowAll} pneStyle='outlined' size='small'>
                        {t('pne.widgetBoard.visibility.showAll', { defaultValue: 'Show all' })}
                    </PneButton>
                ) : null}
            </Stack>
        </Box>
    )
}

export default WidgetBoardEmptyState
