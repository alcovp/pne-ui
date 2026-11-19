import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../../createTheme'
import {pneToggleGroupLook} from '../../toggleLook'

/**
 * UI Kit Tabs group on a MUI ToggleButtonGroup: one choice out of a few. The small group of the theme
 * (32px, 24px buttons): it stands level with the 32px search field and buttons of the Multiget window.
 * The look is repeated here because the window has to look right without the PNE UI theme as well.
 */
export const searchUITabsGroupSx: SxProps<Theme> = theme => ({
    ...pneToggleGroupLook(theme, resolvePneSemanticPalette(theme), 'small'),
    display: 'inline-flex',
})
