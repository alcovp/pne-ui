import React, { forwardRef } from 'react'
import {
    alpha,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormHelperTextProps,
    SxProps,
    useTheme,
} from '@mui/material'
import { PneCheckbox } from './PneCheckbox'
import type { Theme } from '@mui/material/styles'
import type { PneLabeledCheckboxProps } from './PneLabeledCheckbox'

const TRANSPARENT_VALUES = new Set([
    '',
    'transparent',
    'rgba(0, 0, 0, 0)',
    'rgba(0,0,0,0)',
    'rgb(0, 0, 0, 0)',
    'rgb(0 0 0 / 0)',
])

const mergeSx = (...styles: Array<SxProps<Theme> | undefined>): SxProps<Theme> | undefined => {
    const merged: Array<SxProps<Theme>> = []

    styles.forEach((style) => {
        if (style === undefined || style === null) {
            return
        }

        if (Array.isArray(style)) {
            style.forEach((entry) => {
                if (entry === undefined || entry === null) {
                    return
                }

                merged.push(entry)
            })
        } else {
            merged.push(style)
        }
    })

    if (merged.length === 0) {
        return undefined
    }

    if (merged.length === 1) {
        return merged[0]
    }

    return merged as SxProps<Theme>
}

const getEffectiveBackgroundColor = (element: HTMLElement, fallback: string): string => {
    let current: HTMLElement | null = element

    while (current) {
        const color = window.getComputedStyle(current).backgroundColor

        if (color && !TRANSPARENT_VALUES.has(color)) {
            const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)

            if (!rgbaMatch) {
                return color
            }

            const channels = rgbaMatch[1]
                .split(/[,/]/)
                .map((channel) => channel.trim())
                .filter(Boolean)

            if (channels.length < 4) {
                return color
            }

            const alphaChannel = parseFloat(channels[3])

            if (!Number.isNaN(alphaChannel) && alphaChannel > 0) {
                return color
            }
        }

        current = current.parentElement
    }

    return fallback
}

export const PneHighContrastLabeledCheckbox = forwardRef<HTMLButtonElement, PneLabeledCheckboxProps>((props, ref) => {
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

    const theme = useTheme()
    const formControlRef = React.useRef<HTMLDivElement | null>(null)
    const [labelColor, setLabelColor] = React.useState<string>(() => theme.palette.text.primary)

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        const element = formControlRef.current

        if (!element) {
            return
        }

        const backgroundColor = getEffectiveBackgroundColor(element, theme.palette.background.paper)
        const contrastColor = theme.palette.getContrastText(backgroundColor)

        setLabelColor(contrastColor)
    }, [theme])

    const disabledStateSx: SxProps<Theme> = {
        '& .Mui-disabled': {
            backgroundColor: '#FFFFFF',
        },
    }

    const controlSx = mergeSx(
        disabledStateSx,
        containerSx,
    )

    const checkboxSx = mergeSx(
        {
            color: labelColor,
            '&.Mui-checked': {
                color: labelColor,
            },
            '&.MuiCheckbox-indeterminate': {
                color: labelColor,
            },
            '&.Mui-disabled': {
                color: theme.palette.action.disabled,
            },
        },
        sx,
    )

    const labelProps = {
        ...(formControlLabelProps ?? {}),
        sx: mergeSx(
            {
                '& .MuiFormControlLabel-label': {
                    color: labelColor,
                },
                '&.Mui-disabled .MuiFormControlLabel-label': {
                    color: theme.palette.text.disabled,
                },
            },
            formControlLabelProps?.sx,
        ),
    }

    const helperProps: FormHelperTextProps | undefined = helperText
        ? {
            ...(helperTextProps ?? {}),
            sx: mergeSx(
                {
                    color: alpha(labelColor, 0.72),
                },
                helperTextProps?.sx,
            ),
        }
        : undefined

    return (
        <FormControl
            ref={formControlRef}
            error={error}
            sx={controlSx}
            {...formControlProps}
        >
            <FormGroup {...formGroupProps}>
                <FormControlLabel
                    control={
                        <PneCheckbox
                            {...rest}
                            sx={checkboxSx}
                            ref={ref}
                        />
                    }
                    label={label}
                    {...labelProps}
                />
            </FormGroup>
            {helperText && (
                <FormHelperText {...helperProps}>{helperText}</FormHelperText>
            )}
        </FormControl>
    )
})

PneHighContrastLabeledCheckbox.displayName = 'PneHighContrastLabeledCheckbox'
