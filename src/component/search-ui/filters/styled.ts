import {styled as themedStyled} from '@mui/material/styles';
import type {Theme} from '@mui/material/styles';
import {TABLE_CONTROL_TEXT_COLOR} from '../../table/tableControlColors';

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

// The control grey at rest, the text colour under the pointer or the keyboard focus; the icons
// take the colour through `stroke: currentColor`, so dark mode follows the palette. Without the
// PNE theme (plain MUI theme in tests) the light colours stand in.
export const SearchUIFiltersCriterionHeaderButton = themedStyled('button')(({theme}) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    appearance: 'none',
    background: 'transparent',
    border: 0,
    borderRadius: '4px',
    boxSizing: 'border-box',
    padding: '4px',
    height: '24px',
    width: '24px',
    cursor: 'pointer',
    font: 'inherit',
    color: theme.palette.pne?.control.foreground ?? TABLE_CONTROL_TEXT_COLOR,
    stroke: 'currentColor',
    transition: 'color .15s ease',
    '&:hover, &:focus-visible': {
        color: theme.palette.text.primary,
    },
    '&:focus-visible': createSearchUIFocusRing(theme),
    // 24px is small for a finger: on touch screens the target grows by 8px outwards, never into the
    // neighbouring icon, and the icons look the same.
    '@media (pointer: coarse)': {
        '&::before': {
            content: '""',
            position: 'absolute',
            top: '-8px',
            right: 0,
            bottom: '-8px',
            left: 0,
        },
        '&:first-of-type::before': {
            left: '-8px',
        },
        '&:last-of-type::before': {
            right: '-8px',
        },
    },
}));
