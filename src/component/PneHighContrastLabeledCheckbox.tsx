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

const getEffectiveBackgroundColor = (
    element: HTMLElement,
    fallback: string,
    getComputedStyleFn: (elt: Element) => CSSStyleDeclaration,
): string => {
    let current: HTMLElement | null = element

    while (current) {
        const color = getComputedStyleFn(current).backgroundColor

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

    const updateLabelColor = React.useCallback(() => {
        const element = formControlRef.current

        if (!element) {
            return
        }

        const ownerWindow = element.ownerDocument?.defaultView

        if (!ownerWindow) {
            return
        }

        const getStyle = ownerWindow.getComputedStyle.bind(ownerWindow)
        const backgroundColor = getEffectiveBackgroundColor(
            element,
            theme.palette.background.paper,
            getStyle,
        )
        const contrastColor = theme.palette.getContrastText(backgroundColor)

        setLabelColor((previous) => (previous === contrastColor ? previous : contrastColor))
    }, [theme])

    React.useEffect(() => {
        const element = formControlRef.current

        if (!element) {
            return
        }

        const ownerWindow = element.ownerDocument?.defaultView

        if (!ownerWindow) {
            return
        }

        updateLabelColor()

        const cleanupCallbacks: Array<() => void> = []

        const trackedElements: HTMLElement[] = []
        let current: HTMLElement | null = element

        while (current) {
            trackedElements.push(current)
            current = current.parentElement
        }

        const MutationObserverCtor = ownerWindow.MutationObserver

        if (MutationObserverCtor) {
            const mutationObservers: MutationObserver[] = []
            const config: MutationObserverInit = {
                attributes: true,
                attributeFilter: ['style', 'class'],
            }

            trackedElements.forEach((target) => {
                const observer = new MutationObserverCtor(() => {
                    updateLabelColor()
                })

                observer.observe(target, config)
                mutationObservers.push(observer)
            })

            cleanupCallbacks.push(() => {
                mutationObservers.forEach((observer) => observer.disconnect())
            })
        }

        const ResizeObserverCtor = ownerWindow.ResizeObserver

        if (ResizeObserverCtor) {
            const resizeObserver = new ResizeObserverCtor(() => {
                updateLabelColor()
            })

            trackedElements.forEach((target) => {
                resizeObserver.observe(target)
            })

            cleanupCallbacks.push(() => {
                resizeObserver.disconnect()
            })
        } else {
            const handleResize = () => {
                updateLabelColor()
            }

            ownerWindow.addEventListener('resize', handleResize)
            cleanupCallbacks.push(() => {
                ownerWindow.removeEventListener('resize', handleResize)
            })
        }

        trackedElements.forEach((target) => {
            const handleTransitionEnd = () => {
                updateLabelColor()
            }

            const handleAnimationEnd = () => {
                updateLabelColor()
            }

            target.addEventListener('transitionend', handleTransitionEnd)
            target.addEventListener('animationend', handleAnimationEnd)

            cleanupCallbacks.push(() => {
                target.removeEventListener('transitionend', handleTransitionEnd)
                target.removeEventListener('animationend', handleAnimationEnd)
            })
        })

        return () => {
            cleanupCallbacks.forEach((dispose) => dispose())
        }
    }, [updateLabelColor])

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
