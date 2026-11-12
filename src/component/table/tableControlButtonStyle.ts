import {Theme} from '@mui/material'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../../createTheme'
import {
    TABLE_CONTROL_BAND_SIZE,
    TABLE_CONTROL_GAP,
    TABLE_CONTROL_SHELL_PADDING,
    TABLE_CONTROL_SIZE,
} from './tableControlMetrics'

/**
 * A button of the table bands by the UI Kit (Button Tertiary sm): 24px, a 12/16 Medium label on the
 * sunken grey fill. The pointer and a press change the colour of the label, a press darkens the fill
 * too; the focus ring stands inside the button, so a shell never clips it. The views, the page
 * buttons, the page sizes and the band's own actions all take it.
 */
export const createTableControlTextButtonStyle = (theme: Theme): SystemStyleObject<Theme> => {
    const pne = resolvePneSemanticPalette(theme)
    const colors = pne.button.text
    return {
        ...theme.typography.button,
        backgroundColor: colors.default.fill,
        borderRadius: '4px',
        color: colors.default.text,
        fontSize: '12px',
        fontWeight: 500,
        height: `${TABLE_CONTROL_SIZE}px`,
        letterSpacing: 'normal',
        lineHeight: '16px',
        padding: '4px 8px',
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
    }
}

/**
 * The current value of a set of band buttons that is an action on the rows - the page size in force:
 * UI Kit Button Primary sm, the brand fill under its label.
 */
export const createTableControlCurrentStyle = (theme: Theme): SystemStyleObject<Theme> => {
    const colors = resolvePneSemanticPalette(theme).button.primary
    return {
        backgroundColor: colors.default.fill,
        // A fill that does not stand out from a dark surface carries a ring (rule 1).
        boxShadow: colors.default.border === 'transparent' ? 'none' : `inset 0 0 0 1px ${colors.default.border}`,
        color: colors.default.text,
        '&:hover': {
            backgroundColor: colors.hover.fill,
            color: colors.hover.text,
        },
        '&:active': {
            backgroundColor: colors.pressed.fill,
            color: colors.pressed.text,
        },
    }
}

/**
 * The picked item of a set of band buttons that switches a view (UI Kit Tertiary, State=Active): the
 * surface fill with the tab shadow; the label keeps its colour, under the pointer too.
 */
export const createTableControlActiveStyle = (theme: Theme): SystemStyleObject<Theme> => {
    const colors = resolvePneSemanticPalette(theme).button.text
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

/**
 * The shell of a group of band controls: 32px high with 4px around its 24px controls and 4px between
 * them, radius 8, a 1px inner ring. `actions` is the white shell of the UI Kit Button group (the
 * pagination, the page sizes: actions on the rows); `tabs` is the grey one of the UI Kit Tabs (the
 * views: one of them is picked).
 */
export const createTableControlShellStyle = (
    theme: Theme,
    kind: 'actions' | 'tabs',
): SystemStyleObject<Theme> => {
    const band = resolvePneSemanticPalette(theme).table.band
    const colors = kind === 'tabs' ? band.tabs : band.shell
    return {
        alignItems: 'center',
        backgroundColor: colors.fill,
        borderRadius: '8px',
        boxShadow: `inset 0 0 0 1px ${colors.ring}`,
        boxSizing: 'border-box',
        gap: `${TABLE_CONTROL_GAP}px`,
        minHeight: `${TABLE_CONTROL_BAND_SIZE}px`,
        padding: `${TABLE_CONTROL_SHELL_PADDING}px`,
    }
}
