import {Button, CircularProgress} from '@mui/material'
import type {ButtonTypeMap} from '@mui/material/Button'
import type {OverridableComponent, OverrideProps} from '@mui/material/OverridableComponent'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import * as React from 'react'
import type {PneButtonStateColors, PneButtonVariant} from '../buttonPalette'
import {resolvePneSemanticPalette} from '../createTheme'

/**
 * The PNE UI action button (UI Kit Button: Variant × Size × State). `contained` is the single
 * main action on a page, `outlined` and `text` are secondary, `error` is for removals,
 * `warning` is a non-destructive caution, and the four soft styles (`neutral`, `neutralText`,
 * `primaryLight`, `white`) have a brand label and no fill at rest, for tables and toolbars.
 */
export type PneButtonStyle =
    | 'contained'
    | 'outlined'
    | 'error'
    | 'text'
    | 'neutral'
    | 'neutralText'
    | 'primaryLight'
    | 'warning'
    | 'white'

/** small 24px (tables, groups) · medium 32px (forms) · large 40px (page primary). */
export type PneButtonSize = 'small' | 'medium' | 'large'

/** A state pinned for specimens through `data-pne-state`; product code never sets it. */
export type PneButtonSpecimenState = 'hover' | 'pressed' | 'focus'

type PneButtonOwnProps = {
    /** Canonical PNE appearance preset. */
    pneStyle?: PneButtonStyle
    /** PNE buttons intentionally support only the three design-system sizes. */
    size?: PneButtonSize
    /**
     * A request is running: a spinner takes the start icon slot, the end icon hides, clicks are
     * blocked and the resting colours stay. Give such a button a start icon, so its width does
     * not change.
     */
    loading?: boolean
    /** Use `pneStyle`; raw MUI colors are not part of the PneButton contract. */
    color?: never
    /** Use `pneStyle`; raw MUI variants are not part of the PneButton contract. */
    variant?: never
    'data-pne-state'?: PneButtonSpecimenState
}

type PneButtonTypeMap<
    AdditionalProps = {},
    RootComponent extends React.ElementType = 'button',
> = {
    props: Omit<ButtonTypeMap<PneButtonOwnProps & AdditionalProps, RootComponent>['props'], 'href'>
    defaultComponent: RootComponent
}

export type PneButtonProps<
    RootComponent extends React.ElementType = 'button',
    AdditionalProps = {},
> = OverrideProps<PneButtonTypeMap<AdditionalProps, RootComponent>, RootComponent> & {
    component?: RootComponent
}

type PneButtonComponent = ((
    props: {href: string} & OverrideProps<PneButtonTypeMap, 'a'>,
) => React.JSX.Element) & OverridableComponent<PneButtonTypeMap>

export const PNE_BUTTON_FONT_FAMILY = '"Roboto", "Helvetica Neue", Arial, sans-serif'

const BUTTON_VARIANT: Record<PneButtonStyle, PneButtonVariant> = {
    contained: 'primary',
    outlined: 'outline',
    text: 'text',
    error: 'destructive',
    warning: 'warning',
    neutral: 'soft',
    neutralText: 'soft',
    primaryLight: 'soft',
    white: 'soft',
}

type ButtonSizeConfig = {
    height: number
    paddingBlock: number
    paddingInline: number
    fontSize: number
    lineHeight: number
    /** One icon scale for every button, as in UI Kit: 14 · 16 · 18. */
    icon: number
}

// UI Kit sizes: control height, padding, Roboto Medium label, icon glyph.
const BUTTON_SIZE: Record<PneButtonSize, ButtonSizeConfig> = {
    small: {height: 24, paddingBlock: 4, paddingInline: 8, fontSize: 12, lineHeight: 16, icon: 14},
    medium: {height: 32, paddingBlock: 6, paddingInline: 12, fontSize: 13, lineHeight: 18, icon: 16},
    large: {height: 40, paddingBlock: 10, paddingInline: 16, fontSize: 14, lineHeight: 20, icon: 18},
}

const BUTTON_ICON_GAP = 4

const isPneButtonSize = (size: unknown): size is PneButtonSize =>
    size === 'small' || size === 'medium' || size === 'large'

const resolveVariant = (pneStyle: PneButtonStyle | undefined): PneButtonVariant => {
    if (pneStyle === undefined) return 'primary'
    const variant = BUTTON_VARIANT[pneStyle]
    if (variant !== undefined) return variant
    console.warn(`Unknown pneStyle: ${String(pneStyle)}`)
    return 'primary'
}

