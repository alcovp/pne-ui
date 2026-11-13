import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../../createTheme'
import {
    createTableControlActiveStyle,
    createTableControlShellStyle,
    createTableControlTextButtonStyle,
} from '../table/tableControlButtonStyle'

/**
 * UI Kit Tabs group on a MUI ToggleButtonGroup: one choice out of a few. The grey shell of the table's
 * views with 24px buttons in it, the picked one white with the tab shadow; MUI's own borders, joined
 * corners and overlapping margins of a group are taken off.
 */
export const searchUITabsGroupSx: SxProps<Theme> = theme => {
    const text = resolvePneSemanticPalette(theme).button.text
    return {
        ...createTableControlShellStyle(theme, 'tabs'),
        display: 'inline-flex',
        '&& .MuiToggleButtonGroup-grouped': {
            ...createTableControlTextButtonStyle(theme),
            backgroundColor: 'transparent',
            border: 0,
            borderRadius: '4px',
            margin: 0,
            '&:hover': {
                backgroundColor: 'transparent',
                color: text.hover.text,
            },
        },
        '&& .MuiToggleButtonGroup-grouped.Mui-selected': createTableControlActiveStyle(theme),
    }
}
