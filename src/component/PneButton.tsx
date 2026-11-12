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
 * `primaryLight`, `white`) have a brand label on the sunken fill, for tables and toolbars.
 * `errorText` and `successText` are `text` with a red or a green label: a removal and an
 * activation that do not need the weight of a filled button.
 */
export type PneButtonStyle =
    | 'contained'
    | 'outlined'
    | 'error'
    | 'text'
    | 'errorText'
    | 'successText'
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
    /**
     * The picked item of a set, such as a tab or the current page: the lifted white look of
     * `text`, kept under the pointer. Any style given with it is drawn so. It sets the look only;
     * say what it means with `aria-current`, `aria-pressed` or `aria-selected`.
     */
    active?: boolean
    /**
     * `successText` only: the one-way result of an activation. The button turns into a green
     * status that takes no clicks and no focus; give it the label and the icon of the result.
     */
    activated?: boolean
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
    errorText: 'textDanger',
    successText: 'textSuccess',
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
    /** Between the parts of the button. */
    gap: number
    /** How far an icon moves towards the label: at small and medium it sits 2px closer. */
    iconPull: number
}

// UI Kit sizes: control height, padding, Roboto Medium label, icon glyph.
const BUTTON_SIZE: Record<PneButtonSize, ButtonSizeConfig> = {
    small: {height: 24, paddingBlock: 4, paddingInline: 8, fontSize: 12, lineHeight: 16, icon: 14, gap: 4, iconPull: 2},
    medium: {height: 32, paddingBlock: 6, paddingInline: 12, fontSize: 14, lineHeight: 20, icon: 16, gap: 4, iconPull: 2},
    large: {height: 40, paddingBlock: 10, paddingInline: 16, fontSize: 14, lineHeight: 20, icon: 18, gap: 8, iconPull: 0},
}

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
        active = false,
        activated = false,
        startIcon,
        endIcon,
        onClick,
        ...rest
    } = props

    const resolvedSize = isPneButtonSize(size) ? size : 'large'

    if (variant !== undefined || color !== undefined) {
        console.warn('PneButton ignores variant/color; use the canonical pneStyle prop')
    }

    // The picked item of a set is drawn as Tertiary Active whatever its style.
    const resolvedVariant = active ? 'text' : resolveVariant(pneStyle)
    const isActivated = activated && resolvedVariant === 'textSuccess'
    const hasChildren = React.Children.count(children) > 0
    const iconOnly = !hasChildren && Boolean(startIcon || endIcon)
    const spinner = <CircularProgress color='inherit' size={BUTTON_SIZE[resolvedSize].icon} thickness={5}/>

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading || isActivated) {
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
        data-pne-active={active || undefined}
        data-pne-activated={isActivated || undefined}
        aria-disabled={isActivated || undefined}
        onClick={handleClick}
        {...rest}
        {...(isActivated ? {tabIndex: -1} : {})}
    >
        {children}
    </Button>
}

const PneButton = PneButtonImplementation as PneButtonComponent

const ring = (border: string): string | undefined =>
    border === 'transparent' ? undefined : `inset 0 0 0 1px ${border}`

const shadows = (colors: PneButtonStateColors, ...outer: string[]): string =>
    [ring(colors.border), colors.shadow, ...outer].filter(Boolean).join(', ') || 'none'

const stateSx = (colors: PneButtonStateColors): SystemStyleObject<Theme> => ({
    backgroundColor: colors.fill,
    color: colors.text,
    boxShadow: shadows(colors),
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
    const focusRing = [`0 0 0 2px ${theme.palette.background.default}`, `0 0 0 4px ${pne.focusRing}`]
    const iconPull = options.iconOnly || config.iconPull === 0 ? '0px' : `-${config.iconPull}px`

    return {
        ...stateSx(colors.default),
        border: 'none',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontFamily: PNE_BUTTON_FONT_FAMILY,
        fontSize: `${config.fontSize}px`,
        fontWeight: 500,
        gap: options.iconOnly ? 0 : `${config.gap}px`,
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
            ...stateSx(colors.focus),
            boxShadow: shadows(colors.focus, ...focusRing),
        },
        '&[data-pne-loading="true"]': {
            ...stateSx(colors.focus),
            cursor: 'progress',
            pointerEvents: 'none',
        },
        ...(colors.active ? {
            '&[data-pne-active="true"]': stateSx(colors.active),
            '&[data-pne-active="true"].Mui-focusVisible, &[data-pne-active="true"][data-pne-state="focus"]': {
                boxShadow: shadows(colors.active, ...focusRing),
            },
        } : {}),
        ...(colors.activated ? {
            '&[data-pne-activated="true"]': {
                ...stateSx(colors.activated),
                cursor: 'default',
                pointerEvents: 'none',
            },
        } : {}),
        '&.Mui-disabled': stateSx(colors.disabled),
        '&&& .MuiButton-startIcon, &&& .MuiButton-endIcon': {
            display: 'inline-flex',
            marginLeft: 0,
            marginRight: 0,
        },
        // Lengths are strings on purpose: sx reads bare numbers of margin props as theme spacing.
        '&&& .MuiButton-startIcon': {marginRight: iconPull},
        '&&& .MuiButton-endIcon': {marginLeft: iconPull},
        // The spinner fills its box to the edge, so it keeps the whole gap.
        '&&&[data-pne-loading="true"] .MuiButton-startIcon': {marginRight: '0px'},
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
