import React from 'react'
import PneFloatingActionButtons, { type PneFloatingActionButtonsProps } from '../fab/PneFloatingActionButtons'
import { useWidgetBoardScopeStore } from './WidgetBoardScope'
import { useWidgetBoardFabActions, type UseWidgetBoardFabActionsOptions } from './useWidgetBoardFabActions'

export type WidgetBoardFabProps = Omit<PneFloatingActionButtonsProps, 'actions'> &
    Omit<UseWidgetBoardFabActionsOptions, 'store'>

export const WidgetBoardFab: React.FC<WidgetBoardFabProps> = ({
    resetLabel,
    restoreHiddenLabel,
    ...fabProps
}) => {
    const store = useWidgetBoardScopeStore()

    const actions = useWidgetBoardFabActions({
        store,
        resetLabel,
        restoreHiddenLabel,
    })

    return (
        <PneFloatingActionButtons
            {...fabProps}
            actions={actions}
        />
    )
}

export default WidgetBoardFab
