import React, {forwardRef, useId} from 'react'
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
import {mergeAriaDescribedBy} from './PneFieldContext'
import {PneCheckbox, PneCheckboxProps} from './PneCheckbox'

export interface PneLabeledCheckboxProps extends PneCheckboxProps {
    label?: React.ReactNode
    helperText?: React.ReactNode
    error?: boolean
    containerSx?: SxProps
    formControlProps?: Omit<FormControlProps, 'error' | 'sx'>
    formGroupProps?: FormGroupProps
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>
    helperTextProps?: FormHelperTextProps
}

export const PneLabeledCheckbox = forwardRef<HTMLSpanElement, PneLabeledCheckboxProps>((props, ref) => {
    const {
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': ariaInvalid,
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
    const generatedId = useId()
    const hasHelperText = helperText !== undefined && helperText !== null
    const helperTextId = hasHelperText
        ? helperTextProps?.id ?? `${generatedId}-helper-text`
        : undefined

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
                            aria-describedby={mergeAriaDescribedBy(ariaDescribedBy, helperTextId)}
                            aria-invalid={error ? true : ariaInvalid}
                            sx={sx}
                            ref={ref}
                        />
                    }
                    label={label}
                    {...formControlLabelProps}
                />
            </FormGroup>
            {hasHelperText && (
                <FormHelperText {...helperTextProps} id={helperTextId}>{helperText}</FormHelperText>
            )}
        </FormControl>
    )
})

PneLabeledCheckbox.displayName = 'PneLabeledCheckbox'
