import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../createTheme'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP} from '../themeColors'

/**
 * UI Kit Icon action on a MUI IconButton: an icon button with no background, where hover and press
 * colour only the icon. `medium` is a 32px box with a 16px glyph (the close cross of a modal and of
 * a toast), `small` a 24px box with a 14px glyph. The icon rests in the tertiary text colour, or in
 * `restColor` (the tone of a toast), and takes the brand text colour under the pointer.
 */
export const pneIconActionSx = (size: 'small' | 'medium', restColor?: string): SxProps<Theme> => theme => {
    const pne = resolvePneSemanticPalette(theme)
    const dark = theme.palette.mode === 'dark'
    const box = size === 'small' ? '24px' : '32px'
    return {
        flex: '0 0 auto',
        width: box,
        height: box,
        padding: 0,
        borderRadius: '4px',
        backgroundColor: 'transparent',
        color: restColor ?? (dark ? PNE_DARK_COLORS.textMuted : PNE_NEUTRAL_RAMP[600]),
        '& .MuiSvgIcon-root': {
            fontSize: size === 'small' ? '14px' : '16px',
        },
        '&:hover': {
            backgroundColor: 'transparent',
            color: pne.button.text.hover.text,
        },
        '&:active': {
            color: pne.button.text.pressed.text,
        },
        '&.Mui-focusVisible': {
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${pne.focusRing}`,
        },
        '&.Mui-disabled': {
            color: dark ? PNE_DARK_COLORS.textDisabled : PNE_NEUTRAL_RAMP[400],
        },
    }
}
