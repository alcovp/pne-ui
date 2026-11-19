import type {Components, CSSObject, Theme} from '@mui/material/styles'
import {PNE_BUTTON_SIZE, pneButtonLookStyle, type PneButtonLookSize} from './buttonLook'
import type {PneSemanticPalette} from './createTheme'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP} from './themeColors'

/**
 * The look of the MUI `IconButton` under the PNE UI theme (UI Kit Icon action). The library has no icon
 * button of its own: the theme draws the stock one. No background and no round hover spot: the pointer
 * and the press colour only the icon.
 *
 * The box does not depend on the glyph: `size='small'` is 24px (rows, table cells), the default
 * `medium` 32px (forms, the close cross of a window), `large` 40px (in a row with 40px fields). A MUI
 * icon of the default or the `small` size inside takes 14 · 16 · 18px, the icon scale of the buttons;
 * an icon the page sized by `sx` keeps its size.
 *
 * | `color`                  | Look                                                              |
 * |--------------------------|-------------------------------------------------------------------|
 * | `default`                | neutral: tertiary text at rest, the brand text under the pointer   |
 * | `primary`                | the brand text at rest (UI Kit: the active state of a toggle)      |
 * | `error`                  | danger: neutral at rest, the error text under the pointer          |
 * | `inherit`                | the colour of the place, MUI's hover veil                          |
 * | `pnePrimary`             | UI Kit Button Primary, icon only: a filled square                  |
 * | `pneNeutral`             | UI Kit Button Soft, icon only: a brand icon on the sunken fill     |
 * | other palette colours    | the colour at rest, its dark step under the pointer                |
 */
export type PneIconButtonLookSize = PneButtonLookSize

/** A MUI icon of the default size takes its size from this property; an icon button sets it. */
export const PNE_ICON_SIZE_VAR = '--pne-icon-size'

type IconButtonPaletteSource = Pick<PneSemanticPalette, 'button' | 'focusRing'>

const resolveSize = (size: unknown): PneIconButtonLookSize =>
    size === 'small' || size === 'large' ? size : 'medium'

/** The box and the glyph of a size; no colour here. */
export const pneIconButtonSizeLook = (size: PneIconButtonLookSize): CSSObject => {
    const {height, icon} = PNE_BUTTON_SIZE[size]
    return {
        borderRadius: '4px',
        boxSizing: 'border-box',
        // An icon with `fontSize='inherit'` and the spinner of a waiting button follow the button.
        fontSize: `${icon}px`,
        height: `${height}px`,
        padding: 0,
        width: `${height}px`,
        [PNE_ICON_SIZE_VAR]: `${icon}px`,
    }
}

const focusRing = (theme: Theme, pne: IconButtonPaletteSource): string[] =>
    [`0 0 0 2px ${theme.palette.background.paper}`, `0 0 0 4px ${pne.focusRing}`]

/**
 * UI Kit Icon action: the colours of an icon button without a fill. `tone` is the colour under the
 * pointer, `rest` the colour of the icon at rest (the tertiary text by default).
 */
export const pneIconActionLook = (
    theme: Theme,
    pne: IconButtonPaletteSource,
    tone: 'neutral' | 'danger' = 'neutral',
    rest?: string,
): CSSObject => {
    const dark = theme.palette.mode === 'dark'
    const colors = tone === 'danger' ? pne.button.textDanger : pne.button.text
    return {
        backgroundColor: 'transparent',
        color: rest ?? (dark ? PNE_DARK_COLORS.textMuted : PNE_NEUTRAL_RAMP[600]),
        transition: 'color 120ms linear',
        '&:hover': {
            backgroundColor: 'transparent',
            color: colors.hover.text,
        },
        '&:active': {
            color: colors.pressed.text,
        },
        '&.Mui-focusVisible': {
            boxShadow: focusRing(theme, pne).join(', '),
        },
        '&.Mui-disabled': {
            color: dark ? PNE_DARK_COLORS.textDisabled : PNE_NEUTRAL_RAMP[400],
        },
    }
}

