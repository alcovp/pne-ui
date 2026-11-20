// The Material `styled`: its default theme has a palette when no provider stands over the list.
import {styled} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../createTheme';
import {ListItemButton} from '@mui/material';

export const Container = styled('div', {
    shouldForwardProp: prop => prop !== 'height'
})<{ height?: string }>(() => ({
    boxSizing: 'border-box',
    minHeight: '320px',
    display: 'flex',
    justifyContent: 'space-between',
}));

export const ColumnWrapper = styled('div', {})(() => ({
    width: 'calc(50% - 8px)',
    boxSizing: 'border-box',

}));

// UI Kit Transfer list: a caption with the action of the whole list over a box with a hairline; the
// box is the list itself, virtual or not, so its 4px inset scrolls with the rows.
export const AddedListWrapper = styled('div')(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
    '& > [data-virtuoso-scroller], & > [data-rfd-droppable-id]': {
        borderRadius: '8px',
        boxShadow: `inset 0 0 0 1px ${resolvePneSemanticPalette(theme).dropdown.panel.ring}`,
        boxSizing: 'border-box',
        padding: '4px',
    },
}));

export const HeaderColumnWrapper = styled('div')`
    min-height: 24px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 8px;
`;

export const HeaderColumn = styled('div')(({theme}) => ({
    color: (theme).palette.text.secondary,
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
}));

/**
 * A row of a transfer list (UI Kit): 32px, 14/20, the name and the sign of what a click does at the
 * end. The row has no fill of its own; the pointer and the keyboard give it the highlight of a list.
 */
export const StyledListItemButton = styled(ListItemButton)(({theme}) => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    return {
        borderRadius: '4px',
        color: dropdown.option.text,
        columnGap: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '20px',
        minHeight: '32px',
        padding: '6px 8px 6px 12px',
        width: '100%',
        '&:hover, &.Mui-focusVisible': {
            backgroundColor: dropdown.option.hover,
        },
        '& [data-pne-transfer-label]': {
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        '& [data-pne-transfer-sign]': {
            color: dropdown.chip.remove,
            display: 'inline-flex',
            flexShrink: 0,
        },
        '&:hover [data-pne-transfer-sign="add"], &.Mui-focusVisible [data-pne-transfer-sign="add"]': {
            color: resolvePneSemanticPalette(theme).link,
        },
        '&:hover [data-pne-transfer-sign="remove"], &.Mui-focusVisible [data-pne-transfer-sign="remove"]': {
            color: (theme).palette.error.main,
        },
    }
}) as typeof ListItemButton;
