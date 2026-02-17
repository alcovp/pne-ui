import React, { useCallback, useMemo } from 'react'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useTranslation } from 'react-i18next'
import { usePneConfirm } from '../confirm'
import type { PneFabItem } from '../fab/PneFloatingActionButtons'
import { WidgetLayoutsPanel } from './WidgetLayoutsPanel'
import type { WidgetBoardFabStore } from './widgetBoardFabStore'

export type UseWidgetBoardFabActionsOptions = {
    store: WidgetBoardFabStore
    resetLabel?: React.ReactNode
    editVisibilityLabel?: React.ReactNode
    // Backward-compatible alias. Kept to avoid breaking external consumers of this hook/component API.
    restoreHiddenLabel?: React.ReactNode
    onEditVisibilityClick?: () => void
}

export const useWidgetBoardFabActions = ({
    store,
    resetLabel,
    editVisibilityLabel,
    restoreHiddenLabel,
    onEditVisibilityClick,
}: UseWidgetBoardFabActionsOptions): PneFabItem[] => {
    const { t } = useTranslation()
    const { confirm } = usePneConfirm()

    const layoutItems = store(state => state.items)
    const selectedLayoutId = store(state => state.selectedId)
    const selectLayout = store(state => state.onSelect)
    const addLayout = store(state => state.onAdd)
    const deleteLayout = store(state => state.onDelete)
    const addInfo = store(state => state.addInfo)
    const lockedIds = store(state => state.lockedIds)
    const actionsState = store(state => state.actionsState)
    const resetLayout = store(state => state.onResetLayout)
    const visibilityItems = store(state => state.visibilityItems)
    const setWidgetVisibility = store(state => state.onSetWidgetVisibility)

    const resolvedResetLabel = resetLabel ?? t('pne.widgetBoard.actions.resetLayout', { defaultValue: 'Reset layout' })
    const resolvedEditVisibilityLabel =
        editVisibilityLabel ??
        restoreHiddenLabel ??
        t('pne.widgetBoard.actions.editVisibility', { defaultValue: 'Edit visibility' })
    const confirmTitle = t('react.confirm-alert.title.are-you-sure', { defaultValue: 'Are you sure?' })
    const confirmLabel = t('react.confirm-alert.yes', { defaultValue: 'Yes' })
    const cancelLabel = t('react.confirm-alert.no.cancel', { defaultValue: 'Cancel' })
    const resetMessage = t('pne.widgetBoard.confirm.resetLayout', { defaultValue: 'Reset selected saved layout to default for this breakpoint?' })

    const handleResetLayout = useCallback(() => {
        if (!resetLayout) return

        const shouldConfirm = !actionsState?.isDefaultLayoutSelected
        if (shouldConfirm) {
            void confirm({
                title: confirmTitle,
                message: resetMessage,
                confirmLabel,
                cancelLabel,
            }).then(accepted => {
                if (accepted) {
                    resetLayout?.()
                }
            })
            return
        }

        resetLayout()
    }, [actionsState?.isDefaultLayoutSelected, cancelLabel, confirm, confirmLabel, confirmTitle, resetLayout, resetMessage])

    const canEditVisibility = visibilityItems.length > 0 && Boolean(setWidgetVisibility) && Boolean(onEditVisibilityClick)
    const handleEditVisibility = useCallback(() => {
        if (!canEditVisibility) return
        onEditVisibilityClick?.()
    }, [canEditVisibility, onEditVisibilityClick])

    const showResetLayout = Boolean(actionsState?.canResetLayout)
    const canReset = showResetLayout && Boolean(resetLayout)

    return useMemo<PneFabItem[]>(() => {
        const items: PneFabItem[] = [
            {
                id: 'layouts',
                kind: 'content',
                node: (
                    <WidgetLayoutsPanel
                        items={layoutItems}
                        selectedId={selectedLayoutId}
                        onSelect={selectLayout}
                        onAdd={addLayout}
                        onDelete={deleteLayout}
                        addInfo={addInfo}
                        lockedIds={lockedIds}
                    />
                ),
            },
            { id: 'divider-layouts', kind: 'divider' },
        ]

        items.push({
            id: 'reset-layout',
            label: resolvedResetLabel,
            icon: <RestartAltIcon fontSize='small' />,
            onClick: handleResetLayout,
            disabled: !canReset,
            showInFabStack: canReset,
        })

        items.push({
            id: 'edit-visibility',
            label: resolvedEditVisibilityLabel,
            icon: <VisibilityIcon fontSize='small' />,
            onClick: handleEditVisibility,
            disabled: !canEditVisibility,
            showInFabStack: Boolean(onEditVisibilityClick),
        })

        return items
    }, [
        addInfo,
        addLayout,
        canEditVisibility,
        canReset,
        handleEditVisibility,
        handleResetLayout,
        deleteLayout,
        layoutItems,
        lockedIds,
        onEditVisibilityClick,
        resolvedEditVisibilityLabel,
        resolvedResetLabel,
        selectLayout,
        selectedLayoutId,
    ])
}
