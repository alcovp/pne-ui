import React, {ReactNode, forwardRef} from 'react'
import {FormControl, FormControlProps, FormHelperText, FormLabel, SxProps} from '@mui/material'
import {Theme} from '@mui/material/styles'

export interface PneFieldProps
    extends Omit<FormControlProps, 'children' | 'disabled' | 'error' | 'fullWidth' | 'required'> {
    children: ReactNode
    disabled?: boolean
    error?: boolean
    fullWidth?: boolean
    helperText?: ReactNode
    helperTextSx?: SxProps<Theme>
    htmlFor?: string
    id?: string
    label?: ReactNode
    labelSx?: SxProps<Theme>
    required?: boolean
}

const PneField = forwardRef<HTMLDivElement, PneFieldProps>((props, ref) => {
    const {
        children,
        disabled = false,
        error = false,
        fullWidth = true,
        helperText,
        helperTextSx,
        htmlFor,
        id,
        label,
        labelSx,
        required = false,
        sx,
        ...rest
    } = props

    const helperTextId = helperText && id ? `${id}-helper-text` : undefined

    return <FormControl
        disabled={disabled}
        error={error}
        fullWidth={fullWidth}
        id={id}
        required={required}
        ref={ref}
        sx={[
            {
                gap: '4px',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
    >
        {label
            ? <FormLabel
                htmlFor={htmlFor}
                required={required}
                sx={[
                    {
                        color: error ? 'error.main' : 'text.secondary',
                        fontSize: '0.875rem',
                        lineHeight: '20px',
                        '&.Mui-focused': {
                            color: error ? 'error.main' : 'text.secondary',
                        },
                        '& .MuiFormLabel-asterisk': {
                            color: 'error.main',
                        },
                    },
                    ...(Array.isArray(labelSx) ? labelSx : [labelSx]),
                ]}
            >
                {label}
            </FormLabel>
            : null}
        {children}
        {helperText
            ? <FormHelperText
                id={helperTextId}
                sx={[
                    {
                        mx: '14px',
                    },
                    ...(Array.isArray(helperTextSx) ? helperTextSx : [helperTextSx]),
                ]}
            >
                {helperText}
            </FormHelperText>
            : null}
    </FormControl>
})

export default PneField