// https://mui.com/material-ui/guides/typescript/#complications-with-the-component-prop
const PneButtonImplementation = <C extends React.ElementType = 'button'>(
    props: PneButtonProps<C, {component?: C}>,
) => {
    const {
        sx,
        children,
        variant,
        color,
        size = 'large',
        pneStyle,
        loading = false,
        startIcon,
        endIcon,
        onClick,
        ...rest
    } = props

    const resolvedSize = isPneButtonSize(size) ? size : 'large'

    if (variant !== undefined || color !== undefined) {
        console.warn('PneButton ignores variant/color; use the canonical pneStyle prop')
    }

    const resolvedVariant = resolveVariant(pneStyle)
    const hasChildren = React.Children.count(children) > 0
    const iconOnly = !hasChildren && Boolean(startIcon || endIcon)
    const spinner = <CircularProgress color='inherit' size={BUTTON_SIZE[resolvedSize].icon} thickness={5}/>

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading) {
            event.preventDefault()
            return
        }
        onClick?.(event)
    }

    const _sx: SxProps<Theme> = [
        createButtonSx({iconOnly, size: resolvedSize, variant: resolvedVariant}),
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    return <Button
        sx={_sx}
        variant='text'
        size={resolvedSize}
        disableElevation
        startIcon={loading ? spinner : startIcon}
        endIcon={loading ? undefined : endIcon}
        aria-busy={loading || undefined}
        data-pne-variant={resolvedVariant}
        data-pne-size={resolvedSize}
        data-pne-loading={loading || undefined}
        onClick={handleClick}
        {...rest}
    >
        {children}
    </Button>
}

const PneButton = PneButtonImplementation as PneButtonComponent

const ring = (border: string): string | undefined =>
    border === 'transparent' ? undefined : `inset 0 0 0 1px ${border}`

const stateSx = (colors: PneButtonStateColors): SystemStyleObject<Theme> => ({
    backgroundColor: colors.fill,
    color: colors.text,
    boxShadow: ring(colors.border) ?? 'none',
})

const createButtonSx = (
    options: {
        iconOnly: boolean
        size: PneButtonSize
        variant: PneButtonVariant
    },
): SxProps<Theme> => theme => {
    const config = BUTTON_SIZE[options.size]
    const pne = resolvePneSemanticPalette(theme)
    const colors = pne.button[options.variant]
    const focusRing = [
        ring(colors.default.border),
        `0 0 0 2px ${theme.palette.background.default}`,
        `0 0 0 4px ${pne.focusRing}`,
    ].filter(Boolean).join(', ')

    return {
        ...stateSx(colors.default),
        border: 'none',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontFamily: PNE_BUTTON_FONT_FAMILY,
        fontSize: `${config.fontSize}px`,
        fontWeight: 500,
        gap: options.iconOnly ? 0 : `${BUTTON_ICON_GAP}px`,
        height: options.iconOnly ? `${config.height}px` : 'auto',
        lineHeight: `${config.lineHeight}px`,
        minHeight: `${config.height}px`,
        minWidth: options.iconOnly ? `${config.height}px` : '0px',
        padding: options.iconOnly ? 0 : `${config.paddingBlock}px ${config.paddingInline}px`,
        textAlign: 'center',
        textTransform: 'none',
        transition: 'background-color 120ms linear, box-shadow 120ms linear, color 120ms linear',
        whiteSpace: 'normal',
        ...(options.iconOnly ? {width: `${config.height}px`, flexShrink: 0} : {}),
        '&:hover, &[data-pne-state="hover"]': stateSx(colors.hover),
        '&:active, &[data-pne-state="pressed"]': stateSx(colors.pressed),
        '&.Mui-focusVisible, &[data-pne-state="focus"]': {
            ...stateSx(colors.default),
            boxShadow: focusRing,
        },
        '&[data-pne-loading="true"]': {
            ...stateSx(colors.default),
            cursor: 'progress',
            pointerEvents: 'none',
        },
        '&.Mui-disabled': stateSx(colors.disabled),
        '&&& .MuiButton-startIcon, &&& .MuiButton-endIcon': {
            display: 'inline-flex',
            marginLeft: 0,
            marginRight: 0,
        },
        '&&& .MuiButton-startIcon > *:nth-of-type(1), &&& .MuiButton-endIcon > *:nth-of-type(1)': {
            fontSize: config.icon,
        },
        '&&& .MuiButton-startIcon svg, &&& .MuiButton-endIcon svg': {
            height: config.icon,
            width: config.icon,
        },
    } as SystemStyleObject<Theme>
}

export default PneButton
