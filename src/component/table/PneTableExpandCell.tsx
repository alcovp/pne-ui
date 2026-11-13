import React, {forwardRef, MouseEvent} from 'react'
import {IconButton} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import {AutoTestValue, createAutoTestAttributes} from '../AutoTestAttribute'
import {resolvePneSemanticPalette} from '../../createTheme'
import {PneChevronDownIcon} from '../dropdown/dropdownLook'
import {pneIconActionSx} from '../iconActionLook'
import PneTableControlCell, {PneTableControlCellProps} from './PneTableControlCell'

export type PneTableExpandCellProps = Omit<PneTableControlCellProps, 'aria-label' | 'children' | 'onClick'> & {
    /** The name of the button: what the row opens. Optional: the chevron reads by its place in the row. */
    'aria-label'?: string
    expanded: boolean
    onToggle: (expanded: boolean, event: MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
    /** Locator attached to the button. */
    autoTestId?: string
    autoTestValue?: AutoTestValue
}

// An open row keeps the colour the icon takes under the pointer (UI Kit Icon action, Active).
const expandedSx: SxProps<Theme> = theme => ({
    color: resolvePneSemanticPalette(theme).button.text.hover.text,
})

/**
 * A cell with the chevron that opens and closes a row (UI Kit Cell: Expand and Cell: Collapse):
 * an icon action in a control cell; the chevron points right on a closed row and up on an open one.
 */
const PneTableExpandCell = forwardRef<HTMLTableCellElement, PneTableExpandCellProps>((props, ref) => {
    const {
        'aria-label': ariaLabel,
        autoTestId = 'row-expand',
        autoTestValue,
        disabled = false,
        expanded,
        onToggle,
        sx,
        ...rest
    } = props

    return <PneTableControlCell
        data-pne-cell='expand'
        {...rest}
        onClick={event => event.stopPropagation()}
        ref={ref}
        sx={[
            {boxSizing: 'border-box', textAlign: 'center', width: '40px'},
            ...(Array.isArray(sx) ? sx : [sx]),
        ] as PneTableControlCellProps['sx']}
    >
        <IconButton
            {...createAutoTestAttributes(autoTestId, autoTestValue)}
            aria-expanded={expanded}
            aria-label={ariaLabel}
            disabled={disabled}
            disableRipple
            onClick={event => onToggle(!expanded, event)}
            sx={[pneIconActionSx('small'), ...(expanded ? [expandedSx] : [])] as SxProps<Theme>}
            type='button'
        >
            <PneChevronDownIcon sx={{transform: expanded ? 'rotate(180deg)' : 'rotate(-90deg)'}}/>
        </IconButton>
    </PneTableControlCell>
})

PneTableExpandCell.displayName = 'PneTableExpandCell'

export default PneTableExpandCell
