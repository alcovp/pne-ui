import type {Components, CSSObject, Theme} from '@mui/material/styles'
import {PNE_BUTTON_SIZE} from './buttonLook'
import {
    tableControlActiveLook,
    tableControlShellLook,
    tableControlTextButtonLook,
} from './component/table/tableControlLook'
import {TABLE_CONTROL_SHELL_PADDING} from './component/table/tableControlMetrics'
import type {PneSemanticPalette} from './createTheme'

/**
 * The look of the MUI `ToggleButtonGroup` under the PNE UI theme (UI Kit Tabs group: one choice out of
 * a few). The library has no group of its own: the theme draws the stock one. A grey shell with 4px
 * around its buttons and 4px between them; the buttons are text buttons without capitals, the picked
 * one is a white tile with the tab shadow. MUI's own borders, joined corners and overlapping margins
 * of a group are taken off.
 *
 * `size='medium'` (MUI's default) is the 40px group that stands in a row with fields and buttons of
 * forms (32px buttons inside), `size='small'` the 32px group of the table bands (24px buttons).
 * The UI Kit draws one look, so `color` of the group changes nothing. The group is as wide as its
 * buttons; `fullWidth` makes it fill the row and share it between the buttons.
 *
 * A `ToggleButton` outside a group is not a tab and keeps MUI's look.
 */
type ToggleGroupSize = 'small' | 'medium'

const GROUPED = '&& .MuiToggleButtonGroup-grouped'

/**
 * The group's look from a palette. The theme draws every stock group with it; a composite that has to
 * look right without the theme too (the Multiget panel of SearchUI) puts the same look into its `sx`.
 */
export const pneToggleGroupLook = (
    theme: Theme,
    pne: PneSemanticPalette,
    size: ToggleGroupSize = 'medium',
    orientation: 'horizontal' | 'vertical' = 'horizontal',
): CSSObject => ({
    ...tableControlShellLook(pne, 'tabs', PNE_BUTTON_SIZE[size].height + 2 * TABLE_CONTROL_SHELL_PADDING),
    // A stacked group stretches its buttons to the widest one.
    ...(orientation === 'vertical' ? {alignItems: 'stretch'} : undefined),
    // The text button of the table bands, as the views of a table are drawn.
    [GROUPED]: {
        ...tableControlTextButtonLook(theme, pne, size),
        border: 0,
        borderRadius: '4px',
        margin: 0,
    },
    [`${GROUPED}.Mui-selected`]: tableControlActiveLook(pne),
})

export const createPneToggleGroupOverrides = (
    resolvePalette: (theme: Theme) => PneSemanticPalette,
): NonNullable<Components<Theme>['MuiToggleButtonGroup']> => ({
    styleOverrides: {
        root: ({ownerState, theme}) => ({
            ...pneToggleGroupLook(
                theme,
                resolvePalette(theme),
                ownerState.size === 'small' ? 'small' : 'medium',
                ownerState.orientation === 'vertical' ? 'vertical' : 'horizontal',
            ),
            // The shell is as wide as its buttons. A column of a form stretches its children, and the
            // grey shell would run across the whole form with the buttons at its left; `fullWidth` is
            // the way to ask for a group that fills its row.
            ...(ownerState.fullWidth ? undefined : {width: 'fit-content'}),
        }),
    },
})
