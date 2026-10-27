import {styled} from '@mui/system';
import {styled as themedStyled} from '@mui/material/styles';
import {TABLE_CONTROL_TEXT_COLOR} from '../../table/tableControlColors';

export const SearchUIFiltersHeaderActions = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;
    margin-left: auto;

    @media (max-width: 599px) {
        width: 100%;
        margin-left: 0;
        margin-top: 8px;
        flex-wrap: wrap;
        align-items: flex-start;
        row-gap: 8px;
    }
`;

export const SearchUIFiltersHeaderMainRow = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;

    @media (max-width: 599px) {
        width: 100%;
        flex: 1 1 100%;
        gap: 8px;
    }
`;

export const SearchUIFiltersHeaderLeft = styled('div')`
    display: flex;
    align-items: center;
    flex: 0 0 auto;

    @media (max-width: 599px) {
        justify-content: flex-start;
    }
`;

export const SearchUIFiltersHeaderRight = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 1 auto;
    min-width: 0;
    column-gap: 5px;
    flex-wrap: nowrap;

    @media (max-width: 599px) {
        justify-content: flex-end;
        column-gap: 4px;
    }
`;

export const SearchUIFiltersHeaderSearch = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;

    @media (max-width: 599px) {
        width: 100%;
        flex: 1 1 100%;
    }
`;

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