const paletteColor = (theme: Theme, color: unknown): {main: string, dark: string} | undefined => {
    const entry = typeof color === 'string'
        ? (theme.palette as unknown as Record<string, unknown>)[color]
        : undefined
    if (entry && typeof entry === 'object' && 'main' in entry && 'dark' in entry) {
        return entry as {main: string, dark: string}
    }
    return undefined
}

const colorLook = (theme: Theme, pne: IconButtonPaletteSource, color: unknown): CSSObject => {
    switch (color) {
        case 'pnePrimary':
            return {...pneButtonLookStyle('primary', pne.button, focusRing(theme, pne)), stroke: 'currentColor'}
        case 'pneNeutral':
            return {...pneButtonLookStyle('soft', pne.button, focusRing(theme, pne)), stroke: 'currentColor'}
        case 'inherit':
            return {
                backgroundColor: 'transparent',
                color: 'inherit',
                '&:hover': {backgroundColor: theme.palette.action.hover},
                '&.Mui-focusVisible': {boxShadow: focusRing(theme, pne).join(', ')},
            }
        case 'error':
            return pneIconActionLook(theme, pne, 'danger')
        case 'primary':
            return pneIconActionLook(theme, pne, 'neutral', pne.button.text.hover.text)
        default: {
            const palette = paletteColor(theme, color)
            return palette
                ? {
                    ...pneIconActionLook(theme, pne, 'neutral', palette.main),
                    '&:hover': {backgroundColor: 'transparent', color: palette.dark},
                    '&:active': {color: palette.dark},
                }
                : pneIconActionLook(theme, pne)
        }
    }
}

// MUI pulls a button at an edge out by its padding; here the pull is the air around the glyph.
const edgeLook = (edge: unknown, size: PneIconButtonLookSize): CSSObject | undefined => {
    const {height, icon} = PNE_BUTTON_SIZE[size]
    const pull = `-${(height - icon) / 2}px`
    if (edge === 'start') return {marginLeft: pull}
    if (edge === 'end') return {marginRight: pull}
    return undefined
}

const styleCache = new WeakMap<Theme, Map<string, CSSObject>>()

/**
 * The `MuiIconButton` entry of the theme. A style is built once per theme, size, colour and edge: a
 * table draws hundreds of these buttons.
 */
export const createPneIconButtonOverrides = (
    resolvePalette: (theme: Theme) => IconButtonPaletteSource,
): NonNullable<Components<Theme>['MuiIconButton']> => ({
    defaultProps: {
        // The UI Kit action has no fill in any state, so there is nothing for a ripple to draw on.
        disableRipple: true,
    },
    styleOverrides: {
        root: ({ownerState, theme}) => {
            const size = resolveSize(ownerState.size)
            const color = ownerState.color ?? 'default'
            const edge = ownerState.edge || 'none'
            let styles = styleCache.get(theme)
            if (!styles) {
                styles = new Map()
                styleCache.set(theme, styles)
            }
            const key = `${size}/${String(color)}/${String(edge)}`
            let style = styles.get(key)
            if (!style) {
                const pne = resolvePalette(theme)
                style = {
                    ...pneIconButtonSizeLook(size),
                    ...colorLook(theme, pne, color),
                    ...edgeLook(edge, size),
                }
                styles.set(key, style)
            }
            return style
        },
    },
})

/**
 * The `MuiSvgIcon` entry of the theme: an icon of the default size, or of `fontSize='small'` (the usual
 * pair of a small icon button), takes the size its icon button names; anywhere else it keeps MUI's 24
 * and 20px. The size is read from an inherited custom property, so the rule adds no weight: an icon
 * the page sized with `sx`, or asked to be `large` or `inherit`, keeps its size.
 */
export const createPneSvgIconOverrides = (): NonNullable<Components<Theme>['MuiSvgIcon']> => ({
    styleOverrides: {
        root: ({ownerState, theme}) => {
            switch (ownerState.fontSize ?? 'medium') {
                case 'medium':
                    return {fontSize: `var(${PNE_ICON_SIZE_VAR}, ${theme.typography.pxToRem(24)})`}
                case 'small':
                    return {fontSize: `var(${PNE_ICON_SIZE_VAR}, ${theme.typography.pxToRem(20)})`}
                default:
                    return {}
            }
        },
    },
})
