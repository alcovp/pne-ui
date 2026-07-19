import React, {ReactNode, forwardRef, isValidElement, useId} from 'react'
import {FormControl, FormControlProps, FormHelperText, FormLabel, SxProps} from '@mui/material'
import {Theme} from '@mui/material/styles'
import {PneFieldContext, PneFieldContextValue} from './PneFieldContext'

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

    const generatedId = useId()
    const fieldId = id ?? generatedId
    const childId = getChildId(children)
    const controlId = htmlFor ?? childId ?? `${fieldId}-control`
    const helperTextId = helperText ? `${fieldId}-helper-text` : undefined
    const labelId = label ? `${fieldId}-label` : undefined
    const contextValue: PneFieldContextValue = {
        controlId,
        disabled,
        error,
        fullWidth,
        helperTextId,
        labelId,
        required,
    }

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
                htmlFor={controlId}
                id={labelId}
                required={required}
                sx={[
                    {
                        alignSelf: 'flex-start',
                        color: error ? 'error.main' : 'text.secondary',
                        fontSize: '0.875rem',
                        lineHeight: '20px',
                        maxWidth: '100%',
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
        <PneFieldContext.Provider value={contextValue}>
            {children}
        </PneFieldContext.Provider>
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

const getChildId = (children: ReactNode): string | undefined => {
    if (!isValidElement<{ id?: unknown }>(children)) {
        return undefined
    }

    return typeof children.props.id === 'string' && children.props.id !== ''
        ? children.props.id
        : undefined
}

export default PneField
