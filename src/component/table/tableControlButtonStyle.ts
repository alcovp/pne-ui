import {Theme} from '@mui/material'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../../createTheme'
import {tableControlActiveLook, tableControlShellLook, tableControlTextButtonLook} from './tableControlLook'

/**
 * A button of the table bands by the UI Kit (Button Tertiary sm): 24px, a 12/16 Medium label on the
 * sunken grey fill. The pointer and a press change the colour of the label, a press darkens the fill
 * too; the focus ring stands inside the button, so a shell never clips it. The views, the page
 * buttons, the page sizes and the band's own actions all take it.
 *
 * These controls are toggle buttons, page items and arrows of a calendar, which the `MuiButton` entry
 * of the theme does not reach; the sizes and the colours are the ones of the theme's small text button.
 */
export const createTableControlTextButtonStyle = (theme: Theme): SystemStyleObject<Theme> =>
    tableControlTextButtonLook(theme, resolvePneSemanticPalette(theme))

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
export const createTableControlActiveStyle = (theme: Theme): SystemStyleObject<Theme> =>
    tableControlActiveLook(resolvePneSemanticPalette(theme))

/**
 * The shell of a group of band controls: 32px high with 4px around its 24px controls and 4px between
 * them, radius 8, a 1px inner ring. `actions` is the white shell of the UI Kit Button group (the
 * pagination, the page sizes: actions on the rows); `tabs` is the grey one of the UI Kit Tabs (the
 * views: one of them is picked).
 */
export const createTableControlShellStyle = (
    theme: Theme,
    kind: 'actions' | 'tabs',
): SystemStyleObject<Theme> => tableControlShellLook(resolvePneSemanticPalette(theme), kind)
