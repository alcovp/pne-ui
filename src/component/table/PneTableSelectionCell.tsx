import React, {ChangeEvent, MouseEvent} from 'react'
import {SxProps, TableCellProps, Theme} from '@mui/material'
import {PneCheckbox} from '../PneCheckbox'
import {AutoTestValue, createAutoTestAttributes} from '../AutoTestAttribute'
import PneTableControlCell from './PneTableControlCell'

export type SelectionCheckboxAccessibleName =
    | {
        'aria-label': string
        'aria-labelledby'?: never
    }
    | {
        'aria-label'?: never
        'aria-labelledby': string
    }

export type PneTableSelectionCellProps = Omit<
    TableCellProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'onChange' | 'onClick' | 'ref'
> & SelectionCheckboxAccessibleName & {
    checked: boolean
    disabled?: boolean
    checkboxSx?: SxProps<Theme>
    autoTestId?: string
    autoTestValue?: AutoTestValue
    onChange: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void
}

/** UI Kit Cell: Checkbox - the 20px box with 8px at its sides. */
export const SELECTION_CELL_WIDTH = 36

const selectionCellSx: SxProps<Theme> = {
    boxSizing: 'border-box',
    padding: 0,
    textAlign: 'center',
    width: `${SELECTION_CELL_WIDTH}px`,
}

/** The box is 20px (PneCheckbox `medium`); its 8px of padding make the whole cell width the hit area. */
export const selectionCheckboxSx: SxProps<Theme> = {
    boxSizing: 'border-box',
    height: `${SELECTION_CELL_WIDTH}px`,
    padding: '8px',
    width: `${SELECTION_CELL_WIDTH}px`,
}

const PneTableSelectionCell = (props: PneTableSelectionCellProps) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        autoTestId = 'row-selection',
        autoTestValue,
        checked,
        checkboxSx,
        disabled = false,
        onChange,
        sx,
        ...cellProps
    } = props

    const handleCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
        event.stopPropagation()
    }

    return <PneTableControlCell
        {...cellProps}
        onClick={handleCellClick}
        sx={[
            selectionCellSx,
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        <PneCheckbox
            checked={checked}
            disabled={disabled}
            size='medium'
            onChange={(event, nextChecked) => {
                if (!disabled) {
                    onChange(nextChecked, event)
                }
            }}
            slotProps={{
                input: {
                    ...createAutoTestAttributes(autoTestId, autoTestValue),
                    'aria-label': ariaLabel,
                    'aria-labelledby': ariaLabelledBy,
                },
            }}
            sx={[
                selectionCheckboxSx,
                ...(Array.isArray(checkboxSx) ? checkboxSx : [checkboxSx]),
            ]}
        />
    </PneTableControlCell>
}

export default PneTableSelectionCell
