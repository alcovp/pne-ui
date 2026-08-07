import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineRounded'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Box, CircularProgress, Divider, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { alpha, type SxProps, type Theme } from '@mui/material/styles'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import PneModal from '../PneModal'
import PneModalActions from '../PneModalActions'
import PneTextField from '../PneTextField'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import type { WidgetBoardInteractionMode, WidgetBoardPersistenceStatus } from './types'

export type WidgetBoardHeaderControlsProps = {
    interactionMode: WidgetBoardInteractionMode
    onInteractionModeChange: (mode: WidgetBoardInteractionMode) => void
    /** Optional controls rendered immediately after Done while the board is being edited. */
    editActions?: React.ReactNode
    /** First-class widget visibility control rendered after the layout selector in edit mode. */
    visibilityControl?: React.ReactNode
    className?: string
    sx?: SxProps<Theme>
}

type GuardIntent =
    | { kind: 'done' }
    | { kind: 'select-layout'; layoutId: string }

type SaveAsOrigin = 'direct' | 'guard'

const neutralColor = '#5E7594'
const headerButtonSx: SxProps<Theme> = {
    flexShrink: 0,
    whiteSpace: 'nowrap',
}
const layoutButtonSx: SxProps<Theme> = {
    maxWidth: 240,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'flex-start',
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        flex: '0 0 auto',
    },
    '& .MuiButton-endIcon': {
        ml: 'auto',
    },
}
const buttonLabelSx: SxProps<Theme> = {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}
const buttonIconSx: SxProps<Theme> = {
    fontSize: 16,
}

type PersistenceStatusProps = {
    error?: string
    onRetry: () => Promise<void>
    status: WidgetBoardPersistenceStatus
}

const PersistenceStatus: React.FC<PersistenceStatusProps> = ({ error, onRetry, status }) => {
    const { t } = useTranslation()
    const [retrying, setRetrying] = useState(false)
    const isSaving = retrying || status === 'pending' || status === 'saving'
    const effectiveStatus = retrying ? 'saving' : status

    const handleRetry = async () => {
        if (retrying) return
        setRetrying(true)
        try {
            await onRetry()
        } catch {
            // The shared board state exposes the localized retryable error state.
        } finally {
            setRetrying(false)
        }
    }

    if (status === 'error' && !retrying) {
        return (
            <Box
                aria-live='polite'
                data-pne-widget-board-persistence-status='error'
                role='alert'
                sx={{ alignItems: 'center', color: 'error.main', display: 'flex', flexShrink: 0, gap: 0.5 }}
                title={error}
            >
                <ErrorOutlineIcon sx={buttonIconSx} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                    {t('pne.widgetBoard.persistence.error', { defaultValue: 'Couldn’t save changes' })}
                </Typography>
                <PneButton onClick={() => void handleRetry()} pneStyle='text' size='small'>
                    {t('pne.widgetBoard.persistence.retry', { defaultValue: 'Retry' })}
                </PneButton>
            </Box>
        )
    }

    return (
        <Box
            aria-live='polite'
            data-pne-widget-board-persistence-status={effectiveStatus}
            role='status'
            sx={{ alignItems: 'center', color: 'text.secondary', display: 'flex', flexShrink: 0, gap: 0.75 }}
        >
            {isSaving ? (
                <CircularProgress aria-hidden size={14} />
            ) : (
                <CheckCircleOutlineIcon color='success' sx={buttonIconSx} />
            )}
            <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: '18px', whiteSpace: 'nowrap' }}>
                {isSaving
                    ? t('pne.widgetBoard.persistence.saving', { defaultValue: 'Saving…' })
                    : t('pne.widgetBoard.persistence.saved', { defaultValue: 'Saved' })}
            </Typography>
        </Box>
    )
}

