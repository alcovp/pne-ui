import CircularProgress from '@mui/material/CircularProgress'
import type {Components, CSSObject, Theme} from '@mui/material/styles'
import * as React from 'react'
import type {PneButtonPalette, PneButtonStateColors, PneButtonVariant} from './buttonPalette'
import {PNE_LABEL_TRIM, PNE_LABEL_TRIM_SUPPORT, pneIconOnCapitals} from './labelCentring'

/**
 * The look of the MUI `Button` under the PNE UI theme (UI Kit Button: Variant × Size × State). The
 * library has no button of its own: `variant` and `color` of the MUI button pick the UI Kit variant.
 *
 * | `variant`   | `color`               | UI Kit variant                                   |
 * |-------------|-----------------------|--------------------------------------------------|
 * | `contained` | `primary` (default)   | Primary: the single main action                  |
 * | `contained` | `error`               | Destructive: a removal                           |
 * | `contained` | `warning`             | Warning: a non-destructive caution               |
 * | `outlined`  | any                   | Secondary                                        |
 * | `text`      | `primary` (default)   | Tertiary                                         |
 * | `text`      | `error`               | Tertiary danger                                  |
 * | `text`      | `success`             | Tertiary success                                 |
 * | `soft`      | any                   | Soft: a brand label on the sunken fill, in tables|
 *
 * A pair the UI Kit does not draw is shown as its `variant` in the default colour. `color="inherit"`
 * keeps the colour of the place the button stands in.
 */
export const resolvePneButtonVariant = (
    variant: unknown,
    color: unknown,
): PneButtonVariant | undefined => {
    if (color === 'inherit') return undefined
    switch (variant) {
        case 'soft':
            return 'soft'
        case 'contained':
            if (color === 'error') return 'destructive'
            return color === 'warning' ? 'warning' : 'primary'
        case 'outlined':
            return 'outline'
        default:
            if (color === 'error') return 'textDanger'
            return color === 'success' ? 'textSuccess' : 'text'
    }
}

export const PNE_BUTTON_FONT_FAMILY = '"Roboto", "Helvetica Neue", Arial, sans-serif'

export type PneButtonLookSize = 'small' | 'medium' | 'large'

