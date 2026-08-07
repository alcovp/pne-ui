import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Divider, IconButton, Paper, Portal, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import { PneCheckbox } from '../PneCheckbox'
import PneTextField from '../PneTextField'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'

const SEARCH_THRESHOLD = 10
const SIDE_SHEET_WIDTH = 384

export type WidgetBoardVisibilityControlProps = {
    className?: string
    sx?: SxProps<Theme>
}

export const WidgetBoardVisibilityControl: React.FC<WidgetBoardVisibilityControlProps> = ({
    className,
    sx,
}) => {
    const { t } = useTranslation()
    const store = useWidgetBoardScopeStore()
    const visibilityItems = store(state => state.visibilityItems)
    const setWidgetVisibility = store(state => state.onSetWidgetVisibility)
    const showAllWidgets = store(state => state.onRestoreHidden)
    const activeBreakpointId = store(state => state.activeBreakpointId)
    const editBehavior = store(state => state.editBehavior)
    const isLoadingLayouts = store(state => state.isLoadingLayouts)
    const selectedLayoutId = store(state => state.selectedId)
    const layoutItems = store(state => state.items)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const closeButtonRef = useRef<HTMLButtonElement | null>(null)
    const openedBreakpointRef = useRef<string | undefined>(undefined)
    const generatedId = useId()
    const sheetId = `pne-widget-board-visibility-sheet-${generatedId}`
    const titleId = `${sheetId}-title`
    const descriptionId = `${sheetId}-description`

    const hiddenCount = visibilityItems.filter(item => !item.visible).length
    const shownCount = visibilityItems.length - hiddenCount
    const selectedLayout = layoutItems.find(item => item.id === selectedLayoutId)
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const filteredItems = useMemo(
        () => normalizedQuery
            ? visibilityItems.filter(item => item.title.toLocaleLowerCase().includes(normalizedQuery))
            : visibilityItems,
        [normalizedQuery, visibilityItems],
    )

    const restoreTriggerFocus = useCallback(() => {
        if (typeof window === 'undefined') return
        window.requestAnimationFrame(() => triggerRef.current?.focus())
    }, [])

    const closePanel = useCallback(() => {
        setOpen(false)
        setQuery('')
        restoreTriggerFocus()
    }, [restoreTriggerFocus])

    const openPanel = () => {
        openedBreakpointRef.current = activeBreakpointId
        setOpen(true)
    }

    useEffect(() => {
        if (!open || typeof window === 'undefined') return

        const frameId = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
        return () => window.cancelAnimationFrame(frameId)
    }, [closePanel, open])

    useEffect(() => {
        if (!open || openedBreakpointRef.current === activeBreakpointId) return
        closePanel()
    }, [activeBreakpointId, closePanel, open])

    useEffect(() => {
        if (!open || !isLoadingLayouts) return
        closePanel()
    }, [closePanel, isLoadingLayouts, open])

    const triggerLabel = t('pne.widgetBoard.visibility.trigger', { defaultValue: 'Widgets' })
    const hiddenLabel = t('pne.widgetBoard.visibility.hiddenCount', {
        count: hiddenCount,
        defaultValue: '{{count}} hidden',
    })
    const title = t('pne.widgetBoard.visibility.title', { defaultValue: 'Widgets' })
    const closeLabel = t('pne.widgetBoard.visibility.close', { defaultValue: 'Close' })
    const doneLabel = t('pne.widgetBoard.layouts.done', { defaultValue: 'Done' })
    const showAllLabel = t('pne.widgetBoard.visibility.showAll', { defaultValue: 'Show all' })
    const searchLabel = t('pne.widgetBoard.visibility.search', { defaultValue: 'Search widgets' })
    const shownCountLabel = t('pne.widgetBoard.visibility.shownCount', {
        shown: shownCount,
        total: visibilityItems.length,
        defaultValue: 'Shown {{shown}} of {{total}}',
    })
    const breakpointLabel = activeBreakpointId
        ? t(`pne.widgetBoard.breakpoints.${activeBreakpointId}`, { defaultValue: activeBreakpointId })
        : t('pne.widgetBoard.visibility.currentBreakpoint', { defaultValue: 'current size' })
    const scopeLabel = t('pne.widgetBoard.visibility.breakpointScope', {
        breakpoint: breakpointLabel,
        defaultValue: 'Changes apply only to the {{breakpoint}} layout.',
    })
    const emptySearchLabel = t('pne.widgetBoard.visibility.noSearchResults', {
        defaultValue: 'No matching widgets',
    })

    if (editBehavior === 'order-only') return null

    return (
        <>
            <PneButton
                className={className}
                aria-controls={open ? sheetId : undefined}
                aria-expanded={open ? 'true' : 'false'}
                aria-haspopup='dialog'
                data-pne-widget-board-visibility-trigger='true'
                disabled={isLoadingLayouts || visibilityItems.length === 0 || !setWidgetVisibility}
                onClick={openPanel}
                pneStyle='neutral'
                ref={triggerRef}
                size='small'
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={sx}
            >
                {triggerLabel} · {hiddenLabel}
            </PneButton>
            {open ? (
                <Portal>
                    <Paper
                        aria-describedby={descriptionId}
                        aria-labelledby={titleId}
                        aria-modal={false}
                        data-pne-widget-board-breakpoint-id={activeBreakpointId}
                        data-pne-widget-board-visibility-panel='true'
                        elevation={12}
                        id={sheetId}
                        onKeyDown={event => {
                            if (event.key !== 'Escape') return
                            event.preventDefault()
                            event.stopPropagation()
                            closePanel()
                        }}
                        role='dialog'
                        square
                        sx={{
                            bottom: 0,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            maxWidth: '100vw',
                            position: 'fixed',
                            right: 0,
                            top: 0,
                            width: SIDE_SHEET_WIDTH,
                            zIndex: theme => theme.zIndex.drawer + 1,
                        }}
                    >
                        <Stack
                            direction='row'
                            sx={{ alignItems: 'center', minHeight: 56, px: 2, py: 1 }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    component='h2'
                                    id={titleId}
                                    sx={{ fontSize: 18, fontWeight: 600, lineHeight: '24px' }}
                                >
                                    {title}
                                </Typography>
                                {selectedLayout?.name ? (
                                    <Typography sx={{ color: 'text.secondary', fontSize: 12, lineHeight: '16px' }}>
                                        {selectedLayout.name} · {breakpointLabel}
                                    </Typography>
                                ) : null}
                            </Box>
                            <IconButton
                                aria-label={closeLabel}
                                onClick={closePanel}
                                ref={closeButtonRef}
                                size='small'
                                sx={{ minHeight: 44, minWidth: 44 }}
                            >
                                <CloseRoundedIcon fontSize='small' />
                            </IconButton>
                        </Stack>
                        <Divider />
                        <Stack spacing={1.5} sx={{ px: 2, py: 1.5 }}>
                            <Typography
                                id={descriptionId}
                                sx={{ color: 'text.secondary', fontSize: 13, lineHeight: '18px' }}
                            >
                                {scopeLabel}
                            </Typography>
                            <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography sx={{ fontSize: 14, lineHeight: '20px' }}>
                                    {shownCountLabel}
                                </Typography>
                                <PneButton
                                    disabled={hiddenCount === 0 || !showAllWidgets}
                                    onClick={() => showAllWidgets?.()}
                                    pneStyle='text'
                                    size='small'
                                >
                                    {showAllLabel}
                                </PneButton>
                            </Stack>
                            {visibilityItems.length >= SEARCH_THRESHOLD ? (
                                <PneTextField
                                    aria-label={searchLabel}
                                    fullWidth
                                    onChange={event => setQuery(event.target.value)}
                                    placeholder={searchLabel}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <SearchRoundedIcon
                                                    aria-hidden
                                                    sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }}
                                                />
                                            ),
                                        },
                                    }}
                                    value={query}
                                />
                            ) : null}
                        </Stack>
                        <Divider />
                        <Stack
                            spacing={0.5}
                            sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', px: 1, py: 1 }}
                        >
                            {filteredItems.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary', fontSize: 14, px: 1, py: 2 }}>
                                    {emptySearchLabel}
                                </Typography>
                            ) : filteredItems.map(item => {
                                const stateLabel = item.canHide
                                    ? item.visible
                                        ? t('pne.widgetBoard.visibility.shown', { defaultValue: 'Shown' })
                                        : t('pne.widgetBoard.visibility.hidden', { defaultValue: 'Hidden' })
                                    : t('pne.widgetBoard.visibility.required', { defaultValue: 'Required' })
                                const checkboxLabel = t('pne.widgetBoard.visibility.showWidget', {
                                    title: item.title,
                                    defaultValue: 'Show widget {{title}}',
                                })

                                return (
                                    <Box
                                        component='label'
                                        data-pne-widget-board-item-id={item.id}
                                        data-pne-widget-board-visibility-item='true'
                                        key={item.id}
                                        sx={{
                                            alignItems: 'center',
                                            borderRadius: 0.5,
                                            cursor: item.canHide ? 'pointer' : 'default',
                                            display: 'flex',
                                            minHeight: 48,
                                            px: 0.5,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <PneCheckbox
                                            aria-label={checkboxLabel}
                                            checked={item.visible}
                                            disabled={!item.canHide}
                                            onChange={event => setWidgetVisibility?.(item.id, event.target.checked)}
                                            sx={{ flex: '0 0 auto', height: 44, width: 44 }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                sx={{ fontSize: 14, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            >
                                                {item.title}
                                            </Typography>
                                            <Typography
                                                data-pne-widget-board-visibility-state={
                                                    item.canHide ? (item.visible ? 'shown' : 'hidden') : 'required'
                                                }
                                                sx={{
                                                    color: item.canHide && !item.visible ? 'text.primary' : 'text.secondary',
                                                    fontSize: 12,
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                {stateLabel}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Stack>
                        <Divider />
                        <Stack direction='row' sx={{ justifyContent: 'flex-end', px: 2, py: 1.5 }}>
                            <PneButton onClick={closePanel} pneStyle='contained' size='small'>
                                {doneLabel}
                            </PneButton>
                        </Stack>
                    </Paper>
                </Portal>
            ) : null}
        </>
    )
}

export default WidgetBoardVisibilityControl
