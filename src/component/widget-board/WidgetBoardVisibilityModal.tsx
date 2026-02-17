import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import { PneCheckbox } from '../PneCheckbox'
import PneModal from '../PneModal'
import type { WidgetBoardVisibilityItem } from './widgetBoardFabStore'

export type WidgetBoardVisibilityModalProps = {
    open: boolean
    onClose: () => void
    items: WidgetBoardVisibilityItem[]
    onSetWidgetVisibility?: (id: string, visible: boolean) => void
}

export const WidgetBoardVisibilityModal: React.FC<WidgetBoardVisibilityModalProps> = ({
    open,
    onClose,
    items,
    onSetWidgetVisibility,
}) => {
    const { t } = useTranslation()
    const modalTitle = t('pne.widgetBoard.visibility.title', { defaultValue: 'Widget visibility' })
    const closeLabel = t('pne.widgetBoard.visibility.close', { defaultValue: 'Close' })
    const emptyLabel = t('pne.widgetBoard.visibility.empty', { defaultValue: 'No widgets available' })

    return (
        <PneModal open={open} onClose={onClose} title={modalTitle}>
            <Stack spacing={2}>
                {items.length === 0 ? (
                    <Typography sx={{ fontSize: '14px', lineHeight: '20px', color: 'text.secondary' }}>{emptyLabel}</Typography>
                ) : (
                    <Stack spacing={0.5} sx={{ maxHeight: 420, overflowY: 'auto' }}>
                        {items.map(item => (
                            <Box
                                key={item.id}
                                role='button'
                                tabIndex={0}
                                onClick={() => onSetWidgetVisibility?.(item.id, !item.visible)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        onSetWidgetVisibility?.(item.id, !item.visible)
                                    }
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    minHeight: 32,
                                    cursor: onSetWidgetVisibility ? 'pointer' : 'default',
                                    borderRadius: 0.5,
                                    px: 0.5,
                                    '&:hover': onSetWidgetVisibility
                                        ? {
                                            bgcolor: theme => theme.palette.action.hover,
                                        }
                                        : undefined,
                                }}
                            >
                                <PneCheckbox
                                    checked={item.visible}
                                    onClick={event => {
                                        event.stopPropagation()
                                    }}
                                    onChange={event => {
                                        onSetWidgetVisibility?.(item.id, event.target.checked)
                                    }}
                                />
                                <Typography sx={{ fontSize: '14px', lineHeight: '20px' }}>{item.title}</Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <PneButton
                        pneStyle='text'
                        size='small'
                        onClick={onClose}
                        sx={{ height: 32, fontSize: '14px', lineHeight: '20px' }}
                    >
                        {closeLabel}
                    </PneButton>
                </Box>
            </Stack>
        </PneModal>
    )
}

export default WidgetBoardVisibilityModal
