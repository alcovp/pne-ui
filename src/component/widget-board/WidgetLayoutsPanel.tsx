import React, { useState, useSyncExternalStore } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import PneModal from '../PneModal'
import PneTextField from '../PneTextField'
import PneButton from '../PneButton'
import { getWidgetLayoutsPanelBridge, subscribeWidgetLayoutsPanelBridge } from './widgetLayoutsPanelStore'

export type WidgetLayoutOption = {
    id: string
    name: string
}

export type WidgetLayoutsPanelProps = {
    items?: WidgetLayoutOption[]
    selectedId?: string
    onSelect?: (id: string) => void
    onDelete?: (id: string) => void
    onAdd?: (name: string) => void
    addLabel?: React.ReactNode
    className?: string
    lockedIds?: string[]
}

const defaultAddLabel = 'Add new layout'

export const WidgetLayoutsPanel: React.FC<WidgetLayoutsPanelProps> = ({
    items,
    selectedId,
    onSelect,
    onDelete,
    onAdd,
    addLabel = defaultAddLabel,
    className,
    lockedIds = [],
}) => {
    const bridge = useSyncExternalStore(subscribeWidgetLayoutsPanelBridge, () => getWidgetLayoutsPanelBridge(), () => null)

    const resolvedItems = items ?? bridge?.items ?? []
    const resolvedSelectedId = selectedId ?? bridge?.selectedId
    const resolvedOnSelect = onSelect ?? bridge?.onSelect
    const resolvedOnDelete = onDelete ?? bridge?.onDelete
    const resolvedOnAdd = onAdd ?? bridge?.onAdd
    const resolvedLockedIds = lockedIds.length ? lockedIds : bridge?.lockedIds ?? []

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
                    Layouts
                </Typography>
            </Box>
            <Stack>
                {resolvedItems.length === 0 ? (
                    <Box sx={{ px: 2, minHeight: 32, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>No layouts yet</Box>
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
                                            resolvedOnDelete(item.id)
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
                        {addLabel}
                    </PneButton>
                </Box>
            ) : null}
            {hasAdd ? (
                <PneModal open={modalOpen} onClose={() => setModalOpen(false)} title='New layout'>
                    <Stack spacing={2}>
                        <PneTextField
                            label='Template name'
                            fullWidth
                            value={name}
                            onChange={event => setName(event.target.value)}
                            autoFocus
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <PneButton
                                pneStyle='text'
                                size='small'
                                onClick={() => setModalOpen(false)}
                                sx={{ height: 32, fontSize: '14px', lineHeight: '20px' }}
                            >
                                Cancel
                            </PneButton>
                            <PneButton
                                pneStyle='contained'
                                size='small'
                                onClick={handleSave}
                                disabled={!name.trim()}
                                sx={{ height: 32, fontSize: '14px', lineHeight: '20px' }}
                            >
                                Save
                            </PneButton>
                        </Box>
                    </Stack>
                </PneModal>
            ) : null}
        </Box>
    )
}

export default WidgetLayoutsPanel
