import React, {ChangeEvent, MouseEvent, useCallback} from 'react'
import {SxProps, TableCellProps, Theme} from '@mui/material'
import {PneCheckbox} from '../PneCheckbox'
import {AutoTestValue, createAutoTestAttributes} from '../AutoTestAttribute'
import PneHeaderTableCell from './PneHeaderTableCell'
import {TableSelectionPageState} from './tableSelection'
import {
    SelectionCheckboxAccessibleName,
    selectionCheckboxSx,
} from './PneTableSelectionCell'

export type PneTableSelectionHeaderCellProps = Omit<
    TableCellProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'onChange' | 'onClick'
> & SelectionCheckboxAccessibleName & {
    state: TableSelectionPageState
    disabled?: boolean
    checkboxSx?: SxProps<Theme>
    autoTestId?: string
    autoTestValue?: AutoTestValue
    onChange: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void
}

const headerCellSx: SxProps<Theme> = {
    boxSizing: 'border-box',
    padding: 0,
    textAlign: 'center',
    width: '40px',
}

const PneTableSelectionHeaderCell = (props: PneTableSelectionHeaderCellProps) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        autoTestId = 'page-selection',
        autoTestValue,
        checkboxSx,
        disabled = false,
        onChange,
        state,
        sx,
        ...cellProps
    } = props

    const handleCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
        event.stopPropagation()
    }
    const indeterminate = state === 'some'
    const setInputRef = useCallback((input: HTMLInputElement | null) => {
        if (input) {
            input.indeterminate = indeterminate
        }
    }, [indeterminate])

    return <PneHeaderTableCell
        {...cellProps}
        onClick={handleCellClick}
        scope='col'
        sx={[
            headerCellSx,
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        <PneCheckbox
            checked={state === 'all'}
            disabled={disabled}
            indeterminate={indeterminate}
            onChange={(event, nextChecked) => {
                if (!disabled) {
                    onChange(nextChecked, event)
                }
            }}
            slotProps={{
                input: {
                    ...createAutoTestAttributes(autoTestId, autoTestValue),
                    'aria-checked': indeterminate ? 'mixed' : state === 'all',
                    'aria-label': ariaLabel,
                    'aria-labelledby': ariaLabelledBy,
                    ref: setInputRef,
                },
            }}
            sx={[
                selectionCheckboxSx,
                ...(Array.isArray(checkboxSx) ? checkboxSx : [checkboxSx]),
            ]}
        />
    </PneHeaderTableCell>
}

export default PneTableSelectionHeaderCell
