import React, { useCallback, useMemo } from 'react'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import RestorePageIcon from '@mui/icons-material/RestorePage'
import { useTranslation } from 'react-i18next'
import { usePneConfirm } from '../confirm'
import type { PneFabItem } from '../fab/PneFloatingActionButtons'
import { WidgetLayoutsPanel } from './WidgetLayoutsPanel'
import type { WidgetBoardFabStore } from './widgetBoardFabStore'

export type UseWidgetBoardFabActionsOptions = {
    store: WidgetBoardFabStore
    resetLabel?: React.ReactNode
    restoreHiddenLabel?: React.ReactNode
}

export const useWidgetBoardFabActions = ({
    store,
    resetLabel,
    restoreHiddenLabel,
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
    const restoreHidden = store(state => state.onRestoreHidden)

    const resolvedResetLabel = resetLabel ?? t('pne.widgetBoard.actions.resetLayout', { defaultValue: 'Reset layout' })
    const resolvedRestoreHiddenLabel =
        restoreHiddenLabel ?? t('pne.widgetBoard.actions.restoreHiddenWidgets', { defaultValue: 'Restore hidden widgets' })
    const confirmTitle = t('react.confirm-alert.title.are-you-sure', { defaultValue: 'Are you sure?' })
    const confirmLabel = t('react.confirm-alert.yes', { defaultValue: 'Yes' })
    const cancelLabel = t('react.confirm-alert.no.cancel', { defaultValue: 'Cancel' })
    const resetMessage = t('pne.widgetBoard.confirm.resetLayout', { defaultValue: 'Reset selected saved layout to default for this breakpoint?' })
    const restoreHiddenMessage = t('pne.widgetBoard.confirm.restoreHiddenWidgets', { defaultValue: 'Restore all hidden widgets in selected saved layout?' })

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

    const handleRestoreHidden = useCallback(() => {
        if (!restoreHidden) return

        const shouldConfirm = !actionsState?.isDefaultLayoutSelected
        if (shouldConfirm) {
            void confirm({
                title: confirmTitle,
                message: restoreHiddenMessage,
                confirmLabel,
                cancelLabel,
            }).then(accepted => {
                if (accepted) {
                    restoreHidden?.()
                }
            })
            return
        }

        restoreHidden()
    }, [actionsState?.isDefaultLayoutSelected, cancelLabel, confirm, confirmLabel, confirmTitle, restoreHidden, restoreHiddenMessage])

    const showResetLayout = Boolean(actionsState?.canResetLayout)
    const showRestoreHidden = Boolean(actionsState?.hasHiddenWidgets)
    const canReset = showResetLayout && Boolean(resetLayout)
    const canRestoreHidden = showRestoreHidden && Boolean(restoreHidden)

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
            id: 'restore-hidden',
            label: resolvedRestoreHiddenLabel,
            icon: <RestorePageIcon fontSize='small' />,
            onClick: handleRestoreHidden,
            disabled: !canRestoreHidden,
            showInFabStack: canRestoreHidden,
        })

        return items
    }, [
        addInfo,
        addLayout,
        canReset,
        canRestoreHidden,
        handleResetLayout,
        handleRestoreHidden,
        deleteLayout,
        layoutItems,
        lockedIds,
        resolvedResetLabel,
        resolvedRestoreHiddenLabel,
        selectLayout,
        selectedLayoutId,
    ])
}
