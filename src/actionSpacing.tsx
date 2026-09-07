import React from 'react'
import GlobalStyles from '@mui/material/GlobalStyles'

/** Independent defaults in pixels. Group spacing can evolve without changing button spacing. */
export const PNE_ACTION_SPACING = Object.freeze({
    buttons: 8,
    groups: 8,
})

/** CSS values with library-owned fallbacks for isolated components. */
export const pneActionSpacing = Object.freeze({
    buttons: `var(--pne-action-buttons-gap, ${PNE_ACTION_SPACING.buttons}px)`,
    groups: `var(--pne-action-groups-gap, ${PNE_ACTION_SPACING.groups}px)`,
})

const actionSpacingStyles = {
    ':root': {
        '--pne-action-buttons-gap': `${PNE_ACTION_SPACING.buttons}px`,
        '--pne-action-groups-gap': `${PNE_ACTION_SPACING.groups}px`,
    },
}

/** Mount once when using an application's own ThemeProvider. Included in PneThemeProvider. */
export const PneActionSpacingStyles = () => <GlobalStyles styles={actionSpacingStyles}/>
