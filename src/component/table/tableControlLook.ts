import type {CSSObject, Theme} from '@mui/material/styles'
import {PNE_BUTTON_SIZE, type PneButtonLookSize} from '../../buttonLook'
import type {PneSemanticPalette} from '../../createTheme'
import {PNE_LABEL_TRIM, PNE_LABEL_TRIM_SUPPORT} from '../../labelCentring'
import {TABLE_CONTROL_BAND_SIZE, TABLE_CONTROL_GAP, TABLE_CONTROL_SHELL_PADDING} from './tableControlMetrics'

/*
 * The looks of the table band controls from a palette, with no theme lookup of their own: the theme
 * draws the MUI toggle group from them, and `tableControlButtonStyle.ts` gives them to the components.
 */

type TextButtonPalette = Pick<PneSemanticPalette, 'button' | 'focusRing'>

/** UI Kit Button Tertiary of a size: a Medium label on the sunken fill, the focus ring inside. */
export const tableControlTextButtonLook = (
    theme: Theme,
    pne: TextButtonPalette,
    size: PneButtonLookSize = 'small',
): CSSObject => {
    const config = PNE_BUTTON_SIZE[size]
    const colors = pne.button.text
    return {
        ...theme.typography.button,
        backgroundColor: colors.default.fill,
        borderRadius: '4px',
        color: colors.default.text,
        fontSize: `${config.fontSize}px`,
        fontWeight: 500,
        height: `${config.height}px`,
        letterSpacing: 'normal',
        lineHeight: `${config.lineHeight}px`,
        padding: `${config.paddingBlock}px ${config.paddingInline}px`,
        textTransform: 'none' as const,
        '&:hover': {
            backgroundColor: colors.hover.fill,
            color: colors.hover.text,
        },
        '&:active': {
            backgroundColor: colors.pressed.fill,
            color: colors.pressed.text,
        },
        '&.Mui-disabled': {
            backgroundColor: colors.disabled.fill,
            color: colors.disabled.text,
        },
        '&.Mui-focusVisible': {
            outline: `2px solid ${pne.focusRing}`,
            outlineOffset: '-2px',
        },
        // The label stands in the middle at every screen scale (labelCentring.ts). A button that holds
        // more than its label (an icon of its own) keeps the flex layout; `:where` leaves `display` to `sx`.
        [PNE_LABEL_TRIM_SUPPORT]: {
            '&:where(:not(:has(> :not(.MuiTouchRipple-root))))': {
                alignContent: 'center',
                display: 'inline-block',
                textAlign: 'center',
                ...PNE_LABEL_TRIM,
            },
        },
    }
}

/** UI Kit Tertiary, State=Active: the surface fill with the tab shadow; the label keeps its colour. */
export const tableControlActiveLook = (pne: Pick<PneSemanticPalette, 'button'>): CSSObject => {
    const colors = pne.button.text
    const active = colors.active ?? colors.default
    const look = {
        backgroundColor: active.fill,
        boxShadow: active.shadow ?? 'none',
        color: active.text,
    }
    return {
        ...look,
        '&:hover': look,
        '&:active': look,
    }
}

/** The shell of a group: 4px around its controls and 4px between them, radius 8, a 1px inner ring. */
export const tableControlShellLook = (
    pne: Pick<PneSemanticPalette, 'table'>,
    kind: 'actions' | 'tabs',
    height: number = TABLE_CONTROL_BAND_SIZE,
): CSSObject => {
    const band = pne.table.band
    const colors = kind === 'tabs' ? band.tabs : band.shell
    return {
        alignItems: 'center',
        backgroundColor: colors.fill,
        borderRadius: '8px',
        boxShadow: `inset 0 0 0 1px ${colors.ring}`,
        boxSizing: 'border-box',
        gap: `${TABLE_CONTROL_GAP}px`,
        minHeight: `${height}px`,
        padding: `${TABLE_CONTROL_SHELL_PADDING}px`,
    }
}
