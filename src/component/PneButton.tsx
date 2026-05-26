import {Button, ButtonProps} from '@mui/material'
import {alpha} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import * as React from 'react'

export type PneButtonStyle = 'contained' | 'outlined' | 'error' | 'text'
type PneButtonSize = 'small' | 'medium' | 'large'

type ButtonSizeConfig = {
    height: number
    verticalPadding: number
    horizontalPadding: number
    iconNearPadding: number
    iconFarPadding: number
    iconOnlyPadding: number
    gap: number
}

const buttonMinWidth = 64
const outlinedBorderWidth = 1

const buttonSizeConfig: Record<PneButtonSize, ButtonSizeConfig> = {
    small: {
        height: 28,
        verticalPadding: 4,
        horizontalPadding: 16,
        iconNearPadding: 12,
        iconFarPadding: 16,
        iconOnlyPadding: 6,
        gap: 4,
    },
    medium: {
        height: 32,
        verticalPadding: 6,
        horizontalPadding: 20,
        iconNearPadding: 16,
        iconFarPadding: 20,
        iconOnlyPadding: 8,
        gap: 8,
    },
    large: {
        height: 40,
        verticalPadding: 10,
        horizontalPadding: 20,
        iconNearPadding: 16,
        iconFarPadding: 20,
        iconOnlyPadding: 10,
        gap: 8,
    },
}

const isPneButtonSize = (size: ButtonProps['size']): size is PneButtonSize => {
    return size === 'small' || size === 'medium' || size === 'large'
}

