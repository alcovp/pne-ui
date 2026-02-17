import React, { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { usePneConfirm } from '../confirm'
import PneModal from '../PneModal'
import PneTextField from '../PneTextField'
import PneButton from '../PneButton'

export type WidgetLayoutOption = {
    id: string
    name: string
}

export type WidgetLayoutAddInfo = {
    basedOnName?: string
}

export type WidgetLayoutsPanelProps = {
    items?: WidgetLayoutOption[]
    selectedId?: string
    onSelect?: (id: string) => void
    onDelete?: (id: string) => void
    onAdd?: (name: string) => void
    addInfo?: WidgetLayoutAddInfo
    addLabel?: React.ReactNode
    className?: string
    lockedIds?: string[]
}

export const WidgetLayoutsPanel: React.FC<WidgetLayoutsPanelProps> = ({
    items,
    selectedId,
    onSelect,
    onDelete,
    onAdd,
    addInfo,
    addLabel,
    className,
    lockedIds = [],
}) => {
    const { t } = useTranslation()
    const { confirm } = usePneConfirm()

    const resolvedItems = items ?? []
    const resolvedSelectedId = selectedId
    const resolvedOnSelect = onSelect
    const resolvedOnDelete = onDelete
    const resolvedOnAdd = onAdd
    const resolvedAddInfo = addInfo
    const resolvedLockedIds = lockedIds
    const resolvedAddLabel = addLabel ?? t('pne.widgetBoard.layouts.add', { defaultValue: 'Add new layout' })
    const title = t('pne.widgetBoard.layouts.title', { defaultValue: 'Layouts' })
    const emptyLabel = t('pne.widgetBoard.layouts.empty', { defaultValue: 'No layouts yet' })
    const modalTitle = t('pne.widgetBoard.layouts.newTitle', { defaultValue: 'New layout' })
    const templateNameLabel = t('pne.widgetBoard.layouts.templateName', { defaultValue: 'Template name' })
    const cancelLabel = t('pne.widgetBoard.layouts.cancel', { defaultValue: 'Cancel' })
    const saveLabel = t('pne.widgetBoard.layouts.save', { defaultValue: 'Save' })
    const basedOnLabel = t('pne.widgetBoard.layouts.basedOn', { defaultValue: 'Will inherit from' })
    const deleteConfirmTitle = t('react.confirm-alert.title.are-you-sure', { defaultValue: 'Are you sure?' })
    const deleteConfirmLabel = t('react.confirm-alert.yes.delete', { defaultValue: 'Remove' })
    const deleteCancelLabel = t('react.confirm-alert.no.cancel', { defaultValue: 'Cancel' })

    const [modalOpen, setModalOpen] = useState(false)
    const [name, setName] = useState('')

    const handleSave = () => {
        const trimmed = name.trim()
        if (!trimmed || !resolvedOnAdd) return
        resolvedOnAdd(trimmed)
        setName('')
        setModalOpen(false)
    }

    const hasAdd = Boolean(resolvedOnAdd)
    const handleDelete = (item: WidgetLayoutOption) => {
        if (!resolvedOnDelete) return
        void confirm({
            title: deleteConfirmTitle,
            message: t('pne.widgetBoard.confirm.deleteLayout', { defaultValue: 'Delete layout "{{name}}"?', name: item.name }),
            confirmLabel: deleteConfirmLabel,
            cancelLabel: deleteCancelLabel,
        }).then(accepted => {
            if (accepted) {
                resolvedOnDelete(item.id)
            }
        })
    }

    return (
        <Box
            sx={{ width: 320, maxWidth: '100%', bgcolor: '#fff', fontSize: '14px', lineHeight: '20px' }}
            className={className}
            onKeyDown={event => {
                // Блокируем всплытие, чтобы хоткеи/навигация обёртывающего меню (FAB) не крали ввод из инпутов панели
                event.stopPropagation()
            }}
        >
            <Box
                sx={{
                    bgcolor: '#fff',
                    color: '#8A94A6',
                    px: 2,
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #0000001F',
                }}
            >
                <Typography variant='subtitle2' sx={{ lineHeight: '20px', fontWeight: 400, fontSize: '14px' }}>
                    {title}
                </Typography>
            </Box>
            <Stack>
                {resolvedItems.length === 0 ? (
                    <Box sx={{ px: 2, minHeight: 32, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>{emptyLabel}</Box>
                ) : (
                    resolvedItems.map(item => {
                        const selected = item.id === resolvedSelectedId
                        const locked = resolvedLockedIds.includes(item.id)
                        return (
                            <Box
                                key={item.id}
                                onClick={() => resolvedOnSelect?.(item.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 2,
                                    minHeight: 32,
                                    cursor: resolvedOnSelect ? 'pointer' : 'default',
                                    bgcolor: selected ? '#EFF2F5' : '#fff',
                                    color: selected ? 'primary.main' : 'text.primary',
                                    transition: 'background-color 0.2s ease, color 0.2s ease',
                                    '&:hover': resolvedOnSelect
                                        ? {
                                            bgcolor: selected ? '#EFF2F5' : theme => theme.palette.action.hover,
                                        }
                                        : undefined,
                                }}
                            >
                                <Box sx={{ flex: 1, fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}>{item.name}</Box>
                                {resolvedOnDelete && !locked ? (
                                    <IconButton
                                        size='small'
                                        color='inherit'
                                        onClick={event => {
                                            event.stopPropagation()
                                            handleDelete(item)
                                        }}
                                    >
                                        <DeleteIcon fontSize='small' />
                                    </IconButton>
                                ) : null}
                            </Box>
                        )
                    })
                )}
            </Stack>
            {hasAdd ? (
                <Box>
                    <PneButton
                        fullWidth
                        pneStyle='text'
                        size='small'
                        onClick={() => setModalOpen(true)}
                        sx={{
                            height: 32,
                            justifyContent: 'flex-start',
                            px: 2,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: 'primary.main',
                            textDecoration: 'none',
                            minWidth: 0,
                            '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'none',
                            },
                        }}
                    >
                        {resolvedAddLabel}
                    </PneButton>
                </Box>
            ) : null}
            {hasAdd ? (
                <PneModal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
                    <Stack spacing={2}>
                        <PneTextField
                            label={templateNameLabel}
                            fullWidth
                            value={name}
                            onChange={event => setName(event.target.value)}
                            autoFocus
                        />
                        {resolvedAddInfo ? (
                            <Box sx={{ px: 1.5, py: 1, bgcolor: '#F7F9FC', borderRadius: 1, border: '1px solid #E5E8ED' }}>
                                <Stack spacing={0.5}>
                                    <Typography sx={{ fontSize: '13px', lineHeight: '18px', color: '#4E5D78' }}>
                                        {basedOnLabel}: {resolvedAddInfo.basedOnName ?? '—'}
                                    </Typography>
                                </Stack>
                            </Box>
                        ) : null}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <PneButton
                                pneStyle='text'
                                size='small'
                                onClick={() => setModalOpen(false)}
                                sx={{ height: 32, fontSize: '14px', lineHeight: '20px' }}
                            >
                                {cancelLabel}
                            </PneButton>
                            <PneButton
                                pneStyle='contained'
                                size='small'
                                onClick={handleSave}
                                disabled={!name.trim()}
                                sx={{ height: 32, fontSize: '14px', lineHeight: '20px' }}
                            >
                                {saveLabel}
                            </PneButton>
                        </Box>
                    </Stack>
                </PneModal>
            ) : null}
        </Box>
    )
}

export default WidgetLayoutsPanel
