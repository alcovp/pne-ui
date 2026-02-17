import React, { useState } from 'react'
import PneFloatingActionButtons, { type PneFloatingActionButtonsProps } from '../fab/PneFloatingActionButtons'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import { useWidgetBoardFabActions, type UseWidgetBoardFabActionsOptions } from './useWidgetBoardFabActions'
import { WidgetBoardVisibilityModal } from './WidgetBoardVisibilityModal'

export type WidgetBoardFabProps = Omit<PneFloatingActionButtonsProps, 'actions'> &
    Omit<UseWidgetBoardFabActionsOptions, 'store' | 'onEditVisibilityClick'>

export const WidgetBoardFab: React.FC<WidgetBoardFabProps> = ({
    resetLabel,
    editVisibilityLabel,
    restoreHiddenLabel,
    ...fabProps
}) => {
    const store = useWidgetBoardScopeStore()
    const [isVisibilityModalOpen, setVisibilityModalOpen] = useState(false)

    const visibilityItems = store(state => state.visibilityItems)
    const setWidgetVisibility = store(state => state.onSetWidgetVisibility)

    const actions = useWidgetBoardFabActions({
        store,
        resetLabel,
        editVisibilityLabel,
        restoreHiddenLabel,
        onEditVisibilityClick: () => setVisibilityModalOpen(true),
    })

    return (
        <>
            <PneFloatingActionButtons
                {...fabProps}
                actions={actions}
            />
            <WidgetBoardVisibilityModal
                open={isVisibilityModalOpen}
                onClose={() => setVisibilityModalOpen(false)}
                items={visibilityItems}
                onSetWidgetVisibility={setWidgetVisibility}
            />
        </>
    )
}

export default WidgetBoardFab
