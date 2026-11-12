import * as React from 'react'
import {createSvgIcon} from '@mui/material'

/** UI Kit Ic/Menu/Menu-drag-n-drop-vertical: six dots, the handle a row is dragged by. */
const PneDragHandleIcon = createSvgIcon(
    <g fill='currentColor'>
        <circle cx={8} cy={6} r={1}/>
        <circle cx={8} cy={12} r={1}/>
        <circle cx={8} cy={18} r={1}/>
        <circle cx={16} cy={6} r={1}/>
        <circle cx={16} cy={12} r={1}/>
        <circle cx={16} cy={18} r={1}/>
    </g>,
    'PneDragHandle',
)

export default PneDragHandleIcon
