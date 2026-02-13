import React, { useCallback, useMemo, useSyncExternalStore } from 'react'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import RestorePageIcon from '@mui/icons-material/RestorePage'
import { useTranslation } from 'react-i18next'
import { usePneConfirm } from '../confirm'
import type { PneFabItem } from '../fab/PneFloatingActionButtons'
import { WidgetLayoutsPanel } from './WidgetLayoutsPanel'
import { getWidgetLayoutsPanelBridge, subscribeWidgetLayoutsPanelBridge } from './widgetLayoutsPanelStore'

export type UseWidgetBoardFabActionsOptions = {
    resetLabel?: React.ReactNode
    restoreHiddenLabel?: React.ReactNode
}

export const useWidgetBoardFabActions = ({
    resetLabel,
    restoreHiddenLabel,
}: UseWidgetBoardFabActionsOptions = {}): PneFabItem[] => {
    const { t } = useTranslation()
    const { confirm } = usePneConfirm()
    const bridge = useSyncExternalStore(subscribeWidgetLayoutsPanelBridge, () => getWidgetLayoutsPanelBridge(), () => null)
    const resolvedResetLabel = resetLabel ?? t('pne.widgetBoard.actions.resetLayout', { defaultValue: 'Reset layout' })
    const resolvedRestoreHiddenLabel =
        restoreHiddenLabel ?? t('pne.widgetBoard.actions.restoreHiddenWidgets', { defaultValue: 'Restore hidden widgets' })
    const confirmTitle = t('react.confirm-alert.title.are-you-sure', { defaultValue: 'Are you sure?' })
    const confirmLabel = t('react.confirm-alert.yes', { defaultValue: 'Yes' })
    const cancelLabel = t('react.confirm-alert.no.cancel', { defaultValue: 'Cancel' })
    const resetMessage = t('pne.widgetBoard.confirm.resetLayout', { defaultValue: 'Reset selected saved layout to default for this breakpoint?' })
    const restoreHiddenMessage = t('pne.widgetBoard.confirm.restoreHiddenWidgets', { defaultValue: 'Restore all hidden widgets in selected saved layout?' })

    const handleResetLayout = useCallback(() => {
        if (!bridge?.onResetLayout) return

        const shouldConfirm = !bridge.actionsState?.isDefaultLayoutSelected
        if (shouldConfirm) {
            void confirm({
                title: confirmTitle,
                message: resetMessage,
                confirmLabel,
                cancelLabel,
            }).then(accepted => {
                if (accepted) {
                    bridge.onResetLayout?.()
                }
            })
            return
        }

        bridge.onResetLayout()
    }, [bridge, cancelLabel, confirm, confirmLabel, confirmTitle, resetMessage])

    const handleRestoreHidden = useCallback(() => {
        if (!bridge?.onRestoreHidden) return

        const shouldConfirm = !bridge.actionsState?.isDefaultLayoutSelected
        if (shouldConfirm) {
            void confirm({
                title: confirmTitle,
                message: restoreHiddenMessage,
                confirmLabel,
                cancelLabel,
            }).then(accepted => {
                if (accepted) {
                    bridge.onRestoreHidden?.()
                }
            })
            return
        }

        bridge.onRestoreHidden()
    }, [bridge, cancelLabel, confirm, confirmLabel, confirmTitle, restoreHiddenMessage])

    const showResetLayout = Boolean(bridge?.actionsState?.canResetLayout)
    const showRestoreHidden = Boolean(bridge?.actionsState?.hasHiddenWidgets)

    return useMemo<PneFabItem[]>(() => {
        const items: PneFabItem[] = [
            {
                id: 'layouts',
                kind: 'content',
                node: <WidgetLayoutsPanel />,
            },
        ]

        if (showResetLayout || showRestoreHidden) {
            items.push({ id: 'divider-layouts', kind: 'divider' })
        }

        if (showResetLayout) {
            items.push({
                id: 'reset-layout',
                label: resolvedResetLabel,
                icon: <RestartAltIcon fontSize='small' />,
                onClick: handleResetLayout,
            })
        }

        if (showRestoreHidden) {
            items.push({
                id: 'restore-hidden',
                label: resolvedRestoreHiddenLabel,
                icon: <RestorePageIcon fontSize='small' />,
                onClick: handleRestoreHidden,
            })
        }

        return items
    }, [handleResetLayout, handleRestoreHidden, resolvedResetLabel, resolvedRestoreHiddenLabel, showResetLayout, showRestoreHidden])
}
