import {styled as themedStyled} from '@mui/material/styles';
import {TABLE_CONTROL_TEXT_COLOR} from '../../table/tableControlColors';

// Muted at rest, the text colour under the pointer or the keyboard focus; the icons take the
// colour through `stroke: currentColor`, so dark mode follows the palette. Without the PNE theme
// (plain MUI theme in tests) the light colours stand in.
export const SearchUIFiltersCriterionHeaderButton = themedStyled('button')(({theme}) => ({
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
    color: theme.palette.pne?.text.muted ?? TABLE_CONTROL_TEXT_COLOR,
    stroke: 'currentColor',
    transition: 'color .15s ease',
    '&:hover, &:focus-visible': {
        color: theme.palette.text.primary,
    },
    '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '1px',
    },
}));
