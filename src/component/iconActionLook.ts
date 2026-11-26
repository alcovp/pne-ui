import type {SxProps, Theme} from '@mui/material/styles'
import {PNE_BUTTON_SIZE} from '../buttonLook'
import {resolvePneSemanticPalette} from '../createTheme'
import {pneIconActionLook, pneIconButtonSizeLook} from '../iconButtonLook'

/**
 * UI Kit Icon action on a MUI IconButton: an icon button with no background, where hover and press
 * colour only the icon. `medium` is a 32px box with a 16px glyph (the close cross of a modal and of
 * a toast), `small` a 24px box with a 14px glyph. The icon rests in the tertiary text colour, or in
 * `restColor` (the tone of a toast), and takes the brand text colour under the pointer.
 *
 * The theme draws every stock IconButton with the same look functions; the components of the library
 * repeat the look here because they have to look right without the PNE UI theme as well, and they size
 * every glyph, whatever size the icon asked for.
 */
export const pneIconActionSx =
    (size: 'small' | 'medium', restColor?: string): SxProps<Theme> =>
    theme => ({
        flex: '0 0 auto',
        ...pneIconButtonSizeLook(size),
        ...pneIconActionLook(theme, resolvePneSemanticPalette(theme), 'neutral', restColor),
        '& .MuiSvgIcon-root': {
            fontSize: `${PNE_BUTTON_SIZE[size].icon}px`,
        },
    })
