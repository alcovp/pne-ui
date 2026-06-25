import React, { useMemo, useState } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Box, ButtonBase, Divider, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { alpha, type SxProps, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import PneModal from '../PneModal'
import PneTextField from '../PneTextField'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import type { WidgetBoardInteractionMode } from './types'

export type WidgetBoardHeaderControlsProps = {
    interactionMode: WidgetBoardInteractionMode
    onInteractionModeChange: (mode: WidgetBoardInteractionMode) => void
    className?: string
    sx?: SxProps<Theme>
}

const neutralColor = '#5E7594'

export const WidgetBoardHeaderControls: React.FC<WidgetBoardHeaderControlsProps> = ({
    interactionMode,
    onInteractionModeChange,
    className,
    sx,
}) => {
    const { t } = useTranslation()
    const [layoutAnchorEl, setLayoutAnchorEl] = useState<HTMLElement | null>(null)
    const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
    const [layoutName, setLayoutName] = useState('')

    const store = useWidgetBoardScopeStore()
    const layoutItems = store(state => state.items)
    const selectedLayoutId = store(state => state.selectedId)
    const selectLayout = store(state => state.onSelect)
    const addLayout = store(state => state.onAdd)
    const addInfo = store(state => state.addInfo)

    const selectedLayout = useMemo(
        () => layoutItems.find(item => item.id === selectedLayoutId),
        [layoutItems, selectedLayoutId],
    )
    const selectedLayoutName = selectedLayout?.name ?? t('pne.widgetBoard.layouts.defaultName', { defaultValue: 'Default layout' })
    const isEditMode = interactionMode === 'edit'
    const layoutMenuOpen = Boolean(layoutAnchorEl)

    const openSaveAsModal = () => {
        setLayoutName('')
        setSaveAsModalOpen(true)
    }

    const closeSaveAsModal = () => {
        setSaveAsModalOpen(false)
        setLayoutName('')
    }

    const handleSaveAs = () => {
        const trimmed = layoutName.trim()
        if (!trimmed || !addLayout) return
        addLayout(trimmed)
        closeSaveAsModal()
    }

    const handleSelectLayout = (id: string) => {
        selectLayout?.(id)
        setLayoutAnchorEl(null)
    }

    return (
        <Box
            className={className}
            data-pne-widget-board-header-controls='true'
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 0,
                ...sx,
            }}
        >
            <ButtonBase
                aria-haspopup='menu'
                aria-expanded={layoutMenuOpen ? 'true' : undefined}
                onClick={event => setLayoutAnchorEl(event.currentTarget)}
                sx={{
                    minHeight: 32,
                    maxWidth: 240,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(94, 117, 148, 0.1)',
                    color: neutralColor,
                    flexShrink: 1,
                    minWidth: 0,
                    '&:hover': {
                        bgcolor: 'rgba(94, 117, 148, 0.14)',
                    },
                }}
            >
                <SaveOutlinedIcon sx={{ fontSize: 16, flex: '0 0 auto' }} />
                <Typography
                    component='span'
                    sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 14,
                        lineHeight: '20px',
                        color: 'inherit',
                    }}
                >
                    {selectedLayoutName}
                </Typography>
                <KeyboardArrowDownIcon sx={{ fontSize: 16, flex: '0 0 auto' }} />
            </ButtonBase>

            {isEditMode ? (
                <>
                    <PneButton
                        pneStyle='contained'
                        size='small'
                        startIcon={<SaveOutlinedIcon sx={{ fontSize: 16 }} />}
                        onClick={openSaveAsModal}
                        sx={{
                            minHeight: 32,
                            height: 32,
                            borderRadius: 0.5,
                            px: 1.5,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {t('pne.widgetBoard.actions.saveAs', { defaultValue: 'Save as' })}
                    </PneButton>
                    <PneButton
                        pneStyle='outlined'
                        size='small'
                        onClick={() => onInteractionModeChange('view')}
                        sx={{
                            minHeight: 32,
                            height: 32,
                            borderRadius: 0.5,
                            px: 1,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {t('pne.widgetBoard.layouts.cancel', { defaultValue: 'Cancel' })}
                    </PneButton>
                </>
            ) : (
                <ButtonBase
                    onClick={() => onInteractionModeChange('edit')}
                    sx={{
                        minHeight: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1,
                        py: 0.75,
                        borderRadius: 0.5,
                        bgcolor: 'rgba(94, 117, 148, 0.1)',
                        color: neutralColor,
                        flexShrink: 0,
                        '&:hover': {
                            bgcolor: 'rgba(94, 117, 148, 0.14)',
                        },
                    }}
                >
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography component='span' sx={{ fontSize: 14, lineHeight: '20px', color: 'inherit' }}>
                        {t('edit', { defaultValue: 'Edit' })}
                    </Typography>
                </ButtonBase>
            )}

            <Menu
                anchorEl={layoutAnchorEl}
                open={layoutMenuOpen}
                onClose={() => setLayoutAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.5,
                            width: 300,
                            maxWidth: 'calc(100vw - 32px)',
                            borderRadius: 1,
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            boxShadow: '0px 4px 8px rgba(20, 27, 52, 0.2)',
                            p: 1,
                        },
                    },
                    list: {
                        sx: { p: 0 },
                    },
                }}
            >
                <MenuItem
                    disabled={!addLayout}
                    onClick={() => {
                        setLayoutAnchorEl(null)
                        openSaveAsModal()
                    }}
                    sx={{
                        minHeight: 32,
                        borderRadius: 0.5,
                        px: 1.5,
                        py: 0.5,
                        fontSize: 14,
                        lineHeight: '20px',
                        color: 'primary.main',
                    }}
                >
                    {t('pne.widgetBoard.layouts.saveAsNew', { defaultValue: 'Save as new layout' })}
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0}>
                    {layoutItems.map(item => {
                        const selected = item.id === selectedLayoutId
                        return (
                            <MenuItem
                                key={item.id}
                                selected={selected}
                                onClick={() => handleSelectLayout(item.id)}
                                sx={{
                                    minHeight: 36,
                                    borderRadius: 0.5,
                                    px: 1,
                                    py: 1,
                                    fontSize: 14,
                                    lineHeight: '20px',
                                    color: selected ? 'primary.main' : neutralColor,
                                    '&.Mui-selected': {
                                        bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
                                        border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    },
                                    '&.Mui-selected:hover': {
                                        bgcolor: theme => alpha(theme.palette.primary.main, 0.07),
                                    },
                                }}
                            >
                                <Box component='span' sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.name}
                                </Box>
                            </MenuItem>
                        )
                    })}
                </Stack>
            </Menu>

            <PneModal
                open={saveAsModalOpen}
                onClose={closeSaveAsModal}
                title={t('pne.widgetBoard.layouts.newTitle', { defaultValue: 'New layout' })}
            >
                <Stack spacing={2}>
                    <PneTextField
                        label={t('pne.widgetBoard.layouts.templateName', { defaultValue: 'Template name' })}
                        fullWidth
                        value={layoutName}
                        onChange={event => setLayoutName(event.target.value)}
                        autoFocus
                    />
                    {addInfo ? (
                        <Box sx={{ px: 1.5, py: 1, bgcolor: '#F7F9FC', borderRadius: 1, border: '1px solid #E5E8ED' }}>
                            <Typography sx={{ fontSize: 13, lineHeight: '18px', color: '#4E5D78' }}>
                                {t('pne.widgetBoard.layouts.basedOn', { defaultValue: 'Will inherit from' })}: {addInfo.basedOnName}
                            </Typography>
                        </Box>
                    ) : null}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <PneButton pneStyle='text' size='small' onClick={closeSaveAsModal}>
                            {t('pne.widgetBoard.layouts.cancel', { defaultValue: 'Cancel' })}
                        </PneButton>
                        <PneButton pneStyle='contained' size='small' onClick={handleSaveAs} disabled={!layoutName.trim()}>
                            {t('pne.widgetBoard.layouts.save', { defaultValue: 'Save' })}
                        </PneButton>
                    </Box>
                </Stack>
            </PneModal>
        </Box>
    )
}

export default WidgetBoardHeaderControls
