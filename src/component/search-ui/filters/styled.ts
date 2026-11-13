import {styled as themedStyled} from '@mui/material/styles';
import type {Theme} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../../createTheme';
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP} from '../../../themeColors';

/**
 * Hover delay of the panel's tooltips, as on the table column settings action. The tooltips are
 * not interactive: one may lie over the icons of the next row and must not catch their clicks.
 */
export const SEARCH_UI_FILTERS_TOOLTIP_DELAY = 300;

/**
 * The keyboard focus of the panel's own controls: the icons, the fold pill, the pill inputs, the
 * date fields, the chip dropdowns and the link triggers all draw this ring in the accent colour,
 * just outside the control and following its corners. The MUI buttons of the actions row keep
 * their focus ripple.
 */
export const createSearchUIFocusRing = (theme: Theme) => ({
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '1px',
});

/** The same ring for `sx` nesting. */
export const searchUIFocusRingSx = {
    outline: (theme: Theme) => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '1px',
};

// UI Kit Icon action md: a 32px box with a 16px glyph and no background; the icon rests in the tertiary
// text colour and takes the brand text colour under the pointer or the keyboard focus. The icons take
// the colour through `stroke: currentColor`, so dark mode follows the palette.
export const SearchUIFiltersCriterionHeaderButton = themedStyled('button')(({theme}) => {
    const pne = resolvePneSemanticPalette(theme)
    const dark = theme.palette.mode === 'dark'
    return {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        appearance: 'none',
        background: 'transparent',
        border: 0,
        borderRadius: '4px',
        boxSizing: 'border-box',
        padding: '8px',
        height: '32px',
        width: '32px',
        flexShrink: 0,
        cursor: 'pointer',
        font: 'inherit',
        color: dark ? PNE_DARK_COLORS.textMuted : PNE_NEUTRAL_RAMP[600],
        stroke: 'currentColor',
        transition: 'color .15s ease',
        '&:hover, &:focus-visible': {
            color: pne.button.text.hover.text,
        },
        '&:active': {
            color: pne.button.text.pressed.text,
        },
        '&:focus-visible': createSearchUIFocusRing(theme),
    }
});
