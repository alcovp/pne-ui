import React, {ChangeEvent, forwardRef, MouseEvent} from 'react'
import {SxProps, TableCellProps, Theme} from '@mui/material'
import type {SwitchOwnerState} from '@mui/material/Switch'
import PneSwitch, {PneSwitchProps} from '../PneSwitch'
import {AutoTestValue, createAutoTestAttributes} from '../AutoTestAttribute'
import PneTableControlCell from './PneTableControlCell'

export type TableSwitchAccessibleName =
    | {
        'aria-label': string
        'aria-labelledby'?: never
    }
    | {
        'aria-label'?: never
        'aria-labelledby': string
    }

type SwitchDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneTableSwitchControlProps = Omit<
    PneSwitchProps,
    | 'aria-label'
    | 'aria-labelledby'
    | 'checked'
    | 'defaultChecked'
    | 'disabled'
    | 'onChange'
    | 'readOnly'
    | 'size'
> & SwitchDataAttributes

type PneTableSwitchCellBaseProps = Omit<
    TableCellProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'onChange' | 'onClick' | 'ref'
> & TableSwitchAccessibleName & {
    /** Locator attached to the native switch input. */
    autoTestId?: string
    autoTestValue?: AutoTestValue
    checked: boolean
    disabled?: boolean
    /** Ref to the PneSwitch span root. Use switchProps.inputRef for the native input. */
    switchRef?: React.Ref<HTMLSpanElement>
    /** Switch-only props; cell props stay at the top level. */
    switchProps?: PneTableSwitchControlProps
}

type InteractiveTableSwitchCellProps = {
    readOnly?: false
    onChange:
        | ((checked: boolean, event: ChangeEvent<HTMLInputElement>) => void)
        | ((checked: boolean, event: ChangeEvent<HTMLInputElement>) => PromiseLike<unknown>)
}

type ReadOnlyTableSwitchCellProps = {
    readOnly: true
    onChange?: never
}

export type PneTableSwitchCellProps = PneTableSwitchCellBaseProps & (
    | InteractiveTableSwitchCellProps
    | ReadOnlyTableSwitchCellProps
)

const switchCellSx: SxProps<Theme> = {
    boxSizing: 'border-box',
    padding: 0,
    textAlign: 'center',
    width: '40px',
}

type SwitchInputSlotProps = NonNullable<NonNullable<PneSwitchProps['slotProps']>['input']>

const resolveInputSlotProps = (
    slotProps: SwitchInputSlotProps | undefined,
    ownerState: SwitchOwnerState,
) => {
    return typeof slotProps === 'function'
        ? slotProps(ownerState)
        : slotProps ?? {}
}

const PneTableSwitchCell = forwardRef<HTMLTableCellElement, PneTableSwitchCellProps>((props, ref) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        autoTestId = 'table-switch',
        autoTestValue,
        checked,
        disabled = false,
        onChange,
        readOnly = false,
        switchRef,
        switchProps,
        sx,
        ...cellProps
    } = props
    const {
        slotProps: switchSlotProps,
        ...restSwitchProps
    } = switchProps ?? {}
    const consumerInputSlotProps = switchSlotProps?.input

    const handleCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
        event.stopPropagation()
    }

    return <PneTableControlCell
        {...cellProps}
        onClick={handleCellClick}
        ref={ref}
        sx={[
            switchCellSx,
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        <PneSwitch
            {...restSwitchProps}
            checked={checked}
            disabled={disabled}
            onChange={(event, nextChecked) => {
                if (!disabled && !readOnly) {
                    return onChange?.(nextChecked, event)
                }
            }}
            readOnly={readOnly}
            ref={switchRef}
            size='small'
            slotProps={{
                ...switchSlotProps,
                input: ownerState => {
                    const inputProps = resolveInputSlotProps(consumerInputSlotProps, ownerState)
                    const consumerOnClick = inputProps.onClick

                    return {
                        ...inputProps,
                        ...createAutoTestAttributes(autoTestId, autoTestValue),
                        'aria-label': ariaLabel,
                        'aria-labelledby': ariaLabelledBy,
                        ...(readOnly ? {
                            onClick: (event: React.MouseEvent<HTMLInputElement>) => {
                                consumerOnClick?.(event)
                                const input = event.currentTarget

                                // A controlled checkbox input may retain the browser's
                                // transient toggle after preventDefault. Restore it before
                                // paint while keeping the read-only switch focusable.
                                queueMicrotask(() => {
                                    input.checked = checked
                                })
                            },
                        } : {}),
                    }
                },
            }}
        />
    </PneTableControlCell>
})

PneTableSwitchCell.displayName = 'PneTableSwitchCell'

export default PneTableSwitchCell