export const WidgetBoardHeaderControls: React.FC<WidgetBoardHeaderControlsProps> = ({
    interactionMode,
    onInteractionModeChange,
    editActions,
    visibilityControl,
    className,
    sx,
}) => {
    const { t } = useTranslation()
    const [layoutAnchorEl, setLayoutAnchorEl] = useState<HTMLElement | null>(null)
    const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
    const [saveAsOrigin, setSaveAsOrigin] = useState<SaveAsOrigin>('direct')
    const [layoutName, setLayoutName] = useState('')
    const [saveAsSubmitting, setSaveAsSubmitting] = useState(false)
    const [saveAsError, setSaveAsError] = useState(false)
    const [guardIntent, setGuardIntent] = useState<GuardIntent | null>(null)
    const [guardOpen, setGuardOpen] = useState(false)
    const [guardBusy, setGuardBusy] = useState(false)
    const [doneBusy, setDoneBusy] = useState(false)
    const [failedSelectLayoutId, setFailedSelectLayoutId] = useState<string | undefined>(undefined)

    const store = useWidgetBoardScopeStore()
    const layoutItems = store(state => state.items)
    const selectedLayoutId = store(state => state.selectedId)
    const selectLayout = store(state => state.onSelect)
    const addLayout = store(state => state.onAdd)
    const addInfo = store(state => state.addInfo)
    const lockedIds = store(state => state.lockedIds)
    const actionsState = store(state => state.actionsState)
    const activeBreakpointId = store(state => state.activeBreakpointId)
    const isLoadingLayouts = store(state => state.isLoadingLayouts) ?? true
    const flushLayoutSave = store(state => state.onFlushLayoutSave)
    const discardLayoutChanges = store(state => state.onDiscardLayoutChanges)

    const selectedLayout = useMemo(
        () => layoutItems.find(item => item.id === selectedLayoutId),
        [layoutItems, selectedLayoutId],
    )
    const selectedLayoutName = selectedLayout?.name ?? t('pne.widgetBoard.layouts.defaultName', { defaultValue: 'Default layout' })
    const isEditMode = interactionMode === 'edit'
    const layoutMenuOpen = Boolean(layoutAnchorEl)
    const isSelectedLayoutLocked = actionsState?.isSelectedLayoutLocked
        ?? (selectedLayoutId ? lockedIds.includes(selectedLayoutId) : true)
    const hasDraftChanges = actionsState?.hasDraftChanges ?? false
    const dirtyBreakpointIds = useMemo(
        () => actionsState?.dirtyBreakpointIds ?? [],
        [actionsState?.dirtyBreakpointIds],
    )
    const persistenceStatus = actionsState?.persistenceStatus ?? 'idle'
    const persistenceError = actionsState?.persistenceError
    const dirtyBreakpointLabel = useMemo(() => {
        const orderedIds = activeBreakpointId && dirtyBreakpointIds.includes(activeBreakpointId)
            ? [activeBreakpointId, ...dirtyBreakpointIds.filter(id => id !== activeBreakpointId)]
            : [...dirtyBreakpointIds]
        if (orderedIds.length === 0 && activeBreakpointId) orderedIds.push(activeBreakpointId)
        return orderedIds
            .map(id => String(t(`pne.widgetBoard.breakpoints.${id}`, { defaultValue: id })))
            .join(', ')
    }, [activeBreakpointId, dirtyBreakpointIds, t])
    const dirtyStatusLabel = hasDraftChanges && dirtyBreakpointLabel
        ? String(t('pne.widgetBoard.draft.unsavedForBreakpoint', {
            breakpoint: dirtyBreakpointLabel,
            defaultValue: 'Unsaved changes · {{breakpoint}}',
        }))
        : undefined
    const headerControlsBusy = isLoadingLayouts || doneBusy

    const resetSaveAsForm = () => {
        setLayoutName('')
        setSaveAsError(false)
        setSaveAsSubmitting(false)
    }

    const openSaveAsModal = (origin: SaveAsOrigin = 'direct') => {
        resetSaveAsForm()
        setSaveAsOrigin(origin)
        setSaveAsModalOpen(true)
    }

    const closeSaveAsModal = () => {
        if (saveAsSubmitting) return
        setSaveAsModalOpen(false)
        resetSaveAsForm()
        if (saveAsOrigin === 'guard' && guardIntent) {
            setGuardOpen(true)
        } else {
            setGuardIntent(null)
        }
        setSaveAsOrigin('direct')
    }

    const attemptSelectLayout = async (layoutId: string) => {
        try {
            const latestSelectLayout = store.getState().onSelect
            if (!latestSelectLayout) throw new Error('WidgetBoard layout selection is unavailable')
            await latestSelectLayout(layoutId)
            setFailedSelectLayoutId(undefined)
        } catch (error) {
            setFailedSelectLayoutId(layoutId)
            throw error
        }
    }

    const finishGuardIntent = async (intent: GuardIntent) => {
        if (intent.kind === 'done') {
            onInteractionModeChange('view')
            return
        }
        await attemptSelectLayout(intent.layoutId)
    }

    const handleSaveAs = async () => {
        const trimmed = layoutName.trim()
        if (!trimmed || !addLayout || saveAsSubmitting || isLoadingLayouts) return
        const guardedIntent = saveAsOrigin === 'guard' ? guardIntent : null

        setSaveAsSubmitting(true)
        setSaveAsError(false)
        try {
            await addLayout(trimmed)
        } catch {
            setSaveAsError(true)
            setSaveAsSubmitting(false)
            return
        }

        setFailedSelectLayoutId(undefined)
        setSaveAsModalOpen(false)
        resetSaveAsForm()
        setSaveAsOrigin('direct')
        setGuardIntent(null)

        if (guardedIntent) {
            try {
                await finishGuardIntent(guardedIntent)
            } catch {
                // The layout exists; retain it and let the shared persistence state expose switch failure.
            }
        }
    }

    const requestGuardedAction = (intent: GuardIntent) => {
        setGuardIntent(intent)
        setGuardOpen(true)
    }

    const handleSelectLayout = (id: string) => {
        setLayoutAnchorEl(null)
        if (!selectLayout || id === selectedLayoutId) return
        if (isSelectedLayoutLocked && hasDraftChanges) {
            requestGuardedAction({ kind: 'select-layout', layoutId: id })
            return
        }
        void attemptSelectLayout(id).catch(() => undefined)
    }

    const handleDone = async () => {
        if (doneBusy) return
        if (isSelectedLayoutLocked && hasDraftChanges) {
            requestGuardedAction({ kind: 'done' })
            return
        }
        if (isSelectedLayoutLocked || !flushLayoutSave) {
            onInteractionModeChange('view')
            return
        }

        setDoneBusy(true)
        try {
            await flushLayoutSave()
            onInteractionModeChange('view')
        } catch {
            // Keep edit mode open; PersistenceStatus exposes the retryable error.
        } finally {
            setDoneBusy(false)
        }
    }

    const handleGuardContinue = () => {
        if (guardBusy) return
        setGuardOpen(false)
        setGuardIntent(null)
    }

    const handleGuardSaveAs = () => {
        if (guardBusy) return
        setGuardOpen(false)
        openSaveAsModal('guard')
    }

    const handleGuardDiscard = async () => {
        if (!guardIntent || guardBusy) return
        const intent = guardIntent
        setGuardBusy(true)
        try {
            await discardLayoutChanges?.()
        } catch {
            setGuardBusy(false)
            return
        }

        setGuardOpen(false)
        setGuardIntent(null)
        try {
            await finishGuardIntent(intent)
        } catch {
            // The draft is discarded; PersistenceStatus can retry a failed deferred selection.
        }
        setGuardBusy(false)
    }

    const handleRetry = async () => {
        if (failedSelectLayoutId) {
            await attemptSelectLayout(failedSelectLayoutId)
            return
        }
        if (!flushLayoutSave) return
        await flushLayoutSave()
    }

    const handleOpenLayoutMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setLayoutAnchorEl(event.currentTarget)
    }

    return (
        <Box
            className={className}
            data-pne-widget-board-header-controls='true'
            sx={[
                {
                    alignItems: 'center',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    minWidth: 0,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <PneButton
                aria-label={dirtyStatusLabel ? `${selectedLayoutName}. ${dirtyStatusLabel}` : undefined}
                aria-haspopup='menu'
                aria-expanded={layoutMenuOpen ? 'true' : undefined}
                data-pne-widget-board-layout-dirty={hasDraftChanges ? 'true' : 'false'}
                data-pne-widget-board-layout-locked={isSelectedLayoutLocked ? 'true' : 'false'}
                data-pne-widget-board-layout-selector='true'
                disabled={headerControlsBusy}
                pneStyle='neutral'
                size='small'
                startIcon={isSelectedLayoutLocked
                    ? <LockOutlinedIcon sx={buttonIconSx} />
                    : <BookmarkBorderOutlinedIcon sx={buttonIconSx} />}
                endIcon={<KeyboardArrowDownIcon sx={buttonIconSx} />}
                onClick={handleOpenLayoutMenu}
                sx={layoutButtonSx}
                title={dirtyStatusLabel ?? selectedLayoutName}
            >
                <Box component='span' sx={buttonLabelSx}>
                    {selectedLayoutName}
                </Box>
            </PneButton>

            {isEditMode && visibilityControl ? (
                <Box
                    aria-disabled={headerControlsBusy ? 'true' : undefined}
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        flex: '0 0 auto',
                        opacity: headerControlsBusy ? 0.6 : 1,
                        pointerEvents: headerControlsBusy ? 'none' : 'auto',
                    }}
                >
                    {visibilityControl}
                </Box>
            ) : null}

            {isEditMode ? (
                <>
                    {isSelectedLayoutLocked ? (
                        <PneButton
                            disabled={headerControlsBusy}
                            pneStyle='contained'
                            size='small'
                            startIcon={<SaveOutlinedIcon sx={buttonIconSx} />}
                            onClick={() => openSaveAsModal('direct')}
                            sx={headerButtonSx}
                        >
                            {t('pne.widgetBoard.layouts.saveAsNew', { defaultValue: 'Save as new layout' })}
                        </PneButton>
                    ) : null}
                    {!isSelectedLayoutLocked || failedSelectLayoutId ? (
                        <PersistenceStatus
                            error={persistenceError}
                            onRetry={handleRetry}
                            status={failedSelectLayoutId ? 'error' : persistenceStatus}
                        />
                    ) : null}
                    <PneButton
                        disabled={headerControlsBusy}
                        pneStyle={isSelectedLayoutLocked ? 'outlined' : 'contained'}
                        size='small'
                        startIcon={doneBusy ? <CircularProgress aria-hidden size={14} /> : undefined}
                        onClick={() => void handleDone()}
                        sx={headerButtonSx}
                    >
                        {t('pne.widgetBoard.layouts.done', { defaultValue: 'Done' })}
                    </PneButton>
                    {editActions ? (
                        <Box
                            aria-disabled={headerControlsBusy ? 'true' : undefined}
                            data-pne-widget-board-header-edit-actions='true'
                            sx={{
                                alignItems: 'center',
                                display: 'flex',
                                flexShrink: 0,
                                gap: 0.5,
                                opacity: headerControlsBusy ? 0.6 : 1,
                                pointerEvents: headerControlsBusy ? 'none' : 'auto',
                            }}
                        >
                            <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
                            {editActions}
                        </Box>
                    ) : null}
                </>
            ) : (
                <PneButton
                    disabled={isLoadingLayouts}
                    pneStyle='neutral'
                    size='small'
                    startIcon={<EditOutlinedIcon sx={buttonIconSx} />}
                    onClick={() => onInteractionModeChange('edit')}
                    sx={headerButtonSx}
                >
                    {t('edit', { defaultValue: 'Edit' })}
                </PneButton>
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
                    disabled={!addLayout || isLoadingLayouts}
                    onClick={() => {
                        setLayoutAnchorEl(null)
                        openSaveAsModal('direct')
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
                                disabled={isLoadingLayouts}
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
                actions={<PneModalActions
                    secondary={<PneButton
                        disabled={saveAsSubmitting}
                        pneStyle='outlined'
                        onClick={closeSaveAsModal}
                    >
                        {t('pne.widgetBoard.layouts.cancel', { defaultValue: 'Cancel' })}
                    </PneButton>}
                    primary={<PneButton
                        disabled={!layoutName.trim() || !addLayout || saveAsSubmitting || isLoadingLayouts}
                        pneStyle='contained'
                        startIcon={saveAsSubmitting ? <CircularProgress aria-hidden size={14} /> : undefined}
                        onClick={() => void handleSaveAs()}
                    >
                        {t('pne.widgetBoard.layouts.create', { defaultValue: 'Create' })}
                    </PneButton>}
                />}
                closeLabel={t('pne.widgetBoard.layouts.cancel', { defaultValue: 'Cancel' })}
                data-pne-widget-board-save-as-modal='true'
                hideCloseButton={saveAsSubmitting}
                open={saveAsModalOpen}
                onClose={closeSaveAsModal}
                title={t('pne.widgetBoard.layouts.createTitle', { defaultValue: 'Create layout' })}
            >
                <Stack spacing={2}>
                    <PneTextField
                        autoFocus
                        disabled={saveAsSubmitting || isLoadingLayouts}
                        fullWidth
                        label={t('pne.widgetBoard.layouts.nameLabel', { defaultValue: 'Layout name' })}
                        value={layoutName}
                        onChange={event => {
                            setLayoutName(event.target.value)
                            setSaveAsError(false)
                        }}
                    />
                    {addInfo ? (
                        <Box sx={{ px: 1.5, py: 1, bgcolor: '#F7F9FC', borderRadius: 1, border: '1px solid #E5E8ED' }}>
                            <Typography sx={{ fontSize: 13, lineHeight: '18px', color: '#4E5D78' }}>
                                {t('pne.widgetBoard.layouts.basedOn', { defaultValue: 'Will inherit from' })}: {addInfo.basedOnName}
                            </Typography>
                        </Box>
                    ) : null}
                    {saveAsError ? (
                        <Alert data-pne-widget-board-save-as-error='true' severity='error'>
                            {t('pne.widgetBoard.layouts.createError', {
                                defaultValue: 'Couldn’t create the layout. Try again.',
                            })}
                        </Alert>
                    ) : null}
                </Stack>
            </PneModal>

            <PneModal
                actions={<PneModalActions
                    groupLeading
                    leading={<PneButton
                        disabled={guardBusy || isLoadingLayouts}
                        onClick={handleGuardContinue}
                        pneStyle='text'
                    >
                        {t('pne.widgetBoard.draft.continueEditing', { defaultValue: 'Continue editing' })}
                    </PneButton>}
                    secondary={<PneButton
                        disabled={guardBusy || isLoadingLayouts || !discardLayoutChanges}
                        onClick={() => void handleGuardDiscard()}
                        pneStyle='outlined'
                    >
                        {t('pne.widgetBoard.draft.discard', { defaultValue: 'Discard changes' })}
                    </PneButton>}
                    primary={<PneButton
                        disabled={guardBusy || isLoadingLayouts || !addLayout}
                        onClick={handleGuardSaveAs}
                        pneStyle='contained'
                    >
                        {t('pne.widgetBoard.layouts.saveAsNew', { defaultValue: 'Save as new layout' })}
                    </PneButton>}
                />}
                closeLabel={t('pne.widgetBoard.draft.continueEditing', { defaultValue: 'Continue editing' })}
                data-pne-widget-board-draft-guard='true'
                hideCloseButton={guardBusy}
                open={guardOpen}
                onClose={handleGuardContinue}
                title={t('pne.widgetBoard.draft.guardTitle', { defaultValue: 'Keep your changes?' })}
            >
                <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: '20px' }}>
                    {t('pne.widgetBoard.draft.guardDescription', {
                        breakpoint: dirtyBreakpointLabel,
                        defaultValue: 'Changes to the Default layout for {{breakpoint}} haven’t been saved.',
                    })}
                </Typography>
            </PneModal>
        </Box>
    )
}

export default WidgetBoardHeaderControls