// https://mui.com/material-ui/guides/typescript/#complications-with-the-component-prop
const PneButton = <C extends React.ElementType>(
    props: ButtonProps<C, { component?: C }> & {pneStyle?: PneButtonStyle}
) => {
    const {
        sx,
        children,
        variant,
        color,
        size = 'large',
        pneStyle,
        startIcon,
        endIcon,
        ...rest
    } = props

    const resolvedSize = isPneButtonSize(size) ? size : 'large'

    let finalVariant: ButtonProps['variant'] = 'contained'
    let finalColor: ButtonProps['color'] = 'primary'

    if (pneStyle) {
        switch (pneStyle) {
            case 'contained':
                finalVariant = 'contained'
                finalColor = 'primary'
                break
            case 'outlined':
                finalVariant = 'outlined'
                finalColor = 'primary'
                break
            case 'error':
                finalVariant = 'outlined'
                finalColor = 'error'
                break
            case 'text':
                finalVariant = 'text'
                finalColor = 'primary'
                break
            default:
                console.warn(`Unknown pneStyle: ${pneStyle}`)
        }
    } else {
        finalVariant = variant || finalVariant
        finalColor = color || finalColor
    }

    const hasStartIcon = Boolean(startIcon)
    const hasEndIcon = Boolean(endIcon)
    const hasChildren = React.Children.count(children) > 0
    const iconOnly = !hasChildren && (hasStartIcon || hasEndIcon)

    const _sx: SxProps<Theme> = [
        createButtonSx({
            color: finalColor,
            hasEndIcon,
            hasStartIcon,
            iconOnly,
            size: resolvedSize,
            variant: finalVariant,
        }),
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <Button
        sx={_sx}
        variant={finalVariant}
        color={finalColor}
        size={resolvedSize}
        startIcon={startIcon}
        endIcon={endIcon}
        {...rest}
    >
        {children}
    </Button>
}

const createButtonSx = (
    options: {
        color: ButtonProps['color']
        hasEndIcon: boolean
        hasStartIcon: boolean
        iconOnly: boolean
        size: PneButtonSize
        variant: ButtonProps['variant']
    },
): SxProps<Theme> => theme => {
    const config = buttonSizeConfig[options.size]
    const iconOnlyPadding = config.iconOnlyPadding
    const iconOnlySize = 16 + iconOnlyPadding * 2

    return {
        ...createButtonBaseSx(config, options, iconOnlyPadding, iconOnlySize),
        ...createPrimaryButtonColorSx(theme, options.variant, options.color),
    } as SystemStyleObject<Theme>
}

const createButtonBaseSx = (
    config: ButtonSizeConfig,
    options: {
        hasEndIcon: boolean
        hasStartIcon: boolean
        iconOnly: boolean
        variant: ButtonProps['variant']
    },
    iconOnlyPadding: number,
    iconOnlySize: number,
): SystemStyleObject<Theme> => {
    const padding = getButtonPadding(config, options, iconOnlyPadding)

    return {
        borderRadius: '4px',
        boxShadow: 'none',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 400,
        gap: options.iconOnly ? 0 : `${config.gap}px`,
        height: options.iconOnly ? `${iconOnlySize}px` : `${config.height}px`,
        lineHeight: '20px',
        minHeight: options.iconOnly ? `${iconOnlySize}px` : `${config.height}px`,
        minWidth: options.iconOnly ? `${iconOnlySize}px` : `${buttonMinWidth}px`,
        padding,
        textTransform: 'none',
        ...(options.iconOnly ? {width: `${iconOnlySize}px`} : {}),
        '&:hover': {
            boxShadow: 'none',
        },
        '&:active': {
            boxShadow: 'none',
        },
        '&&& .MuiButton-startIcon, &&& .MuiButton-endIcon': {
            display: 'inline-flex',
            marginLeft: 0,
            marginRight: 0,
        },
        '&&& .MuiButton-startIcon > *:nth-of-type(1), &&& .MuiButton-endIcon > *:nth-of-type(1)': {
            fontSize: 16,
        },
        '&&& .MuiButton-startIcon svg, &&& .MuiButton-endIcon svg': {
            height: 16,
            width: 16,
        },
    }
}

const getButtonPadding = (
    config: ButtonSizeConfig,
    options: {
        hasEndIcon: boolean
        hasStartIcon: boolean
        iconOnly: boolean
        variant: ButtonProps['variant']
    },
    iconOnlyPadding: number,
) => {
    if (options.iconOnly) {
        return `${iconOnlyPadding}px`
    }

    const compensateBorder = options.variant === 'outlined'
    const verticalPadding = getButtonPaddingValue(config.verticalPadding, compensateBorder)
    const horizontalPadding = getButtonPaddingValue(config.horizontalPadding, compensateBorder)
    const iconNearPadding = getButtonPaddingValue(config.iconNearPadding, compensateBorder)
    const iconFarPadding = getButtonPaddingValue(config.iconFarPadding, compensateBorder)

    if (options.hasStartIcon) {
        return `${verticalPadding}px ${iconFarPadding}px ${verticalPadding}px ${iconNearPadding}px`
    }

    if (options.hasEndIcon) {
        return `${verticalPadding}px ${iconNearPadding}px ${verticalPadding}px ${iconFarPadding}px`
    }

    return `${verticalPadding}px ${horizontalPadding}px`
}

const getButtonPaddingValue = (padding: number, compensateBorder: boolean) => {
    return compensateBorder ? padding - outlinedBorderWidth : padding
}

const createPrimaryButtonColorSx = (
    theme: Theme,
    variant: ButtonProps['variant'],
    color: ButtonProps['color'],
): SystemStyleObject<Theme> => {
    if (color !== 'primary') {
        return {}
    }

    const feedbackBackgroundColor = alpha(theme.palette.primary.main, 0.1)

    if (variant === 'contained') {
        return {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover, &:active': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: 'none',
            },
            '&.Mui-disabled': {
                backgroundColor: '#B0B7C3',
                color: '#fff',
            },
        }
    }

    if (variant === 'outlined') {
        return {
            backgroundColor: 'transparent',
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover, &:active': {
                backgroundColor: feedbackBackgroundColor,
                borderColor: theme.palette.primary.dark,
                color: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
                backgroundColor: 'transparent',
                borderColor: '#B0B7C3',
                color: '#B0B7C3',
            },
        }
    }

    if (variant === 'text') {
        return {
            color: theme.palette.primary.main,
            '&:hover, &:active': {
                backgroundColor: feedbackBackgroundColor,
                color: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
                backgroundColor: 'transparent',
                color: '#B0B7C3',
            },
        }
    }

    return {}
}

export default PneButton
