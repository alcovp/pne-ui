import React from 'react'
import PneFloatingActionButtons, { type PneFloatingActionButtonsProps } from '../fab/PneFloatingActionButtons'
import { useWidgetBoardFabActions, type UseWidgetBoardFabActionsOptions } from './useWidgetBoardFabActions'

export type WidgetBoardFabProps = Omit<PneFloatingActionButtonsProps, 'actions'> & UseWidgetBoardFabActionsOptions

export const WidgetBoardFab: React.FC<WidgetBoardFabProps> = ({
    store,
    resetLabel,
    restoreHiddenLabel,
    ...fabProps
}) => {
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
