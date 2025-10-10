import React, { forwardRef } from 'react'
import {
    FormControl,
    FormControlLabel,
    FormControlLabelProps,
    FormControlProps,
    FormGroup,
    FormGroupProps,
    FormHelperText,
    FormHelperTextProps,
    SxProps,
} from '@mui/material'
import { CheckboxProps } from '@mui/material/Checkbox'
import { PneCheckbox } from './PneCheckbox'

export type PneLabeledCheckboxProps = CheckboxProps & {
    label?: React.ReactNode
    helperText?: React.ReactNode
    error?: boolean
    containerSx?: SxProps
    formControlProps?: Omit<FormControlProps, 'error' | 'sx'>
    formGroupProps?: FormGroupProps
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>
    helperTextProps?: FormHelperTextProps
}

export const PneLabeledCheckbox = forwardRef<HTMLButtonElement, PneLabeledCheckboxProps>((props, ref) => {
    const {
        label,
        helperText,
        error = false,
        containerSx,
        formControlProps,
        formGroupProps,
        formControlLabelProps,
        helperTextProps,
        sx,
        ...rest
    } = props

    return (
        <FormControl
            error={error}
            sx={containerSx}
            {...formControlProps}
        >
            <FormGroup {...formGroupProps}>
                <FormControlLabel
                    control={
                        <PneCheckbox
                            {...rest}
                            sx={sx}
                            ref={ref}
                        />
                    }
                    label={label}
                    {...formControlLabelProps}
                />
            </FormGroup>
            {helperText && (
                <FormHelperText {...helperTextProps}>{helperText}</FormHelperText>
            )}
        </FormControl>
    )
})

PneLabeledCheckbox.displayName = 'PneLabeledCheckbox'