export type PneButtonSizeConfig = {
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

/**
 * UI Kit sizes: small 24px (tables, groups), medium 32px (forms), large 40px (page primary). The one
 * table of the button sizes: the theme draws the MUI `Button` from it, and the controls that look
 * like a button without being one (the controls of a table band, an icon action) read it too.
 */
export const PNE_BUTTON_SIZE: Record<PneButtonLookSize, PneButtonSizeConfig> = {
    small: {height: 24, paddingBlock: 4, paddingInline: 8, fontSize: 12, lineHeight: 16, icon: 14, gap: 4, iconPull: 2},
    medium: {height: 32, paddingBlock: 6, paddingInline: 12, fontSize: 14, lineHeight: 20, icon: 16, gap: 4, iconPull: 2},
    large: {height: 40, paddingBlock: 10, paddingInline: 16, fontSize: 14, lineHeight: 20, icon: 18, gap: 8, iconPull: 0},
}

const resolveSize = (size: unknown): PneButtonLookSize =>
    size === 'small' || size === 'large' ? size : 'medium'

const ring = (border: string): string | undefined =>
    border === 'transparent' ? undefined : `inset 0 0 0 1px ${border}`

const shadows = (colors: PneButtonStateColors, ...outer: string[]): string =>
    [ring(colors.border), colors.shadow, ...outer].filter(Boolean).join(', ') || 'none'

const stateStyle = (colors: PneButtonStateColors): CSSObject => ({
    backgroundColor: colors.fill,
    color: colors.text,
    boxShadow: shadows(colors),
})

// The picked item of a set says what it is with one of these; the look follows the meaning.
const PICKED = ['[aria-current]:not([aria-current="false"])', '[aria-pressed="true"]', '[aria-selected="true"]']
const picked = (suffix = ''): string => PICKED.map(mark => `&${mark}${suffix}`).join(', ')

// A button that waits with its spinner at an edge keeps its label; in the centre MUI hides the label.
const WAITING = '&&&.MuiButton-loading:not(.MuiButton-loadingPositionCenter)'
const WAITING_CENTRE = '&.MuiButton-loading.MuiButton-loadingPositionCenter'

// A button that holds its label and the slots MUI itself renders, nothing else. A button with other children
// (a bare icon, a box of its own) keeps the flex layout: only flex centres what the page put inside.
// `:where` keeps the weight of the rule at one class, so `display` from the `sx` of a page still wins.
const LABEL_ONLY = '&:where(:not(:has(> :not(.MuiButton-startIcon, .MuiButton-endIcon, .MuiButton-loadingWrapper, .MuiTouchRipple-root))))'

const PADDING_BLOCK = '--pne-button-padding-block'
const WORD_JOINER = '"\\2060"'

const sizeStyle = (size: PneButtonLookSize): CSSObject => {
    const config = PNE_BUTTON_SIZE[size]
    const iconPull = config.iconPull === 0 ? '0px' : `-${config.iconPull}px`

    return {
        border: 'none',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontFamily: PNE_BUTTON_FONT_FAMILY,
        fontSize: `${config.fontSize}px`,
        fontWeight: 500,
        gap: `${config.gap}px`,
        height: 'auto',
        lineHeight: `${config.lineHeight}px`,
        minHeight: `${config.height}px`,
        minWidth: '0px',
        // The block padding is read through a property that only the trimmed layout below sets, so the padding
        // itself stays a plain declaration of the button: a padding from the `sx` of a page still replaces it.
        paddingBottom: `var(${PADDING_BLOCK}, ${config.paddingBlock}px)`,
        paddingLeft: `${config.paddingInline}px`,
        paddingRight: `${config.paddingInline}px`,
        paddingTop: `var(${PADDING_BLOCK}, ${config.paddingBlock}px)`,
        textAlign: 'center',
        textTransform: 'none',
        transition: 'background-color 120ms linear, box-shadow 120ms linear, color 120ms linear',
        whiteSpace: 'normal',
        // The class is repeated so that these rules outrank the ones MUI gives the icon slots.
        '&&& .MuiButton-startIcon, &&& .MuiButton-endIcon': {
            display: 'inline-flex',
            marginLeft: 0,
            marginRight: 0,
        },
        '&&& .MuiButton-startIcon': {marginRight: iconPull},
        '&&& .MuiButton-endIcon': {marginLeft: iconPull},
        '&&& .MuiButton-startIcon > *:nth-of-type(1), &&& .MuiButton-endIcon > *:nth-of-type(1)': {
            fontSize: config.icon,
        },
        '&&& .MuiButton-startIcon svg, &&& .MuiButton-endIcon svg': {
            height: config.icon,
            width: config.icon,
        },
        // The spinner of a waiting button stands in the slot of its icon: the icon of that edge and
        // the icon of the other edge hide. The spinner fills its box, so it keeps the whole gap.
        [`${WAITING} .MuiButton-startIcon, ${WAITING} .MuiButton-endIcon`]: {display: 'none'},
        [`${WAITING} .MuiButton-loadingIndicator`]: {
            fontSize: config.icon,
            position: 'static',
        },
        [`${WAITING_CENTRE} .MuiButton-loadingIndicator`]: {fontSize: config.icon},
        // The label stands in the middle of the button at every screen scale (labelCentring.ts): the button is a
        // block whose one line is trimmed to the capital band and centred, and the icons are inline boxes
        // raised to the middle of that band. The gaps of the flex layout become margins of the same size.
        [PNE_LABEL_TRIM_SUPPORT]: {
            [LABEL_ONLY]: {
                alignContent: 'center',
                display: 'inline-block',
                // A trimmed line is as high as its capitals, so the padding grows by what the trim took: a
                // label of two lines keeps the room over and under it that a label of one line has. 1px less
                // than the exact half, so that the rounding of the cap height never makes a button 1px higher.
                [PADDING_BLOCK]: `calc((${config.height}px - 1cap) / 2 - 1px)`,
                ...PNE_LABEL_TRIM,
                '&.MuiButton-fullWidth': {display: 'block'},
                // MUI's zero-width strut keeps the baseline of a flex button that starts with an icon; a block
                // has its text for that, and the strut would only take a gap before the icon.
                '&::before': {content: 'none'},
                // An icon never leaves the word beside it for a line of its own, as it never did in the flex
                // layout: its slot is an inline box that ends (or starts) with a word joiner. The slot does not
                // wrap inside, because a line may break after an inline picture even before a joiner.
                '&&& .MuiButton-startIcon, &&& .MuiButton-endIcon': {
                    display: 'inline',
                    lineHeight: 0,
                    verticalAlign: pneIconOnCapitals(config.icon),
                    whiteSpace: 'nowrap',
                },
                '&&& .MuiButton-startIcon': {marginRight: `${config.gap - config.iconPull}px`},
                '&&& .MuiButton-endIcon': {marginLeft: `${config.gap - config.iconPull}px`},
                '&&& .MuiButton-startIcon::after, &&& .MuiButton-endIcon::before': {content: WORD_JOINER},
                [`${WAITING} .MuiButton-startIcon, ${WAITING} .MuiButton-endIcon`]: {display: 'none'},
                [`${WAITING} .MuiButton-loadingIndicator`]: {
                    display: 'inline',
                    lineHeight: 0,
                    marginRight: `${config.gap}px`,
                    verticalAlign: pneIconOnCapitals(config.icon),
                    whiteSpace: 'nowrap',
                },
                [`${WAITING}:not(.MuiButton-loadingPositionEnd) .MuiButton-loadingIndicator::after`]: {
                    content: WORD_JOINER,
                },
                [`${WAITING}.MuiButton-loadingPositionEnd .MuiButton-loadingIndicator`]: {
                    marginLeft: `${config.gap}px`,
                    marginRight: 0,
                },
                [`${WAITING}.MuiButton-loadingPositionEnd .MuiButton-loadingIndicator::before`]: {
                    content: WORD_JOINER,
                },
            },
        },
    }
}

/** The colours of a UI Kit button variant in all its states; the icon-only button of the theme takes them too. */
export const pneButtonLookStyle = (
    variant: PneButtonVariant,
    palette: PneButtonPalette,
    focusRing: string[],
): CSSObject => {
    const colors = palette[variant]

    // Later states win: default, hover, pressed, focus, waiting, picked, activated, disabled.
    return {
        ...stateStyle(colors.default),
        '&:hover, &[data-pne-state="hover"]': stateStyle(colors.hover),
        '&:active, &[data-pne-state="pressed"]': stateStyle(colors.pressed),
        '&.Mui-focusVisible, &[data-pne-state="focus"]': {
            ...stateStyle(colors.focus),
            boxShadow: shadows(colors.focus, ...focusRing),
        },
        ...(colors.active ? {
            [picked()]: stateStyle(colors.active),
            [`${picked('.Mui-focusVisible')}, ${picked('[data-pne-state="focus"]')}`]: {
                boxShadow: shadows(colors.active, ...focusRing),
            },
        } : {}),
        // MUI gives a disabled outlined button a border of its own; the ring is the inset shadow.
        '&.Mui-disabled': {...stateStyle(colors.disabled), border: 'none'},
        // MUI disables a waiting button; it keeps the look of the focused one, without the ring.
        [`${WAITING}.Mui-disabled`]: stateStyle(colors.focus),
        [`${WAITING_CENTRE}.Mui-disabled`]: {
            ...stateStyle(colors.focus),
            color: 'transparent',
            '& .MuiButton-loadingIndicator': {color: colors.focus.text},
        },
        // The one-way result of an activation: a status that takes no clicks. `aria-disabled` says
        // so; the consumer also takes it out of the tab order.
        ...(colors.activated ? {
            '&[aria-disabled="true"]': {
                ...stateStyle(colors.activated),
                cursor: 'default',
                pointerEvents: 'none',
            },
        } : {}),
    }
}

// `color="inherit"`: no fill, the label of the place the button stands in.
const inheritStyle = (theme: Theme, focusRing: string[]): CSSObject => ({
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: 'inherit',
    '&.MuiButton-outlined': {boxShadow: 'inset 0 0 0 1px currentColor'},
    '&:hover, &[data-pne-state="hover"]': {backgroundColor: theme.palette.action.hover},
    '&.Mui-focusVisible, &[data-pne-state="focus"]': {boxShadow: focusRing.join(', ')},
    '&.Mui-disabled': {border: 'none', color: theme.palette.action.disabled},
})

type ButtonPaletteSource = {button: PneButtonPalette, focusRing: string}

const styleCache = new WeakMap<Theme, Map<string, CSSObject>>()

const buttonStyle = (
    theme: Theme,
    resolvePalette: (theme: Theme) => ButtonPaletteSource,
    size: PneButtonLookSize,
    look: PneButtonVariant | undefined,
): CSSObject => {
    let styles = styleCache.get(theme)
    if (!styles) {
        styles = new Map()
        styleCache.set(theme, styles)
    }
    const key = `${size}/${look ?? 'inherit'}`
    let style = styles.get(key)
    if (!style) {
        const pne = resolvePalette(theme)
        const focusRing = [`0 0 0 2px ${theme.palette.background.default}`, `0 0 0 4px ${pne.focusRing}`]
        // The two parts share no selector: the size rules set no colour, the look sets nothing else.
        style = {
            ...sizeStyle(size),
            ...(look ? pneButtonLookStyle(look, pne.button, focusRing) : inheritStyle(theme, focusRing)),
        }
        styles.set(key, style)
    }
    return style
}

/**
 * The `MuiButton` entry of the theme. A style is built once per theme, size and look: a page draws
 * hundreds of buttons, and each render only looks its style up.
 */
export const createPneButtonOverrides = (
    resolvePalette: (theme: Theme) => ButtonPaletteSource,
): NonNullable<Components<Theme>['MuiButton']> => ({
    defaultProps: {
        // The spinner takes the slot of the start icon, at the size of the icon.
        loadingIndicator: React.createElement(CircularProgress, {color: 'inherit', size: '1em', thickness: 5}),
        loadingPosition: 'start',
    },
    styleOverrides: {
        root: ({ownerState, theme}) => buttonStyle(
            theme,
            resolvePalette,
            resolveSize(ownerState.size),
            resolvePneButtonVariant(ownerState.variant, ownerState.color),
        ),
    },
})
