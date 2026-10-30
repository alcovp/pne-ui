import {Theme} from '@mui/material'
import {
    TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
    TABLE_CONTROL_TEXT_COLOR,
} from './tableControlColors'
import {TABLE_CONTROL_SIZE} from './tableControlMetrics'

/**
 * The text buttons of the table bands, the views and the band's own actions alike: 32px, a bold label
 * in the control grey, no border and no shadow, the pressed-in grey under the pointer and the focus ring
 * inside the button. Skin-neutral: the colours come from the PNE control palette, never from the skin.
 */
export const createTableControlTextButtonStyle = (theme: Theme) => ({
    ...theme.typography.button,
    borderRadius: '4px',
    color: theme.palette.pne?.control.foreground ?? TABLE_CONTROL_TEXT_COLOR,
    fontWeight: 'bold',
    height: `${TABLE_CONTROL_SIZE}px`,
    letterSpacing: '0.46px',
    lineHeight: '22px',
    padding: '0 10px',
    textTransform: 'none' as const,
    '&:hover': {
        backgroundColor: theme.palette.pne?.control.activeBackground ?? TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
    },
    '&.Mui-focusVisible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '-2px',
    },
})
